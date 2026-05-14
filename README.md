# TransLens — Smart Text Selection Translator

<p align="center">
  <img src="translens/app-icon.png" alt="TransLens Icon" width="128" />
</p>

<p align="center">
  <strong>Select · Screenshot · Translate · Multi-Engine</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-Windows-blue" alt="Platform" />
  <img src="https://img.shields.io/badge/tauri-v2-brightgreen" alt="Tauri" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
</p>

---

## Features

- **Text Selection Translation** — Select text anywhere and translate instantly, no copy-paste needed
- **Screenshot OCR Translation** — Draw a box over any screen region, auto-detect text and translate
- **Chat Bubble Overlay** — Beautiful floating bubbles for translation results with customizable themes
- **Multi-Engine Support** — 12 translation engines built-in, switch on the fly
- **Highly Customizable** — Fonts, colors, animations, popup styles — everything adjustable
- **Translation History** — Auto-saved history with search and clear support
- **Global Shortcuts** — Customizable hotkeys for lightning-fast operation

## Supported Engines

| Engine | API Key Required |
|--------|-----------------|
| Google Translate | Yes |
| DeepL | Yes |
| Baidu Translate | Yes |
| Tencent Machine Translation | Yes |
| Volcengine Translate (ByteDance) | Yes |
| Alibaba Cloud Translate | Yes |
| Zhipu AI (GLM) | Yes |
| Azure Translator | Yes |
| OpenAI (GPT) | Yes |
| DeepSeek | Yes |
| Yandex Translate | Yes |
| Kimi (Moonshot) | Yes |

> All engines require you to bring your own API key. Configure them in Settings.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Framework | [Tauri v2](https://v2.tauri.app/) |
| Frontend | React 18 + TypeScript |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS 4 |
| UI Components | Radix UI |
| State Management | Zustand |
| Animation | Framer Motion |
| Icons | Lucide React |
| Backend | Rust |

## Prerequisites

- **Node.js** ≥ 18
- **Rust** ≥ 1.70
- **Windows** 10/11 (Windows-only for now)

## Quick Start

```bash
# Clone the repo
git clone https://github.com/alanniko1265-ai/translate.git
cd translate/translens

# Install dependencies
npm install

# Start dev server
npm run tauri dev

# Build for production
npm run tauri build
```

## Project Structure

```
translens/
├── src/                  # React frontend
│   ├── components/       # UI components
│   ├── hooks/            # Custom hooks
│   ├── services/         # Translation services
│   ├── stores/           # Zustand state
│   ├── utils/            # Utility functions
│   └── types.ts          # TypeScript types
├── src-tauri/            # Tauri / Rust backend
│   ├── src/
│   │   ├── commands/     # Tauri commands
│   │   ├── utils/        # Backend utilities
│   │   ├── lib.rs
│   │   └── main.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── public/               # Static assets
├── package.json
└── vite.config.ts
```

## Configuration

Launch the app, go to Settings, and fill in your API keys for the engines you want to use. Where to get them:

- Google: https://cloud.google.com/translate
- DeepL: https://www.deepl.com/pro-api
- Baidu: https://fanyi-api.baidu.com
- Tencent: https://cloud.tencent.com/product/tmt
- Alibaba Cloud: https://www.aliyun.com/product/ai/alimt
- Azure: https://azure.microsoft.com/services/cognitive-services/translator/

## License

[MIT](LICENSE)
