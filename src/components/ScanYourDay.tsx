import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CarbonResult, CarbonGrade } from "@/types/carbon";
import { useToast } from "@/hooks/use-toast";
import { addToDiary } from "@/components/CarbonDiary";
import SearchBar from "@/components/SearchBar";
import ProductScanner from "@/components/ProductScanner";
import GradeBadge from "@/components/GradeBadge";
import confetti from "canvas-confetti";
import { CheckCircle2, Circle, RotateCcw, Zap, Leaf, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

const TOTAL_STEPS = 5;

const getOverallGrade = (totalCo2: number): CarbonGrade => {
  if (totalCo2 < 15) return "A";
  if (totalCo2 < 40) return "B";
  if (totalCo2 < 80) return "C";
  if (totalCo2 < 150) return "D";
  return "F";
};

const gradeMessages: Record<CarbonGrade, string> = {
  A: "Outstanding! Your daily routine is remarkably light on the planet. Keep inspiring others! 🌿",
  B: "Great job! You're making conscious choices that matter. Small tweaks can make you even greener.",
  C: "Not bad! You're average, but there's room to reduce. Check the alternatives for each product.",
  D: "Your routine has a heavy footprint. Consider swapping a few items for greener alternatives.",
  F: "Time for a rethink. Your daily products carry a significant carbon burden. Let's find better options.",
};

const ScanYourDay = () => {
  const [products, setProducts] = useState<CarbonResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();

  const currentStep = products.length;
  const progress = (currentStep / TOTAL_STEPS) * 100;

  const searchProduct = async (productName: string) => {
    if (currentStep >= TOTAL_STEPS) return;
    setIsLoading(true);

    try {
      const { data: cached } = await supabase
        .from("searches")
        .select("*")
        .ilike("product_name", productName)
        .limit(1)
        .maybeSingle();

      let result: CarbonResult;

      if (cached) {
        await supabase
          .from("searches")
          .update({ search_count: (cached.search_count || 1) + 1 })
          .eq("id", cached.id);
        result = cached.result as unknown as CarbonResult;
      } else {
        const { data, error } = await supabase.functions.invoke("analyze-product", {
          body: { product_name: productName },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        result = data as CarbonResult;

        await supabase.from("searches").insert({
          product_name: result.product || productName,
          result: result as any,
        });
      }

      addToDiary(result);
      const newProducts = [...products, result];
      setProducts(newProducts);

      if (newProducts.length === TOTAL_STEPS) {
        setIsComplete(true);
        const grade = getOverallGrade(newProducts.reduce((s, p) => s + p.total_co2e_kg, 0));
        if (grade === "A" || grade === "B") {
          const colors = ["#4ade80", "#86efac", "#22c55e"];
          const end = Date.now() + 2000;
          (function frame() {
            confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
            confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
            if (Date.now() < end) requestAnimationFrame(frame);
          })();
        }
      }
    } catch (err: any) {
      toast({
        title: "Analysis failed",
        description: err.message || "Could not analyze this product.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setProducts([]);
    setIsComplete(false);
  };

  const totalCo2 = products.reduce((s, p) => s + p.total_co2e_kg, 0);
  const overallGrade = getOverallGrade(totalCo2);

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Progress steps */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            {i < currentStep ? (
              <CheckCircle2 className="h-6 w-6 text-primary" />
            ) : i === currentStep && !isComplete ? (
              <div className="relative">
                <Circle className="h-6 w-6 text-primary" />
                <Zap className="h-3 w-3 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
            ) : (
              <Circle className="h-6 w-6 text-muted-foreground/30" />
            )}
            {i < TOTAL_STEPS - 1 && (
              <div className={`w-8 md:w-12 h-0.5 rounded-full ${i < currentStep ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="relative h-2 rounded-full bg-secondary overflow-hidden max-w-md mx-auto">
        <div
          className="absolute h-full rounded-full bg-primary transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {!isComplete ? (
        <>
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground font-mono">
              Product {currentStep + 1} of {TOTAL_STEPS}
            </p>
            <p className="text-lg font-semibold text-foreground">
              {currentStep === 0
                ? "What's the first product you use today?"
                : currentStep === 1
                ? "What do you grab next?"
                : currentStep === 2
                ? "Halfway there! What's next?"
                : currentStep === 3
                ? "Almost done — product #4?"
                : "Last one! Make it count."}
            </p>
          </div>

          {/* Search input */}
          <div className="flex items-center gap-3 justify-center">
            <div className="flex-1 max-w-2xl">
              <SearchBar onSearch={searchProduct} isLoading={isLoading} />
            </div>
            <ProductScanner onProductIdentified={searchProduct} isLoading={isLoading} />
          </div>

          {/* Scanned products so far */}
          {products.length > 0 && (
            <div className="space-y-3 max-w-md mx-auto">
              <h4 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Scanned so far</h4>
              {products.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{p.product}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      {p.total_co2e_kg.toFixed(1)} kg
                    </span>
                    <GradeBadge grade={p.grade} size="sm" />
                  </div>
                </div>
              ))}
              <div className="text-right text-xs font-mono text-muted-foreground">
                Running total: <span className="text-primary font-semibold">{totalCo2.toFixed(1)} kg CO₂e</span>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Results screen */
        <div className="space-y-8 animate-fade-up">
          <div className="rounded-xl border border-border bg-card p-6 md:p-8 glow-box text-center space-y-4">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Your Daily Routine Score</p>
            <div className="flex justify-center">
              <GradeBadge grade={overallGrade} size="lg" />
            </div>
            <div className="font-orbitron text-5xl md:text-6xl font-bold text-primary glow-green">
              {totalCo2.toFixed(1)}
            </div>
            <p className="text-sm text-muted-foreground font-mono">kg CO₂e combined</p>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 max-w-lg mx-auto">
            <p className="text-sm text-foreground leading-relaxed italic text-center">
              💡 {gradeMessages[overallGrade]}
            </p>
          </div>

          {/* Product breakdown */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4 max-w-lg mx-auto">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Leaf className="h-5 w-5 text-primary" />
              Your 5 Products
            </h3>
            {products.map((p, i) => {
              const pctOfTotal = (p.total_co2e_kg / totalCo2) * 100;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{p.product}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">
                        {p.total_co2e_kg.toFixed(1)} kg ({pctOfTotal.toFixed(0)}%)
                      </span>
                      <GradeBadge grade={p.grade} size="sm" />
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pctOfTotal}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center">
            <Button onClick={reset} variant="outline" className="gap-2 font-mono">
              <RotateCcw className="h-4 w-4" />
              Scan Another Day
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanYourDay;
