import { useState, useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, startOfDay, startOfWeek, parseISO } from "date-fns";

interface TrendPoint {
  label: string;
  emissions: number;
  searches: number;
}

interface TrendChartProps {
  allSearches: { co2: number; search_count: number; created_at: string }[];
}

const TrendChart = ({ allSearches }: TrendChartProps) => {
  const [trendPeriod, setTrendPeriod] = useState<"daily" | "weekly">("daily");

  const trendData = useMemo<TrendPoint[]>(() => {
    if (!allSearches.length) return [];

    const buckets = new Map<string, { emissions: number; searches: number }>();

    if (trendPeriod === "daily") {
      for (let i = 13; i >= 0; i--) {
        const key = format(subDays(new Date(), i), "yyyy-MM-dd");
        buckets.set(key, { emissions: 0, searches: 0 });
      }
      allSearches.forEach((s) => {
        const key = format(startOfDay(parseISO(s.created_at)), "yyyy-MM-dd");
        const bucket = buckets.get(key);
        if (bucket) {
          bucket.emissions += s.co2;
          bucket.searches += s.search_count;
        }
      });
    } else {
      for (let i = 7; i >= 0; i--) {
        const key = format(startOfWeek(subDays(new Date(), i * 7)), "yyyy-MM-dd");
        buckets.set(key, { emissions: 0, searches: 0 });
      }
      allSearches.forEach((s) => {
        const weekStart = format(startOfWeek(parseISO(s.created_at)), "yyyy-MM-dd");
        const bucket = buckets.get(weekStart);
        if (bucket) {
          bucket.emissions += s.co2;
          bucket.searches += s.search_count;
        }
      });
    }

    return Array.from(buckets.entries()).map(([key, val]) => ({
      label: trendPeriod === "daily" ? format(parseISO(key), "MMM d") : `W/O ${format(parseISO(key), "MMM d")}`,
      emissions: Math.round(val.emissions * 10) / 10,
      searches: val.searches,
    }));
  }, [allSearches, trendPeriod]);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
          <CalendarDays className="h-4 w-4 text-primary" />
          Community Emissions Trend
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => setTrendPeriod("daily")}
            className={`text-xs font-mono px-2.5 py-1 rounded-md transition-colors ${
              trendPeriod === "daily"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setTrendPeriod("weekly")}
            className={`text-xs font-mono px-2.5 py-1 rounded-md transition-colors ${
              trendPeriod === "weekly"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Weekly
          </button>
        </div>
      </div>
      {trendData.length > 0 ? (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="emissionsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 69%, 58%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142, 69%, 58%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(120, 10%, 12%)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "hsl(120, 10%, 55%)" }}
                axisLine={{ stroke: "hsl(120, 10%, 12%)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(120, 10%, 55%)" }}
                axisLine={false}
                tickLine={false}
                unit=" kg"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(120, 15%, 6%)",
                  border: "1px solid hsl(120, 10%, 15%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontFamily: "monospace",
                }}
                labelStyle={{ color: "hsl(120, 60%, 97%)" }}
                itemStyle={{ color: "hsl(142, 69%, 58%)" }}
                formatter={(value: number) => [`${value} kg CO₂`, "Emissions"]}
              />
              <Area
                type="monotone"
                dataKey="emissions"
                stroke="hsl(142, 69%, 58%)"
                strokeWidth={2}
                fill="url(#emissionsGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground font-mono text-center py-8">No trend data yet. Start searching products!</p>
      )}
    </div>
  );
};

export default TrendChart;
