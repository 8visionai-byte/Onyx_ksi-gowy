import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import type { ClassificationResult } from "@/lib/types";

const DEFAULT_PROMPT = `Jesteś asystentem do klasyfikacji dokumentów księgowych. Otrzymasz tekst OCR z faktury lub paragonu.

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

Zwróć TYLKO poprawny JSON, bez markdown.`;

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

export async function classifyDocument(
  ocrText: string
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
    // Use default prompt if DB lookup fails
  }

  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: ocrText },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Brak odpowiedzi z modelu AI");
  }

  const result = JSON.parse(content) as ClassificationResult;
  return result;
}
