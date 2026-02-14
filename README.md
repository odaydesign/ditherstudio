# Dither Studio - Desktop

**Dither Studio** is a powerful, open-source desktop application for creating stunning dithered images and retro graphics. built with Next.js and Electron.

![Dither Studio Screenshot](public/screenshot.png)

## 🚀 Key Features

- **Real-time Dithering**: Apply various dithering algorithms (Floyd-Steinberg, Atkinson, Bayer, etc.) instantly.
- **Custom Shapes**: Use ASCII characters or custom shapes for unique effects.
- **Export Options**: Save your creations as PNG, GIF, or SVG.
- **Video Support**: Process video files with dithering effects.
- **Desktop Experience**: Native performance and file handling via Electron.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Desktop Runtime**: Electron
- **Graphics**: THREE.js, WebGL (Custom Shaders)
- **State Management**: Zustand
- **Language**: TypeScript

## 🔧 Installation

To run Dither Studio locally, follow these steps:

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/odaydesign/dither-saas.git
    cd dither-saas
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run in Development Mode**:
    This starts both the Next.js dev server and the Electron window.
    ```bash
    npm run dev:desktop
    ```

## 📦 Building for Production

To create a distributable desktop application (dmg, exe, deb):

```bash
npm run build:desktop
```
The output will be in the `dist/` directory.

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
