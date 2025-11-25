import type { Metadata } from "next";
import {
  Racing_Sans_One,
  Open_Sans,
  Montserrat,
  Bricolage_Grotesque,
} from "next/font/google";
import "./globals.css";

const racingSansOne = Racing_Sans_One({
  variable: "--font-racing",
  subsets: ["latin"],
  weight: ["400"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  preload: true,
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Tipmanna",
  description:
    "Tipmanna is a platform for tippers to tip their favorite hosts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${racingSansOne.variable} ${openSans.variable} ${montserrat.variable} ${bricolage.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
