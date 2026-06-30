/**
 * Manages the context window size and budget for local LLMs,
 * especially crucial for multi-modal models like Phi 3.5 Vision.
 */

export function manageContextBudget(
  messages: any[], 
  maxTokens: number = 4096, 
  minReserveForOutput: number = 512
): number {
  let totalEstimatedTokens = 0;
  
  for (const msg of messages) {
    if (typeof msg.content === 'string') {
      totalEstimatedTokens += Math.ceil(msg.content.length / 4); // rough estimate
    } else if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === 'text') {
          totalEstimatedTokens += Math.ceil(part.text.length / 4);
        } else if (part.type === 'image_url') {
          // Phi-3.5-vision-instruct processes images as patches, often ~1000-1500 tokens
          totalEstimatedTokens += 1024;
        }
      }
    }
  }
  
  // Calculate remaining tokens for output reserve
  const availableForOutput = maxTokens - totalEstimatedTokens;
  
  // Ensure we don't go below the minimum reserve, but also don't exceed what's mathematically possible
  if (availableForOutput < minReserveForOutput) {
    console.warn(`[Context Budget] Warning: High context usage (${totalEstimatedTokens}). Only ${availableForOutput} tokens remain, restricting output generation.`);
    // If it's completely exhausted, just return a minimal safe amount (e.g. 100) or minReserveForOutput and let the engine handle truncation.
    return Math.max(availableForOutput, 100);
  }
  
  // Return the remaining budget for output token generation
  return availableForOutput;
}
