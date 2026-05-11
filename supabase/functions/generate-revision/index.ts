import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Recall5 AI, an elite study coach. You produce concise, exam-ready 5-minute revisions. Be precise, structured, and ruthless about cutting fluff. Use clear academic tone. When formulas are involved, render them in plain text or LaTeX-friendly notation.`;

const tool = {
  type: "function",
  function: {
    name: "build_revision",
    description: "Return a structured 5-minute revision pack",
    parameters: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description:
            "A markdown 5-minute revision summary (300-500 words) covering the chapter clearly with headings and bullets.",
        },
        key_concepts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              term: { type: "string" },
              definition: { type: "string" },
            },
            required: ["term", "definition"],
          },
        },
        formulas: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              expression: { type: "string" },
              note: { type: "string" },
            },
            required: ["name", "expression"],
          },
        },
        rapid_fire: {
          type: "array",
          description: "8-12 short Q/A pairs for rapid recall",
          items: {
            type: "object",
            properties: {
              q: { type: "string" },
              a: { type: "string" },
            },
            required: ["q", "a"],
          },
        },
        exam_questions: {
          type: "array",
          description: "5-7 likely exam questions, mix of short and long",
          items: { type: "string" },
        },
      },
      required: ["summary", "key_concepts", "formulas", "rapid_fire", "exam_questions"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // GEMINI API KEY
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY missing");
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { sessionId, subject, chapter, notes } = await req.json();

    if (!sessionId || !subject || !chapter) {
      return new Response(
        JSON.stringify({
          error: "sessionId, subject and chapter are required",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // PREMIUM PROMPT
    const prompt = `
You are Recall5 AI, an elite AI study assistant.

Generate a structured JSON response for:
Subject: ${subject}
Chapter: ${chapter}

Student Notes:
${notes || "No notes provided"}

Return STRICT JSON ONLY in this format:

{
  "summary": "Concise 5-minute revision summary",
  "key_concepts": [
    {
      "term": "Concept Name",
      "definition": "Definition"
    }
  ],
  "formulas": [
    {
      "name": "Formula Name",
      "expression": "Formula",
      "note": "Short explanation"
    }
  ],
  "rapid_fire": [
    {
      "q": "Question",
      "a": "Answer"
    }
  ],
  "exam_questions": [
    "Question 1",
    "Question 2"
  ]
}

Requirements:
- Summary should be concise but high quality
- Key concepts should be exam-focused
- Rapid fire should contain 8-10 Q&A
- Exam questions should be realistic
- Use markdown formatting where useful
- No explanation outside JSON
`;

    const aiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      },
    );

    if (!aiRes.ok) {
      const errorText = await aiRes.text();

      console.error(errorText);

      throw new Error("Gemini API request failed");
    }

    const aiJson = await aiRes.json();

    const raw = aiJson?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!raw) {
      throw new Error("No AI response returned");
    }

    // CLEAN JSON RESPONSE
    const cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    const { data: inserted, error: insErr } = await supabase
      .from("revisions")
      .insert({
        session_id: sessionId,
        subject,
        chapter,
        input_text: notes || null,
        summary: parsed.summary,
        key_concepts: parsed.key_concepts,
        formulas: parsed.formulas,
        rapid_fire: parsed.rapid_fire,
        exam_questions: parsed.exam_questions,
      })
      .select()
      .single();
    if (insErr) throw insErr;

    // Update streak / total
    const today = new Date().toISOString().slice(0, 10);
    const { data: streak } = await supabase
      .from("streaks")
      .select("*")
      .eq("session_id", sessionId)
      .maybeSingle();

    let nextStreak = 1;
    if (streak?.last_active) {
      const last = new Date(streak.last_active);
      const diff = Math.floor((new Date(today).getTime() - last.getTime()) / 86400000);
      if (diff === 0) nextStreak = streak.current_streak;
      else if (diff === 1) nextStreak = streak.current_streak + 1;
      else nextStreak = 1;
    }

    await supabase.from("streaks").upsert({
      session_id: sessionId,
      current_streak: nextStreak,
      last_active: today,
      total_revisions: (streak?.total_revisions || 0) + 1,
      updated_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ revision: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-revision error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
