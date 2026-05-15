# Onyx Księgowy — Specyfikacja Projektu

## Przegląd

Aplikacja webowa zastępująca obecny flow Telegram + Make.com do księgowości. Użytkownik skanuje dokumenty bezpośrednio w aplikacji (aparat/upload), AI przetwarza je automatycznie, a dashboard wyświetla dane finansowe.

**Cel:** Zmniejszenie przetwarzania dokumentów z 8 ręcznych kroków do 2 kliknięć (zdjęcie → potwierdź).

## Kontekst Biznesowy

### Struktura firmy
Spółka **Onyx** — **hotel i restauracja**, 3 rodziny współwłaścicieli:
- **Onyx** — koszty firmowe (oryginalne koszty spółki: dostawcy żywności, wyposażenie, media, itp.)
- **Ogonowscy** — koszty prywatne wrzucane przez firmę
- **Pieloch** — koszty prywatne wrzucane przez firmę
- **Welman** — koszty prywatne wrzucane przez firmę

Rodziny wrzucają swoje prywatne wydatki (faktury VAT) przez firmę Onyx. Każdy dokument musi być przypisany do właściciela kosztów. Na koniec miesiąca rodziny rozliczają się — ile kosztów VAT-owych poniósł każdy.

### Branża i stawki VAT
Hotel + restauracja — typowe stawki VAT na dokumentach:
| Stawka | Zastosowanie |
|--------|-------------|
| 23% | Standardowa (wyposażenie, usługi, materiały, chemia) |
| 8% | Gastronomia, usługi hotelowe, żywność przetworzona |
| 5% | Podstawowe produkty spożywcze (pieczywo, nabiał, mięso) |
| 0% / ZW | Zwolnione (niektóre usługi finansowe, eksport)

### Właściciele kosztów (cost_owner)
| Właściciel | Opis |
|-----------|------|
| `onyx` | Oryginalne koszty firmy Onyx |
| `ogonowscy` | Prywatne koszty rodziny Ogonowskich |
| `pieloch` | Prywatne koszty rodziny Pieloch |
| `welman` | Prywatne koszty rodziny Welman |

## Architektura

### Stack technologiczny
- **Frontend + Backend:** Next.js 14 (App Router, React, TypeScript)
- **Stylowanie:** Tailwind CSS (ciemny motyw)
- **ORM:** Prisma
- **Baza danych:** PostgreSQL (istniejący kontener Docker na VPS)
- **OCR:** Google Cloud Vision API
- **AI:** OpenAI GPT-4o (klasyfikacja + ekstrakcja danych z tekstu OCR)
- **Autoryzacja:** NextAuth.js (credentials + role)
- **Deploy:** Kontener Docker na Hostinger Horizon VPS

### Infrastruktura (Docker)
```yaml
services:
  onyx-app:
    build: .
    ports: ["3000:3000"]
    depends_on: [postgresql]
    networks: [postgresql-uyof_default]
  
  # PostgreSQL już istnieje na VPS
  # Połączenie przez sieć wewnętrzną: postgresql-uyof_default
```

### Diagram systemu
```
[Przeglądarka/Telefon] 
    → [Next.js Frontend (React + Tailwind)]
    → [Next.js API Routes]
        → /api/upload     → zapisuje obraz, uruchamia pipeline
        → /api/ocr        → Google Cloud Vision API
        → /api/classify   → OpenAI GPT (typ dokumentu + ekstrakcja danych)
        → /api/documents  → operacje CRUD
        → /api/dashboard  → zagregowane statystyki
    → [PostgreSQL]
    → [Pliki (volumen na VPS)]
```

## Flow Przetwarzania Dokumentów

### Nowy flow (krok po kroku)

**Krok 1 — Skanowanie**
1. Użytkownik otwiera apkę → klika "Nowy skan" → aparat/upload
2. Zdjęcie wykonane/wgrane (można kilka naraz)

**Krok 2 — Automatyczne przetwarzanie (w tle)**
- Obraz zapisany na VPS
- Google Cloud Vision → OCR (ekstrakcja tekstu ze zdjęcia)
- OpenAI GPT → analiza tekstu OCR → zwraca JSON:
  - **Automatycznie rozpoznaje typ dokumentu** (faktura/paragon/inny)
  - **Automatycznie wyciąga dane** (kontrahent, data, pozycje, kwoty, stawki VAT)
  - Prompt jest **konfigurowalny w Ustawieniach** — admin może edytować jak AI ma rozpoznawać dokumenty

**Krok 3 — Klasyfikacja właściciela (użytkownik wybiera)**
AI rozpoznaje typ automatycznie, ale właściciela kosztów wybiera użytkownik.
Ekran z pytaniami (jak w Telegramie):

