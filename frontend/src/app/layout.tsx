/* eslint-disable @next/next/no-sync-scripts */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Creator Revenue Bridge",
  description: "미래 플랫폼 수익을 활용한 RWA 기반 선지급 서비스",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
