import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { CarbonResult } from "@/types/carbon";
import GradeBadge from "./GradeBadge";
import LifecycleChart from "./LifecycleChart";
import EquivalentsGrid from "./EquivalentsGrid";
import AlternativesSection from "./AlternativesSection";
import ShareableCard from "./ShareableCard";
import { Info, TrendingDown, TrendingUp } from "lucide-react";

const AnimatedNumber = ({ target, duration = 1200 }: { target: number; duration?: number }) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * target);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return <>{value < 10 ? value.toFixed(2) : value < 100 ? value.toFixed(1) : Math.round(value)}</>;
};

const CarbonReportCard = ({ result }: { result: CarbonResult }) => {
  const benchmarkDiff = ((result.total_co2e_kg - result.category_average_co2e_kg) / result.category_average_co2e_kg) * 100;
  const isBetter = benchmarkDiff < 0;

  useEffect(() => {
    if (result.grade === "A") {
      const end = Date.now() + 1500;
      const colors = ["#4ade80", "#86efac", "#22c55e"];
      (function frame() {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    }
  }, [result]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-fade-up">
      {/* Hero section */}
      <div className="rounded-xl border border-border bg-card p-6 md:p-8 glow-box">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left space-y-1">
            <h2 className="text-2xl font-bold text-foreground">{result.product}</h2>
            <p className="text-sm text-muted-foreground font-mono">{result.category}</p>
            <div className="mt-4">
              <div className="font-orbitron text-6xl md:text-7xl font-bold text-primary glow-green">
                <AnimatedNumber target={result.total_co2e_kg} />
              </div>
              <div className="text-sm text-muted-foreground font-mono mt-1">kg CO₂e total</div>
            </div>
          </div>
          <GradeBadge grade={result.grade} />
        </div>

        {/* Confidence */}
        <div className="mt-4 flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <Info className="h-3 w-3" />
          Confidence: <span className="capitalize text-foreground">{result.confidence}</span>
        </div>
      </div>

      {/* Lifecycle breakdown */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Lifecycle Breakdown</h3>
        <LifecycleChart lifecycle={result.lifecycle} />
      </div>

      {/* Industry benchmark */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-3 text-foreground">vs. Category Average</h3>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1 text-sm font-mono ${isBetter ? "text-primary" : "text-destructive"}`}>
            {isBetter ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
            {Math.abs(benchmarkDiff).toFixed(0)}% {isBetter ? "below" : "above"} average
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            (avg: {result.category_average_co2e_kg} kg CO₂e)
          </span>
        </div>
        {/* Benchmark bar */}
        <div className="mt-3 relative h-3 rounded-full bg-secondary overflow-hidden">
          <div
            className="absolute h-full rounded-full bg-primary/40"
            style={{ width: `${Math.min((result.category_average_co2e_kg / Math.max(result.total_co2e_kg, result.category_average_co2e_kg)) * 100, 100)}%` }}
          />
          <div
            className={`absolute h-full rounded-full ${isBetter ? "bg-primary" : "bg-destructive"}`}
            style={{ width: `${Math.min((result.total_co2e_kg / Math.max(result.total_co2e_kg, result.category_average_co2e_kg)) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Equivalents */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Planetary Equivalents</h3>
        <EquivalentsGrid equivalents={result.equivalents} />
      </div>

      {/* Key insight */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <p className="text-sm text-foreground leading-relaxed italic">
          💡 {result.key_insight}
        </p>
      </div>

      {/* Alternatives */}
      <AlternativesSection alternatives={result.alternatives} />

      {/* Shareable Card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Share This Report</h3>
        <ShareableCard result={result} />
      </div>
    </div>
  );
};

export default CarbonReportCard;
