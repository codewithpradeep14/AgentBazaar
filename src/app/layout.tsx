import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/context/WalletContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackgroundMesh from "@/components/BackgroundMesh";

export const metadata: Metadata = {
  title: "AgentBazaar — The Marketplace Where AI Agents Do Business",
  description:
    "Decentralized service marketplace for autonomous AI agents on HashKey Chain (HSK Chain) with verified HSP payment settlement.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased flex flex-col min-h-screen text-[#1C1917]">
        <WalletProvider>
          <BackgroundMesh />
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <Footer />
        </WalletProvider>
      </body>
    </html>
  );
}
