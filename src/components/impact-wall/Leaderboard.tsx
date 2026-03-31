import { useState } from "react";
import { Activity, Flame } from "lucide-react";

interface RankedProduct {
  product_name: string;
  co2: number;
  search_count: number;
}

interface LeaderboardProps {
  carbonRanking: RankedProduct[];
  leaderboard: { product_name: string; search_count: number }[];
}

const Leaderboard = ({ carbonRanking, leaderboard }: LeaderboardProps) => {
  const [rankTab, setRankTab] = useState<"searches" | "carbon">("carbon");
  const maxCo2 = carbonRanking.length > 0 ? carbonRanking[0].co2 : 1;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setRankTab("carbon")}
          className={`text-xs font-mono px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
            rankTab === "carbon"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Flame className="h-3.5 w-3.5" />
          By Carbon
        </button>
        <button
          onClick={() => setRankTab("searches")}
          className={`text-xs font-mono px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
            rankTab === "searches"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          Most Searched
        </button>
      </div>

      {rankTab === "carbon" ? (
        <div className="space-y-2.5">
          {carbonRanking.map((item, i) => (
            <div key={item.product_name} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">
                  <span className="text-primary mr-2">#{i + 1}</span>
                  {item.product_name}
                </span>
                <span className="text-foreground font-semibold">{item.co2} kg</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/70 transition-all"
                  style={{ width: `${(item.co2 / maxCo2) * 100}%` }}
                />
              </div>
            </div>
          ))}
          {carbonRanking.length === 0 && (
            <p className="text-xs text-muted-foreground font-mono">No data yet.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((item, i) => (
            <div key={item.product_name} className="flex items-center justify-between text-xs font-mono py-1 border-b border-border/50 last:border-0">
              <span className="text-muted-foreground">
                <span className="text-primary mr-2">#{i + 1}</span>
                {item.product_name}
              </span>
              <span className="text-foreground">{item.search_count}×</span>
            </div>
          ))}
          {leaderboard.length === 0 && (
            <p className="text-xs text-muted-foreground font-mono">No data yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
