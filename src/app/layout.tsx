import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.scss";
import Navbar from "@/components/Navbar";
import { SplashScreen } from "@/components/SplashScreen";
import { ToastContainer } from "@/components/Toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppLoading } from "@/components/AppLoading";
import { RouteProgressOverlay } from "@/components/RouteProgressOverlay";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "킥-인",
  description: "풋살 팀 경기 일정 관리 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="bg-[#0F1115]">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0F1115]`}
      >
        <ErrorBoundary>
          <RouteProgressOverlay />
          <SplashScreen />
          <Navbar />
          <Suspense fallback={<AppLoading />}>{children}</Suspense>
          <ToastContainer />
        </ErrorBoundary>
      </body>
    </html>
  );
}
