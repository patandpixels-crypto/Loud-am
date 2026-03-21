import type { Metadata } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import Navbar from "@/components/Navbar";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BREAL | Be Real. Get Paid.",
  description:
    "Share insider company reviews anonymously. Staff-only sections. Get paid when people read your posts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script src="https://js.paystack.co/v2/inline.js" strategy="beforeInteractive" />
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className={`${jakarta.variable} ${spaceGrotesk.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main className="min-h-[calc(100vh-64px)]">{children}</main>
            <footer className="border-t border-card-border">
              <div className="mx-auto max-w-6xl px-4 py-8">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                  <div className="flex items-center gap-3">
                    <span className="logo-text gradient-text text-lg">BREAL</span>
                    <span className="hidden h-4 w-px bg-card-border sm:block" />
                    <span className="hidden text-xs text-muted sm:block">Be real. Get paid.</span>
                  </div>
                  <p className="text-xs text-muted">
                    &copy; {new Date().getFullYear()} BREAL. All rights reserved.
                  </p>
                </div>
              </div>
            </footer>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
