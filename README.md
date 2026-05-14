# TransLens - 智能划词翻译助手

<p align="center">
  <img src="translens/app-icon.png" alt="TransLens Icon" width="128" />
</p>

<p align="center">
  <strong>划词翻译 · 截图翻译 · AI 翻译 · 多引擎支持</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-Windows-blue" alt="Platform" />
  <img src="https://img.shields.io/badge/tauri-v2-brightgreen" alt="Tauri" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
</p>

---

## 功能特性

- **划词翻译** — 选中文本即可翻译，无需复制粘贴
- **截图翻译** — 框选屏幕区域，自动 OCR 识别并翻译
- **气泡弹窗** — 翻译结果以美观气泡形式显示，可自定义主题
- **多引擎支持** — 内置 12 种翻译引擎，按需切换
- **高度可定制** — 字体、颜色、动画、弹窗样式等均可调整
- **历史记录** — 自动保存翻译历史，支持搜索和清除
- **全局快捷键** — 自定义快捷键实现快捷操作

## 支持的翻译引擎

| 引擎 | 需要 API Key |
|------|-------------|
| Google Translate | 是 |
| DeepL | 是 |
| 百度翻译 | 是 |
| 腾讯翻译 | 是 |
| 火山翻译 (字节跳动) | 是 |
| 阿里云翻译 | 是 |
| 智谱 AI (GLM) | 是 |
| Azure Translator | 是 |
| OpenAI (GPT) | 是 |
| DeepSeek | 是 |
| Yandex Translate | 是 |
| Kimi (Moonshot) | 是 |

> 所有翻译引擎都需要用户自行申请 API Key 并在设置中配置。

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | [Tauri v2](https://v2.tauri.app/) |
| 前端 | React 18 + TypeScript |
| 构建工具 | Vite 6 |
| 样式 | Tailwind CSS 4 |
| UI 组件 | Radix UI |
| 状态管理 | Zustand |
| 动画 | Framer Motion |
| 图标 | Lucide React |
| 后端 | Rust |

## 开发环境要求

- **Node.js** ≥ 18
- **Rust** ≥ 1.70
- **Windows** 10/11（目前仅支持 Windows）

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/alanniko1265-ai/translate.git
cd translate/translens

# 安装依赖
npm install

# 启动开发服务器
npm run tauri dev

# 构建生产版本
npm run tauri build
```

## 项目结构

```
translens/
├── src/                  # React 前端源码
│   ├── components/       # UI 组件
│   ├── hooks/            # 自定义 Hooks
│   ├── services/         # 翻译服务
│   ├── stores/           # Zustand 状态
│   ├── utils/            # 工具函数
│   └── types.ts          # TypeScript 类型定义
├── src-tauri/            # Tauri/Rust 后端
│   ├── src/
│   │   ├── commands/     # Tauri 命令
│   │   ├── utils/        # 后端工具
│   │   ├── lib.rs
│   │   └── main.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── public/               # 静态资源
├── package.json
└── vite.config.ts
```

## 配置

启动应用后，进入设置页面，为你想使用的翻译引擎填入 API Key。各引擎的申请地址：

- Google: https://cloud.google.com/translate
- DeepL: https://www.deepl.com/pro-api
- 百度: https://fanyi-api.baidu.com
- 腾讯: https://cloud.tencent.com/product/tmt
- 阿里云: https://www.aliyun.com/product/ai/alimt
- Azure: https://azure.microsoft.com/services/cognitive-services/translator/

## License

[MIT](LICENSE)
