# PDF Selection Viewer with AI Chat

A Next.js application that lets you select content from PDFs and get AI-powered explanations, summaries, and calculations.

![PDF Selection Viewer](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![AI Powered](https://img.shields.io/badge/AI-GPT--4o--mini-blue?logo=openai)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- **📄 PDF Viewer** - Upload and view PDFs with zoom controls
- **🔍 Text Selection** - Select text and get AI explanations
- **🖼️ Image Selection** - Ctrl+drag to select regions for image analysis
- **🧮 Equation Support** - Ask AI to explain or solve equations
- **💬 Chat Interface** - Multi-turn conversations with context
- **💾 Persistent Storage** - Chat history and PDF survive page reloads
- **🎨 Modern UI** - Beautiful gradient design with Tailwind CSS

## 🚀 Quick Start

### 1. Get an OpenRouter API Key

1. Go to [OpenRouter](https://openrouter.ai/keys)
2. Sign up (free)
3. Create an API key

### 2. Install & Run

```bash
cd pdf-viewer
npm install

# Add your API key to .env.local
echo "NEXT_PUBLIC_OPENROUTER_API_KEY=your-key-here" > .env.local

npm run dev
```

Open http://localhost:3000

## 📖 Usage

### Text Selection
1. Click and drag to select text in the PDF
2. A floating toolbar appears with action buttons
3. Click **Explain**, **Summarize**, or **Calculate**

### Image/Region Selection
1. Hold **Ctrl** and drag to select any region
2. The selected area is captured as an image
3. Click an action button to send to AI for analysis

### Chat
- Type follow-up questions in the chat
- AI remembers previous messages for context
- Click **Clear Chat** to start fresh

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 15 | React framework |
| react-pdf | PDF rendering |
| OpenRouter | AI API gateway |
| GPT-4o-mini | Vision-capable AI model |
| Tailwind CSS | Styling |
| localStorage | Persistence |

## 📁 Project Structure

```
pdf-viewer/
├── src/
│   ├── app/
│   │   ├── page.tsx        # Main layout
│   │   └── globals.css     # Styles
│   ├── components/
│   │   ├── PDFViewer.tsx   # PDF rendering + selection
│   │   ├── GeminiChat.tsx  # Chat interface
│   │   └── SelectionToolbar.tsx # Action buttons
│   └── lib/
│       └── gemini.ts       # AI API client
├── public/                  # Static files
├── .env.local              # API key (not in git)
└── package.json
```

## 🧪 Test Cases

1. **Text Explanation** - Select text → Explain
2. **Image Analysis** - Ctrl+drag diagram → Explain
3. **Math Calculation** - Select equation → Calculate
4. **Follow-up Questions** - Ask "Can you explain more?"
5. **Persistence** - Refresh page, history remains

## ⚙️ Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_OPENROUTER_API_KEY` | OpenRouter API key |

## 📝 Notes

- **Free Tier**: OpenRouter gives $1 free credit on signup
- **Model**: Uses GPT-4o-mini for text and vision tasks
- **Storage**: Uses localStorage (data stays in browser)

## 📄 License

MIT License - feel free to use for your projects!

---

Built with ❤️ using Next.js and OpenRouter
