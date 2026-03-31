import { useState, useEffect } from "react";
import { CarbonResult } from "@/types/carbon";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Trash2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DiaryEntry {
  product: string;
  co2e: number;
  grade: string;
  timestamp: number;
}

const DIARY_KEY = "carbonlens-diary";

export const addToDiary = (result: CarbonResult) => {
  const entries: DiaryEntry[] = JSON.parse(localStorage.getItem(DIARY_KEY) || "[]");
  // Avoid duplicates from same session
  if (entries.some((e) => e.product === result.product && Date.now() - e.timestamp < 60000)) return;
  entries.push({
    product: result.product,
    co2e: result.total_co2e_kg,
    grade: result.grade,
    timestamp: Date.now(),
  });
  localStorage.setItem(DIARY_KEY, JSON.stringify(entries));
};

const gradeColor: Record<string, string> = {
  A: "hsl(142, 71%, 55%)",
  B: "hsl(142, 71%, 73%)",
  C: "hsl(43, 96%, 56%)",
  D: "hsl(24, 94%, 53%)",
  F: "hsl(0, 84%, 60%)",
};

const CarbonDiary = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);

  useEffect(() => {
    setEntries(JSON.parse(localStorage.getItem(DIARY_KEY) || "[]"));
  }, []);

  const totalEmissions = entries.reduce((sum, e) => sum + e.co2e, 0);

  const clearDiary = () => {
    localStorage.removeItem(DIARY_KEY);
    setEntries([]);
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <BookOpen className="h-10 w-10 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground font-mono">
          Your diary is empty. Search for products to start tracking.
        </p>
      </div>
    );
  }

  const chartData = entries.map((e) => ({
    name: e.product.length > 12 ? e.product.slice(0, 12) + "…" : e.product,
    co2e: e.co2e,
    grade: e.grade,
  }));

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="rounded-xl border border-border bg-card p-6 text-center space-y-1">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Total discovered emissions
        </p>
        <div className="font-orbitron text-4xl font-bold text-primary glow-green">
          {totalEmissions < 10 ? totalEmissions.toFixed(2) : totalEmissions < 100 ? totalEmissions.toFixed(1) : Math.round(totalEmissions)}
        </div>
        <p className="text-sm font-mono text-muted-foreground">
          kg CO₂e across {entries.length} product{entries.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Your Product History</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "DM Mono" }}
                axisLine={false}
                tickLine={false}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "DM Mono" }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontFamily: "DM Mono",
                  fontSize: 12,
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [`${value} kg CO₂e`, "Emissions"]}
              />
              <Bar dataKey="co2e" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={gradeColor[entry.grade] || gradeColor.C} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Clear */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={clearDiary} className="gap-2 text-muted-foreground">
          <Trash2 className="h-3.5 w-3.5" />
          Clear Diary
        </Button>
      </div>
    </div>
  );
};

export default CarbonDiary;