```
[AI rozpoznał: Faktura zakupowa | Hurtownia ABC | 2 340,00 zł netto]

Pytanie 1: Czyj to jest koszt?
┌─────────────────────────────────────┐
│  [Onyx (firmowy)]  [Prywatny]       │
└─────────────────────────────────────┘

Jeśli "Prywatny" → Pytanie 2:
┌─────────────────────────────────────┐
│ [Ogonowscy]  [Pieloch]  [Welman]   │
└─────────────────────────────────────┘
```

**Krok 4 — Potwierdzenie danych**
- Podgląd: typ dokumentu (auto-wykryty), kontrahent, kwoty, pozycje z rozbiciem VAT (23%/8%/5%/0%)
- Oryginalne zdjęcie obok
- Wszystkie pola edytowalne jeśli AI źle rozpoznał
- Przycisk "Zatwierdź"

**Krok 5 — Zapis + dashboard się aktualizuje**

### Stary flow (do zastąpienia)
1. ~~Ręcznie robisz zdjęcie dokumentu~~
2. ~~Zapisujesz jako PDF~~
3. ~~Otwierasz Telegram → wysyłasz PDF~~
4. ~~Make.com → PDF-co → Google Vision OCR~~
5. ~~OpenAI klasyfikuje~~
6. ~~Wybierasz w Telegramie: Onyx / Ogonowscy / Pieloch / Welman~~
7. ~~Wybierasz typ dokumentu~~
8. ~~Dane → Google Sheets~~

## Schemat Bazy Danych

### Tabele

**documents** (dokumenty)
| Kolumna | Typ | Opis |
|---------|-----|------|
| id | UUID, PK | |
| type | ENUM | 'faktura_zakup', 'faktura_sprzedaz', 'paragon', 'inny' |
| cost_owner | ENUM | **'onyx', 'ogonowscy', 'pieloch', 'welman'** |
| is_private | BOOLEAN | true = koszt prywatny rodziny, false = koszt firmowy Onyx |
| status | ENUM | 'processing', 'review', 'confirmed', 'rejected' |
| vendor_name | TEXT | Nazwa kontrahenta/sprzedawcy |
| document_number | TEXT, nullable | Numer faktury |
| document_date | DATE | Data dokumentu |
| net_amount | DECIMAL | Kwota netto |
| vat_amount | DECIMAL | Kwota VAT |
| gross_amount | DECIMAL | Kwota brutto |
| vat_rate | TEXT | np. "23%", "8%", "mixed" |
| ocr_raw_text | TEXT | Surowy tekst z OCR |
| ai_raw_response | JSONB | Surowa odpowiedź AI |
| image_path | TEXT | Ścieżka do zdjęcia |
| notes | TEXT, nullable | Notatki użytkownika |
| created_by | FK → users.id | Kto skanował |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**document_items** (pozycje na dokumencie)
| Kolumna | Typ | Opis |
|---------|-----|------|
| id | UUID, PK | |
| document_id | FK → documents.id | |
| name | TEXT | Nazwa produktu/usługi |
| quantity | DECIMAL | Ilość |
| unit | TEXT | szt, kg, l, itp. |
| unit_price | DECIMAL | Cena jednostkowa |
| net_amount | DECIMAL | Kwota netto |
| vat_rate | DECIMAL | 0.23, 0.08, itp. |
| vat_amount | DECIMAL | Kwota VAT |
| gross_amount | DECIMAL | Kwota brutto |
| category | TEXT, nullable | materiały, usługi, paliwo, itp. |

**users** (użytkownicy)
| Kolumna | Typ | Opis |
|---------|-----|------|
| id | UUID, PK | |
| email | TEXT, UNIQUE | |
| password_hash | TEXT | |
| name | TEXT | |
| role | ENUM | 'admin', 'viewer' |
| created_at | TIMESTAMP | |

## Design UI

### Layout
- **Sidebar + Content** (ciemny motyw, styl Notion/Linear)
- Szerokość sidebar: 220px, zwijany na mobile
- Tło: #0f172a (slate-950)
- Karty: #1e293b (slate-800)
- Akcent: #3b82f6 (blue-500)

### Nawigacja Sidebar
1. **Nowy skan** (główna akcja, niebieski przycisk)
2. **Dashboard** (podsumowanie)
3. **Koszty / Wydatki**
4. **Rejestr VAT**
5. **Produkty**
6. **Dokumenty** (archiwum)
7. **Ustawienia** (na dole)

### Strony

#### 1. Dashboard (Strona główna)
- **Filtr właścicieli kosztów** — checkboxy u góry strony:
  - [x] Onyx  [x] Ogonowscy  [x] Pieloch  [x] Welman
  - Zaznaczanie/odznaczanie filtruje WSZYSTKIE dane na dashboardzie
  - Można wybrać jednego, kilku lub wszystkich
