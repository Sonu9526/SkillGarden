export type SkillLevel = "Beginner" | "Intermediate" | "Advanced";
export type Cadence = "daily" | "weekly";
export type GrowthState = "seed" | "sprout" | "leaf" | "bud" | "bloom";

export type MicroTask = {
  id: string;
  title: string;
  description: string;
  cadence: Cadence;
  points: number;
  completed: boolean;
};

export type Milestone = {
  id: string;
  title: string;
  objective: string;
  estimatedSessions: number;
  videoQuery: string;
  tasks: MicroTask[];
};

export type Stage = {
  id: string;
  title: string;
  description: string;
  milestones: Milestone[];
};

export type SkillGarden = {
  id: string;
  hobby: string;
  level: SkillLevel;
  commitment: string;
  stages: Stage[];
  createdAt: string;
  lastCompletedAt?: string;
};

export type CurriculumRequest = {
  hobby: string;
  level: SkillLevel;
  commitment: string;
};

export type Video = {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  url: string;
  embedUrl: string;
};

export type HivePost = {
  id: string;
  author: string;
  body: string;
  skill: string;
  time: string;
  reactions: {
    cheer: number;
    inspired: number;
    helpful: number;
  };
};

export type Hive = {
  id: string;
  name: string;
  topic: string;
  description: string;
  members: number;
  challenge: string;
  posts: HivePost[];
  category?: string;
  coverImage?: string | null;
  profileImage?: string | null;
  tags?: string[] | string | null;
};
