# DepNudge

**DepNudge** is a CLI tool to help you keep your Node.js project dependencies up to date and free of undefined or missing packages. It scans your codebase for used packages, checks for outdated dependencies, and helps you update or install them with ease.

## Features
- Scan your code for undefined dependencies (used but not declared)
- Check for outdated packages in your `package.json`
- Interactive update and install prompts
- Multi-language support (English, Spanish, French, Italian)
- Backup your `package.json` before making changes
- Friendly CLI with progress bars and clear output

## Installation

```sh
npm install depnudge -g 
```

## Usage

Run DepNudge from your project directory:

```sh
depnudge           # Check for outdated packages and interactively update

depnudge --scan    # Scan for undefined dependencies in your code

depnudge --install # Find and install undefined dependencies

depnudge --check   # Only check for outdated packages (don't update)

depnudge --lang es # Switch language (es, en, fr, it)
```

### Example

```sh
depnudge --scan src/
```

## Language Support
- English
- Spanish
- French
- Italian

You can switch languages with the `--lang` flag:

```sh
depnudge --lang it
```

## Contributing

Contributions are welcome! Please open issues or pull requests for bug fixes, new features, or translations.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