- 4 karty statystyk: Wydatki netto, VAT naliczony, Przychody, Liczba dokumentów
  - Wartości zmieniają się dynamicznie wg zaznaczonych właścicieli
- Selektor miesiąca
- Tabela ostatnich dokumentów (data, typ, kontrahent, netto, VAT, właściciel, status)
  - Kolumna "Właściciel" z kolorowym badge: Onyx/Ogonowscy/Pieloch/Welman
- Porównanie trendu vs poprzedni miesiąc

#### 2. Nowy Skan
- Aparat (mobile) / upload pliku (desktop)
- Wsparcie wielu dokumentów naraz
- Wskaźnik przetwarzania (spinner/progress)
- **Ekran klasyfikacji** (jak w Telegramie):
  - Krok 1: "Czyj to koszt?" → [Onyx (firmowy)] [Prywatny]
  - Krok 2 (jeśli prywatny): "Która rodzina?" → [Ogonowscy] [Pieloch] [Welman]
  - Krok 3: Typ dokumentu (auto-wykryty, edytowalny)
- **Ekran potwierdzenia:**
  - Dane wyciągnięte przez AI w formularzu (edytowalne)
  - Kontrahent, data, kwoty, pozycje
  - Podgląd oryginalnego zdjęcia obok
  - Przyciski: Zatwierdź / Odrzuć

#### 3. Koszty / Wydatki
- **Filtr właścicieli** — checkboxy: Onyx / Ogonowscy / Pieloch / Welman
- Podsumowanie miesięczne z podziałem na kategorie
- Wykres słupkowy: wydatki wg kategorii
- **Tabela kosztów per właściciel:**
  - Wiersz: Ogonowscy — suma netto / suma VAT / suma brutto
  - Wiersz: Pieloch — suma netto / suma VAT / suma brutto
  - Wiersz: Welman — suma netto / suma VAT / suma brutto
  - Wiersz: Onyx — suma netto / suma VAT / suma brutto
  - **RAZEM** — łączna suma
- Lista top dostawców
- Filtrowalna tabela wszystkich dokumentów kosztowych
- Eksport do CSV

#### 4. Rejestr VAT
- **Filtr właścicieli** — checkboxy
- VAT naliczony vs VAT należny — podsumowanie
- VAT wg stawki (23%, 8%, 5%, 0%, ZW)
- **Rozliczenie VAT per rodzina:**
  - Ogonowscy: VAT naliczony X zł
  - Pieloch: VAT naliczony X zł
  - Welman: VAT naliczony X zł
  - Onyx: VAT naliczony X zł
- Miesięczne saldo VAT
- Widok gotowy do JPK
- Filtrowalna tabela rejestru

#### 5. Produkty
- **Filtr właścicieli** — checkboxy
- Wszystkie zakupione pozycje zagregowane
- Grupowanie wg nazwy produktu
- Ilości, średnie ceny
- Wyszukiwanie i filtrowanie
- Tagi kategorii

#### 6. Dokumenty (Archiwum)
- Widok galerii / listy (przełącznik)
- Miniatura zeskanowanego dokumentu
- Wyszukiwanie pełnotekstowe (tekst OCR)
- Filtr wg: typu, zakresu dat, kontrahenta, **właściciela kosztów**, statusu
- Kliknięcie → podgląd oryginału + wyciągnięte dane

#### 7. Ustawienia
- **Prompt AI (konfigurowalny):**
  - Pole tekstowe z aktualnym promptem systemowym dla OpenAI
  - Admin może edytować jak AI rozpoznaje dokumenty
  - Przycisk "Testuj prompt" — wklej tekst OCR, zobacz co AI zwróci
  - Przycisk "Przywróć domyślny"
- Zarządzanie użytkownikami (tylko admin): dodaj/usuń, zmień role
- Konfiguracja klucza API OCR (Google Cloud Vision)
- Konfiguracja klucza API OpenAI
- Personalizacja kategorii dokumentów
- Zarządzanie właścicielami kosztów (dodaj/edytuj rodzinę)
- Konfiguracja stawek VAT (domyślne: 23%, 8%, 5%, 0%)
- Eksport wszystkich danych

### Responsywność mobilna
- Sidebar zwija się do menu hamburger
- Aparat jest główną akcją na mobile
- Karty układają się pionowo
- Tabela przewija się horyzontalnie
- Filtr właścicieli jako dropdown na mobile

## Autoryzacja

### Role
- **Admin:** Pełen dostęp. Skanowanie, edycja, usuwanie, zarządzanie użytkownikami, ustawienia.
- **Viewer:** Tylko odczyt dashboardu. Podgląd dokumentów bez możliwości skanowania/edycji.

### Implementacja
- NextAuth.js z credentials provider
- Tokeny JWT w httpOnly cookies
- Middleware chroniący API routes wg roli
- Timeout sesji: 24 godziny

## Endpointy API

