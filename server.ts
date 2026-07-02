/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up larger limits for base64 image uploading
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Helper to check for Gemini API key
function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
}

// Scrape Webpage Metadata Helper
async function scrapeUrlMetadata(url: string) {
  let targetUrl = url.trim();
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = "https://" + targetUrl;
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch webpage. Status: ${response.status}`);
    }

    const html = await response.text();

    // Regex parsing for title
    let title = "";
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) title = titleMatch[1].trim();

    // Og:title
    const ogTitleMatch =
      html.match(
        /<meta[^>]*(?:property|name)=["']og:title["'][^>]*content=["']([^"']+)["']/i,
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']og:title["']/i,
      );
    if (ogTitleMatch) title = ogTitleMatch[1].trim();

    // Description
    let description = "";
    const descMatch =
      html.match(
        /<meta[^>]*(?:name|property)=["']description["'][^>]*content=["']([^"']+)["']/i,
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["']description["']/i,
      ) ||
      html.match(
        /<meta[^>]*(?:name|property)=["']og:description["'][^>]*content=["']([^"']+)["']/i,
      );
    if (descMatch) description = descMatch[1].trim();

    // Image
    let imageUrl = "";
    const imgMatch =
      html.match(
        /<meta[^>]*(?:property|name)=["']og:image["'][^>]*content=["']([^"']+)["']/i,
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']og:image["']/i,
      );
    if (imgMatch) imageUrl = imgMatch[1].trim();

    // Site Name
    let siteName = "";
    const siteNameMatch =
      html.match(
        /<meta[^>]*(?:property|name)=["']og:site_name["'][^>]*content=["']([^"']+)["']/i,
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']og:site_name["']/i,
      );
    if (siteNameMatch) {
      siteName = siteNameMatch[1].trim();
    } else {
      try {
        const parsedUrl = new URL(targetUrl);
        siteName = parsedUrl.hostname.replace("www.", "");
      } catch (e) {}
    }

    // Favicon
    let favicon = "";
    const favMatch =
      html.match(
        /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i,
      ) ||
      html.match(
        /<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i,
      );
    if (favMatch) {
      favicon = favMatch[1].trim();
      if (favicon.startsWith("/") && !favicon.startsWith("//")) {
        try {
          const parsedUrl = new URL(targetUrl);
          favicon = `${parsedUrl.origin}${favicon}`;
        } catch (e) {}
      }
    } else {
      try {
        const parsedUrl = new URL(targetUrl);
        favicon = `https://www.google.com/s2/favicons?sz=64&domain=${parsedUrl.hostname}`;
      } catch (e) {}
    }

    // Extract body text for Article Reader & AI indexing
    const bodyMatch = html.match(/<body[^>]*>([\s\S]+?)<\/body>/i);
    let bodyText = bodyMatch ? bodyMatch[1] : html;
    // Strip script and style
    bodyText = bodyText.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
    bodyText = bodyText.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
    // Strip other HTML tags
    bodyText = bodyText.replace(/<[^>]+>/g, " ");
    // Clean whitespace
    bodyText = bodyText.replace(/\s+/g, " ").trim();
    const cleanText = bodyText.substring(0, 8000); // Send up to 8000 chars of body

    return {
      success: true,
      url: targetUrl,
      title: title || targetUrl,
      description,
      imageUrl,
      siteName,
      favicon,
      bodyText: cleanText,
    };
  } catch (error: any) {
    console.error("Scraping error:", error);
    try {
      const parsedUrl = new URL(targetUrl);
      return {
        success: true,
        url: targetUrl,
        title: parsedUrl.hostname,
        description: "Saved link to " + targetUrl,
        siteName: parsedUrl.hostname.replace("www.", ""),
        favicon: `https://www.google.com/s2/favicons?sz=64&domain=${parsedUrl.hostname}`,
        bodyText: "",
      };
    } catch (e) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// 1. Scrape Webpage metadata endpoint
app.post("/api/scrape", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    res.status(400).json({ error: "URL is required" });
    return;
  }
  const result = await scrapeUrlMetadata(url);
  res.json(result);
});

