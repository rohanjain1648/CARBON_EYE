import { formatDistanceToNow, parseISO } from "date-fns";

interface FeedItem {
  product_name: string;
  co2: number;
  created_at: string;
}

interface LiveFeedProps {
  feed: FeedItem[];
}

const LiveFeed = ({ feed }: LiveFeedProps) => {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
        <span className="h-2 w-2 rounded-full bg-primary pulse-dot" />
        Live Feed
      </h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {feed.length === 0 ? (
          <p className="text-xs text-muted-foreground font-mono">No searches yet. Be the first!</p>
        ) : (
          feed.map((item, i) => (
            <div key={i} className="text-xs font-mono text-muted-foreground py-1 border-b border-border/50 last:border-0 flex items-center justify-between gap-2">
              <span>
                Someone looked up <span className="text-foreground">{item.product_name}</span>{" "}
                — <span className="text-primary">{item.co2} kg CO₂</span>
              </span>
              <span className="text-muted-foreground/60 whitespace-nowrap text-[10px]">
                {formatDistanceToNow(parseISO(item.created_at), { addSuffix: true })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LiveFeed;
