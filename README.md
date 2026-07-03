<div align="center">
  <img src="./Logo.svg" width="100" height="100" alt="Pensieve Logo" />
  <h1>Pensieve</h1>
  <p><strong>Your Neural Vault. Your Second Brain. Entirely Sovereign.</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind" />
    <img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite" alt="Vite" />
    <img src="https://img.shields.io/badge/Appwrite-Cloud-FD366E?style=for-the-badge&logo=appwrite" alt="Appwrite" />
  </p>

  <p><i>Capture thoughts, organize digital memories, and own your data.</i></p>
</div>

---

## 🧠 What is Pensieve?

Pensieve is a high-performance, private neural vault designed to capture your thoughts, bookmarks, and digital memories without sacrificing your privacy. Built with a **Local-First** philosophy, it leverages on-device AI and secure cloud synchronization to provide a seamless "second brain" experience.

Whether you're saving a fleeting thought, a beautiful quote, or a complex research article, Pensieve organizes it instantly using semantic analysis and intelligent tagging.

---

## ✨ Key Features

### 🛡️ Sovereign Data & Sync
- **Local-First Engine**: All data is stored and encrypted locally in IndexedDB using Dexie.js.
- **Appwrite Integration**: Secure, real-time synchronization across devices using your own Appwrite instance. Host your own personal cloud.
- **Privacy First**: No telemetry, no hidden trackers. Your thoughts stay yours.

### 🤖 Intelligence (On-Device & Cloud)
- **Local WebGPU AI**: Run 1.5B+ parameter models (LiteRT) directly in your browser. Private summarization and tagging—no data leaves your machine.
- **Gemini Pro Fallback**: High-performance cloud AI for complex reasoning, image analysis, and deep content extraction.
- **Omnibar Intelligence**: Auto-detects content types (URLs, Colors, Quotes, Movie Titles) as you type.

### 🎨 Hyper-Customizable Interface
- **Marketplace & XP Economy**: Earn experience points (XP) for every thought captured. Spend them in the Marketplace to unlock premium upgrades.
- **Visual Effects**: Unlock CRT scanline overlays, Matrix digital rain, and advanced "Glass UI" themes.
- **Profile Customization**: Customize your avatar with Royal Crests, Glowing Borders, and custom styles.
- **Omnibar Styles**: Transform your search experience with Crystal Glass effects and Neural Glows.

### 📌 Neural Widgets
- **Pinned Widgets**: Keep critical information always visible with the persistent widget system.
- **Neural XP Tracker**: Watch your progress in real-time as you grow your neural vault.
- **Local Time & Weather**: Context-aware widgets that adapt to your environment.

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
   Create a `.env` file in the root directory. See `.env.example` for all required keys.
   ```env
   GEMINI_API_KEY=your_gemini_key
   VITE_FIREBASE_API_KEY=your_firebase_key
   VITE_STORE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

---

## 📖 Guides & Resources

- **[Setup Guide](./appwrite-setup-guide.md)**: Detailed instructions for Appwrite database and storage setup.
- **[Store Customization](./appwrite-setup-guide.md#4-custom-effect-injection-advanced)**: Learn how to inject custom CSS effects through store items.
- **[Gamification System](./docs/gamification.md)**: Understanding XP, Levels, and Achievements.

---

## 🤝 Contributing

We welcome contributions! Whether it's a bug fix, a new store effect, or a core feature improvement, please feel free to open a PR.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with ❤️ for the unburdened mind.</p>
  <p><strong>Neural Vault v2.4.0</strong></p>
</div>
