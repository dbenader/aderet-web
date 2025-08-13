import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
    subsets: ['latin'],
    weight: ['400', '700'],
    variable: '--font-space-mono', // define CSS variable
  });


export const metadata: Metadata = {
  title: "Aderet Technologies LLC",
  description: "Aderet Technologies LLC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${spaceMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
