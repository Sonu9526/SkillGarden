import { NextResponse } from "next/server";
import { fallbackCurriculum, normalizeCurriculum } from "@/app/lib/curriculum";
import type { CurriculumRequest } from "@/app/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as CurriculumRequest;
  const hobby = body.hobby?.trim();
  const level = body.level;
  const commitment = body.commitment?.trim();

  if (!hobby || !level || !commitment) {
    return NextResponse.json({ error: "Hobby, level, and commitment are required." }, { status: 400 });
  }

  const input = { hobby, level, commitment };

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({
      skill: fallbackCurriculum(input),
      source: "fallback"
    });
  }

  try {
    const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json"
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: [
                  "You are a professional educational curriculum designer for Skillgarden.",
                  "Your job is to design a highly personalized, creative, and engaging 5-stage learning path for the hobby or skill: '" + hobby + "'.",
                  "Return ONLY raw JSON with a stages array matching the schema shape below. Do not wrap the output in markdown formatting code blocks (like ```json) or add any leading/trailing comments.",
                  "Design guidelines:",
                  "- Level of learner: " + level,
                  "- Time commitment: " + commitment,
                  "- Use exactly 5 stages, with 2 milestones per stage, and 3 micro tasks per milestone.",
                  "- Focus on producing highly specific, actionable, and diverse milestone objectives and micro tasks.",
                  "- CRITICAL: Do NOT repeat generic phrases like 'Warm up', 'Do one guided rep', or 'Log reflection' across milestones. Every single task must have a unique, descriptive, and hobby-specific title and description reflecting its exact place in the progression (e.g. 'Practice sketching a 5-value shaded sphere' instead of 'Practice core rep').",
                  "- Ensure tasks are bite-sized, practical, and safe.",
                  "",
                  "Required JSON Schema Shape:",
                  JSON.stringify({
                    stages: [
                      {
                        title: "Creative and descriptive stage title (e.g., 'Foundations of Water & Pigment')",
                        description: "Short summary of what this stage covers",
                        milestones: [
                          {
                            title: "Descriptive milestone title (e.g., 'Mastering the Flat Wash')",
                            objective: "Clear, concrete outcome for this milestone",
                            estimatedSessions: 3,
                            videoQuery: "specific youtube search terms for tutorials",
                            tasks: [
                              {
                                title: "Action-oriented unique task title (e.g., 'Paint three 2x2 inch flat wash squares')",
                                description: "Clear step-by-step instruction for this task",
                                cadence: "daily",
                                points: 10
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  })
                ].join("\n")
              }
            ]
          }
        ]
      })
    }
    );

    if (!response.ok) {
      throw new Error(`Gemini request failed with ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = typeof content === "string" ? JSON.parse(content) : content;

    return NextResponse.json({
      skill: normalizeCurriculum(input, parsed),
      source: "gemini"
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      skill: fallbackCurriculum(input),
      source: "fallback"
    });
  }
}
