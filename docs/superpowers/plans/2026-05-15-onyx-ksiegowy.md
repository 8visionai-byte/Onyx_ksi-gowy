# Onyx Księgowy — Plan Implementacji

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplikacja webowa do skanowania dokumentów księgowych z OCR + AI, zastępująca flow Telegram + Make.com. Dashboard z filtrowaniem kosztów per właściciel (Onyx, Ogonowscy, Pieloch, Welman).

**Architecture:** Full-stack Next.js 14 (App Router) z Prisma ORM + PostgreSQL. OCR przez Google Cloud Vision API, klasyfikacja przez OpenAI GPT-4o. Deploy jako kontener Docker na Hostinger Horizon VPS.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Prisma, PostgreSQL, NextAuth.js, Google Cloud Vision, OpenAI API

**Spec:** `docs/superpowers/specs/2026-05-14-onyx-ksiegowy-design.md`

---

## Struktura plików

```
onyx-ksiegowy/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout z sidebar
│   │   ├── page.tsx                   # Dashboard (strona główna)
│   │   ├── globals.css
│   │   ├── skan/
│   │   │   └── page.tsx               # Nowy skan
│   │   ├── koszty/
│   │   │   └── page.tsx               # Koszty / Wydatki
│   │   ├── vat/
│   │   │   └── page.tsx               # Rejestr VAT
│   │   ├── produkty/
│   │   │   └── page.tsx               # Produkty
│   │   ├── dokumenty/
│   │   │   ├── page.tsx               # Archiwum dokumentów
│   │   │   └── [id]/
│   │   │       └── page.tsx           # Szczegóły dokumentu
│   │   ├── ustawienia/
│   │   │   └── page.tsx               # Ustawienia
│   │   ├── login/
│   │   │   └── page.tsx               # Logowanie
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts       # NextAuth handler
│   │       ├── documents/
│   │       │   ├── route.ts           # GET list, POST create
│   │       │   ├── upload/
│   │       │   │   └── route.ts       # POST upload image
│   │       │   └── [id]/
│   │       │       └── route.ts       # GET, PUT, DELETE single
│   │       ├── ocr/
│   │       │   └── route.ts           # POST OCR processing
│   │       ├── classify/
│   │       │   └── route.ts           # POST AI classification
│   │       ├── dashboard/
│   │       │   ├── summary/
│   │       │   │   └── route.ts       # GET stats
│   │       │   ├── expenses/
│   │       │   │   └── route.ts       # GET expense breakdown
│   │       │   ├── vat/
│   │       │   │   └── route.ts       # GET VAT summary
│   │       │   └── owners-breakdown/
│   │       │       └── route.ts       # GET per-owner breakdown
│   │       ├── users/
│   │       │   ├── route.ts           # GET list, POST create
│   │       │   └── [id]/
│   │       │       └── route.ts       # PUT, DELETE
│   │       └── config/
│   │           └── route.ts           # GET/PUT AI config
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── OwnerFilter.tsx            # Checkboxy właścicieli
│   │   ├── StatCard.tsx
│   │   ├── DocumentsTable.tsx
│   │   ├── CameraCapture.tsx
│   │   ├── ClassificationWizard.tsx   # Flow: Onyx/Prywatny → rodzina
│   │   ├── DocumentReview.tsx         # Podgląd + edycja danych AI
│   │   └── MonthSelector.tsx
│   ├── lib/
│   │   ├── prisma.ts                  # Prisma client singleton
│   │   ├── auth.ts                    # NextAuth config
│   │   ├── ocr.ts                     # Google Cloud Vision wrapper
│   │   ├── classifier.ts             # OpenAI classification wrapper
│   │   └── types.ts                   # Shared TypeScript types
│   └── middleware.ts                  # Auth middleware
├── public/
│   └── uploads/                       # Uploaded document images
├── tests/
│   ├── api/
│   │   ├── documents.test.ts
│   │   ├── ocr.test.ts
│   │   ├── classify.test.ts
│   │   └── dashboard.test.ts
│   └── components/
│       ├── OwnerFilter.test.tsx
│       └── ClassificationWizard.test.tsx
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Faza 1: Fundament

### Task 1: Scaffolding projektu Next.js

**Files:**
- Create: `onyx-ksiegowy/package.json`
- Create: `onyx-ksiegowy/tsconfig.json`
- Create: `onyx-ksiegowy/next.config.ts`
- Create: `onyx-ksiegowy/tailwind.config.ts`
- Create: `onyx-ksiegowy/.env.example`
- Create: `onyx-ksiegowy/src/app/globals.css`

- [ ] **Step 1: Utworzenie projektu Next.js**

```bash
cd "C:\Users\Paweł Pieloch\CLAUDE CODE"
npx create-next-app@latest onyx-ksiegowy --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

- [ ] **Step 2: Instalacja zależności**

```bash
cd onyx-ksiegowy
npm install prisma @prisma/client next-auth @auth/prisma-adapter
npm install openai @google-cloud/vision
npm install bcryptjs zod uuid
npm install -D @types/bcryptjs @types/uuid vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Plik .env.example**

Utwórz `onyx-ksiegowy/.env.example`:
```env
# Database
DATABASE_URL="postgresql://user:password@postgresql:5432/onyx_ksiegowy"

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Google Cloud Vision
GOOGLE_CLOUD_VISION_CREDENTIALS='{"type":"service_account","project_id":"..."}'

# OpenAI
OPENAI_API_KEY="sk-..."

# Upload
UPLOAD_DIR="/app/public/uploads"
```

- [ ] **Step 4: Konfiguracja Tailwind dla ciemnego motywu**

Zmodyfikuj `onyx-ksiegowy/tailwind.config.ts`:
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        onyx: {
          bg: "#0f172a",
          card: "#1e293b",
          border: "#334155",
          text: "#e2e8f0",
          muted: "#94a3b8",
          accent: "#3b82f6",
        },
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 5: Globalne style**

Zastąp `onyx-ksiegowy/src/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #0f172a;
  color: #e2e8f0;
}
```

- [ ] **Step 6: Konfiguracja vitest**

Utwórz `onyx-ksiegowy/vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Utwórz `onyx-ksiegowy/tests/setup.ts`:
```typescript
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 7: Sprawdzenie że projekt się buduje**

```bash
npm run build
```
Expected: Build successful

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: scaffolding projektu Onyx Księgowy (Next.js + Tailwind + Prisma)"
```

---

### Task 2: Schemat bazy danych (Prisma)

**Files:**
- Create: `onyx-ksiegowy/prisma/schema.prisma`
- Create: `onyx-ksiegowy/prisma/seed.ts`
- Create: `onyx-ksiegowy/src/lib/prisma.ts`

- [ ] **Step 1: Inicjalizacja Prisma**

```bash
cd onyx-ksiegowy
npx prisma init
```

- [ ] **Step 2: Schemat Prisma**

