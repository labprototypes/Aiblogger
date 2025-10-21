import "./globals.css";
import type { ReactNode } from "react";
import { Header } from "../components/Header";

export const metadata = {
  title: "AI Blogger Studio",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-bg text-gray-200">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <Header />
          {children}
        </div>
      </body>
    </html>
  );
}
