import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "LOUD-AM! | Speak Your Truth",
  description:
    "Post honest reviews about people and brands you've worked with, dated, or done business with. Upvote the truth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-64px)]">{children}</main>
          <footer className="border-t border-card-border py-8 text-center">
            <p className="gradient-text inline-block text-sm font-bold">
              LOUD-AM!
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              &copy; {new Date().getFullYear()} &mdash; Speak your truth, be heard.
            </p>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