Zastąp `onyx-ksiegowy/prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum DocumentType {
  faktura_zakup
  faktura_sprzedaz
  paragon
  inny
}

enum CostOwner {
  onyx
  ogonowscy
  pieloch
  welman
}

enum DocumentStatus {
  processing
  review
  confirmed
  rejected
}

enum UserRole {
  admin
  viewer
}

model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String    @map("password_hash")
  name         String
  role         UserRole  @default(viewer)
  createdAt    DateTime  @default(now()) @map("created_at")

  documents    Document[]
  aiConfigs    AiConfig[]

  @@map("users")
}

model Document {
  id              String         @id @default(uuid())
  type            DocumentType
  costOwner       CostOwner      @map("cost_owner")
  isPrivate       Boolean        @default(false) @map("is_private")
  status          DocumentStatus @default(processing)
  vendorName      String?        @map("vendor_name")
  vendorNip       String?        @map("vendor_nip")
  documentNumber  String?        @map("document_number")
  documentDate    DateTime?      @map("document_date")
  saleDate        DateTime?      @map("sale_date")
  netAmount       Decimal?       @map("net_amount") @db.Decimal(12, 2)
  vatAmount       Decimal?       @map("vat_amount") @db.Decimal(12, 2)
  grossAmount     Decimal?       @map("gross_amount") @db.Decimal(12, 2)
  ocrRawText      String?        @map("ocr_raw_text")
  aiRawResponse   Json?          @map("ai_raw_response")
  imagePath       String         @map("image_path")
  notes           String?
  createdBy       String         @map("created_by")
  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")
  deletedAt       DateTime?      @map("deleted_at")

  user            User           @relation(fields: [createdBy], references: [id])
  items           DocumentItem[]

  @@map("documents")
}

model DocumentItem {
  id          String   @id @default(uuid())
  documentId  String   @map("document_id")
  name        String
  quantity    Decimal? @db.Decimal(10, 3)
  unit        String?
  unitPrice   Decimal? @map("unit_price") @db.Decimal(12, 2)
  netAmount   Decimal? @map("net_amount") @db.Decimal(12, 2)
  vatRate     Decimal? @map("vat_rate") @db.Decimal(4, 2)
  vatAmount   Decimal? @map("vat_amount") @db.Decimal(12, 2)
  grossAmount Decimal? @map("gross_amount") @db.Decimal(12, 2)
  category    String?

  document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@map("document_items")
}

model AiConfig {
  id        String   @id @default(uuid())
  key       String   @unique
  value     String
  updatedBy String?  @map("updated_by")
  updatedAt DateTime @updatedAt @map("updated_at")

  user      User?    @relation(fields: [updatedBy], references: [id])

  @@map("ai_config")
}
```

- [ ] **Step 3: Singleton Prisma client**

Utwórz `onyx-ksiegowy/src/lib/prisma.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 4: Seed z domyślnym użytkownikiem admin i promptem AI**

Utwórz `onyx-ksiegowy/prisma/seed.ts`:
```typescript
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_PROMPT = `Jesteś analizatorem dokumentów księgowych dla polskiej firmy hotelowo-gastronomicznej.
Na podstawie tekstu OCR ze zeskanowanego dokumentu wyciągnij:

1. Typ dokumentu: faktura_zakup | faktura_sprzedaz | paragon | inny
2. Nazwa sprzedawcy/kontrahenta
3. NIP sprzedawcy (jeśli widoczny)
4. Numer dokumentu (jeśli widoczny)
5. Data wystawienia dokumentu (format: YYYY-MM-DD)
6. Data sprzedaży/wykonania usługi (jeśli inna niż data wystawienia, format: YYYY-MM-DD)
7. Pozycje: [{nazwa, ilosc, jednostka, cena_jednostkowa, netto, stawka_vat, vat, brutto}]
8. Sumy: {netto, vat, brutto}
9. Rozbicie VAT wg stawek (0.23, 0.08, 0.05, 0.0)

Kontekst branżowy — firma Onyx (hotel + restauracja). Typowe koszty:
- Dostawy żywności (mięso, nabiał, warzywa) — VAT 5% lub 8%
- Usługi gastronomiczne — VAT 8%
- Wyposażenie, chemia, materiały — VAT 23%
- Usługi hotelowe — VAT 8%

Zwróć TYLKO poprawny JSON (bez markdown). Jeśli pole nie do ustalenia, użyj null.
Wszystkie kwoty w PLN. Stawki VAT jako ułamki dziesiętne.

Schemat odpowiedzi:
{
  "type": "faktura_zakup",
  "vendor_name": "string",
  "vendor_nip": "string|null",
  "document_number": "string|null",
  "document_date": "YYYY-MM-DD",
  "sale_date": "YYYY-MM-DD|null",
  "items": [
    {
      "nazwa": "string",
      "ilosc": 1.0,
      "jednostka": "szt",
      "cena_jednostkowa": 100.00,
      "netto": 100.00,
      "stawka_vat": 0.23,
      "vat": 23.00,
      "brutto": 123.00
    }
  ],
  "totals": {
    "netto": 100.00,
    "vat": 23.00,
    "brutto": 123.00
  },
  "vat_breakdown": {
    "0.23": { "netto": 100.00, "vat": 23.00 },
    "0.08": { "netto": 0.00, "vat": 0.00 }
  }
}`;

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: { email: "admin@onyx.pl" },
    update: {},
    create: {
      email: "admin@onyx.pl",
      passwordHash,
      name: "Admin",
      role: "admin",
    },
  });

  await prisma.aiConfig.upsert({
    where: { key: "document_classification_prompt" },
    update: {},
    create: {
      key: "document_classification_prompt",
      value: DEFAULT_PROMPT,
    },
  });

  console.log("Seed zakończony: admin@onyx.pl / admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Dodaj do `package.json`:
```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

- [ ] **Step 5: Generowanie klienta + migracja (lokalnie do testu)**

```bash
npx prisma generate
```
Expected: Generated Prisma Client

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: schemat bazy danych Prisma (documents, items, users, ai_config)"
```

---

### Task 3: Autoryzacja (NextAuth.js)

**Files:**
- Create: `onyx-ksiegowy/src/lib/auth.ts`
- Create: `onyx-ksiegowy/src/app/api/auth/[...nextauth]/route.ts`
- Create: `onyx-ksiegowy/src/middleware.ts`
- Create: `onyx-ksiegowy/src/lib/types.ts`
- Create: `onyx-ksiegowy/src/app/login/page.tsx`

- [ ] **Step 1: Typy współdzielone**

Utwórz `onyx-ksiegowy/src/lib/types.ts`:
```typescript
import { CostOwner, DocumentType, DocumentStatus } from "@prisma/client";

export type OwnerFilter = CostOwner[];

export interface DashboardFilters {
  owners: OwnerFilter;
  month: string; // YYYY-MM
}

export interface ClassificationResult {
  type: DocumentType;
  vendor_name: string | null;
  vendor_nip: string | null;
  document_number: string | null;
  document_date: string | null;
  sale_date: string | null;
  items: {
    nazwa: string;
    ilosc: number | null;
    jednostka: string | null;
    cena_jednostkowa: number | null;
    netto: number | null;
    stawka_vat: number | null;
    vat: number | null;
    brutto: number | null;
  }[];
  totals: {
    netto: number | null;
    vat: number | null;
    brutto: number | null;
  };
  vat_breakdown: Record<string, { netto: number; vat: number }>;
}

export const OWNER_LABELS: Record<CostOwner, string> = {
  onyx: "Onyx",
  ogonowscy: "Ogonowscy",
  pieloch: "Pieloch",
  welman: "Welman",
};

export const OWNER_COLORS: Record<CostOwner, string> = {
  onyx: "bg-blue-500",
  ogonowscy: "bg-purple-500",
  pieloch: "bg-green-500",
  welman: "bg-amber-500",
};

export const DOCTYPE_LABELS: Record<DocumentType, string> = {
  faktura_zakup: "Faktura zakupowa",
  faktura_sprzedaz: "Faktura sprzedażowa",
  paragon: "Paragon",
  inny: "Inny",
};
```

- [ ] **Step 2: Konfiguracja NextAuth**

Utwórz `onyx-ksiegowy/src/lib/auth.ts`:
```typescript
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Hasło", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 godziny
  },
};
```

- [ ] **Step 3: Route handler NextAuth**

Utwórz `onyx-ksiegowy/src/app/api/auth/[...nextauth]/route.ts`:
```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

- [ ] **Step 4: Middleware**

Utwórz `onyx-ksiegowy/src/middleware.ts`:
```typescript
import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

- [ ] **Step 5: Strona logowania**

Utwórz `onyx-ksiegowy/src/app/login/page.tsx`:
```tsx
"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Nieprawidłowy email lub hasło");
      setLoading(false);
    } else {
      router.push("/");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-onyx-bg">
      <div className="w-full max-w-md p-8 bg-onyx-card rounded-2xl border border-onyx-border">
        <h1 className="text-2xl font-bold text-center mb-2">📊 Onyx Księgowy</h1>
        <p className="text-onyx-muted text-center mb-8">Zaloguj się do systemu</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-onyx-muted mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-onyx-bg border border-onyx-border rounded-lg text-onyx-text focus:outline-none focus:border-onyx-accent"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-onyx-muted mb-1">Hasło</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-onyx-bg border border-onyx-border rounded-lg text-onyx-text focus:outline-none focus:border-onyx-accent"
              required
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-onyx-accent text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {loading ? "Logowanie..." : "Zaloguj się"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: autoryzacja NextAuth.js (credentials, JWT, middleware, login page)"
```

---

### Task 4: Layout — Sidebar + Shell

**Files:**
- Create: `onyx-ksiegowy/src/components/Sidebar.tsx`
- Modify: `onyx-ksiegowy/src/app/layout.tsx`
- Create: `onyx-ksiegowy/src/app/page.tsx`

- [ ] **Step 1: Komponent Sidebar**

Utwórz `onyx-ksiegowy/src/components/Sidebar.tsx`:
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/skan", label: "Nowy skan", icon: "📸", primary: true },
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/koszty", label: "Koszty", icon: "💰" },
  { href: "/vat", label: "Rejestr VAT", icon: "🧾" },
  { href: "/produkty", label: "Produkty", icon: "📦" },
  { href: "/dokumenty", label: "Dokumenty", icon: "📁" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-onyx-card rounded-lg border border-onyx-border"
      >
        {mobileOpen ? "✕" : "☰"}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-[220px] bg-onyx-card border-r border-onyx-border flex flex-col z-40 transition-transform
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="p-5">
          <h1 className="text-lg font-bold text-onyx-accent">📊 Onyx Księgowy</h1>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                  ${item.primary
                    ? "bg-onyx-accent text-white hover:bg-blue-600"
                    : isActive
                      ? "bg-onyx-bg text-onyx-text"
                      : "text-onyx-muted hover:text-onyx-text hover:bg-onyx-bg"
                  }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 space-y-1">
          <Link
            href="/ustawienia"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-onyx-muted hover:text-onyx-text hover:bg-onyx-bg transition-colors"
          >
            <span>⚙️</span>
            <span>Ustawienia</span>
          </Link>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-onyx-muted hover:text-red-400 hover:bg-onyx-bg transition-colors w-full"
          >
            <span>🚪</span>
            <span>Wyloguj</span>
          </button>
        </div>
      </aside>
    </>
  );
}
```

- [ ] **Step 2: Root layout z sidebar**

Zastąp `onyx-ksiegowy/src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SessionProvider } from "@/components/SessionProvider";

