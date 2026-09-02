import type { Metadata } from "next";
import "@razorpay/blade/fonts.css";
import "./globals.css";
import BladeProviderWrapper from "@/components/BladeProviderWrapper";

export const metadata: Metadata = {
  title: "RecoverAI — Payment Recovery Operations",
  description: "AI-powered payment recovery operations dashboard for the Razorpay ecosystem.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        <BladeProviderWrapper>{children}</BladeProviderWrapper>
      </body>
    </html>
  );
}
