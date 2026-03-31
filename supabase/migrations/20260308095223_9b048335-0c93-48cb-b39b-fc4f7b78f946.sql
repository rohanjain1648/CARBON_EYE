
-- Create searches table for caching product carbon data
CREATE TABLE public.searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name TEXT NOT NULL,
  result JSONB NOT NULL,
  search_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.searches ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can see cached results and the impact wall)
CREATE POLICY "Anyone can read searches" ON public.searches FOR SELECT USING (true);

-- Public insert access (anonymous searches)
CREATE POLICY "Anyone can insert searches" ON public.searches FOR INSERT WITH CHECK (true);

-- Public update for incrementing search count
CREATE POLICY "Anyone can update search count" ON public.searches FOR UPDATE USING (true);

-- Enable realtime for impact wall
ALTER PUBLICATION supabase_realtime ADD TABLE public.searches;

-- Index for fast product name lookups
CREATE INDEX idx_searches_product_name ON public.searches (lower(product_name));
