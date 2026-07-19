import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const {
      hobby,
      level,
      stageTitle,
      milestoneTitle,
      milestoneObjective,
      message,
      history
    } = await request.json();

    if (!hobby || !level || !milestoneTitle || !message) {
      return NextResponse.json(
        { error: "Hobby, level, milestone, and message are required." },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        response: `[Mock AI Mentor] Since GEMINI_API_KEY is not configured in your environment, I am responding in mock mode. You are working on "${milestoneTitle}" for your "${hobby}" learning journey. Keep practicing, focus on small steps, and make sure to complete your tasks today!`
      });
    }

    const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

    // Format chat history into Gemini contents structure
    const formattedContents = [];

    // System instructions built into the user prompt structure
    const systemPrompt = `You are a supportive, friendly, and expert AI Mentor helping a learner master the hobby/skill: "${hobby}" (Current Level: ${level}).
The learner is currently working on the stage: "${stageTitle}" and specifically the milestone: "${milestoneTitle}".
The objective of this milestone is: "${milestoneObjective}".
Provide professional coaching advice, practical tips, material suggestions, and actionable guidance. Keep answers concise, readable, and structured using markdown. Always maintain an encouraging coaching persona.`;

    // Add history if present
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        formattedContents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        });
      });
    }

    // Add current user prompt
    formattedContents.push({
      role: "user",
      parts: [
        {
          text: `${systemPrompt}\n\nUser Question: ${message}`
        }
      ]
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: formattedContents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini mentor request failed with status ${response.status}`);
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I encountered an issue processing that query. Please try again.";

    return NextResponse.json({ response: replyText });
  } catch (error) {
    console.error("AI Mentor error:", error);
    return NextResponse.json(
      { error: "Failed to fetch response from the AI Mentor. Please try again." },
      { status: 500 }
    );
  }
}
