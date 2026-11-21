import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { Suspense } from "react";
import { LoadingScreen } from "@/components/loading-screen";
import { Shell } from "@/components/shell";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Milestone",
  description: "Clear scope. Agreed changes. No surprises.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full font-sans text-ink">
        <Suspense fallback={<LoadingScreen />}>
          <StoreProvider>
            <Shell>{children}</Shell>
          </StoreProvider>
        </Suspense>
      </body>
    </html>
  );
}
