import { CarbonEquivalents } from "@/types/carbon";
import { Car, TreePine, Droplets, Plane } from "lucide-react";

const EquivalentsGrid = ({ equivalents }: { equivalents: CarbonEquivalents }) => {
  const items = [
    { icon: Car, value: equivalents.driving_km, unit: "km", label: "of driving" },
    { icon: TreePine, value: equivalents.trees_year, unit: "trees", label: "to offset (1yr)" },
    { icon: Droplets, value: equivalents.water_litres, unit: "L", label: "of water embedded" },
    { icon: Plane, value: equivalents.flight_percent, unit: "%", label: "of LDN→NYC flight" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-border bg-secondary/30 p-4 text-center">
          <item.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
          <div className="font-orbitron text-xl font-bold text-foreground">
            {typeof item.value === "number" && item.value < 0.01
              ? "<0.01"
              : item.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            {item.unit} {item.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EquivalentsGrid;