### Dokumenty
- `POST /api/documents/upload` — upload zdjęcia, start przetwarzania
- `GET /api/documents` — lista z filtrami (typ, data, status, kontrahent, **cost_owner**)
- `GET /api/documents/:id` — pojedynczy dokument z pozycjami
- `PUT /api/documents/:id` — aktualizacja/zatwierdzenie dokumentu
- `DELETE /api/documents/:id` — miękkie usunięcie (tylko admin)

### Przetwarzanie
- `POST /api/ocr` — Google Cloud Vision OCR
- `POST /api/classify` — OpenAI klasyfikacja + ekstrakcja

### Dashboard
- `GET /api/dashboard/summary?owners=onyx,pieloch` — dane kart statystyk (filtrowane)
- `GET /api/dashboard/expenses?owners=ogonowscy&month=2026-05` — podział wydatków
- `GET /api/dashboard/vat?owners=all` — podsumowanie rejestru VAT
- `GET /api/dashboard/owners-breakdown` — rozliczenie per rodzina

### Autoryzacja
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`

### Admin
- `GET /api/users` — lista użytkowników
- `POST /api/users` — utworzenie użytkownika
- `PUT /api/users/:id` — zmiana roli
- `DELETE /api/users/:id` — usunięcie użytkownika

## Prompt OpenAI — Klasyfikacja i Ekstrakcja

```
System: Jesteś analizatorem dokumentów księgowych dla polskiej firmy hotelowo-gastronomicznej.
Na podstawie tekstu OCR ze zeskanowanego dokumentu wyciągnij:

1. Typ dokumentu: faktura_zakup | faktura_sprzedaz | paragon | inny
2. Nazwa sprzedawcy/kontrahenta
3. NIP sprzedawcy (jeśli widoczny)
4. Numer dokumentu (jeśli widoczny)
5. Data wystawienia dokumentu
6. Data sprzedaży/wykonania usługi (jeśli inna niż data wystawienia)
7. Pozycje: [{nazwa, ilosc, jednostka, cena_jednostkowa, netto, stawka_vat, vat, brutto}]
8. Sumy: {netto, vat, brutto}
9. Rozbicie VAT wg stawek (23%, 8%, 5%, 0%/ZW)

Kontekst branżowy — firma Onyx (hotel + restauracja). Typowe koszty:
- Dostawy żywności (mięso, nabiał, warzywa) — VAT 5% lub 8%
- Usługi gastronomiczne — VAT 8%
- Wyposażenie, chemia, materiały — VAT 23%
- Usługi hotelowe — VAT 8%

Zwróć poprawny JSON. Jeśli pole nie do ustalenia, użyj null.
Wszystkie kwoty w PLN. Stawki VAT jako ułamki dziesiętne (0.23, 0.08, 0.05, 0.0).
```

**Ten prompt jest konfigurowalny w Ustawieniach aplikacji.** Admin może go edytować, testować na przykładowych tekstach OCR i dostosowywać do swoich potrzeb.

### Tabela konfiguracji prompta w bazie

**ai_config** (konfiguracja AI)
| Kolumna | Typ | Opis |
|---------|-----|------|
| id | UUID, PK | |
| key | TEXT, UNIQUE | np. 'document_classification_prompt' |
| value | TEXT | Treść prompta |
| updated_by | FK → users.id | Kto ostatnio edytował |
| updated_at | TIMESTAMP | |

## Obsługa Błędów
- Błąd OCR → ponów raz, potem pokaż formularz "ręczne wpisanie"
- Błąd ekstrakcji AI → pokaż tekst OCR, użytkownik wypełnia ręcznie
- Błąd sieci → kolejkuj do ponowienia, pokaż wskaźnik offline
- Nieprawidłowe dane → walidacja po stronie klienta i serwera

## Migracja z Google Sheets
- Jednorazowy skrypt importu: odczyt danych z Google Sheets → wstawienie do PostgreSQL
- Mapowanie: Ewidencja Sprzedaży → documents (type: faktura_sprzedaz)
- Mapowanie: Ewidencja Nabycia → documents (type: faktura_zakup)
- Mapowanie: Ewidencja Produktów → document_items
- Mapowanie kolumny właściciela kosztów (jeśli istnieje w arkuszu)

## Kryteria Sukcesu
1. Skanowanie dokumentu: zdjęcie → zatwierdzone dane w < 30 sekund
2. Dashboard ładuje się w < 2 sekundy
3. Dokładność OCR > 90% na standardowych polskich fakturach
4. Mobile-friendly: pełna funkcjonalność w przeglądarce telefonu
5. Multi-user: role admin + viewer działają poprawnie
6. Filtr właścicieli kosztów działa na wszystkich stronach dashboardu
7. Rozliczenie per rodzina — widoczne sumy kosztów i VAT dla każdego właściciela