// Hugging Face proxy for WebGPU vision models
app.all("/api/hf-proxy/*", async (req, res) => {
  try {
    const targetUrl = "https://huggingface.co/" + req.params[0];
    const upstreamMethod = req.method;
    console.log(`[HF Proxy] ${upstreamMethod} ${targetUrl}`);

    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    };
    if (req.headers.range) {
      headers["Range"] = req.headers.range;
    }

    const response = await fetch(targetUrl, {
      method: upstreamMethod,
      headers,
    });

    const contentType = response.headers.get("content-type");
    const contentLength = response.headers.get("content-length");
    const acceptRanges = response.headers.get("accept-ranges");
    const contentRange = response.headers.get("content-range");

    res.status(response.status);

    if (contentType) res.setHeader("content-type", contentType);
    if (contentLength) res.setHeader("content-length", contentLength);
    if (acceptRanges) res.setHeader("accept-ranges", acceptRanges);
    if (contentRange) res.setHeader("content-range", contentRange);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Expose-Headers",
      "Content-Length, Content-Type, Content-Range"
    );

    if (upstreamMethod === "HEAD" || !response.body) {
      res.end();
      return;
    }

    const reader = (response.body as any).getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        res.end();
        break;
      }
      res.write(value);
    }
  } catch (error: any) {
    console.error("[HF Proxy Error]", error);
    res.status(500).json({ error: error.message });
  }
});

// General GET/HEAD CORS Proxy for model weights and WASM files
app.get("/api/proxy", async (req, res) => {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      res.status(400).json({ error: "url parameter is required" });
      return;
    }

    console.log(`[General GET Proxy] ${req.method} ${targetUrl}`);

    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    };
    if (req.headers.range) {
      headers["Range"] = req.headers.range;
    }

    const response = await fetch(targetUrl, {
      method: "GET",
      headers,
    });

    const contentType = response.headers.get("content-type");
    const contentLength = response.headers.get("content-length");
    const acceptRanges = response.headers.get("accept-ranges");
    const contentRange = response.headers.get("content-range");

    res.status(response.status);

    if (contentType) res.setHeader("content-type", contentType);
    if (contentLength) res.setHeader("content-length", contentLength);
    if (acceptRanges) res.setHeader("accept-ranges", acceptRanges);
    if (contentRange) res.setHeader("content-range", contentRange);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Expose-Headers",
      "Content-Length, Content-Type, Content-Range"
    );

    if (!response.body) {
      res.end();
      return;
    }

    const reader = (response.body as any).getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        res.end();
        break;
      }
      res.write(value);
    }
  } catch (error: any) {
    console.error("[General GET Proxy Error]", error);
    res.status(500).json({ error: error.message });
  }
});

// 1B. MLC / LiteRT Weights CORS Streaming Proxy endpoint
app.post("/api/mlc-fetch", async (req, res) => {
  try {
    const { url, upstreamMethod = "GET" } = req.body;
    if (!url) {
      res.status(400).json({ error: "URL is required" });
      return;
    }

    console.log(`[MLC Fetch Proxy] ${upstreamMethod} ${url}`);

    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    };

    const response = await fetch(url, {
      method: upstreamMethod,
      headers,
    });

    // Mirror key download response headers
    const contentType = response.headers.get("content-type");
    const contentLength = response.headers.get("content-length");
    const acceptRanges = response.headers.get("accept-ranges");

    if (contentType) res.setHeader("content-type", contentType);
    if (contentLength) res.setHeader("content-length", contentLength);
    if (acceptRanges) res.setHeader("accept-ranges", acceptRanges);

    res.setHeader("Access-Control-Allow-Origin", "*");

    if (upstreamMethod === "HEAD" || !response.body) {
      res.sendStatus(response.status);
      return;
    }

    // Stream the body chunks directly to the response
    const reader = (response.body as any).getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        res.end();
        break;
      }
      res.write(value);
    }
  } catch (error: any) {
    console.error("[MLC Fetch Proxy Error]", error);
    res.status(500).json({ error: error.message });
  }
});

