import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a carbon footprint expert. For any product given, return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "product": "canonical product name",
  "category": "product category",
  "total_co2e_kg": number,
  "confidence": "high"|"medium"|"low",
  "lifecycle": {
    "raw_materials": number,
    "manufacturing": number,
    "transport": number,
    "use_phase": number,
    "end_of_life": number
  },
  "grade": "A"|"B"|"C"|"D"|"F",
  "category_average_co2e_kg": number,
  "equivalents": {
    "driving_km": number,
    "trees_year": number,
    "water_litres": number,
    "flight_percent": number
  },
  "key_insight": "one powerful sentence about the biggest emission driver",
  "alternatives": [
    {
      "name": "product name",
      "co2e_kg": number,
      "reduction_percent": number,
      "reason": "why it's greener in one sentence"
    }
  ]
}

Rules:
- lifecycle values must sum to total_co2e_kg
- Provide exactly 3 alternatives
- Grade: A (<2kg), B (2-10kg), C (10-50kg), D (50-200kg), F (>200kg)
- equivalents.flight_percent is % of a London to NYC economy flight (~550kg CO₂)
- Use IPCC lifecycle data, academic LCA studies, and industry reports as basis
- If uncertain, provide best estimate and set confidence to "low"
- Return ONLY the JSON object, no other text`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { product_name } = await req.json();
    if (!product_name) {
      return new Response(JSON.stringify({ error: "product_name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Analyze the carbon footprint of: "${product_name}"` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    let content = aiResponse.choices?.[0]?.message?.content || "";

    // Strip markdown code fences if present
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    const result = JSON.parse(content);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-product error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
