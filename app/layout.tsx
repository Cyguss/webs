import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/lib/theme";
import { ToastProvider } from "@/components/toast-context";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "KRYPT MARKET — Automated Black Market & Digital Key Protocol",
    template: "%s | KRYPT MARKET",
  },
  description:
    "Deploy your high-security digital node. Sell software serials, license keys, and automated digital goods. Instant on-chain crypto and encrypted card settlement.",
  keywords: ["krypt", "krypt market", "digital goods", "license vault", "black market", "crypto payments", "instant serial delivery"],
  openGraph: {
    title: "KRYPT MARKET — Automated Black Market & Digital Key Protocol",
    description: "Deploy your high-security digital node. Instant automated key dispatch.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('krypt-theme') || localStorage.getItem('vaultly-theme') || 'dark';
                document.documentElement.setAttribute('data-theme', t);
                document.documentElement.classList.add(t);
                document.documentElement.style.colorScheme = t;
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
