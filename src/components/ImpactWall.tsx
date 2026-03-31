import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";
import { toast } from "@/hooks/use-toast";
import GlobalStats from "./impact-wall/GlobalStats";
import TrendChart from "./impact-wall/TrendChart";
import LiveFeed from "./impact-wall/LiveFeed";
import Leaderboard from "./impact-wall/Leaderboard";

interface FeedItem {
  product_name: string;
  co2: number;
  created_at: string;
}

interface RankedProduct {
  product_name: string;
  co2: number;
  search_count: number;
}

const ImpactWall = () => {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [totalEmissions, setTotalEmissions] = useState(0);
  const [totalSearches, setTotalSearches] = useState(0);
  const [leaderboard, setLeaderboard] = useState<{ product_name: string; search_count: number }[]>([]);
  const [carbonRanking, setCarbonRanking] = useState<RankedProduct[]>([]);
  const [allSearches, setAllSearches] = useState<{ co2: number; search_count: number; created_at: string }[]>([]);

  const fetchData = async () => {
    const { data: recent } = await supabase
      .from("searches")
      .select("product_name, result, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (recent) {
      setFeed(
        recent.map((r: any) => ({
          product_name: r.product_name,
          co2: (r.result as any)?.total_co2e_kg ?? 0,
          created_at: r.created_at,
        }))
      );
    }

    const { data: stats } = await supabase.from("searches").select("product_name, result, search_count, created_at");
    if (stats) {
      setTotalSearches(stats.reduce((sum: number, s: any) => sum + (s.search_count || 1), 0));
      setTotalEmissions(
        stats.reduce((sum: number, s: any) => sum + ((s.result as any)?.total_co2e_kg ?? 0) * (s.search_count || 1), 0)
      );

      setCarbonRanking(
        stats
          .map((s: any) => ({
            product_name: s.product_name,
            co2: (s.result as any)?.total_co2e_kg ?? 0,
            search_count: s.search_count || 1,
          }))
          .sort((a: RankedProduct, b: RankedProduct) => b.co2 - a.co2)
          .slice(0, 10)
      );

      setAllSearches(
        stats.map((s: any) => ({
          co2: ((s.result as any)?.total_co2e_kg ?? 0) * (s.search_count || 1),
          search_count: s.search_count || 1,
          created_at: s.created_at,
        }))
      );
    }

    const { data: top } = await supabase
      .from("searches")
      .select("product_name, search_count")
      .order("search_count", { ascending: false })
      .limit(10);
    if (top) setLeaderboard(top as any);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("impact-wall")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "searches" }, () => {
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Milestone confetti + toast
  const prevMilestone = useRef(0);
  useEffect(() => {
    if (totalEmissions === 0) return;
    const currentMilestone = Math.floor(totalEmissions / 1000);
    if (currentMilestone > prevMilestone.current && prevMilestone.current !== 0) {
      const milestoneValue = currentMilestone * 1000;
      const end = Date.now() + 2000;
      const colors = ["#4ade80", "#86efac", "#22c55e", "#a3e635"];
      (function frame() {
        confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.6 }, colors });
        confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.6 }, colors });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
      toast({
        title: "🎉 Community Milestone!",
        description: `Community hit ${milestoneValue.toLocaleString()} kg CO₂ uncovered!`,
      });
    }
    prevMilestone.current = currentMilestone;
  }, [totalEmissions]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <GlobalStats totalEmissions={totalEmissions} totalSearches={totalSearches} />
      <TrendChart allSearches={allSearches} />
      <div className="grid md:grid-cols-2 gap-6">
        <LiveFeed feed={feed} />
        <Leaderboard carbonRanking={carbonRanking} leaderboard={leaderboard} />
      </div>
    </div>
  );
};

export default ImpactWall;
