# 🛠️ TypeScript Project Template

A minimal, practical starter for building small browser apps with TypeScript and Web Components using Parcel. Includes example component, Pug templates, and a simple BaseComponent to accelerate development.

---

## What this project is

- Opinionated small app template using Parcel v2, TypeScript, Pug templates and CSS.
- Contains a BaseComponent class that:
  - accepts a template (template id or template function),
  - accepts initial props,
  - proxies `this.props` so direct assignments (e.g. `this.props.count = 1`) update the DOM,
  - accepts inline or external styles to inject into the shadow root,
  - performs a one-time template setup and incremental updates thereafter.
- ExampleComponent demonstrates usage and how to import CSS/Pug as strings for use inside components.

---

## 🚀 Quick Start

1. Clone
```bash
git clone https://github.com/bladeski/basic-template.git
cd basic-template
```
2. Install
```bash
npm install
```
3. Develop
```bash
npm run dev
```
4. Build
```bash
npm run build
```
5. Test (if enabled)
```bash
npm run test
```

---

## 📂 Project structure (important files)
* `src/index.pug` — app entry (imports component templates).
* `src/components/BaseComponent.ts` — shared base class.
* `src/components/ExampleComponent/ExampleComponent.pug` — component * template.
* `src/components/ExampleComponent/ExampleComponent.ts` — component implementation.
* `src/styles/` — global design tokens and utilities.
* `src/types/bundle-text.d.ts` — declaration for bundle-text: imports.

---

## ⚙️ Included scripts
- npm run dev — run in watch/development mode
- npm run build — compile TypeScript to dist/
- npm run lint — run ESLint
- npm run test — run Jest (if configured)

---

## 💡 Tips
- Adjust tsconfig.json targets and module settings for your environment
- Add environment variables in .env and share .env.example
- Keep dependencies updated with npm outdated / npm update

---

## Contributing & Extending
Extend BaseComponent for common behavior.
Use component-level CSS variables (design tokens in src/styles) to theme components.
Add unit tests for components using your preferred test runner.

---

## 📜 License
MIT