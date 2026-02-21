This is the **VSA (Voice Scheduling Agent) Web Console** – a Next.js frontend for the Voice Scheduling Agent backend API.

## How to run

```bash
npm install
cp .env.local.example .env.local   # edit if needed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to the Dashboard.

## Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_BASE` | Backend API base URL (default: `https://voice-scheduling-gent.onrender.com/api/v1`). Used only by Next server proxy. |
| `BACKEND_API_KEY` | Optional. If your backend requires `x-api-key`, set it here. **Server-side only** – never exposed to the client. |
| `NEXT_PUBLIC_SHOW_WEBHOOK_TESTER` | Set to `true` to show the Webhook Tester in the sidebar (e.g. for dev). Set to `false` in production if desired. |
| `OPENAI_API_KEY` | Optional. OpenAI API key for smarter voice transcript parsing (name, date, time, title). **Server-side only** – used by `/api/voice/parse`. If not set, falls back to local regex parsing. |

## How to test flows

- **Dashboard → Create Session → Create Event → View Event → Open Calendar link**  
  Use “Create session” or “Create event” from the Dashboard (or from Sessions / Events). On an event detail page, use “Open in Google Calendar” if the backend returned an `htmlLink`.

- **Webhook tester**  
  Go to **Webhook Tester** (if `NEXT_PUBLIC_SHOW_WEBHOOK_TESTER=true`). Fill the form to send a `create_calendar_event` tool call to `/webhooks/voice`. Use “Copy curl” to reproduce the request from the command line.

## Scripts

- `npm run dev` – start dev server
- `npm run build` – production build
- `npm run start` – run production server
- `npm run typecheck` – run TypeScript check

Date/time display uses the browser’s native `Intl` API (see `lib/formatDate.ts`); no date-fns dependency.
- `npm run lint` – run ESLint

## Getting Started (dev)

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
