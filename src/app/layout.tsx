import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import NetworkStatusToast from "@/components/system/NetworkStatusToast";

export const metadata: Metadata = {
  title: "AURA | Premium Streaming",
  description: "The future of streaming.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-black text-white">
        <AuthProvider>
          {children}
          <NetworkStatusToast />
        </AuthProvider>
      </body>
    </html>
  );
}
