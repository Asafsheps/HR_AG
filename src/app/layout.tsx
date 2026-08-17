import type { Metadata } from "next";
import "./globals.css";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: "AI-powered recruitment platform — smarter hiring, faster.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      {/* suppressHydrationWarning: browser extensions (the data-gptw
          attribute in Asaf's Brave) mutate <body> before React hydrates,
          which is indistinguishable from a real mismatch to React. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
