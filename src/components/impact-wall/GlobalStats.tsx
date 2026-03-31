import { Globe, TrendingUp } from "lucide-react";
import { useCountUp } from "./useCountUp";

interface GlobalStatsProps {
  totalEmissions: number;
  totalSearches: number;
}

const GlobalStats = ({ totalEmissions, totalSearches }: GlobalStatsProps) => {
  const animatedEmissions = useCountUp(totalEmissions);
  const animatedSearches = useCountUp(totalSearches);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-xl border border-border bg-card p-5 text-center animate-fade-in">
        <Globe className="h-5 w-5 mx-auto mb-2 text-primary" />
        <div className="font-orbitron text-2xl font-bold text-primary">
          {animatedEmissions.toLocaleString()}
        </div>
        <div className="text-xs text-muted-foreground font-mono">kg CO₂ uncovered</div>
      </div>
      <div className="rounded-xl border border-border bg-card p-5 text-center animate-fade-in">
        <TrendingUp className="h-5 w-5 mx-auto mb-2 text-primary" />
        <div className="font-orbitron text-2xl font-bold text-foreground">
          {animatedSearches.toLocaleString()}
        </div>
        <div className="text-xs text-muted-foreground font-mono">total searches</div>
      </div>
    </div>
  );
};

export default GlobalStats;
