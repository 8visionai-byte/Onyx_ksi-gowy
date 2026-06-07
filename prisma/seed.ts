import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DEFAULT_AI_PROMPT = `Jesteś analizatorem dokumentów księgowych dla polskiej firmy hotelowo-gastronomicznej.
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
  "items": [{"nazwa": "string", "ilosc": 1.0, "jednostka": "szt", "cena_jednostkowa": 100.00, "netto": 100.00, "stawka_vat": 0.23, "vat": 23.00, "brutto": 123.00}],
  "totals": {"netto": 100.00, "vat": 23.00, "brutto": 123.00},
  "vat_breakdown": {"0.23": {"netto": 100.00, "vat": 23.00}}
}`;

async function main() {
  console.log("Seeding database...");

  // Create default admin user
  const passwordHash = await bcrypt.hash("admin123", 12);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@onyx.pl" },
    update: {},
    create: {
      email: "admin@onyx.pl",
      passwordHash,
      name: "Administrator",
      role: "admin",
    },
  });

  console.log(`Created admin user: ${adminUser.email}`);

  // Create default AI config for document classification prompt
  const aiConfig = await prisma.aiConfig.upsert({
    where: { key: "document_classification_prompt" },
    update: {},
    create: {
      key: "document_classification_prompt",
      value: DEFAULT_AI_PROMPT,
      updatedBy: adminUser.id,
    },
  });

  console.log(`Created AI config: ${aiConfig.key}`);

  console.log("Seeding complete.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