const inter = Inter({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "Onyx Księgowy",
  description: "System księgowy dla firmy Onyx",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="pl" className="dark">
      <body className={`${inter.className} bg-onyx-bg text-onyx-text`}>
        <SessionProvider session={session}>
          {session ? (
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 md:ml-[220px] p-6 md:p-8">
                {children}
              </main>
            </div>
          ) : (
            children
          )}
        </SessionProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: SessionProvider wrapper**

Utwórz `onyx-ksiegowy/src/components/SessionProvider.tsx`:
```tsx
"use client";

import { SessionProvider as NextSessionProvider } from "next-auth/react";

export function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: any;
}) {
  return (
    <NextSessionProvider session={session}>
      {children}
    </NextSessionProvider>
  );
}
```

- [ ] **Step 4: Placeholder strony głównej**

Zastąp `onyx-ksiegowy/src/app/page.tsx`:
```tsx
export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="text-onyx-muted">Strona główna — w budowie</p>
    </div>
  );
}
```

- [ ] **Step 5: Sprawdzenie dev server**

```bash
npm run dev
```
Otwórz http://localhost:3000 — powinien przekierować na /login

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: layout z sidebar, nawigacja, shell aplikacji"
```

---

## Faza 2: Pipeline OCR + AI

### Task 5: API Upload dokumentów

**Files:**
- Create: `onyx-ksiegowy/src/app/api/documents/upload/route.ts`
- Create: `onyx-ksiegowy/src/app/api/documents/route.ts`
- Create: `onyx-ksiegowy/src/app/api/documents/[id]/route.ts`

- [ ] **Step 1: Endpoint upload**

Utwórz `onyx-ksiegowy/src/app/api/documents/upload/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Brak pliku" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = process.env.UPLOAD_DIR || "public/uploads";
    await mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.name) || ".jpg";
    const filename = `${uuid()}${ext}`;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    const userId = (session.user as any).id;

    const document = await prisma.document.create({
      data: {
        type: "inny",
        costOwner: "onyx",
        isPrivate: false,
        status: "processing",
        imagePath: `/uploads/${filename}`,
        createdBy: userId,
      },
    });

    return NextResponse.json({ id: document.id, imagePath: document.imagePath });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Endpoint CRUD dokumentów**

Utwórz `onyx-ksiegowy/src/app/api/documents/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CostOwner, DocumentType, DocumentStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const owners = searchParams.get("owners")?.split(",") as CostOwner[] | undefined;
  const type = searchParams.get("type") as DocumentType | undefined;
  const status = searchParams.get("status") as DocumentStatus | undefined;
  const month = searchParams.get("month"); // YYYY-MM
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: any = { deletedAt: null };

  if (owners?.length) {
    where.costOwner = { in: owners };
  }
  if (type) where.type = type;
  if (status) where.status = status;
  if (month) {
    const [year, m] = month.split("-").map(Number);
    where.documentDate = {
      gte: new Date(year, m - 1, 1),
      lt: new Date(year, m, 1),
    };
  }

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.document.count({ where }),
  ]);

  return NextResponse.json({ documents, total, page, limit });
}
```

- [ ] **Step 3: Endpoint pojedynczego dokumentu**

Utwórz `onyx-ksiegowy/src/app/api/documents/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const document = await prisma.document.findUnique({
    where: { id: params.id },
    include: { items: true },
  });

  if (!document || document.deletedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(document);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { type, costOwner, isPrivate, status, vendorName, vendorNip,
    documentNumber, documentDate, saleDate, netAmount, vatAmount,
    grossAmount, notes, items } = body;

  const document = await prisma.document.update({
    where: { id: params.id },
    data: {
      type, costOwner, isPrivate, status, vendorName, vendorNip,
      documentNumber,
      documentDate: documentDate ? new Date(documentDate) : undefined,
      saleDate: saleDate ? new Date(saleDate) : undefined,
      netAmount, vatAmount, grossAmount, notes,
    },
  });

  if (items?.length) {
    await prisma.documentItem.deleteMany({ where: { documentId: params.id } });
    await prisma.documentItem.createMany({
      data: items.map((item: any) => ({
        documentId: params.id,
        name: item.nazwa || item.name,
        quantity: item.ilosc || item.quantity,
        unit: item.jednostka || item.unit,
        unitPrice: item.cena_jednostkowa || item.unitPrice,
        netAmount: item.netto || item.netAmount,
        vatRate: item.stawka_vat || item.vatRate,
        vatAmount: item.vat || item.vatAmount,
        grossAmount: item.brutto || item.grossAmount,
        category: item.category,
      })),
    });
  }

  const updated = await prisma.document.findUnique({
    where: { id: params.id },
    include: { items: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.document.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: API endpoints dokumentów (upload, CRUD, filtrowanie per owner)"
```

---

### Task 6: Integracja OCR (Google Cloud Vision)

**Files:**
- Create: `onyx-ksiegowy/src/lib/ocr.ts`
- Create: `onyx-ksiegowy/src/app/api/ocr/route.ts`

- [ ] **Step 1: Wrapper Google Cloud Vision**

Utwórz `onyx-ksiegowy/src/lib/ocr.ts`:
```typescript
import vision from "@google-cloud/vision";

let client: vision.ImageAnnotatorClient | null = null;

function getClient(): vision.ImageAnnotatorClient {
  if (!client) {
    const credentials = JSON.parse(
      process.env.GOOGLE_CLOUD_VISION_CREDENTIALS || "{}"
    );
    client = new vision.ImageAnnotatorClient({ credentials });
  }
  return client;
}

export async function extractTextFromImage(imagePath: string): Promise<string> {
  const visionClient = getClient();

  const [result] = await visionClient.textDetection(imagePath);
  const detections = result.textAnnotations;

  if (!detections || detections.length === 0) {
    throw new Error("OCR nie rozpoznał tekstu w obrazie");
  }

  // Pierwszy element zawiera cały tekst
  return detections[0].description || "";
}
```

- [ ] **Step 2: Endpoint OCR**

Utwórz `onyx-ksiegowy/src/app/api/ocr/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractTextFromImage } from "@/lib/ocr";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { documentId } = await req.json();

  if (!documentId) {
    return NextResponse.json({ error: "Brak documentId" }, { status: 400 });
  }

  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    return NextResponse.json({ error: "Dokument nie znaleziony" }, { status: 404 });
  }

  try {
    const imagePath = path.join(
      process.env.UPLOAD_DIR || "public/uploads",
      path.basename(document.imagePath)
    );

    const ocrText = await extractTextFromImage(imagePath);

    await prisma.document.update({
      where: { id: documentId },
      data: { ocrRawText: ocrText, status: "review" },
    });

    return NextResponse.json({ text: ocrText });
  } catch (error: any) {
    console.error("OCR error:", error);

    // Retry raz
    try {
      const imagePath = path.join(
        process.env.UPLOAD_DIR || "public/uploads",
        path.basename(document.imagePath)
      );
      const ocrText = await extractTextFromImage(imagePath);

      await prisma.document.update({
        where: { id: documentId },
        data: { ocrRawText: ocrText, status: "review" },
      });

      return NextResponse.json({ text: ocrText });
    } catch (retryError) {
      return NextResponse.json(
        { error: "OCR failed", message: "Nie udało się rozpoznać tekstu. Wprowadź dane ręcznie." },
        { status: 422 }
      );
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: integracja Google Cloud Vision OCR z retry"
```

---

### Task 7: Klasyfikacja AI (OpenAI)

**Files:**
- Create: `onyx-ksiegowy/src/lib/classifier.ts`
- Create: `onyx-ksiegowy/src/app/api/classify/route.ts`
- Create: `onyx-ksiegowy/src/app/api/config/route.ts`

- [ ] **Step 1: Wrapper OpenAI**

Utwórz `onyx-ksiegowy/src/lib/classifier.ts`:
```typescript
import OpenAI from "openai";
import { prisma } from "./prisma";
import { ClassificationResult } from "./types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function classifyDocument(
  ocrText: string
): Promise<ClassificationResult> {
  // Pobierz prompt z bazy (konfigurowalny)
  const config = await prisma.aiConfig.findUnique({
    where: { key: "document_classification_prompt" },
  });

  const systemPrompt = config?.value || "Analizuj dokument księgowy.";

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: ocrText },
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Brak odpowiedzi od AI");
  }

  return JSON.parse(content) as ClassificationResult;
}
```

- [ ] **Step 2: Endpoint klasyfikacji**

Utwórz `onyx-ksiegowy/src/app/api/classify/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { classifyDocument } from "@/lib/classifier";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { documentId, ocrText } = await req.json();

  if (!documentId || !ocrText) {
    return NextResponse.json(
      { error: "Brak documentId lub ocrText" },
      { status: 400 }
    );
  }

  try {
    const result = await classifyDocument(ocrText);

    await prisma.document.update({
      where: { id: documentId },
      data: {
        type: result.type,
        vendorName: result.vendor_name,
        vendorNip: result.vendor_nip,
        documentNumber: result.document_number,
        documentDate: result.document_date ? new Date(result.document_date) : null,
        saleDate: result.sale_date ? new Date(result.sale_date) : null,
        netAmount: result.totals?.netto,
        vatAmount: result.totals?.vat,
        grossAmount: result.totals?.brutto,
        aiRawResponse: result as any,
        status: "review",
      },
    });

    // Zapisz pozycje
    if (result.items?.length) {
      await prisma.documentItem.createMany({
        data: result.items.map((item) => ({
          documentId,
          name: item.nazwa,
          quantity: item.ilosc,
          unit: item.jednostka,
          unitPrice: item.cena_jednostkowa,
          netAmount: item.netto,
          vatRate: item.stawka_vat,
          vatAmount: item.vat,
          grossAmount: item.brutto,
        })),
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Classification error:", error);
    return NextResponse.json(
      { error: "Klasyfikacja nie powiodła się", message: error.message },
      { status: 422 }
    );
  }
}
```

- [ ] **Step 3: Endpoint konfiguracji AI**

Utwórz `onyx-ksiegowy/src/app/api/config/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const configs = await prisma.aiConfig.findMany();
  return NextResponse.json(configs);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { key, value } = await req.json();
  const userId = (session.user as any).id;

  const config = await prisma.aiConfig.upsert({
    where: { key },
    update: { value, updatedBy: userId },
    create: { key, value, updatedBy: userId },
  });

  return NextResponse.json(config);
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: klasyfikacja AI OpenAI z konfigurowalnym promptem"
```

---

## Faza 3: UI — Skanowanie + Dashboard

### Task 8: Strona "Nowy Skan" (aparat + klasyfikacja)

**Files:**
- Create: `onyx-ksiegowy/src/components/CameraCapture.tsx`
- Create: `onyx-ksiegowy/src/components/ClassificationWizard.tsx`
- Create: `onyx-ksiegowy/src/components/DocumentReview.tsx`
- Create: `onyx-ksiegowy/src/app/skan/page.tsx`

- [ ] **Step 1: Komponent aparatu/upload**

Utwórz `onyx-ksiegowy/src/components/CameraCapture.tsx`:
```tsx
"use client";

import { useRef, useState } from "react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  disabled?: boolean;
}

export default function CameraCapture({ onCapture, disabled }: CameraCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    onCapture(file);
  }

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Podgląd dokumentu"
            className="w-full max-h-[400px] object-contain rounded-xl border border-onyx-border"
          />
          <button
            onClick={() => { setPreview(null); }}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Aparat (mobile) */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={disabled}
            className="flex-1 py-12 border-2 border-dashed border-onyx-border rounded-xl hover:border-onyx-accent transition-colors flex flex-col items-center gap-3 disabled:opacity-50"
          >
            <span className="text-4xl">📸</span>
            <span className="text-onyx-muted">Zrób zdjęcie</span>
          </button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            className="hidden"
          />

          {/* Upload pliku */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex-1 py-12 border-2 border-dashed border-onyx-border rounded-xl hover:border-onyx-accent transition-colors flex flex-col items-center gap-3 disabled:opacity-50"
          >
            <span className="text-4xl">📁</span>
            <span className="text-onyx-muted">Wybierz plik</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFile}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wizard klasyfikacji (Onyx/Prywatny → rodzina)**

Utwórz `onyx-ksiegowy/src/components/ClassificationWizard.tsx`:
```tsx
"use client";

import { useState } from "react";
import { CostOwner } from "@prisma/client";
import { OWNER_LABELS, OWNER_COLORS } from "@/lib/types";

interface ClassificationWizardProps {
  aiDetectedType: string;
  vendorName: string | null;
  netAmount: number | null;
  onComplete: (owner: CostOwner, isPrivate: boolean) => void;
}

export default function ClassificationWizard({
  aiDetectedType,
  vendorName,
  netAmount,
  onComplete,
}: ClassificationWizardProps) {
  const [step, setStep] = useState<1 | 2>(1);

  function handleOwnType(isPrivate: boolean) {
    if (isPrivate) {
      setStep(2);
    } else {
      onComplete("onyx", false);
    }
  }

  function handleFamilySelect(owner: CostOwner) {
    onComplete(owner, true);
  }

  return (
    <div className="bg-onyx-card rounded-xl border border-onyx-border p-6">
      {/* AI detection info */}
      <div className="mb-6 p-4 bg-onyx-bg rounded-lg border border-onyx-border">
        <p className="text-sm text-onyx-muted mb-1">AI rozpoznał:</p>
        <p className="text-lg font-semibold">
          {aiDetectedType} {vendorName && `| ${vendorName}`}{" "}
          {netAmount && `| ${netAmount.toFixed(2)} zł netto`}
        </p>
      </div>

      {step === 1 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Czyj to jest koszt?</h3>
          <div className="flex gap-4">
            <button
              onClick={() => handleOwnType(false)}
              className="flex-1 py-6 bg-blue-500/20 border-2 border-blue-500 rounded-xl text-center hover:bg-blue-500/30 transition-colors"
            >
              <span className="text-2xl block mb-2">🏨</span>
              <span className="font-semibold">Onyx (firmowy)</span>
            </button>
            <button
              onClick={() => handleOwnType(true)}
              className="flex-1 py-6 bg-purple-500/20 border-2 border-purple-500 rounded-xl text-center hover:bg-purple-500/30 transition-colors"
            >
              <span className="text-2xl block mb-2">👨‍👩‍👧‍👦</span>
              <span className="font-semibold">Prywatny</span>
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Która rodzina?</h3>
          <div className="flex gap-4">
            {(["ogonowscy", "pieloch", "welman"] as CostOwner[]).map((owner) => (
              <button
                key={owner}
                onClick={() => handleFamilySelect(owner)}
                className={`flex-1 py-6 ${OWNER_COLORS[owner]}/20 border-2 border-current rounded-xl text-center hover:opacity-80 transition-opacity`}
              >
                <span className="text-2xl block mb-2">👨‍👩‍👧</span>
                <span className="font-semibold">{OWNER_LABELS[owner]}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep(1)}
            className="mt-4 text-sm text-onyx-muted hover:text-onyx-text"
          >
            ← Wróć
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Komponent review dokumentu**

Utwórz `onyx-ksiegowy/src/components/DocumentReview.tsx`:
```tsx
"use client";

import { useState } from "react";
import { ClassificationResult, DOCTYPE_LABELS } from "@/lib/types";
import { DocumentType } from "@prisma/client";

interface DocumentReviewProps {
  data: ClassificationResult;
  imagePath: string;
  onConfirm: (editedData: ClassificationResult) => void;
  onReject: () => void;
}

export default function DocumentReview({
  data,
  imagePath,
  onConfirm,
  onReject,
}: DocumentReviewProps) {
  const [edited, setEdited] = useState(data);

  function updateField(field: string, value: any) {
    setEdited((prev) => ({ ...prev, [field]: value }));
  }

  function updateTotal(field: string, value: string) {
    setEdited((prev) => ({
      ...prev,
      totals: { ...prev.totals, [field]: parseFloat(value) || 0 },
    }));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Oryginalne zdjęcie */}
      <div>
        <h3 className="text-sm font-semibold text-onyx-muted mb-2">Oryginalny dokument</h3>
        <img
          src={imagePath}
          alt="Skan dokumentu"
          className="w-full rounded-xl border border-onyx-border"
        />
      </div>

      {/* Formularz danych */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-onyx-muted mb-2">Rozpoznane dane</h3>

        {/* Typ dokumentu */}
        <div>
          <label className="block text-xs text-onyx-muted mb-1">Typ dokumentu</label>
          <select
            value={edited.type}
            onChange={(e) => updateField("type", e.target.value)}
            className="w-full px-3 py-2 bg-onyx-bg border border-onyx-border rounded-lg text-onyx-text"
          >
            {Object.entries(DOCTYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        {/* Kontrahent */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-onyx-muted mb-1">Kontrahent</label>
            <input
              value={edited.vendor_name || ""}
              onChange={(e) => updateField("vendor_name", e.target.value)}
              className="w-full px-3 py-2 bg-onyx-bg border border-onyx-border rounded-lg text-onyx-text"
            />
          </div>
          <div>
            <label className="block text-xs text-onyx-muted mb-1">NIP</label>
            <input
              value={edited.vendor_nip || ""}
              onChange={(e) => updateField("vendor_nip", e.target.value)}
              className="w-full px-3 py-2 bg-onyx-bg border border-onyx-border rounded-lg text-onyx-text"
            />
          </div>
        </div>

        {/* Numer + daty */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-onyx-muted mb-1">Nr dokumentu</label>
            <input
              value={edited.document_number || ""}
              onChange={(e) => updateField("document_number", e.target.value)}
              className="w-full px-3 py-2 bg-onyx-bg border border-onyx-border rounded-lg text-onyx-text"
            />
          </div>
          <div>
            <label className="block text-xs text-onyx-muted mb-1">Data wystawienia</label>
            <input
              type="date"
              value={edited.document_date || ""}
              onChange={(e) => updateField("document_date", e.target.value)}
              className="w-full px-3 py-2 bg-onyx-bg border border-onyx-border rounded-lg text-onyx-text"
            />
          </div>
          <div>
            <label className="block text-xs text-onyx-muted mb-1">Data sprzedaży</label>
            <input
              type="date"
              value={edited.sale_date || ""}
              onChange={(e) => updateField("sale_date", e.target.value)}
              className="w-full px-3 py-2 bg-onyx-bg border border-onyx-border rounded-lg text-onyx-text"
            />
          </div>
        </div>

        {/* Kwoty */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-onyx-muted mb-1">Netto (zł)</label>
            <input
              type="number"
              step="0.01"
              value={edited.totals?.netto ?? ""}
              onChange={(e) => updateTotal("netto", e.target.value)}
              className="w-full px-3 py-2 bg-onyx-bg border border-onyx-border rounded-lg text-onyx-text"
            />
          </div>
          <div>
            <label className="block text-xs text-onyx-muted mb-1">VAT (zł)</label>
            <input
              type="number"
              step="0.01"
              value={edited.totals?.vat ?? ""}
              onChange={(e) => updateTotal("vat", e.target.value)}
              className="w-full px-3 py-2 bg-onyx-bg border border-onyx-border rounded-lg text-onyx-text"
            />
          </div>
          <div>
            <label className="block text-xs text-onyx-muted mb-1">Brutto (zł)</label>
            <input
              type="number"
              step="0.01"
              value={edited.totals?.brutto ?? ""}
              onChange={(e) => updateTotal("brutto", e.target.value)}
              className="w-full px-3 py-2 bg-onyx-bg border border-onyx-border rounded-lg text-onyx-text"
            />
          </div>
        </div>

        {/* Pozycje */}
        {edited.items?.length > 0 && (
          <div>
            <label className="block text-xs text-onyx-muted mb-1">
              Pozycje ({edited.items.length})
            </label>
            <div className="bg-onyx-bg rounded-lg border border-onyx-border overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-onyx-muted border-b border-onyx-border">
                    <th className="px-2 py-1 text-left">Nazwa</th>
                    <th className="px-2 py-1">Ilość</th>
                    <th className="px-2 py-1">Netto</th>
                    <th className="px-2 py-1">VAT%</th>
                    <th className="px-2 py-1">Brutto</th>
                  </tr>
                </thead>
                <tbody>
                  {edited.items.map((item, i) => (
                    <tr key={i} className="border-b border-onyx-border/50">
                      <td className="px-2 py-1">{item.nazwa}</td>
                      <td className="px-2 py-1 text-center">{item.ilosc} {item.jednostka}</td>
                      <td className="px-2 py-1 text-right">{item.netto?.toFixed(2)}</td>
                      <td className="px-2 py-1 text-center">{((item.stawka_vat || 0) * 100).toFixed(0)}%</td>
                      <td className="px-2 py-1 text-right">{item.brutto?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Przyciski */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => onConfirm(edited)}
            className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
          >
            ✓ Zatwierdź
          </button>
          <button
            onClick={onReject}
            className="flex-1 py-3 bg-red-600/20 text-red-400 border border-red-600 rounded-lg hover:bg-red-600/30 font-semibold transition-colors"
          >
            ✕ Odrzuć
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Strona skanowania — pełny flow**

Utwórz `onyx-ksiegowy/src/app/skan/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CameraCapture from "@/components/CameraCapture";
import ClassificationWizard from "@/components/ClassificationWizard";
import DocumentReview from "@/components/DocumentReview";
import { ClassificationResult } from "@/lib/types";
import { CostOwner } from "@prisma/client";

type ScanStep = "capture" | "processing" | "classify" | "review" | "done" | "error";

export default function SkanPage() {
  const [step, setStep] = useState<ScanStep>("capture");
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState<string>("");
  const [classificationData, setClassificationData] = useState<ClassificationResult | null>(null);
  const [owner, setOwner] = useState<CostOwner>("onyx");
  const [isPrivate, setIsPrivate] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  async function handleCapture(file: File) {
    setStep("processing");

    try {
      // 1. Upload
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/documents/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Upload failed");

      const { id, imagePath: path } = await uploadRes.json();
      setDocumentId(id);
      setImagePath(path);

      // 2. OCR
      const ocrRes = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: id }),
      });

      if (!ocrRes.ok) {
        setStep("error");
        setErrorMsg("OCR nie rozpoznał tekstu. Spróbuj ponownie lub wprowadź dane ręcznie.");
        return;
      }

      const { text } = await ocrRes.json();

      // 3. AI Classification
      const classifyRes = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: id, ocrText: text }),
      });

      if (!classifyRes.ok) {
        setStep("error");
        setErrorMsg("AI nie mógł sklasyfikować dokumentu.");
        return;
      }

      const result: ClassificationResult = await classifyRes.json();
      setClassificationData(result);
      setStep("classify");
    } catch (err: any) {
      setStep("error");
      setErrorMsg(err.message || "Wystąpił błąd");
    }
  }

  function handleOwnerSelected(selectedOwner: CostOwner, priv: boolean) {
    setOwner(selectedOwner);
    setIsPrivate(priv);
    setStep("review");
  }

  async function handleConfirm(editedData: ClassificationResult) {
    if (!documentId) return;

    await fetch(`/api/documents/${documentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: editedData.type,
        costOwner: owner,
        isPrivate,
        status: "confirmed",
        vendorName: editedData.vendor_name,
        vendorNip: editedData.vendor_nip,
        documentNumber: editedData.document_number,
        documentDate: editedData.document_date,
        saleDate: editedData.sale_date,
        netAmount: editedData.totals?.netto,
        vatAmount: editedData.totals?.vat,
        grossAmount: editedData.totals?.brutto,
        items: editedData.items,
      }),
    });

    setStep("done");
  }

  async function handleReject() {
    if (documentId) {
      await fetch(`/api/documents/${documentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
    }
    resetScan();
  }

  function resetScan() {
    setStep("capture");
    setDocumentId(null);
    setImagePath("");
    setClassificationData(null);
    setErrorMsg("");
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📸 Nowy skan</h1>

      {step === "capture" && (
        <CameraCapture onCapture={handleCapture} />
      )}

      {step === "processing" && (
        <div className="text-center py-20">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-onyx-muted">Przetwarzanie dokumentu...</p>
          <p className="text-xs text-onyx-muted mt-2">OCR → AI klasyfikacja → ekstrakcja danych</p>
        </div>
      )}

      {step === "classify" && classificationData && (
        <ClassificationWizard
          aiDetectedType={classificationData.type}
          vendorName={classificationData.vendor_name}
          netAmount={classificationData.totals?.netto}
          onComplete={handleOwnerSelected}
        />
      )}

      {step === "review" && classificationData && (
        <DocumentReview
          data={classificationData}
          imagePath={imagePath}
          onConfirm={handleConfirm}
          onReject={handleReject}
        />
      )}

      {step === "done" && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-xl font-bold mb-2">Dokument zapisany!</h2>
          <div className="flex gap-4 justify-center mt-6">
            <button
              onClick={resetScan}
              className="px-6 py-2 bg-onyx-accent text-white rounded-lg hover:bg-blue-600"
            >
              Skanuj kolejny
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 bg-onyx-card border border-onyx-border text-onyx-text rounded-lg hover:bg-onyx-bg"
            >
              Dashboard
            </button>
          </div>
        </div>
      )}

      {step === "error" && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2 text-red-400">Błąd</h2>
          <p className="text-onyx-muted mb-6">{errorMsg}</p>
          <button
            onClick={resetScan}
            className="px-6 py-2 bg-onyx-accent text-white rounded-lg hover:bg-blue-600"
          >
            Spróbuj ponownie
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: strona skanowania z flow aparat → OCR → AI → klasyfikacja → review"
```

---

### Task 9: Komponent OwnerFilter + StatCard

**Files:**
- Create: `onyx-ksiegowy/src/components/OwnerFilter.tsx`
- Create: `onyx-ksiegowy/src/components/StatCard.tsx`
- Create: `onyx-ksiegowy/src/components/MonthSelector.tsx`
- Create: `onyx-ksiegowy/src/components/DocumentsTable.tsx`

- [ ] **Step 1: Filtr właścicieli (checkboxy)**

Utwórz `onyx-ksiegowy/src/components/OwnerFilter.tsx`:
```tsx
"use client";

import { CostOwner } from "@prisma/client";
import { OWNER_LABELS, OWNER_COLORS } from "@/lib/types";

const ALL_OWNERS: CostOwner[] = ["onyx", "ogonowscy", "pieloch", "welman"];

interface OwnerFilterProps {
  selected: CostOwner[];
  onChange: (owners: CostOwner[]) => void;
}

export default function OwnerFilter({ selected, onChange }: OwnerFilterProps) {
  function toggle(owner: CostOwner) {
    if (selected.includes(owner)) {
      onChange(selected.filter((o) => o !== owner));
    } else {
      onChange([...selected, owner]);
    }
  }

  const allSelected = selected.length === ALL_OWNERS.length;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-xs text-onyx-muted mr-1">Właściciel:</span>
      <button
        onClick={() => onChange(allSelected ? [] : [...ALL_OWNERS])}
        className={`px-3 py-1 rounded-full text-xs border transition-colors ${
          allSelected
            ? "bg-onyx-accent text-white border-onyx-accent"
            : "border-onyx-border text-onyx-muted hover:border-onyx-accent"
        }`}
      >
        Wszyscy
      </button>
      {ALL_OWNERS.map((owner) => {
        const isActive = selected.includes(owner);
        return (
          <button
            key={owner}
            onClick={() => toggle(owner)}
            className={`px-3 py-1 rounded-full text-xs border transition-colors ${
              isActive
                ? `${OWNER_COLORS[owner]} text-white border-transparent`
                : "border-onyx-border text-onyx-muted hover:border-onyx-accent"
            }`}
          >
            {OWNER_LABELS[owner]}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Karta statystyk**

Utwórz `onyx-ksiegowy/src/components/StatCard.tsx`:
```tsx
interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  color?: string;
}

export default function StatCard({ label, value, change, color = "text-onyx-text" }: StatCardProps) {
  return (
    <div className="bg-onyx-card rounded-xl p-4 border border-onyx-border">
      <p className="text-xs text-onyx-muted">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      {change && <p className="text-xs text-onyx-muted mt-1">{change}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Selektor miesiąca**

Utwórz `onyx-ksiegowy/src/components/MonthSelector.tsx`:
```tsx
"use client";

interface MonthSelectorProps {
  value: string; // YYYY-MM
  onChange: (month: string) => void;
}

export default function MonthSelector({ value, onChange }: MonthSelectorProps) {
  const [year, month] = value.split("-").map(Number);

  function shift(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const MONTHS = [
    "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
    "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
  ];

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => shift(-1)} className="p-1 text-onyx-muted hover:text-onyx-text">←</button>
      <span className="text-sm bg-onyx-card px-3 py-1 rounded-lg border border-onyx-border">
        {MONTHS[month - 1]} {year}
      </span>
      <button onClick={() => shift(1)} className="p-1 text-onyx-muted hover:text-onyx-text">→</button>
    </div>
  );
}
```

- [ ] **Step 4: Tabela dokumentów (reusable)**

Utwórz `onyx-ksiegowy/src/components/DocumentsTable.tsx`:
```tsx
"use client";

import Link from "next/link";
import { OWNER_LABELS, OWNER_COLORS, DOCTYPE_LABELS } from "@/lib/types";

interface DocumentRow {
  id: string;
  documentDate: string | null;
  type: string;
  vendorName: string | null;
  netAmount: number | null;
  vatAmount: number | null;
  costOwner: string;
  status: string;
}

interface DocumentsTableProps {
  documents: DocumentRow[];
}

export default function DocumentsTable({ documents }: DocumentsTableProps) {
  return (
    <div className="bg-onyx-card rounded-xl border border-onyx-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-onyx-muted border-b border-onyx-border text-left">
            <th className="px-4 py-3">Data</th>
            <th className="px-4 py-3">Typ</th>
            <th className="px-4 py-3">Kontrahent</th>
            <th className="px-4 py-3 text-right">Netto</th>
            <th className="px-4 py-3 text-right">VAT</th>
            <th className="px-4 py-3">Właściciel</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id} className="border-b border-onyx-border/50 hover:bg-onyx-bg/50">
              <td className="px-4 py-3">
                <Link href={`/dokumenty/${doc.id}`} className="hover:text-onyx-accent">
                  {doc.documentDate ? new Date(doc.documentDate).toLocaleDateString("pl") : "—"}
                </Link>
              </td>
              <td className="px-4 py-3">
                <span className="text-xs px-2 py-0.5 rounded bg-onyx-bg">
                  {DOCTYPE_LABELS[doc.type as keyof typeof DOCTYPE_LABELS] || doc.type}
                </span>
              </td>
              <td className="px-4 py-3">{doc.vendorName || "—"}</td>
              <td className="px-4 py-3 text-right">{doc.netAmount?.toFixed(2) || "—"} zł</td>
              <td className="px-4 py-3 text-right">{doc.vatAmount?.toFixed(2) || "—"} zł</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded text-white ${OWNER_COLORS[doc.costOwner as keyof typeof OWNER_COLORS] || "bg-gray-500"}`}>
                  {OWNER_LABELS[doc.costOwner as keyof typeof OWNER_LABELS] || doc.costOwner}
                </span>
              </td>
              <td className="px-4 py-3">
                {doc.status === "confirmed" ? <span className="text-green-400">✓</span> :
                 doc.status === "review" ? <span className="text-amber-400">⏳</span> :
                 doc.status === "rejected" ? <span className="text-red-400">✕</span> :
                 <span className="text-onyx-muted">⋯</span>}
              </td>
            </tr>
          ))}
          {documents.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-onyx-muted">
                Brak dokumentów
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: komponenty reusable (OwnerFilter, StatCard, MonthSelector, DocumentsTable)"
```

---

### Task 10: Dashboard API + Strona główna

**Files:**
- Create: `onyx-ksiegowy/src/app/api/dashboard/summary/route.ts`
- Create: `onyx-ksiegowy/src/app/api/dashboard/owners-breakdown/route.ts`
- Modify: `onyx-ksiegowy/src/app/page.tsx`

- [ ] **Step 1: API summary**

Utwórz `onyx-ksiegowy/src/app/api/dashboard/summary/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CostOwner } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const owners = (searchParams.get("owners")?.split(",") || ["onyx", "ogonowscy", "pieloch", "welman"]) as CostOwner[];
  const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);

  const [year, m] = month.split("-").map(Number);
  const startDate = new Date(year, m - 1, 1);
  const endDate = new Date(year, m, 1);

  const where = {
    costOwner: { in: owners },
    status: "confirmed" as const,
    deletedAt: null,
    documentDate: { gte: startDate, lt: endDate },
  };

  const expenses = await prisma.document.aggregate({
    where: { ...where, type: { in: ["faktura_zakup", "paragon"] } },
    _sum: { netAmount: true, vatAmount: true, grossAmount: true },
    _count: true,
  });

  const revenue = await prisma.document.aggregate({
    where: { ...where, type: "faktura_sprzedaz" },
    _sum: { netAmount: true, vatAmount: true, grossAmount: true },
    _count: true,
  });

  const totalDocs = await prisma.document.count({ where: { ...where } });
  const pendingDocs = await prisma.document.count({
    where: { costOwner: { in: owners }, status: "review", deletedAt: null },
  });

  return NextResponse.json({
    expenses: {
      netto: Number(expenses._sum.netAmount || 0),
      vat: Number(expenses._sum.vatAmount || 0),
      brutto: Number(expenses._sum.grossAmount || 0),
      count: expenses._count,
    },
    revenue: {
      netto: Number(revenue._sum.netAmount || 0),
      vat: Number(revenue._sum.vatAmount || 0),
      brutto: Number(revenue._sum.grossAmount || 0),
      count: revenue._count,
    },
    totalDocs,
    pendingDocs,
    month,
  });
}
```

- [ ] **Step 2: API owners-breakdown**

Utwórz `onyx-ksiegowy/src/app/api/dashboard/owners-breakdown/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);

  const [year, m] = month.split("-").map(Number);
  const startDate = new Date(year, m - 1, 1);
  const endDate = new Date(year, m, 1);

  const breakdown = await prisma.document.groupBy({
    by: ["costOwner"],
    where: {
      status: "confirmed",
      deletedAt: null,
      documentDate: { gte: startDate, lt: endDate },
      type: { in: ["faktura_zakup", "paragon"] },
    },
    _sum: { netAmount: true, vatAmount: true, grossAmount: true },
    _count: true,
  });

  return NextResponse.json(breakdown);
}
```

- [ ] **Step 3: Strona dashboard z filtrami i danymi**

Zastąp `onyx-ksiegowy/src/app/page.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { CostOwner } from "@prisma/client";
import OwnerFilter from "@/components/OwnerFilter";
import StatCard from "@/components/StatCard";
import MonthSelector from "@/components/MonthSelector";
import DocumentsTable from "@/components/DocumentsTable";

export default function DashboardPage() {
  const [owners, setOwners] = useState<CostOwner[]>(["onyx", "ogonowscy", "pieloch", "welman"]);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [summary, setSummary] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const ownerParam = owners.join(",");

    Promise.all([
      fetch(`/api/dashboard/summary?owners=${ownerParam}&month=${month}`).then((r) => r.json()),
      fetch(`/api/documents?owners=${ownerParam}&month=${month}&limit=10`).then((r) => r.json()),
    ]).then(([sum, docs]) => {
      setSummary(sum);
      setDocuments(docs.documents || []);
      setLoading(false);
    });
  }, [owners, month]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("pl-PL", { minimumFractionDigits: 2 }).format(n);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <MonthSelector value={month} onChange={setMonth} />
      </div>

      <div className="mb-6">
        <OwnerFilter selected={owners} onChange={setOwners} />
      </div>

      {loading ? (
        <p className="text-onyx-muted">Ładowanie...</p>
      ) : summary ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Wydatki (netto)"
              value={`${fmt(summary.expenses.netto)} zł`}
              color="text-red-400"
              change={`${summary.expenses.count} dokumentów`}
            />
            <StatCard
              label="VAT naliczony"
              value={`${fmt(summary.expenses.vat)} zł`}
              color="text-amber-400"
            />
            <StatCard
              label="Przychody (netto)"
              value={`${fmt(summary.revenue.netto)} zł`}
              color="text-green-400"
              change={`${summary.revenue.count} faktur`}
            />
            <StatCard
              label="Dokumenty"
              value={`${summary.totalDocs}`}
              color="text-blue-400"
              change={`${summary.pendingDocs} oczekujących`}
            />
          </div>

          <h2 className="text-lg font-semibold mb-3">Ostatnie dokumenty</h2>
          <DocumentsTable documents={documents} />
        </>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: dashboard z filtrami właścicieli, kartami statystyk, tabelą dokumentów"
```

---

## Faza 4: Remaining Pages + Deploy

### Task 11: Strona Koszty + Rejestr VAT + Produkty + Dokumenty + Ustawienia

Te strony budujemy jako osobne pliki wg tego samego wzorca: `OwnerFilter` u góry, dane z API, tabela/karty. Każda strona to osobny commit.

- [ ] **Step 1:** Utwórz `onyx-ksiegowy/src/app/koszty/page.tsx` — koszty z tabelą per właściciel (netto/VAT/brutto per Onyx, Ogonowscy, Pieloch, Welman + RAZEM). Filtr OwnerFilter + MonthSelector. Dane z `/api/dashboard/owners-breakdown`.

- [ ] **Step 2:** Commit: `feat: strona Koszty z rozbiciem per właściciel`

- [ ] **Step 3:** Utwórz `onyx-ksiegowy/src/app/api/dashboard/vat/route.ts` + `onyx-ksiegowy/src/app/vat/page.tsx` — rejestr VAT z rozbiciem per stawka (23%/8%/5%/0%) i per właściciel.

- [ ] **Step 4:** Commit: `feat: strona Rejestr VAT z rozbiciem per stawka i właściciel`

- [ ] **Step 5:** Utwórz `onyx-ksiegowy/src/app/api/dashboard/expenses/route.ts` + `onyx-ksiegowy/src/app/produkty/page.tsx` — agregacja pozycji z document_items, grupowanie po nazwie.

- [ ] **Step 6:** Commit: `feat: strona Produkty z agregacją pozycji`

- [ ] **Step 7:** Utwórz `onyx-ksiegowy/src/app/dokumenty/page.tsx` — archiwum z wyszukiwarką, filtrami, widokiem galerii/listy. `onyx-ksiegowy/src/app/dokumenty/[id]/page.tsx` — szczegóły dokumentu z podglądem oryginalnego zdjęcia.

- [ ] **Step 8:** Commit: `feat: strona Dokumenty (archiwum + szczegóły)`

- [ ] **Step 9:** Utwórz `onyx-ksiegowy/src/app/ustawienia/page.tsx` — konfigurowalny prompt AI (textarea, przycisk test, przywróć domyślny), zarządzanie użytkownikami (CRUD), klucze API. Utwórz `onyx-ksiegowy/src/app/api/users/route.ts` + `[id]/route.ts`.

- [ ] **Step 10:** Commit: `feat: strona Ustawienia (prompt AI, użytkownicy, klucze API)`

---

### Task 12: Docker + Deploy

**Files:**
- Create: `onyx-ksiegowy/Dockerfile`
- Create: `onyx-ksiegowy/docker-compose.yml`
- Create: `onyx-ksiegowy/.dockerignore`

- [ ] **Step 1: Dockerfile**

Utwórz `onyx-ksiegowy/Dockerfile`:
```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
```

- [ ] **Step 2: docker-compose.yml**

Utwórz `onyx-ksiegowy/docker-compose.yml`:
```yaml
version: "3.8"

services:
  onyx-app:
    build: .
    container_name: onyx-ksiegowy
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://onyx:${DB_PASSWORD}@postgresql:5432/onyx_ksiegowy
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - GOOGLE_CLOUD_VISION_CREDENTIALS=${GOOGLE_CLOUD_VISION_CREDENTIALS}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - UPLOAD_DIR=/app/public/uploads
    volumes:
      - uploads:/app/public/uploads
    depends_on:
      - postgresql
    networks:
      - postgresql-uyof_default
    restart: unless-stopped

  postgresql:
    image: postgres:16-alpine
    container_name: onyx-db
    environment:
      - POSTGRES_USER=onyx
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=onyx_ksiegowy
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - postgresql-uyof_default
    restart: unless-stopped

volumes:
  pgdata:
  uploads:

networks:
  postgresql-uyof_default:
    external: true
```

- [ ] **Step 3: .dockerignore**

Utwórz `onyx-ksiegowy/.dockerignore`:
```
node_modules
.next
.git
*.md
```

- [ ] **Step 4: Dodaj output: standalone do next.config.ts**

Zmodyfikuj `onyx-ksiegowy/next.config.ts`:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: Dockerfile + docker-compose do deploy na Hostinger VPS"
```

---

## Kolejność deploy na VPS

Po zakończeniu implementacji:

1. `git push` do repo
2. SSH na VPS: `git clone` + `cp .env.example .env` + uzupełnij zmienne
3. `docker compose up -d --build`
4. `docker compose exec onyx-app npx prisma migrate deploy`
5. `docker compose exec onyx-app npx prisma db seed`
6. Otwórz `https://onyx.twojadomena.pl` → login: admin@onyx.pl / admin123
7. Zmień hasło w Ustawieniach
