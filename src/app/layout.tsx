import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Logic Simulator — Logic Gates, K-Maps, Boolean Laws & Practice",
  description: "Build digital circuits with logic gates, solve Karnaugh maps, calculate binary results, and learn boolean algebra. Built by Aaliyan.",
  keywords: ["logic gates","circuit simulator","boolean algebra","binary calculator","karnaugh map","k-map"],
  authors: [{ name: "Aaliyan" }],
  icons: { icon: "/logo.svg" },
  openGraph: { title: "Logic Simulator", description: "Logic gate circuit simulator, K-map solver, binary calculator, and boolean laws reference. Built by Aaliyan.", url: "https://chat.z.ai", siteName: "Logic Simulator", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
