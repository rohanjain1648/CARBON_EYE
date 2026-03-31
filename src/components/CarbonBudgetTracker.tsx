import { useState, useEffect, useMemo } from "react";
import { Target, AlertTriangle, TrendingUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DiaryEntry {
  product: string;
  co2e: number;
  grade: string;
  timestamp: number;
}

const DIARY_KEY = "carbonlens-diary";
const BUDGET_KEY = "carbonlens-budget";

const BUDGET_PRESETS = [
  { label: "Eco Warrior", value: 50, desc: "~50 kg/mo" },
  { label: "Conscious", value: 100, desc: "~100 kg/mo" },
  { label: "Average", value: 200, desc: "~200 kg/mo" },
  { label: "Relaxed", value: 500, desc: "~500 kg/mo" },
];

const getMonthEntries = (entries: DiaryEntry[]) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  return entries.filter((e) => e.timestamp >= startOfMonth);
};

interface RingGaugeProps {
  percentage: number;
  used: number;
  budget: number;
  status: "safe" | "warning" | "danger" | "exceeded";
}

const RingGauge = ({ percentage, used, budget, status }: RingGaugeProps) => {
  const radius = 90;
  const stroke = 12;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(percentage, 100);
  const dashOffset = circumference - (clampedPct / 100) * circumference;

  const colorMap = {
    safe: "hsl(var(--grade-a))",
    warning: "hsl(var(--grade-c))",
    danger: "hsl(var(--grade-d))",
    exceeded: "hsl(var(--grade-f))",
  };
  const color = colorMap[status];

  const glowMap = {
    safe: "drop-shadow(0 0 8px hsl(var(--grade-a) / 0.4))",
    warning: "drop-shadow(0 0 8px hsl(var(--grade-c) / 0.4))",
    danger: "drop-shadow(0 0 8px hsl(var(--grade-d) / 0.4))",
    exceeded: "drop-shadow(0 0 12px hsl(var(--grade-f) / 0.5))",
  };

  return (
    <div className="relative flex items-center justify-center">
      <svg width="220" height="220" viewBox="0 0 220 220" className="transform -rotate-90">
        {/* Track */}
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Progress */}
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: "stroke-dashoffset 1s ease-out, stroke 0.5s ease",
            filter: glowMap[status],
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span
          className="font-orbitron text-3xl font-bold"
          style={{ color }}
        >
          {percentage > 999 ? "999+" : Math.round(percentage)}%
        </span>
        <span className="font-mono text-xs text-muted-foreground mt-1">
          {used < 10 ? used.toFixed(2) : used < 100 ? used.toFixed(1) : Math.round(used)} / {budget} kg
        </span>
      </div>
    </div>
  );
};

