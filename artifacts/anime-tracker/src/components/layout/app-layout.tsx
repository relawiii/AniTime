import React from "react";
import { Navbar } from "./navbar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-primary selection:text-white">
      <Navbar />
      <main className="pb-24">
        {children}
      </main>
      <footer className="py-8 text-center text-white/40 text-sm border-t border-white/10">
        <p>© {new Date().getFullYear()} AniTime. Not a streaming service.</p>
        <p className="mt-2">Data provided by AniList.</p>
      </footer>
    </div>
  );
}
