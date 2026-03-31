import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { CarbonResult } from "@/types/carbon";
import { Download, Link, Leaf, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import GradeBadge from "./GradeBadge";
import { toast } from "@/hooks/use-toast";

const ShareableCompareCard = ({ a, b }: { a: CarbonResult; b: CarbonResult }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const diff = a.total_co2e_kg - b.total_co2e_kg;
  const winner = diff < 0 ? 0 : diff > 0 ? 1 : -1;

  const exportPNG = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0a0f0a",
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `carbonlens-compare-${a.product.toLowerCase().replace(/\s+/g, "-")}-vs-${b.product.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      toast({ title: "Export failed", description: "Could not generate image.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const copyLink = () => {
    const winnerName = winner === 0 ? a.product : winner === 1 ? b.product : null;
    const text = winnerName
      ? `${a.product} (${a.total_co2e_kg} kg CO₂e, Grade ${a.grade}) vs ${b.product} (${b.total_co2e_kg} kg CO₂e, Grade ${b.grade}) — ${winnerName} saves ${Math.abs(diff).toFixed(1)} kg CO₂e! Compared with CarbonLens 🌍`
      : `${a.product} vs ${b.product} — both at ${a.total_co2e_kg} kg CO₂e (Grade ${a.grade}). Compared with CarbonLens 🌍`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Comparison summary copied to clipboard." });
  };

  const products = [a, b];

  return (
    <div className="space-y-4">
      <div
        ref={cardRef}
        className="rounded-xl border border-border overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0a0f0a 0%, #111a11 50%, #0a0f0a 100%)" }}
      >
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="h-4 w-4 text-primary" />
              <span className="font-orbitron text-xs font-bold tracking-widest text-primary">
                CARBONLENS
              </span>
            </div>
            <span className="text-xs font-mono text-muted-foreground">COMPARISON</span>
          </div>

          {/* Two products side by side */}
          <div className="grid grid-cols-2 gap-4">
            {products.map((p, i) => (
              <div
                key={i}
                className={`rounded-lg p-4 text-center space-y-2 ${
                  winner === i
                    ? "border border-primary/40 bg-primary/5"
                    : "border border-border/40 bg-secondary/20"
                }`}
              >
                {winner === i && (
                  <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-primary">
                    <Trophy className="h-3 w-3" />
                    GREENER
                  </div>
                )}
                <h4 className="text-sm font-semibold text-foreground truncate">{p.product}</h4>
                <p className="text-[10px] font-mono text-muted-foreground">{p.category}</p>
                <div className="font-orbitron text-3xl font-bold text-primary">
                  {p.total_co2e_kg < 10
                    ? p.total_co2e_kg.toFixed(2)
                    : p.total_co2e_kg < 100
                    ? p.total_co2e_kg.toFixed(1)
                    : Math.round(p.total_co2e_kg)}
                </div>
                <p className="text-[10px] font-mono text-muted-foreground">kg CO₂e</p>
                <div className="flex justify-center">
                  <GradeBadge grade={p.grade} size="sm" />
                </div>
              </div>
            ))}
          </div>

          {/* Difference */}
          <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-center">
            <p className="text-xs text-foreground font-mono">
              {winner === 0
                ? `💡 ${a.product} saves ${Math.abs(diff).toFixed(1)} kg CO₂e vs ${b.product}`
                : winner === 1
                ? `💡 ${b.product} saves ${Math.abs(diff).toFixed(1)} kg CO₂e vs ${a.product}`
                : "💡 Both products have equal carbon footprints"}
            </p>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-border/50">
            <p className="text-[10px] font-mono text-muted-foreground">
              carbonlens.app · Built for Treeline Hacks 2026 🌍
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button onClick={exportPNG} disabled={isExporting} className="flex-1 gap-2">
          <Download className="h-4 w-4" />
          {isExporting ? "Exporting…" : "Download PNG"}
        </Button>
        <Button onClick={copyLink} variant="outline" className="flex-1 gap-2">
          <Link className="h-4 w-4" />
          Copy Summary
        </Button>
      </div>
    </div>
  );
};

export default ShareableCompareCard;
