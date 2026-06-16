import { Session } from "next-auth";

/** Czy sesja jest ograniczona tylko do Onyx (firmowe). */
export function isOnyxOnly(session: Session | null): boolean {
  return (
    (session?.user as { scope?: string } | undefined)?.scope === "onyx"
  );
}
