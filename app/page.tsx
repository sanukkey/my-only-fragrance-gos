"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Sparkles, TrendingUp, Gem } from "lucide-react";
import Dashboard from "./components/Dashboard";
import AIAlchemist from "./components/AIAlchemist";
import LTVHub from "./components/LTVHub";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "alchemist", label: "AI-Alchemist", icon: Sparkles },
  { id: "ltv", label: "LTV-Hub", icon: TrendingUp },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-champagneLight/60 bg-cream/98 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 pt-5 pb-4">
          {/* タグラインを画面の水平中央に配置（3列グリッドで中央列に配置） */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 pb-4">
            <div className="min-w-0" aria-hidden="true" />
            <p className="font-serif text-2xl md:text-3xl font-light tracking-wide text-warmInk text-center px-2">
              香りで世界を変えていく
            </p>
            <div className="min-w-0" aria-hidden="true" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="font-sans text-lg font-semibold tracking-tight text-warmInk">
                MY ONLY FRAGRANCE
              </span>
              <span className="font-sans text-xs font-medium text-warmMuted bg-champagneLight/50 text-warmInk px-2.5 py-1 rounded">
                G-OS
              </span>
            </div>
            <nav className="flex gap-1 flex-shrink-0 items-center">
              <Link
                href="/experience"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-sans text-sm font-medium transition-silent text-champagne hover:bg-champagneLight/40 border border-champagne/50"
              >
                <Gem size={18} strokeWidth={1.8} />
                G-OS Experience
              </Link>
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-sans text-sm font-medium transition-silent ${
                    activeTab === id
                      ? "bg-champagne text-cream"
                      : "text-warmMuted hover:text-warmInk hover:bg-champagneLight/40"
                  }`}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-10">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "alchemist" && <AIAlchemist />}
        {activeTab === "ltv" && <LTVHub />}
      </main>

      <footer className="border-t border-champagneLight/50 py-5 bg-cream/80">
        <p className="font-sans text-xs text-warmMuted text-center">
          © MY ONLY FRAGRANCE — 香りで世界を変えていく。経営のための、そして現場の誇りのためのOS
        </p>
      </footer>
    </div>
  );
}
