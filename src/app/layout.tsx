import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { headers } from "next/headers";
import { defaultLocale, isLocale } from "@/config/site";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-poppins",
});

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
    <html lang={locale} className={poppins.variable} suppressHydrationWarning>
      <body cz-shortcut-listen="true">{children}</body>
    </html>
  );
}
