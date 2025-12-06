# JSON Viewer

A static JSON data preview tool with real-time parsing, auto-fix, and beautified display.

## ✨ Features

- **Real-time Preview**: Automatically displays structured preview as you input JSON data
- **Smart Fix**: Auto-fixes common JSON format issues (trailing commas, unquoted keys, etc.)
- **JSON Lines Support**: Supports newline-delimited JSON Lines format
- **Syntax Highlighting**: Different colors for different data types
- **Responsive Design**: Works on desktop and mobile devices
- **Static Build**: Can be deployed to nginx, Caddy, or any static file server

## 🚀 Quick Start

### Install Dependencies

```bash
npm install
```

### Development Mode

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Build for Production

```bash
npm run build
```

Build output will be in the `build` directory, ready for deployment to any static file server.

### Run Tests

```bash
npm test
```

## 📖 Usage

### Supported JSON Formats

1. **Standard JSON**:
   ```json
   {"name": "John", "age": 30, "hobbies": ["reading", "swimming"]}
   ```

2. **JSON Lines** (one JSON object per line):
   ```
   {"name": "John", "age": 30}
   {"name": "Jane", "age": 25}
   {"name": "Bob", "age": 35}
   ```

3. **Auto-fix Capabilities**:
   - Trailing commas: `{"key": "value",}` → `{"key": "value"}`
   - Unquoted keys: `{key: "value"}` → `{"key": "value"}`
   - Single quotes: `{'key': 'value'}` → `{"key": "value"}`

### Interface Features

- **Left Input Area**: Paste or type JSON data
- **Right Preview Area**: Real-time structured preview
- **Clear Button**: One-click clear input
- **Status Display**: Shows character and line count
- **Error Messages**: Displays detailed error info for invalid JSON

## 🏗️ Tech Stack

- **React 19**: UI framework
- **TypeScript**: Type-safe JavaScript
- **CSS**: Custom styles with responsive design
- **Create React App**: Build tooling

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx      # Header navigation
│   ├── Footer.tsx      # Footer
│   ├── JsonInput.tsx   # JSON input component
│   └── JsonPreview.tsx # JSON preview component
├── utils/              # Utility functions
│   ├── jsonParser.ts   # JSON parsing and fixing
│   └── jsonParser.test.ts # Unit tests
├── App.tsx            # Main app component
├── App.test.tsx       # App tests
└── index.css          # Global styles
```

## 🚀 Deployment

### GitHub Pages (via GitHub Actions)

This project is configured for automatic deployment to GitHub Pages. Simply push to the `main` branch and GitHub Actions will build and deploy automatically.

1. Go to your repo **Settings** → **Pages**
2. Set Source to **GitHub Actions**
3. Push to `main` branch

### Using nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Using Caddy

```
your-domain.com {
    root * /path/to/build
    file_server
    try_files {path} /index.html
}
```

### Using Vercel

```bash
npm install -g vercel
vercel --prod
```

## 🧪 Testing

The project includes a complete test suite:

- **Unit Tests**: JSON parser function tests
- **Component Tests**: React component behavior tests
- **Integration Tests**: Overall app functionality tests

Run tests:

```bash
npm test
```

View test coverage:

```bash
npm test -- --coverage
```

## 📄 License

MIT License

## 🤝 Contributing

Issues and Pull Requests are welcome!
