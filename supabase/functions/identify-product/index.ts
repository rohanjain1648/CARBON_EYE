import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_base64, barcode } = await req.json();

    if (!image_base64 && !barcode) {
      return new Response(
        JSON.stringify({ error: "image_base64 or barcode is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let messages: any[];

    if (barcode) {
      // Barcode lookup via AI
      messages = [
        {
          role: "system",
          content: `You identify products from barcodes. Given a barcode number, return ONLY a JSON object: {"product_name": "the most likely product name", "confidence": "high"|"medium"|"low"}. Use your knowledge of UPC/EAN databases. If you can't identify it, still provide your best guess with "low" confidence. Return ONLY the JSON, no other text.`,
        },
        {
          role: "user",
          content: `Identify the product with this barcode/UPC/EAN: ${barcode}`,
        },
      ];
    } else {
      // Image identification via vision
      messages = [
        {
          role: "system",
          content: `You identify products from images. Look at the image and return ONLY a JSON object: {"product_name": "the specific product name with brand if visible", "confidence": "high"|"medium"|"low"}. Be as specific as possible — include brand, model, size/variant if visible. Return ONLY the JSON, no other text.`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "What product is in this image? Identify it as specifically as possible." },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image_base64}` } },
          ],
        },
      ];
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    let content = aiResponse.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    const result = JSON.parse(content);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("identify-product error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
