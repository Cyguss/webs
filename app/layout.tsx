import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/lib/theme";
import { ToastProvider } from "@/components/toast-context";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Vaultly — Sell Digital Products Instantly",
    template: "%s | Vaultly",
  },
  description:
    "Create your storefront in minutes. Sell license keys, digital goods, and services. Accept card and crypto payments with instant automated delivery.",
  keywords: ["digital products", "sell online", "license keys", "storefront", "crypto payments"],
  openGraph: {
    title: "Vaultly — Sell Digital Products Instantly",
    description: "Create your storefront in minutes. Accept card and crypto payments.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('vaultly-theme') || 'dark';
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
