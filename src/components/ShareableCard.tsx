import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { CarbonResult } from "@/types/carbon";
import { Download, Link, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import GradeBadge from "./GradeBadge";
import { toast } from "@/hooks/use-toast";

const ShareableCard = ({ result }: { result: CarbonResult }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

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
      link.download = `carbonlens-${result.product.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      toast({ title: "Export failed", description: "Could not generate image.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const copyLink = () => {
    const text = `${result.product} has a carbon footprint of ${result.total_co2e_kg} kg CO₂e (Grade ${result.grade}). ${result.key_insight} — Scanned with CarbonLens 🌍`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Carbon summary copied to clipboard." });
  };

  return (
    <div className="space-y-4">
      {/* The exportable card */}
      <div
        ref={cardRef}
        className="rounded-xl border border-border overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0a0f0a 0%, #111a11 50%, #0a0f0a 100%)" }}
      >
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-primary" />
            <span className="font-orbitron text-xs font-bold tracking-widest text-primary">
              CARBONLENS
            </span>
          </div>

          {/* Main content */}
          <div className="flex items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-foreground">{result.product}</h3>
              <p className="text-xs font-mono text-muted-foreground">{result.category}</p>
              <div className="pt-3">
                <span className="font-orbitron text-5xl font-bold text-primary">
                  {result.total_co2e_kg < 10
                    ? result.total_co2e_kg.toFixed(2)
                    : result.total_co2e_kg < 100
                    ? result.total_co2e_kg.toFixed(1)
                    : Math.round(result.total_co2e_kg)}
                </span>
                <span className="text-sm text-muted-foreground font-mono ml-2">kg CO₂e</span>
              </div>
            </div>
            <GradeBadge grade={result.grade} />
          </div>

          {/* Key insight */}
          <div className="rounded-lg bg-primary/10 border border-primary/20 p-3">
            <p className="text-xs text-foreground leading-relaxed">
              💡 {result.key_insight}
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

export default ShareableCard;
