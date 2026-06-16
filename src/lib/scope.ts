import { Session } from "next-auth";

/** Czy sesja jest ograniczona tylko do Onyx (firmowe). */
export function isOnyxOnly(session: Session | null): boolean {
  return (
    (session?.user as { scope?: string } | undefined)?.scope === "onyx"
  );
}

/**
 * Czy sesja może zapisywać dokumenty (skan, klasyfikacja, edycja).
 * Administrator (pełny) lub pracownik Onyx (zapis wymuszony na firmowe).
 */
export function canWriteDocuments(session: Session | null): boolean {
  const role = (session?.user as { role?: string } | undefined)?.role;
  return role === "admin" || isOnyxOnly(session);
}