const CarbonBudgetTracker = () => {
  const [budget, setBudget] = useState(() => {
    const saved = localStorage.getItem(BUDGET_KEY);
    return saved ? Number(saved) : 100;
  });
  const [entries, setEntries] = useState<DiaryEntry[]>([]);

  useEffect(() => {
    const allEntries: DiaryEntry[] = JSON.parse(localStorage.getItem(DIARY_KEY) || "[]");
    setEntries(allEntries);

    // Listen for storage changes from other components
    const handleStorage = () => {
      setEntries(JSON.parse(localStorage.getItem(DIARY_KEY) || "[]"));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Re-read diary on visibility change (when switching tabs/views)
  useEffect(() => {
    const handleFocus = () => {
      setEntries(JSON.parse(localStorage.getItem(DIARY_KEY) || "[]"));
    };
    window.addEventListener("focus", handleFocus);
    // Also poll when component mounts or re-renders with interval
    const interval = setInterval(handleFocus, 2000);
    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, []);

  const changeBudget = (value: number) => {
    setBudget(value);
    localStorage.setItem(BUDGET_KEY, String(value));
  };

  const monthEntries = useMemo(() => getMonthEntries(entries), [entries]);
  const monthUsed = useMemo(() => monthEntries.reduce((sum, e) => sum + e.co2e, 0), [monthEntries]);
  const percentage = budget > 0 ? (monthUsed / budget) * 100 : 0;
  const remaining = Math.max(budget - monthUsed, 0);

  const status: "safe" | "warning" | "danger" | "exceeded" =
    percentage >= 100 ? "exceeded" : percentage >= 80 ? "danger" : percentage >= 60 ? "warning" : "safe";

  const currentMonth = new Date().toLocaleString("default", { month: "long", year: "numeric" });

  const statusMessages = {
    safe: { icon: TrendingUp, text: "On track — keep it up!", color: "text-[hsl(var(--grade-a))]" },
    warning: { icon: AlertTriangle, text: "Approaching your limit — be mindful.", color: "text-[hsl(var(--grade-c))]" },
    danger: { icon: AlertTriangle, text: "Almost at your limit!", color: "text-[hsl(var(--grade-d))]" },
    exceeded: { icon: AlertTriangle, text: "Budget exceeded! Consider greener alternatives.", color: "text-[hsl(var(--grade-f))]" },
  };
  const StatusIcon = statusMessages[status].icon;

  return (
    <div className="space-y-6">
      {/* Header with budget selector */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-orbitron text-lg font-bold text-foreground">Carbon Budget</h3>
            <p className="text-xs font-mono text-muted-foreground">{currentMonth}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 font-mono text-xs">
                <Target className="h-3.5 w-3.5" />
                {budget} kg/mo
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              {BUDGET_PRESETS.map((preset) => (
                <DropdownMenuItem
                  key={preset.value}
                  onClick={() => changeBudget(preset.value)}
                  className={`font-mono text-xs cursor-pointer ${budget === preset.value ? "text-primary" : ""}`}
                >
                  <span className="font-semibold">{preset.label}</span>
                  <span className="ml-auto text-muted-foreground">{preset.desc}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Ring Gauge */}
        <div className="flex justify-center">
          <RingGauge percentage={percentage} used={monthUsed} budget={budget} status={status} />
        </div>

        {/* Status Alert */}
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 ${
            status === "safe"
              ? "border-[hsl(var(--grade-a)/0.3)] bg-[hsl(var(--grade-a)/0.05)]"
              : status === "warning"
              ? "border-[hsl(var(--grade-c)/0.3)] bg-[hsl(var(--grade-c)/0.05)]"
              : status === "danger"
              ? "border-[hsl(var(--grade-d)/0.3)] bg-[hsl(var(--grade-d)/0.05)]"
              : "border-[hsl(var(--grade-f)/0.3)] bg-[hsl(var(--grade-f)/0.05)]"
          }`}
        >
          <StatusIcon className={`h-4 w-4 flex-shrink-0 ${statusMessages[status].color}`} />
          <span className={`text-sm font-mono ${statusMessages[status].color}`}>
            {statusMessages[status].text}
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center space-y-1">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Used</p>
          <p className="font-orbitron text-lg font-bold text-foreground">
            {monthUsed < 10 ? monthUsed.toFixed(1) : Math.round(monthUsed)}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground">kg CO₂e</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center space-y-1">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Remaining</p>
          <p className={`font-orbitron text-lg font-bold ${remaining === 0 ? "text-[hsl(var(--grade-f))]" : "text-[hsl(var(--grade-a))]"}`}>
            {remaining < 10 ? remaining.toFixed(1) : Math.round(remaining)}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground">kg CO₂e</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center space-y-1">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Products</p>
          <p className="font-orbitron text-lg font-bold text-foreground">{monthEntries.length}</p>
          <p className="text-[10px] font-mono text-muted-foreground">this month</p>
        </div>
      </div>

      {/* Recent this month */}
      {monthEntries.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <h4 className="text-sm font-semibold text-foreground">This Month's Products</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {[...monthEntries].reverse().map((entry, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-background/50 border border-border/50"
              >
                <span className="text-xs font-mono text-foreground truncate max-w-[60%]">
                  {entry.product}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">
                    {entry.co2e < 1 ? entry.co2e.toFixed(2) : entry.co2e.toFixed(1)} kg
                  </span>
                  <span
                    className="text-[10px] font-orbitron font-bold px-1.5 py-0.5 rounded"
                    style={{
                      color:
                        entry.grade === "A"
                          ? "hsl(var(--grade-a))"
                          : entry.grade === "B"
                          ? "hsl(var(--grade-b))"
                          : entry.grade === "C"
                          ? "hsl(var(--grade-c))"
                          : entry.grade === "D"
                          ? "hsl(var(--grade-d))"
                          : "hsl(var(--grade-f))",
                    }}
                  >
                    {entry.grade}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CarbonBudgetTracker;
