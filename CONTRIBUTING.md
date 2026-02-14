# Contributing to Dither Studio

Thank you for your interest in contributing to Dither Studio! We welcome contributions from the community to help improve this project.

## How to Contribute

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally.
3.  **Create a new branch** for your feature or bugfix (`git checkout -b feature/amazing-feature`).
4.  **Make your changes**.
5.  **Commit your changes** (`git commit -m 'Add amazing feature'`).
6.  **Push to the branch** (`git push origin feature/amazing-feature`).
7.  **Open a Pull Request**.

## Development Setup

Follow the [Installation](README.md#installation) instructions in the README to set up your development environment.

## Adding New Algorithms

Dither Studio relies heavily on custom WebGL shaders for its effects. If you want to add a new dithering algorithm:

1.  **Register the Algorithm**:
    - Add your algorithm to `lib/three/algorithms.ts`.
    - Assign a unique `id` and `shaderValue`.

2.  **Implement the Shader**:
    - Open `lib/three/shaders/fragmentShader.ts`.
    - Add your GLSL implementation function (e.g., `float myNewDither(vec2 coord, vec2 uv)`).
    - Update `getDitherThreshold()` to call your function based on `uAlgorithm`.

3.  **Update UI**:
    - The UI should automatically pick up the new algorithm if registered correctly in `algorithms.ts`.

## Code Style

- We use **TypeScript** for type safety.
- We use **ESLint** and **Prettier** for code formatting. Please run `npm run lint` before submitting.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
