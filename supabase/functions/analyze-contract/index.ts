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
    const { fileBase64, fileName } = await req.json();
    if (!fileBase64) {
      return new Response(JSON.stringify({ error: "fileBase64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a contract document analyzer. Extract structured data from the uploaded contract document. Analyze the document carefully and extract all relevant fields. For each field, provide a confidence level: "high" if clearly stated, "medium" if inferred, "low" if uncertain or partially visible.`;

    const userPrompt = `Analyze this contract document (${fileName || "contract.pdf"}) and extract the following fields:
- contract_number: The contract ID or number
- contract_date: The date of the contract (format: YYYY-MM-DD)
- amount: The contract amount (numeric value only)
- currency: The currency code (e.g. EUR, PLN, USD)
- contractor: The name of the contractor or vendor
- description: A brief description of the contract scope
- status: Either "Ongoing" or "Completed"
- comments: Any notable comments, especially about phased payments`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              {
                type: "image_url",
                image_url: { url: `data:application/pdf;base64,${fileBase64}` },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_contract_data",
              description: "Extract structured contract data from the document",
              parameters: {
                type: "object",
                properties: {
                  contract_number: {
                    type: "object",
                    properties: {
                      value: { type: "string" },
                      confidence: { type: "string", enum: ["high", "medium", "low"] },
                    },
                    required: ["value", "confidence"],
                  },
                  contract_date: {
                    type: "object",
                    properties: {
                      value: { type: "string", description: "YYYY-MM-DD format" },
                      confidence: { type: "string", enum: ["high", "medium", "low"] },
                    },
                    required: ["value", "confidence"],
                  },
                  amount: {
                    type: "object",
                    properties: {
                      value: { type: "number" },
                      confidence: { type: "string", enum: ["high", "medium", "low"] },
                    },
                    required: ["value", "confidence"],
                  },
                  currency: {
                    type: "object",
                    properties: {
                      value: { type: "string" },
                      confidence: { type: "string", enum: ["high", "medium", "low"] },
                    },
                    required: ["value", "confidence"],
                  },
                  contractor: {
                    type: "object",
                    properties: {
                      value: { type: "string" },
                      confidence: { type: "string", enum: ["high", "medium", "low"] },
                    },
                    required: ["value", "confidence"],
                  },
                  description: {
                    type: "object",
                    properties: {
                      value: { type: "string" },
                      confidence: { type: "string", enum: ["high", "medium", "low"] },
                    },
                    required: ["value", "confidence"],
                  },
                  status: {
                    type: "object",
                    properties: {
                      value: { type: "string", enum: ["Ongoing", "Completed"] },
                      confidence: { type: "string", enum: ["high", "medium", "low"] },
                    },
                    required: ["value", "confidence"],
                  },
                  comments: {
                    type: "object",
                    properties: {
                      value: { type: "string" },
                      confidence: { type: "string", enum: ["high", "medium", "low"] },
                    },
                    required: ["value", "confidence"],
                  },
                },
                required: ["contract_number"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_contract_data" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "No data extracted from document" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ data: extracted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-contract error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
