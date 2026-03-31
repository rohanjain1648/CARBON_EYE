import { CarbonLifecycle } from "@/types/carbon";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = [
  "hsl(142, 69%, 58%)",
  "hsl(142, 69%, 48%)",
  "hsl(162, 60%, 45%)",
  "hsl(180, 50%, 40%)",
  "hsl(200, 45%, 35%)",
];

const LABELS: Record<keyof CarbonLifecycle, string> = {
  raw_materials: "Raw Materials",
  manufacturing: "Manufacturing",
  transport: "Transport",
  use_phase: "Use Phase",
  end_of_life: "End of Life",
};

const LifecycleChart = ({ lifecycle }: { lifecycle: CarbonLifecycle }) => {
  const data = Object.entries(lifecycle).map(([key, value]) => ({
    name: LABELS[key as keyof CarbonLifecycle],
    value: Number(value.toFixed(2)),
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
          <XAxis type="number" tick={{ fill: "hsl(120, 10%, 55%)", fontSize: 12, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} unit=" kg" />
          <YAxis type="category" dataKey="name" tick={{ fill: "hsl(120, 60%, 97%)", fontSize: 12, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} width={110} />
          <Tooltip
            contentStyle={{
              background: "hsl(120, 15%, 6%)",
              border: "1px solid hsl(120, 10%, 15%)",
              borderRadius: "8px",
              fontFamily: "DM Mono",
              color: "hsl(120, 60%, 97%)",
            }}
            formatter={(value: number) => [`${value} kg CO₂e`, "Emissions"]}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LifecycleChart;
