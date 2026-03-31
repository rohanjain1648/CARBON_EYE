import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import ProductScanner from "@/components/ProductScanner";
import CarbonReportCard from "@/components/CarbonReportCard";
import ImpactWall from "@/components/ImpactWall";
import CarbonDiary from "@/components/CarbonDiary";
import CarbonBudgetTracker from "@/components/CarbonBudgetTracker";
import ScanYourDay from "@/components/ScanYourDay";
import ProductCompare from "@/components/ProductCompare";
import { useProductSearch } from "@/hooks/useProductSearch";
import { Leaf, Eye, BookOpen, Gauge, Zap, GitCompareArrows } from "lucide-react";

const Index = () => {
  const { result, isLoading, search } = useProductSearch();
  const [view, setView] = useState<"search" | "impact" | "diary" | "budget" | "challenge" | "compare">("search");

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => setView("search")} className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-primary" />
            <span className="font-orbitron text-sm font-bold tracking-wider text-foreground">CARBONLENS</span>
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView("challenge")}
              className={`text-xs font-mono transition-colors flex items-center gap-1.5 ${view === "challenge" ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
            >
              <Zap className="h-3.5 w-3.5" />
              Scan Your Day
            </button>
            <button
              onClick={() => setView("compare")}
              className={`text-xs font-mono transition-colors flex items-center gap-1.5 ${view === "compare" ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
            >
              <GitCompareArrows className="h-3.5 w-3.5" />
              Compare
            </button>
            <button
              onClick={() => setView("budget")}
              className={`text-xs font-mono transition-colors flex items-center gap-1.5 ${view === "budget" ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
            >
              <Gauge className="h-3.5 w-3.5" />
              Budget
            </button>
            <button
              onClick={() => setView("impact")}
              className={`text-xs font-mono transition-colors flex items-center gap-1.5 ${view === "impact" ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
            >
              <Eye className="h-3.5 w-3.5" />
              Impact Wall
            </button>
            <button
              onClick={() => setView("diary")}
              className={`text-xs font-mono transition-colors flex items-center gap-1.5 ${view === "diary" ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Diary
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8 md:py-16">
        {view === "search" && (
          <div className="space-y-12">
            {!result && (
              <div className="text-center space-y-4 mb-8">
                <h1 className="font-orbitron text-3xl md:text-5xl font-bold text-foreground tracking-tight">
                  Scan Any Product.
                  <br />
                  <span className="text-primary glow-green">Know Its True Cost.</span>
                </h1>
                <p className="text-muted-foreground font-mono text-sm md:text-base max-w-xl mx-auto">
                  The price tag shows dollars. CarbonLens shows what the planet pays.
                </p>
              </div>
            )}
            <div className="flex items-center gap-3 justify-center">
              <div className="flex-1 max-w-2xl">
                <SearchBar onSearch={(q) => { setView("search"); search(q); }} isLoading={isLoading} />
              </div>
              <ProductScanner onProductIdentified={(name) => { setView("search"); search(name); }} isLoading={isLoading} />
            </div>
            {isLoading && (
              <div className="w-full max-w-3xl mx-auto space-y-4 animate-pulse">
                <div className="rounded-xl bg-card border border-border h-48" />
                <div className="rounded-xl bg-card border border-border h-64" />
                <div className="rounded-xl bg-card border border-border h-32" />
              </div>
            )}
            {result && <CarbonReportCard result={result} />}
          </div>
        )}

        {view === "impact" && (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="font-orbitron text-2xl font-bold text-foreground">Impact Wall</h2>
              <p className="text-sm text-muted-foreground font-mono">
                See what the community has uncovered
              </p>
            </div>
            <ImpactWall />
          </div>
        )}

        {view === "diary" && (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="font-orbitron text-2xl font-bold text-foreground">Carbon Diary</h2>
              <p className="text-sm text-muted-foreground font-mono">
                Your personal product emission history
              </p>
            </div>
            <CarbonDiary />
          </div>
        )}

        {view === "budget" && (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="font-orbitron text-2xl font-bold text-foreground">Carbon Budget</h2>
              <p className="text-sm text-muted-foreground font-mono">
                Track your monthly carbon footprint against your goal
              </p>
            </div>
            <CarbonBudgetTracker />
          </div>
        )}

        {view === "challenge" && (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="font-orbitron text-2xl font-bold text-foreground">Scan Your Day</h2>
              <p className="text-sm text-muted-foreground font-mono">
                Search 5 products from your daily routine and discover your lifestyle carbon score
              </p>
            </div>
            <ScanYourDay />
          </div>
        )}

        {view === "compare" && (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="font-orbitron text-2xl font-bold text-foreground">Compare Products</h2>
              <p className="text-sm text-muted-foreground font-mono">
                Search two products and see their carbon footprints side-by-side
              </p>
            </div>
            <ProductCompare />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 text-center">
        <p className="text-xs text-muted-foreground font-mono">
          CarbonLens — Built for Treeline Hacks 2026 🌍
        </p>
      </footer>
    </div>
  );
};

export default Index;
