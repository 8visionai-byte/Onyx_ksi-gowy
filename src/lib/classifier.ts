import { prisma } from "@/lib/prisma";
import type { ClassificationResult } from "@/lib/types";
import fs from "fs/promises";
import path from "path";

const DEFAULT_PROMPT = `Jesteś asystentem do klasyfikacji dokumentów księgowych dla firmy hotelowo-gastronomicznej Onyx. Otrzymasz ZDJĘCIE faktury lub paragonu.

Odpowiedz w formacie JSON z następującymi polami:
- type: "faktura_zakup" | "faktura_sprzedaz" | "paragon" | "inny"
- vendor_name: nazwa sprzedawcy (string lub null)
- vendor_nip: NIP sprzedawcy (string lub null)
- document_number: numer dokumentu (string lub null)
- document_date: data wystawienia w formacie YYYY-MM-DD (string lub null)
- sale_date: data sprzedaży w formacie YYYY-MM-DD (string lub null)
- items: tablica pozycji, każda z polami:
  - nazwa (string)
  - ilosc (number lub null)
  - jednostka (string lub null)
  - cena_jednostkowa (number lub null)
  - netto (number lub null)
  - stawka_vat (number lub null, np. 23 dla 23%)
  - vat (number lub null)
  - brutto (number lub null)
- totals: { netto, vat, brutto } (number lub null)
- vat_breakdown: obiekt ze stawkami VAT jako kluczami, np. { "23": { netto: 100, vat: 23 } }

Kontekst branżowy — hotel + restauracja. Typowe VAT: żywność 5%/8%, usługi gastronomiczne i hotelowe 8%, wyposażenie/chemia/materiały 23%.

Zwróć TYLKO poprawny JSON, bez markdown.`;

function mimeFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".heic") return "image/heic";
  if (ext === ".pdf") return "application/pdf";
  return "image/jpeg";
}

/**
 * Analizuje ZDJĘCIE dokumentu modelem Gemini (multimodal) i zwraca dane strukturalne.
 * Zastępuje wcześniejszy tor Google Vision OCR + OpenAI.
 */
export async function classifyDocument(
  imageFilePath: string
): Promise<ClassificationResult> {
  let systemPrompt = DEFAULT_PROMPT;

  try {
    const config = await prisma.aiConfig.findUnique({
      where: { key: "document_classification_prompt" },
    });
    if (config?.value) {
      systemPrompt = config.value;
    }
  } catch {
    // Użyj domyślnego promptu, jeśli odczyt z bazy zawiedzie
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Brak klucza GEMINI_API_KEY w konfiguracji");
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

  const fileBuffer = await fs.readFile(imageFilePath);
  const base64 = fileBuffer.toString("base64");
  const mimeType = mimeFromPath(imageFilePath);

  const instruction =
    systemPrompt +
    "\n\nPrzeanalizuj załączony obraz dokumentu i wyodrębnij dane. Zwróć TYLKO poprawny JSON według powyższego schematu, bez markdown.";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: instruction },
              { inline_data: { mime_type: mimeType, data: base64 } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API błąd ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new Error("Brak odpowiedzi z modelu Gemini");
  }

  return JSON.parse(content) as ClassificationResult;
}
