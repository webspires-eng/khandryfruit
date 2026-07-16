import type { Metadata } from "next";
import { headers } from "next/headers";
import { defaultLocale, isLocale } from "@/config/site";
import "./globals.css";

export const metadata: Metadata = {
  title: "Khan Dry Fruit",
  description: "Premium Afghan dry fruits in Duisburg",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const requestLocale = (await headers()).get("x-next-intl-locale");
  const locale =
    requestLocale && isLocale(requestLocale) ? requestLocale : defaultLocale;
  return (
    <html lang={locale} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