// 1C. Chat endpoint for cloud AI
app.post("/api/chat", async (req, res) => {
  try {
    const { 
      messages, 
      items, 
      apiKey, 
      provider = "gemini", 
      baseUrl, 
      model = "gemini-2.5-flash",
      image // base64 image data:image/...
    } = req.body;
    
    if (!apiKey && provider !== "lmstudio") {
      return res.status(400).json({ error: "API key is required" });
    }

    let systemPrompt =
      "You are a helpful AI assistant that has access to the user's personal memories, notes, and bookmarks. Here is the data: \n" +
      JSON.stringify(items);

    // 1. Google Gemini
    if (provider === "gemini") {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });
      
      const genModel = (ai as any).getGenerativeModel({ model: model });
      
      let lastMsgParts: any[] = [{ text: messages[messages.length - 1].content }];
      
      if (image && image.includes("base64,")) {
        const base64Data = image.split("base64,")[1];
        const mimeType = image.split(";")[0].split(":")[1];
        lastMsgParts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
      }

      const result = await genModel.generateContent({
        contents: [
          ...messages.slice(0, -1).map((m: any) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }]
          })),
          { role: "user", parts: lastMsgParts }
        ],
        systemInstruction: systemPrompt
      });
      
      const response = await result.response;
      return res.json({ reply: response.text() });
    }

    // 2. OpenAI or compatible (including LM Studio v1 OpenAI-compat)
    if (provider === "openai" || (provider === "lmstudio" && !baseUrl?.includes("/api/v1"))) {
      const targetUrl = baseUrl || "https://api.openai.com/v1";
      
      let userContent: any = messages[messages.length - 1].content;
      if (image) {
        userContent = [
          { type: "text", text: userContent },
          { type: "image_url", image_url: { url: image } }
        ];
      }

      const response = await fetch(`${targetUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey || ""}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.slice(0, -1).map((m: any) => ({ role: m.role, content: m.content })),
            { role: "user", content: userContent }
          ],
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "OpenAI API Error");
      return res.json({ reply: data.choices[0].message.content });
    }

    // 3. LM Studio Native v1 API
    if (provider === "lmstudio" && baseUrl?.includes("/api/v1")) {
      // LM Studio v1 Native: POST /api/v1/chat
      let userContent: any = messages[messages.length - 1].content;
      if (image) {
        userContent = [
          { type: "text", text: userContent },
          { type: "image_url", image_url: { url: image } }
        ];
      }

      const response = await fetch(`${baseUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey ? `Bearer ${apiKey}` : "",
        },
        body: JSON.stringify({
          model,
          input: userContent,
          system_prompt: systemPrompt,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "LM Studio Native API Error");
      
      // LM Studio v1 response has 'output' array
      const assistantMsg = data.output.find((o: any) => o.type === "message");
      return res.json({ reply: assistantMsg?.content || "No message returned" });
    }

    // 4. Anthropic
    if (provider === "anthropic") {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          system: systemPrompt,
          messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
          max_tokens: 1024,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Anthropic API Error");
      return res.json({ reply: data.content[0].text });
    }

    res.status(400).json({ error: "Unsupported provider" });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 1D. Test API Key
app.post("/api/test-key", async (req, res) => {
  try {
    const { provider, apiKey, baseUrl } = req.body;

    if (provider === "gemini") {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });
      const model = (ai as any).getGenerativeModel({ model: "gemini-2.5-flash" });
      const response = await model.generateContent('Ping. Reply with exactly "Pong".');
      const text = response.response.text();
      if (text.includes("Pong")) {
        return res.json({ success: true });
      }
    }

    if (provider === "openai") {
      const targetUrl = baseUrl || "https://api.openai.com/v1";
      const response = await fetch(`${targetUrl}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (response.ok) return res.json({ success: true });
    }

    if (provider === "lmstudio") {
      const targetUrl = baseUrl || "http://localhost:1234/v1";
      // Try /v1/models (OpenAI compat) or /api/v1/models (Native)
      const endpoint = targetUrl.includes("/api/v1") ? "/models" : "/models";
      try {
        const response = await fetch(`${targetUrl}${endpoint}`, {
          headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
          signal: AbortSignal.timeout(5000),
        });
        if (response.ok) return res.json({ success: true });
        throw new Error("Could not connect to LM Studio API");
      } catch (e) {
        throw new Error("LM Studio Connection failed: " + (e as Error).message);
      }
    }

    if (provider === "anthropic") {
      // Small test message for Anthropic
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-latest",
          messages: [{ role: "user", content: "Ping" }],
          max_tokens: 1,
        }),
      });
      if (response.ok) return res.json({ success: true });
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Gemini AI Analysis / Tagging endpoint
app.post("/api/analyze", async (req, res) => {
  const { item } = req.body;
  if (!item) {
    res.status(400).json({ error: "Item data is required" });
    return;
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Graceful fallback if no API key is set
    console.log(
      "Gemini API key is not configured. Falling back to local heuristic tags.",
    );
    const generatedTags = generateFallbackTags(item);
    res.json({
      success: true,
      title: item.title || "Untitled " + item.type,
      content: item.content || "",
      tags: generatedTags,
      aiSummary: `Saved ${item.type} (Local Offline Indexing)`,
      dominantColor: item.type === "color" ? item.colorHex : "grey",
      readingTime: item.type === "article" ? 3 : undefined,
    });
    return;
  }

  try {
    let prompt = "";
    let mimeType = "";
    let base64Data = "";

    if (item.type === "color") {
      prompt = `Analyze the Hex color code "${item.colorHex}". 
      Respond with a JSON object containing:
      1. "title": An elegant, creative name for this color (e.g., "Warm Terracotta", "Midnight Horizon").
      2. "content": A 1-2 sentence description of the color's psychology, vibe, and matching hex codes (analogous, complementary).
      3. "tags": An array of 6-8 search terms for this color, including mood (e.g., "earthy", "cozy", "pastel", "neon", "nature"), general color group ("red", "blue", etc.), and styles it fits.
      4. "dominantColor": The closest basic color category name ("red", "orange", "yellow", "green", "blue", "purple", "pink", "brown", "black", "white", "grey").
      5. "category": "color".`;
    } else if (item.type === "quote") {
      prompt = `Analyze the quote: "${item.content}".
      Respond with a JSON object containing:
      1. "title": A beautiful headline summarising the quote's core philosophy (e.g., "On Inner Fortitude").
      2. "content": The formatted quote.
      3. "author": The identified author (if any, separate from the quote).
      4. "tags": An array of 6-8 descriptive search tags (e.g., "philosophy", "motivation", "stoicism", "love", "zen").
      5. "aiSummary": A 1-sentence reflection or interpretation.
      6. "dominantColor": A mood color associated with this quote (e.g., "grey", "black", "blue", "purple", "brown", "yellow").
      7. "category": "quote".`;
    } else if (item.type === "note") {
      prompt = `Analyze this personal note/checklist:
      Title: "${item.title}"
      Body: "${item.content}"
      
      Classify the item into one of ["note", "recipe"] (choose "recipe" if it describes ingredients and steps for cooking).
      Respond with a JSON object containing:
      1. "title": An optimized, highly professional title.
      2. "content": The cleaned note body.
      3. "category": "note" or "recipe".
      4. "tags": An array of 6-10 search tags based on the topics discussed, style, or task list context (e.g., "productivity", "idea", "todo", "reflection", "cooking", "learning").
      5. "aiSummary": A concise 1-sentence summary of the note.
      6. "dominantColor": A color vibe for this note based on its contents (e.g., "green" for growth, "yellow" for ideas, "blue" for calm, "purple" for creative).
      7. "ingredients": If recipe, a list of ingredient strings extracted.
      8. "steps": If recipe, a list of preparation step strings extracted.
      9. "duration": If recipe, prep time (e.g., "15 mins").`;
    } else if (item.type === "link" || item.type === "article") {
      prompt = `Analyze this bookmark metadata we scraped:
      URL: "${item.url}"
      Scraped Title: "${item.title}"
      Scraped Description: "${item.content}"
      Page body text context: "${item.bodyText || ""}"
      
      Determine the absolute best category for this item from: "article", "video", "music", "tweet", "recipe", "document", or "link".
      Use the following guidelines:
      - "video": If URL points to YouTube, Vimeo, IMDb, Netflix, or is a movie/TV show.
      - "music": If URL points to Spotify, Apple Music, SoundCloud, bandcamp, or is a song/album.
      - "tweet": If URL is a Twitter/X link or a social post.
      - "recipe": If the webpage describes a cooking recipe, ingredients, or food instructions.
      - "document": If the link is a PDF, doc, slides, or sheet.
      - "article": If it is a blog, news article, essay, or medium post.
      - "link": If it is a general website, tool, portfolio, or landing page.

      Respond with a JSON object containing:
      1. "title": A clean, readable, decluttered title for the bookmark.
      2. "content": A condensed 2-sentence summary/description of what the page is about.
      3. "category": The selected category from ["article", "video", "music", "tweet", "recipe", "document", "link"].
      4. "tags": An array of 8-12 search tags capturing the topic, mood, industry, style, or brand (e.g., "minimal", "webdev", "jazz", "recipe", "cooking", "design").
      5. "aiSummary": A beautiful 1-sentence summary.
      6. "readingTime": If classified as "article", estimated reading time in minutes (integer).
      7. "siteName": A clean brand name of the website (e.g., "Medium", "YouTube", "Spotify", "Wikipedia").
      8. "dominantColor": A visual color association based on the brand or topic (e.g. "red" for YouTube, "green" for Spotify/Medium, "blue" for Twitter/PDF, "yellow" for design/recipes, "purple" for creative).
      9. "duration": If video or recipe, estimated duration (e.g., "12:45" or "35 mins").
      10. "ingredients": If recipe, a list of ingredient strings.
      11. "steps": If recipe, a list of preparation step strings.
      12. "author": If tweet, article or recipe, the author's name.
      13. "authorUsername": If tweet, the author's handle/username (e.g. "@username").
      14. "fileSize": If document/PDF, estimate or note the format (e.g., "2.4 MB PDF").`;
    } else if (item.type === "image") {
      // Analyze image
      if (item.imageUrl && item.imageUrl.startsWith("data:image/")) {
        const matches = item.imageUrl.match(
          /^data:([A-Za-z-+\/]+);base64,(.+)$/,
        );
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          base64Data = matches[2];
        }
      }

      prompt = `Analyze this uploaded image. Describe its contents, mood, aesthetic, and suggest a wonderful title.
      Respond with a JSON object containing:
      1. "title": A beautiful, minimal descriptive title for this image (e.g., "Misty Pine Forest at Dawn", "Mid-Century Modern Living Room").
      2. "content": A vivid 1-2 sentence description of the visual style, aesthetic, and details.
      3. "tags": An array of 10-15 highly accurate search tags capturing styles (e.g., "isometric", "cinematic", "minimalist", "scandinavian"), elements (e.g., "nature", "chair", "illustration", "interior"), vibe (e.g., "cozy", "gloomy"), and colors seen.
      4. "dominantColor": The overall primary color name seen in the image ("red", "orange", "yellow", "green", "blue", "purple", "pink", "brown", "black", "white", "grey").
      5. "category": "image".`;
    }

    // Call Gemini using the GenAI SDK
    let responseText = "";
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

    if (item.type === "image" && base64Data && mimeType) {
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        },
        {
          text:
            prompt +
            "\nIMPORTANT: Respond ONLY with a valid JSON block, no markdown enclosing blocks (like ```json). Just the raw JSON.",
        },
      ]);
      responseText = result.response.text();
    } else {
      const result = await model.generateContent(
        prompt +
          "\nIMPORTANT: Respond ONLY with a valid JSON block, no markdown enclosing blocks (like ```json). Just the raw JSON.",
      );
      responseText = result.response.text();
    }

    // Clean up responseText if it's wrapped in markdown codeblocks
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith("```json")) {
      cleanJson = cleanJson.substring(7);
    }
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.substring(3);
    }
    if (cleanJson.endsWith("```")) {
      cleanJson = cleanJson.substring(0, cleanJson.length - 3);
    }
    cleanJson = cleanJson.trim();

    const result = JSON.parse(cleanJson);
    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Gemini AI error:", error);
    // Fallback in case of parsing/API errors
    res.json({
      success: true,
      title: item.title || "Untitled " + item.type,
      content: item.content || "",
      tags: generateFallbackTags(item),
      aiSummary: "Saved " + item.type + " (AI indexing currently unavailable)",
      dominantColor: "grey",
    });
  }
});

// Fallback tags generator if Gemini fails or is not configured
function generateFallbackTags(item: any): string[] {
  const tagsSet = new Set<string>();
  tagsSet.add(item.type);

  if (item.title) {
    item.title
      .toLowerCase()
      .split(/\s+/)
      .forEach((w: string) => {
        if (w.length > 3) tagsSet.add(w.replace(/[^a-z0-9]/g, ""));
      });
  }

  if (item.content) {
    item.content
      .toLowerCase()
      .split(/\s+/)
      .slice(0, 30)
      .forEach((w: string) => {
        if (w.length > 4) tagsSet.add(w.replace(/[^a-z0-9]/g, ""));
      });
  }

  if (item.type === "color" && item.colorHex) {
    tagsSet.add("color");
    tagsSet.add("palette");
    tagsSet.add(item.colorHex);
  }

  return Array.from(tagsSet).filter(Boolean).slice(0, 10);
}

// Dev server vs Production setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
