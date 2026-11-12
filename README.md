# ASSAM ASTRA

A responsive bilingual (English and Assamese) frontend starter for an Assam government examination preparation platform.

## Included in this version

- Responsive homepage for desktop and mobile
- English / Assamese language toggle
- Navigation menu
- Mock test, PYQ, premium and current affairs resource cards
- Initial examination placeholder
- Dark navy and warm gold visual identity

## Not connected yet

This is frontend version 1. Student registration, database, real questions, mock test engine, admin panel, subscriptions and payments will be developed in later stages. Do not collect real student or payment information with this version.

## Requirements

- Node.js 20.9 or newer (LTS recommended)
- npm

## Run locally

1. Extract the ZIP.
2. Open the extracted `assam-astra` folder in VS Code.
3. Open Terminal > New Terminal.
4. Run:

   ```bash
   npm install
   npm run dev
   ```

5. Open http://localhost:3000 in your browser.

Stop the development server with `Ctrl + C`.

## Production build check

```bash
npm run build
```

## Deploy

Push the project to a GitHub repository, then import that repository into Vercel. Use the default Next.js build settings. No environment variables are required for this frontend-only version.

## Project structure

```text
assam-astra/
├── app/
│   ├── globals.css
│   ├── layout.js
│   └── page.js
├── .gitignore
├── jsconfig.json
├── next.config.mjs
├── package.json
└── README.md
```
