# Copilot Instructions for Chrome Extension Development

This file provides guidelines and best practices for GitHub Copilot when assisting with code generation and suggestions for this Chrome extension project.

## General Coding Best Practices
- **Use clear, descriptive variable and function names.**
- **Write modular, reusable code.** Functions should do one thing and do it well.
- **Add comments where appropriate** to explain complex logic.
- **Prefer `const` and `let` over `var`** for variable declarations.
- **Avoid global variables**; use closures or modules to encapsulate logic.
- **Use strict mode** (`'use strict';`) in all JavaScript files.
- **Handle errors gracefully** and provide meaningful error messages.
- **Follow the existing code style** (indentation, spacing, semicolons, etc.).
- **Avoid code duplication**; extract common logic into functions or modules.

## Chrome Extension Specific Guidelines
- **Follow Chrome Extension Manifest V3 guidelines.**
- **Never use `eval` or unsafe code.**
- **Use message passing for communication** between background, popup, and content scripts.
- **Access extension APIs via the `chrome` namespace** (e.g., `chrome.runtime`, `chrome.tabs`).
- **Do not hardcode sensitive information** (API keys, secrets, etc.).
- **Minimize permissions** in `manifest.json` to only what is necessary.
- **Use event listeners efficiently**; remove them when not needed.
- **Keep UI responsive**; avoid blocking the main thread.
- **Sanitize and validate all user input** to prevent XSS and other vulnerabilities.
- **Use CSS for styling, not inline styles.**

## File/Folder Structure
- **Organize code logically** (e.g., separate background, popup, and content scripts).
- **Keep assets (images, CSS) in dedicated folders** if the project grows.
- **Update `manifest.json`** when adding or removing scripts or assets.

## Documentation & Comments
- **Document all public functions and modules.**
- **Add usage examples where helpful.**
- **Update README.md** with any major changes or new features.

## Testing & Debugging
- **Test all features in Chrome before release.**
- **Use `console.log` for debugging, but remove unnecessary logs before production.**
- **Check for errors in the Chrome Extensions page (`chrome://extensions`).**

## Security
- **Never include third-party scripts from remote sources.**
- **Follow the Content Security Policy (CSP) in `manifest.json`.**
- **Escape all dynamic content rendered in the DOM.**

## Accessibility
- **Ensure UI is accessible** (use ARIA labels, keyboard navigation, etc.).
- **Use semantic HTML elements.**

---

By following these instructions, Copilot will help maintain a high-quality, secure, and maintainable Chrome extension codebase.
