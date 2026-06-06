import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BlueBlood.ai - Global Health Intelligence",
  description:
    "Multi-agent health intelligence platform powered by Azure AI Foundry",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
