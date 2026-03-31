import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import Fuse from "fuse.js";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

const SearchBar = ({ onSearch, isLoading }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const cachedProducts = useRef<string[]>([]);
  const fuseRef = useRef<Fuse<string> | null>(null);

  // Load all cached product names once
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("searches")
        .select("product_name")
        .order("search_count", { ascending: false })
        .limit(200);
      if (data) {
        cachedProducts.current = data.map((d: any) => d.product_name);
        fuseRef.current = new Fuse(cachedProducts.current, {
          threshold: 0.4,
          distance: 100,
        });
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (query.length < 2 || !fuseRef.current) {
      setSuggestions([]);
      return;
    }
    const results = fuseRef.current.search(query, { limit: 5 });
    setSuggestions(results.map((r) => r.item));
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (s: string) => {
    setQuery(s);
    setShowSuggestions(false);
    onSearch(s);
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl mx-auto">
      <div className="relative group">
        <div className="absolute -inset-0.5 rounded-xl gradient-border opacity-50 group-focus-within:opacity-100 transition-opacity blur-sm" />
        <div className="relative flex items-center rounded-xl bg-card border border-border overflow-hidden">
          <div className="pl-5 text-muted-foreground">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </div>
          <Input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder='Search any product... "iPhone 15", "Nike Air Max", "Nescafé Gold"'
            className="border-0 bg-transparent text-lg h-14 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 font-mono"
            disabled={isLoading}
          />
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 rounded-lg border border-border bg-card shadow-xl overflow-hidden">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={() => selectSuggestion(s)}
              className="w-full text-left px-5 py-3 text-sm font-mono hover:bg-accent transition-colors text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </form>
  );
};

export default SearchBar;
