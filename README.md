# Kontext Lab

A powerful AI image transformation web app using Mistral AI for image analysis and BFL Kontext for image generation.

## Features

- 📱 **Mobile-First Design**: Optimized for phone photo uploads
- 🎨 **8 Diverse Transformations**: Muppet, LEGO, Cartoon + 5 randomized styles  
- 🔧 **Real-Time Processing**: Live technical metrics and progress tracking
- 🎛️ **Neumorphic UI**: Teenage Engineering-inspired design
- 🔄 **True Randomization**: Fisher-Yates shuffling for unpredictable results
- 📷 **Camera Integration**: Direct photo capture on mobile devices

## Technologies

- **Frontend**: Vanilla JavaScript, CSS3, HTML5
- **Backend**: Node.js, Express.js
- **AI Models**: Mistral Pixtral Large, BFL Flux Kontext Pro
- **Design**: Neumorphic design system

## Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and add your API keys
4. Start development server: `npm run dev`
5. Open http://localhost:8080

## Deployment Options

### 1. Vercel (Recommended)
```bash
npm i -g vercel
vercel
```

### 2. Railway
```bash
npm i -g @railway/cli
railway login
railway deploy
```

### 3. Render
- Connect your GitHub repo to Render
- Uses `render.yaml` for configuration

### 4. Docker
```bash
docker build -t kontext-lab .
docker run -p 8080:8080 kontext-lab
```

## Environment Variables

- `MISTRAL_API_KEY`: Your Mistral AI API key
- `BFL_API_KEY`: Your Black Forest Labs API key
- `PORT`: Server port (default: 8080)

## API Keys Setup

1. **Mistral AI**: Get your key from https://console.mistral.ai/
2. **BFL**: Get your key from https://api.bfl.ai/

## License

MIT License