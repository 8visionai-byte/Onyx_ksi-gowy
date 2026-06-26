import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionProvider from "@/components/SessionProvider";
import Sidebar from "@/components/Sidebar";
import ScanButton from "@/components/ScanButton";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Onyx Księgowy",
  description: "System księgowy dla firmy Onyx",
  applicationName: "Onyx Księgowy",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Onyx Księgowy",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="pl" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <SessionProvider session={session}>
          {session ? (
            <>
              <Sidebar />
              <main className="min-h-screen bg-[#0f172a] md:ml-[220px]">
                <div className="p-6 pt-16 md:pt-6">{children}</div>
              </main>
              <ScanButton />
            </>
          ) : (
            children
          )}
        </SessionProvider>
      </body>
    </html>
  );
}
