# Agent 1 — Architect & Scaffolding

## Your role
You are the project architect. Your job is to scaffold the entire Next.js project from scratch, install all dependencies, configure Tailwind with the brand design tokens, and establish the folder structure that all future agents will build on.

Do NOT build any page UI. Set up the skeleton only.

---

## Project context

This is a business website for **My Wife's Dumplings** — a small Auckland, NZ home-based dumpling business. The site must look handcrafted and warm, matching the brand aesthetic: Chinese folk-art red illustrations, cream/textured background, playful typography.

It is also a **portfolio project** for the developer (Himendra Fernando, CS student, University of Waikato). The tech stack is intentionally chosen to add new, NZ-industry-standard skills to his CV. Stick exactly to the stack below — do not substitute.

---

## Tech stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | **Next.js 14 App Router** | Use `app/` directory, server components by default |
| Language | **TypeScript** | Strict mode |
| Styling | **Tailwind CSS v3** | With custom brand tokens |
| Components | **Shadcn/ui** | Init with `npx shadcn@latest init` |
| Animations | **Framer Motion** | Install only — config in later agent |
| CMS | **Sanity** | Install `next-sanity`, `@sanity/client`, `@sanity/image-url` |
| Forms | **React Hook Form** + **Zod** | Install both |
| Email | **Resend** | Install `resend` |
| Analytics | **@vercel/analytics** | Install |
| Testing | **Vitest** + **@testing-library/react** | Configure vitest.config.ts |
| Linting | **ESLint** + **Prettier** | Next.js default ESLint + add Prettier |

---

## Steps to execute

### 1. Bootstrap Next.js project

Run in the repo root (`C:\Users\Gorilla Rig\Dropbox\My PC (Isaac-pc)\Desktop\MyWifesDumplings`):

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Answer prompts: yes to everything. The `.` means install in the current directory.

### 2. Install all dependencies

```bash
npm install framer-motion next-sanity @sanity/client @sanity/image-url react-hook-form @hookform/resolvers zod resend @vercel/analytics
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom prettier prettier-plugin-tailwindcss
```

### 3. Init Shadcn/ui

```bash
npx shadcn@latest init
```

When prompted:
- Style: **Default**
- Base color: **Stone** (closest to warm cream)
- CSS variables: **Yes**

Then add these components:
```bash
npx shadcn@latest add button card badge separator sheet navigation-menu
```

### 4. Configure Tailwind brand tokens

Replace the contents of `tailwind.config.ts` with:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#C0392B",
          "red-dark": "#922B21",
          "red-light": "#E74C3C",
          cream: "#F5E6D3",
          "cream-dark": "#EDD9C0",
          ink: "#1A0A00",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      backgroundImage: {
        "paper-texture": "url('/textures/paper.png')",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "stamp": {
          "0%": { opacity: "0", transform: "scale(1.3) rotate(-3deg)" },
          "70%": { opacity: "1", transform: "scale(0.95) rotate(1deg)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(0deg)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out forwards",
        "stamp": "stamp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

### 5. Set up global CSS

Replace `src/app/globals.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 30 47% 91%;       /* brand cream */
    --foreground: 20 60% 8%;        /* brand ink */
    --card: 30 40% 94%;
    --card-foreground: 20 60% 8%;
    --popover: 30 40% 94%;
    --popover-foreground: 20 60% 8%;
    --primary: 4 64% 46%;           /* brand red */
    --primary-foreground: 30 47% 96%;
    --secondary: 30 30% 85%;
    --secondary-foreground: 20 60% 8%;
    --muted: 30 20% 88%;
    --muted-foreground: 20 20% 40%;
    --accent: 30 30% 85%;
    --accent-foreground: 20 60% 8%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 98%;
    --border: 30 20% 80%;
    --input: 30 20% 80%;
    --ring: 4 64% 46%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-brand-cream text-brand-ink;
  }
}

/* Rough hand-drawn border utility */
@layer utilities {
  .border-rough {
    border: 2px solid theme('colors.brand.red');
    border-radius: 2px 6px 3px 5px / 5px 3px 6px 2px;
  }
}
```

### 6. Set up fonts in `src/app/layout.tsx`

Use Next.js `next/font/google`. Import **Playfair Display** (display) and **Inter** (body):

```tsx
import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "My Wife's Dumplings | Handmade Dumplings Auckland, NZ",
  description:
    "Handmade dumplings made with love in Auckland, NZ. Pork & chives, pork & cabbage. Order now.",
  openGraph: {
    title: "My Wife's Dumplings",
    description: "Handmade dumplings made with love in Auckland, NZ.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-body antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### 7. Folder structure

Create the following empty directories and placeholder `index.ts` or `.gitkeep` files so the structure is ready for other agents:

```
src/
  app/
    (marketing)/        <- route group for public pages
      page.tsx          <- home page placeholder
      menu/page.tsx     <- menu page placeholder
      about/page.tsx    <- about page placeholder
      order/page.tsx    <- order form page placeholder
    api/
      contact/route.ts  <- API route placeholder
    layout.tsx          <- already created above
    globals.css         <- already created above
  components/
    ui/                 <- Shadcn components live here (auto-generated)
    brand/              <- custom brand components (empty for now)
    layout/             <- Header, Footer (empty for now)
    sections/           <- page sections (Hero, Menu, etc.) (empty for now)
  lib/
    sanity/
      client.ts         <- placeholder
      queries.ts        <- placeholder
      image.ts          <- placeholder
    utils.ts            <- Shadcn cn() utility (auto-generated)
    validations.ts      <- Zod schemas (placeholder)
  types/
    index.ts            <- shared TypeScript types (placeholder)
public/
  textures/             <- empty, for paper texture PNG
  images/               <- empty, for static images
```

Placeholder `page.tsx` content (use for all 4 page placeholders):
```tsx
export default function Page() {
  return <main className="min-h-screen" />;
}
```

Placeholder API route (`src/app/api/contact/route.ts`):
```ts
import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json({ message: "not implemented" }, { status: 501 });
}
```

### 8. Configure Vitest

Create `vitest.config.ts` in the project root:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Create `src/test/setup.ts`:
```ts
import "@testing-library/jest-dom";
```

### 9. Configure Prettier

Create `.prettierrc` in root:
```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### 10. Environment variables

Create `.env.local` in root with placeholder keys:
```
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=
RESEND_API_KEY=
NEXT_PUBLIC_ORDER_FORM_URL=https://docs.google.com/forms/d/1ceXl_Ul9aQ96Mhs7PbZKitqHoc_dPAhrMY3W...
```

Also create `.env.example` as a copy (safe to commit).

Create `.gitignore` entry for `.env.local` (Next.js does this automatically, but verify).

---

## Verify success

Run:
```bash
npm run dev
```

The dev server should start on `localhost:3000` with no errors. The page will be blank — that is expected. Agent 3 will build the UI.

Run:
```bash
npm run build
```

Should complete with no TypeScript errors.

---

## Output for next agent

After completing this agent, the next agent (Agent 2 — Sanity CMS Setup) needs:
- The project running cleanly (`npm run dev` works)
- The folder structure above in place
- `.env.local` with placeholder keys ready to be filled in
