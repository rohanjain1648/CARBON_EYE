import { CarbonAlternative } from "@/types/carbon";
import { Leaf, ArrowDown } from "lucide-react";

const AlternativesSection = ({ alternatives }: { alternatives: CarbonAlternative[] }) => {
  if (!alternatives?.length) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
        <Leaf className="h-5 w-5 text-primary" />
        Greener Choices
      </h3>
      <div className="grid md:grid-cols-3 gap-4">
        {alternatives.map((alt) => (
          <div key={alt.name} className="rounded-lg border border-border bg-card p-4 space-y-3 hover:border-primary/30 transition-colors">
            <div className="font-semibold text-foreground">{alt.name}</div>
            <div className="flex items-center gap-2">
              <span className="font-orbitron text-lg text-primary">{alt.co2e_kg} kg</span>
              <span className="flex items-center gap-0.5 text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                <ArrowDown className="h-3 w-3" />
                {alt.reduction_percent}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{alt.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlternativesSection;
