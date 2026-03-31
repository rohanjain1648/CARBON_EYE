import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CarbonResult } from "@/types/carbon";
import { useToast } from "@/hooks/use-toast";
import { addToDiary } from "@/components/CarbonDiary";

export const useProductSearch = () => {
  const [result, setResult] = useState<CarbonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const search = async (productName: string) => {
    setIsLoading(true);
    setResult(null);

    try {
      // Check cache first
      const { data: cached } = await supabase
        .from("searches")
        .select("*")
        .ilike("product_name", productName)
        .limit(1)
        .maybeSingle();

      if (cached) {
        // Increment search count
        await supabase
          .from("searches")
          .update({ search_count: (cached.search_count || 1) + 1 })
          .eq("id", cached.id);

        setResult(cached.result as unknown as CarbonResult);
        addToDiary(cached.result as unknown as CarbonResult);
        setIsLoading(false);
        return;
      }

      // Call edge function
      const { data, error } = await supabase.functions.invoke("analyze-product", {
        body: { product_name: productName },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const carbonResult = data as CarbonResult;
      setResult(carbonResult);
      addToDiary(carbonResult);

      // Cache in database
      await supabase.from("searches").insert({
        product_name: carbonResult.product || productName,
        result: carbonResult as any,
      });
    } catch (err: any) {
      console.error("Search error:", err);
      toast({
        title: "Analysis failed",
        description: err.message || "Could not analyze this product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { result, isLoading, search };
};
