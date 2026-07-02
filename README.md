<div align="center">
  <img src="./Logo.svg" width="80" height="80" alt="Pensieve Logo" />
  <h1>Pensieve</h1>
  <p><strong>Your Neural Vault. Your Second Brain. Entirely Sovereign.</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind" />
    <img src="https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite" alt="Vite" />
    <img src="https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat-square&logo=firebase" alt="Firebase" />
    <img src="https://img.shields.io/badge/Appwrite-Cloud-FD366E?style=flat-square&logo=appwrite" alt="Appwrite" />
  </p>
</div>

---

## 🧠 What is Pensieve?

Pensieve is a high-performance, private neural vault designed to capture your thoughts, bookmarks, and digital memories without sacrificing your privacy. Built with a **Local-First** philosophy, it leverages on-device AI and secure cloud synchronization to provide a seamless "second brain" experience.

Whether you're saving a fleeting thought, a beautiful quote, or a complex research article, Pensieve organizes it instantly using semantic analysis and intelligent tagging.

---

## ✨ Key Features

### 🛡️ Sovereign Data & Sync
- **Local-First Engine**: All data is stored and encrypted locally in IndexedDB.
- **Appwrite Integration**: Secure, real-time synchronization across devices using your own Appwrite instance.
- **Firebase Auth**: Enterprise-grade security with Google Identity Platform.

### 🤖 Intelligence (On-Device & Cloud)
- **Local WebGPU AI**: Run 1.5B+ parameter models (LiteRT) directly in your browser. Private summarization and tagging—no data leaves your machine.
- **Gemini Pro Fallback**: High-performance cloud AI for complex reasoning and deep content analysis.
- **Auto-Scraping**: Paste a URL, and Pensieve automatically extracts titles, descriptions, and metadata.

### 🎨 Premium User Experience
- **Editorial UI**: A clean, high-contrast interface focused on typography and negative space.
- **Notion-Style Inspector**: A powerful rich text editor optimized for both desktop and mobile.
- **Universal Search**: Lightning-fast fuzzy search across all your saved thoughts.
- **Responsive Navigation**: Full gesture support for mobile, mimicking native Android/iOS experiences.

### 🕹️ Gamified Growth
- **XP Economy**: Earn experience points for every thought captured and organized.
- **Marketplace**: Spend your XP on custom visual effects, CRT monitor scanlines, and premium "Glass UI" themes.
- **Achievements**: Unlock collectible physical-style cards as you hit milestones in your neural journey.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or pnpm

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/pensieve.git
   cd pensieve
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add your keys:
   ```env
   GEMINI_API_KEY=your_gemini_key
   VITE_FIREBASE_API_KEY=your_firebase_key
   VITE_STORE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   # See GUIDE.md for full Appwrite setup
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

---

## 🛠️ Architecture

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion
- **Backend**: Express (API Proxying), Appwrite (Real-time DB & Storage)
- **Authentication**: Firebase Auth
- **AI**: Google Gemini (Cloud), LiteRT / WebLLM (On-device)

---

## 📖 Documentation

- [Appwrite Setup Guide](./appwrite-setup-guide.md) - Learn how to host your own cloud storage.
- [AI Configuration](./docs/ai.md) - Tuning the local and cloud AI models.

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

---

## 📄 License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with ❤️ for the unburdened mind.</p>
</div>
