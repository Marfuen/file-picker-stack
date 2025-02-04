import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./components/providers/AuthProvider";
import { Toaster } from "sonner";
import { Header } from "./components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stack AI - File Picker",
  description: "Stack AI - File Picker",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <div className="flex flex-col gap-2 md:gap-4 p-4 md:p-16 max-w-screen-lg mx-auto">
            <div className="flex flex-col gap-4 md:gap-6 w-full">
              <Header
                title="Google Drive"
                icon="/connections/drive-logo.svg"
                isBeta
              />
              {children}
              <Toaster />
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
