import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create Supabase client to fetch project data
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch project data for context
    const [projectsRes, timelineRes, cashflowRes] = await Promise.all([
      supabase.from("projects").select("*"),
      supabase.from("timeline_items").select("*"),
      supabase.from("milestone_cashflow").select("*"),
    ]);

    const projects = projectsRes.data || [];
    const timelineItems = timelineRes.data || [];
    const cashflows = cashflowRes.data || [];

    // Calculate summary statistics
    const totalBudget = projects.reduce((sum, p) => sum + (p.total_budget || 0), 0);
    const activeProjects = projects.filter(p => p.status === "Active").length;
    
    // Calculate spending
    const totalForecasted = cashflows.reduce((sum, c) => sum + (c.forecasted || 0), 0);
    const totalContracted = cashflows.reduce((sum, c) => sum + (c.contracted || 0), 0);
    const totalInvoiced = cashflows.reduce((sum, c) => sum + (c.invoiced || 0), 0);
    
    // Find late milestones (due date passed, not done)
    const today = new Date().toISOString().split('T')[0];
    const milestones = timelineItems.filter(t => t.type === "milestone");
    const lateMilestones = milestones.filter(m => 
      m.due_date && m.due_date < today && m.status !== "done"
    );
    
    // Find projects with late milestones
    const lateProjectIds = [...new Set(lateMilestones.map(m => m.project_id))];
    const lateProjects = projects.filter(p => lateProjectIds.includes(p.id));
    
    // Calculate savings (budget - contracted)
    const savings = totalBudget - totalContracted;

    // Build context for AI
    const dataContext = `
## Current Project Data (as of ${new Date().toLocaleDateString()})

### Portfolio Summary
- Total Projects: ${projects.length}
- Active Projects: ${activeProjects}
- Total Budget: €${totalBudget.toLocaleString()}
- Total Forecasted: €${totalForecasted.toLocaleString()}
- Total Contracted: €${totalContracted.toLocaleString()}
- Total Invoiced: €${totalInvoiced.toLocaleString()}
- Potential Savings (Budget - Contracted): €${savings.toLocaleString()}

### Projects Running Late (${lateProjects.length} projects)
${lateProjects.map(p => `- ${p.name} at ${p.site}`).join('\n') || 'None currently'}

### All Projects
${projects.map(p => `- ${p.name}: Budget €${(p.total_budget || 0).toLocaleString()}, Status: ${p.status}, Site: ${p.site || 'N/A'}, Tenant: ${p.tenant || 'N/A'}, Budget Line: ${p.budget_line || 'N/A'}`).join('\n')}

### Milestone Status Summary
- Total Milestones: ${milestones.length}
- Done: ${milestones.filter(m => m.status === "done").length}
- In Progress: ${milestones.filter(m => m.status === "in-progress").length}
- Not Started: ${milestones.filter(m => m.status === "not-started").length}
- Overdue: ${lateMilestones.length}
`;

    const systemPrompt = `You are a CAPEX Project Copilot assistant. You help users understand their capital expenditure projects, budgets, timelines, and spending.

${dataContext}

Instructions:
- Answer questions based on the project data provided above
- Be concise and specific with numbers
- Format currency in EUR (€)
- Highlight any concerning trends or late projects when relevant
- If asked about savings, compare budget vs contracted amounts
- If asked about spending, use invoiced amounts for actual spend
- For CAPEX questions, sum up relevant project budgets`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Copilot error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
