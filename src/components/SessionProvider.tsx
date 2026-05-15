"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export default function SessionProvider({
  children,
  session,
}: {
  children: ReactNode;
  session: unknown;
}) {
  return (
    <NextAuthSessionProvider session={session as never}>
      {children}
    </NextAuthSessionProvider>
  );
}
