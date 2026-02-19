import type { Metadata } from "next";
import { Bangers } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import Navbar from "@/components/Navbar";

const bangers = Bangers({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-playful",
});

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
      <body className={`${bangers.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main className="min-h-[calc(100vh-64px)]">{children}</main>
            <footer className="border-t border-card-border py-8 text-center">
              <p className="logo-text gradient-text inline-block text-sm">
                LOUD-AM!
              </p>
              <p className="mt-1 text-xs text-muted">
                &copy; {new Date().getFullYear()} &mdash; Speak your truth, be heard.
              </p>
            </footer>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
