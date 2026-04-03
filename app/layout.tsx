import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import QueryProvider from "@/components/QueryProvider";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-headline",
  weight: ["700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Just a Job",
    template: "%s | Just a Job",
  },
  description: "The Digital Tailor for architected applications, tailored CVs, and application tracking.",
  icons: {
    icon: "/favicon-192x192.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className={`${inter.variable} ${manrope.variable} antialiased`}>
        <QueryProvider>{children}</QueryProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "rgba(15,25,48,0.95)",
              color: "#fff",
              border: "1px solid rgba(129,236,255,0.2)",
              borderRadius: "1rem",
              fontSize: "14px",
              fontWeight: 500,
              backdropFilter: "blur(12px)",
            },
            success: {
              iconTheme: { primary: "#00d4ec", secondary: "#fff" },
            },
          }}
        />
      </body>
    </html>
  );
}
