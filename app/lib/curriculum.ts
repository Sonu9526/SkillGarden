import type { CurriculumRequest, SkillGarden, SkillLevel, Stage } from "./types";

const stageNames = ["Root", "Stem", "Leaves", "Bud", "Bloom"];
const stageDescriptions = [
  "Set up the habit, tools, and smallest useful motions.",
  "Build repeatable basics with short practice loops.",
  "Connect fundamentals into visible mini-projects.",
  "Add feedback, refinement, and personal style.",
  "Create a polished capstone and a sustainable next path."
];

const levelFocus: Record<SkillLevel, string[]> = {
  Beginner: ["orientation", "basic vocabulary", "guided reps", "tiny project"],
  Intermediate: ["diagnosis", "targeted drills", "composition", "feedback loop"],
  Advanced: ["refinement", "constraints", "performance", "portfolio"]
};

// Highly specific, diverse fallback tasks to avoid repetitive content
const fallbackTasksByStage: Record<number, { title: string; description: string }[]> = {
  0: [
    { title: "Set up dedicated workspace", description: "Clear your desk, lay out your physical tools or log in to your software environments." },
    { title: "Review introductory reference guide", description: "Watch a 5-minute setup guide and familiarize yourself with key vocabulary." },
    { title: "Perform your first simple 5-minute drill", description: "Execute the smallest possible movement, stroke, or code print." }
  ],
  1: [
    { title: "Establish a baseline technique repetition", description: "Practice reproducing the primary core shape or muscle memory drill 5 times." },
    { title: "10-minute continuous active loop", description: "Focus purely on smooth rhythm, pacing, and removing tension." },
    { title: "Identify initial mistakes or friction points", description: "Take a note of what felt hardest and what felt most natural." }
  ],
  2: [
    { title: "Synthesize elements into a micro-project", description: "Combine two basic concepts into a complete mini-creation." },
    { title: "Perform side-by-side comparison check", description: "Compare your mini-project with an expert reference to check your form." },
    { title: "Share your milestone progress win", description: "Tell your hive about your completion and get constructive feedback." }
  ],
  3: [
    { title: "Targeted weak-point isolation drill", description: "Perform a focused 15-minute exercise exclusively addressing your biggest obstacle." },
    { title: "Practice under varied constraint rules", description: "Change pace, use a different tool, or introduce a timer to challenge your form." },
    { title: "Examine details for final refinement", description: "Inspect your work closely and clean up any loose edges or rough spots." }
  ],
  4: [
    { title: "Compile and execute capstone project", description: "Create your final showpiece demonstrating everything you have practiced." },
    { title: "Self-review and document overall progress", description: "Compare your capstone work with Stage 1 notes to see how far you have grown." },
    { title: "Establish long-term sustainable schedule", description: "Define a simple weekly maintenance plan to keep your new skill fresh." }
  ]
};

export function fallbackCurriculum(input: CurriculumRequest): SkillGarden {
  const noun = input.hobby.trim();
  const stages: Stage[] = stageNames.map((stageName, stageIndex) => {
    const tasksTemplate = fallbackTasksByStage[stageIndex] || fallbackTasksByStage[0];
    return {
      id: crypto.randomUUID(),
      title: `${stageName}: ${stageTitle(noun, stageIndex)}`,
      description: stageDescriptions[stageIndex],
      milestones: [0, 1].map((offset) => {
        const milestoneIndex = stageIndex * 2 + offset;
        const focus = levelFocus[input.level][Math.min(offset + (stageIndex % 3), 3)];
        return {
          id: crypto.randomUUID(),
          title: `${capitalize(focus)} in ${noun}`,
          objective: `Make ${focus} concrete through a short ${noun} practice cycle matched to ${input.commitment}.`,
          estimatedSessions: stageIndex < 2 ? 2 : 3,
          videoQuery: `${noun} ${input.level.toLowerCase()} ${focus} tutorial`,
          tasks: tasksTemplate.map((task, taskIndex) => ({
            id: crypto.randomUUID(),
            title: `${task.title} (${noun})`,
            description: `${task.description} Keep it under ${input.commitment}.`,
            cadence: taskIndex === 2 ? "weekly" : "daily",
            points: taskIndex === 2 ? 18 : 10,
            completed: false
          }))
        };
      })
    };
  });

  return {
    id: crypto.randomUUID(),
    hobby: noun,
    level: input.level,
    commitment: input.commitment,
    stages,
    createdAt: new Date().toISOString()
  };
}

export function normalizeCurriculum(
  input: CurriculumRequest,
  generated: unknown
): SkillGarden {
  if (!generated || typeof generated !== "object") {
    return fallbackCurriculum(input);
  }

  const candidate = generated as Partial<SkillGarden>;
  const stages = Array.isArray(candidate.stages) ? candidate.stages : [];
  if (stages.length === 0) {
    return fallbackCurriculum(input);
  }

  return {
    id: crypto.randomUUID(),
    hobby: input.hobby,
    level: input.level,
    commitment: input.commitment,
    createdAt: new Date().toISOString(),
    stages: stages.slice(0, 5).map((stage, stageIndex) => ({
      id: crypto.randomUUID(),
      title: safeText(stage.title, stageNames[stageIndex] ?? "Stage"),
      description: safeText(stage.description, stageDescriptions[stageIndex] ?? "Practice with intention."),
      milestones: (Array.isArray(stage.milestones) ? stage.milestones : [])
        .slice(0, 3)
        .map((milestone, milestoneIndex) => ({
          id: crypto.randomUUID(),
          title: safeText(milestone.title, `${input.hobby} milestone ${milestoneIndex + 1}`),
          objective: safeText(milestone.objective, `Practice ${input.hobby} with a clear outcome.`),
          estimatedSessions:
            typeof milestone.estimatedSessions === "number" ? milestone.estimatedSessions : 2,
          videoQuery: safeText(
            milestone.videoQuery,
            `${input.hobby} ${input.level.toLowerCase()} tutorial`
          ),
          tasks: (Array.isArray(milestone.tasks) ? milestone.tasks : [])
            .slice(0, 4)
            .map((task, taskIndex) => ({
              id: crypto.randomUUID(),
              title: safeText(task.title, `Practice task ${taskIndex + 1}`),
              description: safeText(task.description, `Spend one focused session on ${input.hobby}.`),
              cadence: task.cadence === "weekly" ? "weekly" : "daily",
              points: typeof task.points === "number" ? task.points : 10,
              completed: false
            }))
        }))
    }))
  };
}

function stageTitle(hobby: string, index: number) {
  const titles = [
    `Start ${hobby}`,
    `Practice the Core`,
    `Make Small Work`,
    `Refine with Feedback`,
    `Share a Finished Piece`
  ];
  return titles[index] ?? `Grow ${hobby}`;
}

function taskTitle(hobby: string, focus: string, index: number) {
  const titles = [
    `Warm up ${focus}`,
    `Do one guided ${hobby} rep`,
    `Log a tiny reflection`
  ];
  return titles[index] ?? `Practice ${hobby}`;
}

function taskDescription(hobby: string, commitment: string, milestoneIndex: number, taskIndex: number) {
  const verbs = ["Prepare your space and repeat the smallest useful motion.", "Follow one example, then try it from memory.", "Write what felt easier and what should be repeated next."];
  return `${verbs[taskIndex]} Keep it inside ${commitment}; this is session ${milestoneIndex + 1} for ${hobby}.`;
}

function safeText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
