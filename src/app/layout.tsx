import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";

/** Rounded display face used on the first polished chrome (name / attack titles). */
const display = Fredoka({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700"],
});

const body = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Dana & Friends Card Studio",
  description:
    "Generate playful Dana & Friends trading-style cards from photos or mix-and-match parts. Download and print with crop marks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
