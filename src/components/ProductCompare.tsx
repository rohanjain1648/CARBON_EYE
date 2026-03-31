import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CarbonResult, CarbonLifecycle } from "@/types/carbon";
import { useToast } from "@/hooks/use-toast";
import SearchBar from "@/components/SearchBar";
import ProductScanner from "@/components/ProductScanner";
import GradeBadge from "@/components/GradeBadge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ArrowDown, ArrowUp, Minus, Trophy, Package } from "lucide-react";
import ShareableCompareCard from "./ShareableCompareCard";

const LIFECYCLE_LABELS: Record<keyof CarbonLifecycle, string> = {
  raw_materials: "Raw Materials",
  manufacturing: "Manufacturing",
  transport: "Transport",
  use_phase: "Use Phase",
  end_of_life: "End of Life",
};

const ProductCompare = () => {
  const [products, setProducts] = useState<(CarbonResult | null)[]>([null, null]);
  const [loadingSlot, setLoadingSlot] = useState<number | null>(null);
  const { toast } = useToast();

  const searchProduct = async (slot: number, productName: string) => {
    setLoadingSlot(slot);
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

      setProducts((prev) => {
        const next = [...prev];
        next[slot] = result;
        return next;
      });
    } catch (err: any) {
      toast({
        title: "Analysis failed",
        description: err.message || "Could not analyze this product.",
        variant: "destructive",
      });
    } finally {
      setLoadingSlot(null);
    }
  };

  const [a, b] = products;
  const bothLoaded = a && b;
  const diff = bothLoaded ? a.total_co2e_kg - b.total_co2e_kg : 0;
  const winner = bothLoaded ? (diff < 0 ? 0 : diff > 0 ? 1 : -1) : -1;

  const lifecycleData = bothLoaded
    ? (Object.keys(LIFECYCLE_LABELS) as (keyof CarbonLifecycle)[]).map((key) => ({
        name: LIFECYCLE_LABELS[key],
        [a.product]: Number(a.lifecycle[key].toFixed(2)),
        [b.product]: Number(b.lifecycle[key].toFixed(2)),
      }))
    : [];

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Two search slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[0, 1].map((slot) => (
          <div key={slot} className="space-y-3">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider text-center">
              Product {slot + 1}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SearchBar
                  onSearch={(q) => searchProduct(slot, q)}
                  isLoading={loadingSlot === slot}
                />
              </div>
              <ProductScanner
                onProductIdentified={(name) => searchProduct(slot, name)}
                isLoading={loadingSlot === slot}
              />
            </div>

            {/* Product card */}
            {products[slot] ? (
              <div
                className={`rounded-xl border bg-card p-5 text-center space-y-3 transition-all ${
                  winner === slot ? "border-primary glow-box" : "border-border"
                }`}
              >
                {winner === slot && (
                  <div className="flex items-center justify-center gap-1 text-xs font-mono text-primary">
                    <Trophy className="h-3.5 w-3.5" />
                    Greener Choice
                  </div>
                )}
                <h3 className="text-lg font-semibold text-foreground">{products[slot]!.product}</h3>
                <p className="text-xs text-muted-foreground font-mono">{products[slot]!.category}</p>
                <div className="font-orbitron text-4xl font-bold text-primary glow-green">
                  {products[slot]!.total_co2e_kg.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground font-mono">kg CO₂e</p>
                <div className="flex justify-center">
                  <GradeBadge grade={products[slot]!.grade} size="lg" />
                </div>
              </div>
            ) : loadingSlot === slot ? (
              <div className="rounded-xl border border-border bg-card h-56 animate-pulse flex items-center justify-center">
                <Package className="h-8 w-8 text-muted-foreground/30 animate-bounce" />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-card/50 h-56 flex items-center justify-center">
                <p className="text-sm text-muted-foreground font-mono">Search a product above</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Comparison results */}
      {bothLoaded && (
        <div className="space-y-6 animate-fade-up">
          {/* Difference banner */}
          <div className="rounded-xl border border-border bg-card p-5 text-center space-y-2">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">CO₂ Difference</p>
            <div className="flex items-center justify-center gap-2">
              {diff < 0 ? (
                <ArrowDown className="h-5 w-5 text-primary" />
              ) : diff > 0 ? (
                <ArrowUp className="h-5 w-5 text-destructive" />
              ) : (
                <Minus className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="font-orbitron text-3xl font-bold text-foreground">
                {Math.abs(diff).toFixed(1)} kg
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-mono">
              {winner === 0
                ? `${a.product} saves ${Math.abs(diff).toFixed(1)} kg CO₂e vs ${b.product}`
                : winner === 1
                ? `${b.product} saves ${Math.abs(diff).toFixed(1)} kg CO₂e vs ${a.product}`
                : "Both products have equal emissions"}
            </p>
          </div>

          {/* Side-by-side lifecycle chart */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Lifecycle Comparison</h3>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lifecycleData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <XAxis
                    type="number"
                    tick={{ fill: "hsl(120, 10%, 55%)", fontSize: 12, fontFamily: "DM Mono" }}
                    axisLine={false}
                    tickLine={false}
                    unit=" kg"
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "hsl(120, 60%, 97%)", fontSize: 11, fontFamily: "DM Mono" }}
                    axisLine={false}
                    tickLine={false}
                    width={110}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(120, 15%, 6%)",
                      border: "1px solid hsl(120, 10%, 15%)",
                      borderRadius: "8px",
                      fontFamily: "DM Mono",
                      color: "hsl(120, 60%, 97%)",
                    }}
                    formatter={(value: number) => [`${value} kg CO₂e`, ""]}
                  />
                  <Legend
                    wrapperStyle={{ fontFamily: "DM Mono", fontSize: 12 }}
                  />
                  <Bar dataKey={a.product} fill="hsl(142, 69%, 58%)" radius={[0, 4, 4, 0]} barSize={14} />
                  <Bar dataKey={b.product} fill="hsl(200, 60%, 50%)" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick stats comparison */}
          <div className="grid grid-cols-2 gap-4">
            {(["driving_km", "trees_year", "water_litres", "flight_percent"] as const).map((key) => {
              const labels = {
                driving_km: "Driving (km)",
                trees_year: "Trees to offset",
                water_litres: "Water (L)",
                flight_percent: "% LDN→NYC flight",
              };
              const valA = a.equivalents[key];
              const valB = b.equivalents[key];
              return (
                <div key={key} className="rounded-lg border border-border bg-card p-4 space-y-2">
                  <p className="text-xs font-mono text-muted-foreground">{labels[key]}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-center flex-1">
                      <p className="text-xs text-muted-foreground font-mono truncate">{a.product}</p>
                      <p className={`font-orbitron text-lg font-bold ${valA <= valB ? "text-primary" : "text-foreground"}`}>
                        {valA < 0.01 ? "<0.01" : valA.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                      </p>
                    </div>
                    <span className="text-muted-foreground/40 text-xs font-mono mx-2">vs</span>
                    <div className="text-center flex-1">
                      <p className="text-xs text-muted-foreground font-mono truncate">{b.product}</p>
                      <p className={`font-orbitron text-lg font-bold ${valB <= valA ? "text-primary" : "text-foreground"}`}>
                        {valB < 0.01 ? "<0.01" : valB.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Shareable comparison card */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Share This Comparison</h3>
            <ShareableCompareCard a={a} b={b} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCompare;
