import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Insurance Triage - AI Claims Processing",
  description: "AI-powered insurance claim triage and processing system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="pt-24 px-4 pb-12">{children}</main>
      </body>
    </html>
  );
}
