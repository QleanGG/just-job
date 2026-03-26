import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Just a Job — CV Tailor",
  description: "AI-powered CV tailoring from Google Docs to any job",
  icons: {
    icon: "/favicon-192x192.png",
    "apple-touch-icon": "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
