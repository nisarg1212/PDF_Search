# PDF Selection Viewer

An AI-powered PDF study tool built with Next.js. Upload PDFs, select content, get instant AI explanations, and track your progress with annotations.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![AI Powered](https://img.shields.io/badge/AI-Gemini-blue?logo=google)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- **📄 PDF Viewer** - Upload and view PDFs with zoom controls
- **🔍 Smart Selection** - Select text or Ctrl+drag for region selection
- **🤖 AI Analysis** - Get explanations, summaries, and calculations
- **📝 Annotations** - Mark sections as Complete/Incomplete/Pending
- **💾 Persistence** - PDFs and annotations saved locally
- **📚 Library** - Manage all your uploaded PDFs
- **🎨 Modern UI** - Beautiful dark theme with animations

## 🚀 Quick Start

### 1. Get an OpenRouter API Key

1. Go to [OpenRouter](https://openrouter.ai/keys)
2. Sign up (free)
3. Create an API key

### 2. Install & Run

```bash
cd pdf-viewer
npm install

# Create .env.local with your API key
echo "OPENROUTER_API_KEY=your-key-here" > .env.local

npm run dev
```

Open http://localhost:3000

## 📖 Usage

### PDF Library (`/library`)
- Upload PDFs via drag & drop
- Set status: Complete ✓ / Incomplete ✗ / In Progress ◐
- Click to open in viewer

### PDF Viewer (`/viewer`)
- **Text Selection**: Click and drag to select text
- **Region Selection**: Hold **Ctrl** + drag to select any area
- **AI Actions**: Click Explain, Summarize, or Calculate
- **Annotations**: Mark regions with status overlays

### Annotation System
1. Ctrl+drag to select a region
2. Click Complete/Pending/Incomplete/Note
3. Colored overlay appears on PDF
4. Filter annotations using dropdown
5. View all in sidebar panel

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 16 | React framework |
| react-pdf | PDF rendering |
| OpenRouter | AI API gateway |
| Gemini Flash | Vision-capable AI |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| JSON Storage | Local persistence |

## 📁 Project Structure

```
pdf-viewer/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Landing page
│   │   ├── viewer/page.tsx    # PDF Viewer
│   │   ├── library/page.tsx   # PDF Library
│   │   └── api/pdfs/          # REST API
│   ├── components/
│   │   ├── PDFViewer.tsx      # PDF + annotations
│   │   ├── GeminiChat.tsx     # AI chat
│   │   └── SelectionToolbar.tsx
│   └── lib/
│       ├── db.ts              # JSON storage
│       └── gemini.ts          # AI client
├── data/
│   └── pdfs.json              # Local database
└── .env.local                 # API key
```

## ⚙️ Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key |

## 📝 API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/pdfs` | GET | List all PDFs |
| `/api/pdfs` | POST | Upload PDF |
| `/api/pdfs/[id]` | GET | Get PDF by ID |
| `/api/pdfs/[id]` | DELETE | Delete PDF |
| `/api/pdfs/[id]` | PATCH | Update status |

## 📄 License

MIT License

---

© 2026 PDF Selection Viewer
