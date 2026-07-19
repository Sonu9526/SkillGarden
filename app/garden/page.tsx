"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  Bell,
  Check,
  ChevronRight,
  Flame,
  Flower2,
  Leaf,
  Loader2,
  MessageCircle,
  Play,
  Plus,
  Send,
  Sparkles,
  Sprout,
  Trophy,
  Trash2,
  UserCheck,
  UserPlus,
  Users
} from "lucide-react";
import { Plant } from "@/app/components/Plant";
import type {
  CurriculumRequest,
  GrowthState,
  Hive,
  HivePost,
  SkillGarden,
  SkillLevel,
  Video
} from "@/app/lib/types";

type HiveState = {
  hives: Hive[];
};

type ReactionKind = keyof HivePost["reactions"];

const levels: SkillLevel[] = ["Beginner", "Intermediate", "Advanced"];
const commitments = ["15 min/day", "30 min/day", "3x/week", "Weekend blocks"];

export default function Home() {
  const [profile, setProfile] = useState<{ email: string; name: string; picture: string | null }>({
    email: "",
    name: "",
    picture: null
  });
  const [skills, setSkills] = useState<SkillGarden[]>([]);
  const [activeSkillId, setActiveSkillId] = useState<string>("");
  const [activeMilestoneId, setActiveMilestoneId] = useState<string>("");
  const [form, setForm] = useState<CurriculumRequest>({
    hobby: "Watercolor painting",
    level: "Beginner",
    commitment: "15 min/day"
  });
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<string>("");
  const [videos, setVideos] = useState<Video[]>([]);
  const [videoLoading, setVideoLoading] = useState(false);
  const [hives, setHives] = useState<Hive[]>([]);
  const [selectedHiveId, setSelectedHiveId] = useState<string>("");
  const [joinedHiveIds, setJoinedHiveIds] = useState<string[]>([]);
  const [postDraft, setPostDraft] = useState("");

  // Quick Log states
  const [quickLogText, setQuickLogText] = useState("");
  const [selectedLogHiveId, setSelectedLogHiveId] = useState("");
  const [logSuccess, setLogSuccess] = useState(false);

  // Notification states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  // AI Mentor Chat states
  const [showMentor, setShowMentor] = useState(false);
  const [mentorMessages, setMentorMessages] = useState<{ role: "user" | "mentor"; text: string }[]>([]);
  const [mentorInput, setMentorInput] = useState("");
  const [mentorLoading, setMentorLoading] = useState(false);

  useEffect(() => {
    // Auth guard redirect
    const auth = window.localStorage.getItem("bloom-authenticated");
    if (auth !== "true") {
      window.location.href = "/login";
      return;
    }

    const email = window.localStorage.getItem("bloom-user-email") ?? "";
    const name = window.localStorage.getItem("bloom-user-name") ?? email.split("@")[0];
    const picture = window.localStorage.getItem("bloom-user-picture");
    setProfile({ email, name, picture });

    const saved = window.localStorage.getItem("bloom-skills");
    if (saved) {
      const parsed = JSON.parse(saved) as SkillGarden[];
      setSkills(parsed);
      setActiveSkillId(parsed[0]?.id ?? "");
      setActiveMilestoneId(parsed[0]?.stages[0]?.milestones[0]?.id ?? "");
    }

    // Fetch hives and user memberships
    fetch(`/api/hives?email=${encodeURIComponent(email)}`)
      .then((response) => response.json())
      .then((data) => {
        setHives(data.hives ?? []);
        setJoinedHiveIds(data.joinedHiveIds ?? []);
        setSelectedHiveId((current) => current || data.hives?.[0]?.id || "");
        
        const firstJoined = data.joinedHiveIds?.[0];
        if (firstJoined) {
          setSelectedLogHiveId(firstJoined);
        }
      })
      .catch(() => setHives([]));

    // Fetch notifications
    fetch(`/api/notifications?email=${encodeURIComponent(email)}`)
      .then(res => res.json())
      .then(data => {
        setNotifications(data.notifications || []);
      })
      .catch(() => {});
  }, []);

  const activeSkill = skills.find((skill) => skill.id === activeSkillId) ?? skills[0];
  const activeMilestone = useMemo(() => {
    if (!activeSkill) return undefined;
    return (
      activeSkill.stages
        .flatMap((stage) => stage.milestones)
        .find((milestone) => milestone.id === activeMilestoneId) ??
      activeSkill.stages[0]?.milestones[0]
    );
  }, [activeMilestoneId, activeSkill]);

  // Update AI Mentor welcome message when active milestone changes
  useEffect(() => {
    if (activeSkill && activeMilestone) {
      setMentorMessages([
        {
          role: "mentor",
          text: `Hi there! I'm your expert AI Mentor for **${activeSkill.hobby}**. I see you are currently focused on the milestone: **${activeMilestone.title}** (Objective: ${activeMilestone.objective}). How can I help you complete your tasks or practice today?`
        }
      ]);
    } else {
      setMentorMessages([
        {
          role: "mentor",
          text: "Hi there! I'm your SkillGarden AI Mentor. I can help you choose a skill to start with, set up your learning path, or guide you through your learning journey. Ask me anything to get started!"
        }
      ]);
    }
  }, [activeSkill?.id, activeMilestone?.id]);

  useEffect(() => {
    window.localStorage.setItem("bloom-skills", JSON.stringify(skills));
  }, [skills]);

  useEffect(() => {
    if (!activeMilestone) return;
    setVideoLoading(true);
    fetch(`/api/videos?q=${encodeURIComponent(activeMilestone.videoQuery)}`)
      .then((response) => response.json())
      .then((data) => setVideos(data.videos ?? []))
      .catch(() => setVideos([]))
      .finally(() => setVideoLoading(false));
  }, [activeMilestone]);

  async function createSkill() {
    setLoading(true);
    setSource("");
    try {
      const response = await fetch("/api/curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      const nextSkill = data.skill as SkillGarden;
      setSkills((current) => [nextSkill, ...current]);
      setActiveSkillId(nextSkill.id);
      setActiveMilestoneId(nextSkill.stages[0]?.milestones[0]?.id ?? "");
      setSource(data.source ?? "");
    } finally {
      setLoading(false);
    }
  }

  function toggleTask(taskId: string) {
    const completedAt = new Date().toISOString();
    setSkills((current) =>
      current.map((skill) => {
        if (skill.id !== activeSkill?.id) return skill;
        return {
          ...skill,
          lastCompletedAt: completedAt,
          stages: skill.stages.map((stage) => ({
            ...stage,
            milestones: stage.milestones.map((milestone) => ({
              ...milestone,
              tasks: milestone.tasks.map((task) =>
                task.id === taskId ? { ...task, completed: !task.completed } : task
              )
            }))
          }))
        };
      })
    );
  }

  function deleteSkill(skillId: string) {
    setSkills((current) => {
      const remaining = current.filter((skill) => skill.id !== skillId);

      if (skillId === activeSkillId) {
        const nextSkill = remaining[0];
        setActiveSkillId(nextSkill?.id ?? "");
        setActiveMilestoneId(nextSkill?.stages[0]?.milestones[0]?.id ?? "");
        if (!nextSkill) {
          setVideos([]);
        }
      }

      return remaining;
    });
  }

  async function toggleHiveMembership(hiveId: string) {
    if (!profile.email) return;

    try {
      const res = await fetch("/api/hives/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile.email, hiveId })
      });
      const data = await res.json();
      
      if (res.ok) {
        // Refetch hives to get updated member count and lists
        const hivesRes = await fetch(`/api/hives?email=${encodeURIComponent(profile.email)}`);
        const hivesData = await hivesRes.json();
        setHives(hivesData.hives);
        setJoinedHiveIds(hivesData.joinedHiveIds);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function addHivePost() {
    const body = postDraft.trim();
    if (!selectedHive || !body || !profile.email) return;

    try {
      const res = await fetch("/api/hives/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile.email, hiveId: selectedHive.id, body })
      });
      
      if (res.ok) {
        setPostDraft("");
        // Refetch hives to see the new post
        const hivesRes = await fetch(`/api/hives?email=${encodeURIComponent(profile.email)}`);
        const hivesData = await hivesRes.json();
        setHives(hivesData.hives);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function reactToHivePost(postId: string, reaction: ReactionKind) {
    if (!selectedHive || !profile.email) return;

    try {
      const res = await fetch("/api/hives/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile.email, postId, reaction })
      });

      if (res.ok) {
        // Refetch hives to see updated reaction counts
        const hivesRes = await fetch(`/api/hives?email=${encodeURIComponent(profile.email)}`);
        const hivesData = await hivesRes.json();
        setHives(hivesData.hives);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleQuickLogSubmit() {
    if (!profile.email || !quickLogText.trim() || !selectedLogHiveId) return;

    try {
      const res = await fetch("/api/hives/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: profile.email,
          hiveId: selectedLogHiveId,
          body: `🚀 Achievement Log: ${quickLogText.trim()}`
        })
      });
      if (res.ok) {
        setQuickLogText("");
        setLogSuccess(true);
        setTimeout(() => setLogSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function markNotificationsRead() {
    if (!profile.email) return;
    try {
      const res = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile.email })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSendMentorMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!mentorInput.trim() || mentorLoading) return;

    const userMsg = mentorInput.trim();
    const currentMessages = [...mentorMessages, { role: "user" as const, text: userMsg }];
    setMentorMessages(currentMessages);
    setMentorInput("");
    setMentorLoading(true);

    try {
      const hobby = activeSkill ? activeSkill.hobby : "General Learning";
      const level = activeSkill ? activeSkill.level : "Beginner";
      const stage = activeSkill 
        ? activeSkill.stages.find(s => s.milestones.some(m => m.id === activeMilestoneId))
        : null;
      const stageTitle = stage?.title || "Getting Started";
      const milestoneTitle = activeMilestone ? activeMilestone.title : "Choosing a Skill";
      const milestoneObjective = activeMilestone 
        ? activeMilestone.objective 
        : "Explore hobbies, set up a learning path, and start planting your first skill.";

      const res = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hobby,
          level,
          stageTitle,
          milestoneTitle,
          milestoneObjective,
          message: userMsg,
          history: currentMessages.slice(1, -1).map(m => ({ role: m.role, text: m.text }))
        })
      });

      const data = await res.json();
      if (res.ok && data.response) {
        setMentorMessages(prev => [...prev, { role: "mentor", text: data.response }]);
      } else {
        setMentorMessages(prev => [
          ...prev,
          { role: "mentor", text: data.error || "I'm sorry, I couldn't connect to my knowledge base right now. Please try again." }
        ]);
      }
    } catch (err) {
      console.error(err);
      setMentorMessages(prev => [
        ...prev,
        { role: "mentor", text: "I'm sorry, I encountered a communication error. Please try again." }
      ]);
    } finally {
      setMentorLoading(false);
    }
  }

  const overall = activeSkill ? getProgress(activeSkill) : 0;
  const growth = getGrowthState(overall);
  const wilted = activeSkill ? isWilted(activeSkill) : false;
  const recommendedHive = getRecommendedHive(hives, activeSkill?.hobby);
  const selectedHive =
    hives.find((currentHive) => currentHive.id === selectedHiveId) ?? recommendedHive ?? hives[0];
  const joinedSelectedHive = selectedHive ? joinedHiveIds.includes(selectedHive.id) : false;

  useEffect(() => {
    if (!activeSkill || hives.length === 0) return;
    const matchingHive = getRecommendedHive(hives, activeSkill.hobby);
    if (matchingHive) {
      setSelectedHiveId(matchingHive.id);
    }
  }, [activeSkill?.id, activeSkill?.hobby, hives]);

  return (
    <div className="min-h-screen bg-surface overflow-x-hidden text-on-surface text-base">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-8 md:px-12 h-[72px] bg-surface/90 backdrop-blur-md border-b border-outline-variant/30 shadow-sm">
        <div className="flex items-center gap-10">
          <Link href="/" className="font-serif text-3xl md:text-4xl font-bold text-primary cursor-pointer tracking-tight">
            Bloom
          </Link>
          <div className="hidden md:flex gap-6 items-center text-base">
            <Link className="text-primary font-bold border-b-2 border-primary pb-1 cursor-pointer transition-colors duration-300" href="/garden">
              Garden
            </Link>
            <Link className="text-on-surface-variant hover:text-primary transition-colors duration-300 cursor-pointer" href="/discover">
              Hives
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications dropdown */}
          {profile.email && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) markNotificationsRead();
                }}
                className="relative p-2 rounded-full hover:bg-black/5 text-primary transition cursor-pointer flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[24px]">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[8px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-outline-variant/20 bg-white p-3 shadow-xl z-50 animate-fade-in text-xs max-h-96 overflow-y-auto">
                  <h3 className="font-bold text-sm text-primary mb-2 border-b border-outline-variant/10 pb-1">Notifications</h3>
                  {notifications.length === 0 ? (
                    <p className="text-on-surface-variant text-center py-4">No notifications yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map(n => (
                        <Link
                          key={n.id}
                          href={`/hives/${n.hiveId}`}
                          className={`flex items-start gap-2.5 p-2 rounded-xl transition ${
                            n.read ? "hover:bg-black/5" : "bg-secondary/5 hover:bg-secondary/10"
                          }`}
                          onClick={() => setShowNotifications(false)}
                        >
                          {n.senderImage ? (
                            <img src={n.senderImage} alt={n.senderName} className="w-7 h-7 rounded-full border border-outline-variant/10 object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-secondary-container/40 text-primary font-bold flex items-center justify-center text-[9px] shrink-0">
                              {n.senderName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-primary leading-normal">
                              <span className="font-bold">{n.senderName}</span>{" "}
                              {n.type === "LIKE" && "reacted to your post"}
                              {n.type === "COMMENT" && "commented on your post"}
                              {n.type === "REPLY" && "replied to your comment"}
                            </p>
                            <span className="text-[9px] text-on-surface-variant block mt-0.5">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* User profile picture */}
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/10">
            {profile.picture ? (
              <img src={profile.picture} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-secondary-container text-primary font-bold flex items-center justify-center text-xs">
                {profile.name?.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          
          {profile.email && (
            <button
              onClick={() => {
                window.localStorage.removeItem("bloom-authenticated");
                window.localStorage.removeItem("bloom-user-email");
                window.localStorage.removeItem("bloom-user-name");
                window.localStorage.removeItem("bloom-user-picture");
                window.location.href = "/login";
              }}
              className="text-label-sm font-bold text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              Log out
            </button>
          )}
        </div>
      </nav>

      <div className="flex pt-[72px] h-screen overflow-hidden">
        {/* SideNavBar (Left) */}
        <aside className="h-full w-80 flex flex-col p-6 bg-surface-container-low border-r border-outline-variant/30 custom-scrollbar overflow-y-auto shrink-0">
          <div className="mb-8">
            <h2 className="font-serif text-2xl font-bold text-primary mb-1">Skillgarden</h2>
            <p className="text-on-surface-variant text-sm">Nurture your growth</p>
          </div>

          {/* Start a Plant Form */}
          <div className="watercolor-card rounded-xl p-5 mb-8">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-4">Start a Plant</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm block mb-1.5 text-on-surface-variant font-medium">Skill Name</label>
                <input
                  className="w-full bg-surface-bright border border-outline-variant/30 focus:ring-2 focus:ring-secondary/30 focus:border-secondary rounded-lg text-base placeholder:text-outline px-3 py-2.5 text-primary"
                  placeholder="e.g. Watercolor painting"
                  type="text"
                  value={form.hobby}
                  onChange={(e) => setForm({ ...form, hobby: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm block mb-1.5 text-on-surface-variant font-medium">Level</label>
                <select
                  className="w-full bg-surface-bright border border-outline-variant/30 focus:ring-2 focus:ring-secondary/30 focus:border-secondary rounded-lg text-base text-primary px-3 py-2.5"
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value as SkillLevel })}
                >
                  {levels.map((level) => (
                    <option key={level} value={level}>{level === "Beginner" ? "Seedling (Beginner)" : level === "Intermediate" ? "Sprout (Intermediate)" : "Bloom (Advanced)"}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm block mb-2 text-on-surface-variant font-medium">Daily Commitment</label>
                <div className="flex gap-2">
                  {commitments.map((commitment) => (
                    <button
                      key={commitment}
                      type="button"
                      onClick={() => setForm({ ...form, commitment })}
                      className={`px-3 py-2 rounded-lg text-sm flex-1 transition-all active:scale-95 ${
                        form.commitment === commitment
                          ? "bg-secondary-container text-on-secondary-container font-bold"
                          : "bg-surface-bright text-on-surface-variant hover:bg-secondary-container/20"
                      }`}
                    >
                      {commitment.split("/")[0]}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={createSkill}
                disabled={loading || !form.hobby.trim()}
                className="w-full py-3 bg-primary text-on-primary rounded-lg text-base font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Generate curriculum
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sprout Growth (Active Skills) */}
          <div className="mb-8 flex-1 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Sprout Growth</h3>
              <span className="material-symbols-outlined text-secondary">trending_up</span>
            </div>
            
            {skills.length === 0 ? (
              <p className="text-sm text-on-surface-variant italic py-2">No active plants yet. Start a plant above!</p>
            ) : (
              <div className="space-y-4">
                {skills.map((skill) => {
                  const progress = getProgress(skill);
                  const isActive = activeSkill?.id === skill.id;
                  return (
                    <div
                      key={skill.id}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer relative group ${
                        isActive
                          ? "border-secondary/30 bg-secondary-container/10"
                          : "border-transparent hover:bg-secondary-container/5"
                      }`}
                      onClick={() => {
                        setActiveSkillId(skill.id);
                        setActiveMilestoneId(skill.stages[0]?.milestones[0]?.id ?? "");
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSkill(skill.id);
                        }}
                        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-red-600 transition-opacity p-0.5 rounded hover:bg-black/5 flex items-center justify-center"
                        title="Delete plant"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                      <div className="flex justify-between text-sm mb-1.5 pr-6">
                        <span className="font-semibold text-primary truncate max-w-[150px]">{skill.hobby}</span>
                        <span className="font-bold text-secondary">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-outline-variant/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-secondary growth-bar-fill transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Nav Links */}
          <div className="mt-auto pt-5 border-t border-outline-variant/30 space-y-1.5">
            <a className="flex items-center gap-3 p-3 rounded-lg text-primary bg-secondary-container/30 font-bold transition-all duration-200 text-sm" href="/garden">
              <span className="material-symbols-outlined text-[22px]">auto_stories</span>
              Curriculum
            </a>
            <Link className="flex items-center gap-3 p-3 rounded-lg text-on-surface-variant hover:bg-secondary-container/20 hover:text-secondary transition-all text-sm" href="/discover">
              <span className="material-symbols-outlined text-[22px]">explore</span>
              Discover Hives
            </Link>
          </div>
        </aside>

        {/* Main Content: Curriculum Workbench */}
        <main className="flex-1 p-8 md:p-10 custom-scrollbar overflow-y-auto bg-surface">
          {activeSkill ? (
            <>
              <header className="mb-10 flex items-end justify-between border-b border-outline-variant/20 pb-8">
                <div>
                  <nav className="flex gap-2 text-sm text-on-surface-variant mb-3">
                    <span>Gardens</span>
                    <span>/</span>
                    <span className="text-secondary font-bold">{activeSkill.hobby}</span>
                  </nav>
                  <h2 className="font-serif text-4xl font-bold text-primary">{activeSkill.hobby} Foundations</h2>
                  <p className="text-base text-on-surface-variant max-w-2xl mt-3 leading-relaxed">
                    Personalized {activeSkill.level.toLowerCase()} curriculum. Focus on progress and daily consistency.
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-4xl text-primary/10 font-bold font-serif">{activeSkill.commitment}</span>
                </div>
              </header>

              {/* Progress Log Area */}
              <div className="watercolor-card rounded-xl p-5 mb-8">
                <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-3">Log Progress to Hive</h4>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="e.g. Practiced my flat washes today!"
                    className="flex-1 rounded-lg border border-outline-variant/30 bg-surface-bright focus:ring-2 focus:ring-secondary/30 text-base px-3 py-2.5 text-primary placeholder:text-outline"
                    value={quickLogText}
                    onChange={e => setQuickLogText(e.target.value)}
                  />
                  {hives.filter(h => joinedHiveIds.includes(h.id)).length > 0 && (
                    <select
                      className="rounded-lg border border-outline-variant/30 bg-surface-bright focus:ring-2 focus:ring-secondary/30 text-base text-primary px-3"
                      value={selectedLogHiveId}
                      onChange={e => setSelectedLogHiveId(e.target.value)}
                    >
                      {hives.filter(h => joinedHiveIds.includes(h.id)).map(h => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  )}
                  <button
                    onClick={handleQuickLogSubmit}
                    disabled={!quickLogText.trim()}
                    className="bg-primary text-on-primary font-bold px-5 py-2.5 rounded-lg text-sm hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                  >
                    Log
                  </button>
                </div>
                {logSuccess && (
                  <span className="text-xs text-secondary font-semibold block mt-2 animate-fade-in">✓ Progress logged successfully!</span>
                )}
              </div>

              {/* Stages List */}
              <div className="grid grid-cols-1 gap-8">
                <section>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/20 shrink-0">
                      <span className="material-symbols-outlined text-secondary">eco</span>
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-primary">Curriculum Levels &amp; Milestones</h3>
                    <div className="h-px flex-1 bg-outline-variant/20"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Grid: Stages & Milestones */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-3">Milestones Navigation</h4>
                      {activeSkill.stages.flatMap((stage) =>
                        stage.milestones.map((milestone) => {
                          const isCurrent = activeMilestoneId === milestone.id;
                          return (
                            <div
                              key={milestone.id}
                              onClick={() => setActiveMilestoneId(milestone.id)}
                              className={`watercolor-card rounded-xl p-4 cursor-pointer transition-transform hover:-translate-y-0.5 border-l-4 ${
                                isCurrent ? "border-l-secondary bg-secondary-container/10" : "border-l-outline-variant/30"
                              }`}
                            >
                              <h5 className="font-serif text-base font-bold text-primary mb-1">{milestone.title}</h5>
                              <p className="text-sm text-on-surface-variant line-clamp-2">{milestone.objective}</p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-secondary font-bold">
                                <span className="material-symbols-outlined text-[14px]">schedule</span>
                                {milestone.estimatedSessions} sessions
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Right Grid: Active Milestone Task Workspace */}
                    {activeMilestone && (
                      <div className="watercolor-card rounded-xl p-6 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-4 mb-4">
                            <div>
                              <span className="text-xs text-secondary uppercase font-bold tracking-widest block">Active Milestone</span>
                              <h4 className="font-serif text-2xl font-bold text-primary mt-1">{activeMilestone.title}</h4>
                            </div>
                            <button
                              onClick={() => setShowMentor(true)}
                              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-on-primary hover:opacity-90 transition-all cursor-pointer shrink-0"
                            >
                              <span className="material-symbols-outlined text-[16px] text-sun">auto_awesome</span>
                              AI Mentor
                            </button>
                          </div>
                          
                          <p className="text-base text-on-surface-variant mb-6">{activeMilestone.objective}</p>

                          <div className="space-y-3">
                            <h5 className="text-sm font-bold text-primary uppercase tracking-wider mb-3">Milestone Tasks</h5>
                            {activeMilestone.tasks.map((task) => (
                              <div
                                key={task.id}
                                onClick={() => toggleTask(task.id)}
                                className="watercolor-card rounded-lg p-3 flex gap-3 items-center hover:bg-secondary-container/10 transition-colors cursor-pointer border border-outline-variant/10 text-left"
                              >
                                <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">
                                  {task.completed ? "check_circle" : "radio_button_unchecked"}
                                </span>
                                <div className="min-w-0">
                                  <h6 className={`font-semibold text-sm text-primary ${task.completed ? "line-through text-outline" : ""}`}>{task.title}</h6>
                                  <p className="text-xs text-on-surface-variant mt-0.5">{task.description}</p>
                                  <p className="text-[10px] text-secondary font-bold uppercase tracking-wider mt-1">{task.cadence} · {task.points} pts</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </>
          ) : (
            <EmptyWorkbench />
          )}
        </main>

        {/* Right Side: Tutorials & Hives */}
        <aside className="h-full w-[380px] flex flex-col bg-surface-container-low border-l border-outline-variant/10 overflow-hidden relative shrink-0">
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar pr-20">
            {/* Tutorials */}
            <div className="mb-8">
              <div className="flex justify-between items-end mb-4">
                <h3 className="font-headline-sm text-primary text-lg">Tutorials</h3>
              </div>
              
              {videoLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="animate-spin text-secondary" />
                </div>
              ) : videos.length > 0 ? (
                <div className="space-y-4">
                  {videos.map((video) => (
                    <a
                      key={video.id}
                      href={video.url}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group cursor-pointer block border border-outline-variant/10"
                    >
                      <div className="h-28 w-full relative">
                        {video.thumbnail ? (
                          <img className="w-full h-full object-cover" src={video.thumbnail} alt={video.title} />
                        ) : (
                          <div className="w-full h-full bg-secondary-container flex items-center justify-center text-xs text-primary font-bold">
                            Open Tutorial
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="material-symbols-outlined text-white text-3xl">play_circle</span>
                        </div>
                      </div>
                      <div className="p-2.5">
                        <h4 className="font-label-md text-primary leading-tight text-xs line-clamp-1">{video.title}</h4>
                        <p className="text-[10px] text-on-surface-variant mt-1 truncate">{video.channel}</p>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant italic">Select a milestone to load tutorials.</p>
              )}
            </div>

            {/* Joined Hives */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-headline-sm text-primary text-lg">Joined Hives</h3>
                <Link href="/discover" className="text-label-sm text-secondary hover:underline cursor-pointer">Explore</Link>
              </div>

              {hives.filter(h => joinedHiveIds.includes(h.id)).length === 0 ? (
                <p className="text-xs text-on-surface-variant italic">You haven't joined any hives yet.</p>
              ) : (
                <div className="space-y-3">
                  {hives
                    .filter(h => joinedHiveIds.includes(h.id))
                    .map(joinedHive => (
                      <Link
                        key={joinedHive.id}
                        href={`/hives/${joinedHive.id}`}
                        className="p-3 rounded-xl bg-surface flex items-center gap-3 border border-outline-variant/10 hover:bg-secondary-container/10 transition-all cursor-pointer text-left block"
                      >
                        {joinedHive.profileImage ? (
                          <img src={joinedHive.profileImage} alt={joinedHive.name} className="w-9 h-9 rounded-full border border-outline-variant/10 object-cover shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-secondary/15 text-primary font-bold flex items-center justify-center text-xs shrink-0 border border-secondary/30">
                            {joinedHive.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-primary truncate">{joinedHive.name}</h5>
                          <p className="text-[9px] text-on-surface-variant truncate">{joinedHive.category}</p>
                        </div>
                      </Link>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Far Right Action Icons */}
          <div className="absolute right-0 top-0 h-full w-16 bg-surface-bright border-l border-outline-variant/20 flex flex-col items-center py-6 gap-6 shadow-2xl z-[60]">
            <button
              onClick={() => setShowMentor(!showMentor)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                showMentor ? "bg-secondary text-on-secondary" : "bg-primary text-on-primary"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            </button>
          </div>

          {/* Mentor Chat Slideout Drawer */}
          <div
            className={`absolute right-16 top-0 h-full w-80 bg-surface-bright border-l border-outline-variant/20 shadow-2xl flex flex-col transition-transform duration-500 z-[50] ${
              showMentor ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="p-6 border-b border-outline-variant/20 bg-secondary-container/10 flex justify-between items-center">
              <div>
                <h3 className="font-headline-sm text-primary flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-secondary">psychology</span>
                  Skillgarden Mentor
                </h3>
                <p className="text-label-sm text-on-surface-variant">Always here to help you bloom.</p>
              </div>
              <button
                onClick={() => setShowMentor(false)}
                className="text-on-surface-variant hover:text-primary cursor-pointer flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
              {mentorMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col gap-1 max-w-[85%] ${msg.role === "user" ? "ml-auto items-end" : "mr-auto"}`}
                >
                  <div
                    className={`p-3 text-body-md rounded-2xl ${
                      msg.role === "user"
                        ? "bg-primary text-on-primary rounded-tr-none"
                        : "bg-secondary-container/20 text-on-surface rounded-tl-none border border-outline-variant/10"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-outline px-2">
                    {msg.role === "user" ? "You" : "Mentor"}
                  </span>
                </div>
              ))}
              {mentorLoading && (
                <div className="flex flex-col gap-1 max-w-[85%] mr-auto">
                  <div className="p-3 bg-secondary-container/15 text-on-surface rounded-2xl rounded-tl-none border border-outline-variant/10 text-body-md flex items-center gap-1.5">
                    <Loader2 className="animate-spin text-secondary" size={14} />
                    <span className="text-xs">Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Send Composer */}
            <form onSubmit={handleSendMentorMessage} className="p-4 border-t border-outline-variant/20">
              <div className="relative">
                <textarea
                  className="w-full bg-surface-container rounded-xl border-none focus:ring-1 focus:ring-secondary/30 text-body-md p-3 pr-10 resize-none outline-none text-primary"
                  placeholder="Ask your mentor..."
                  rows={2}
                  value={mentorInput}
                  onChange={e => setMentorInput(e.target.value)}
                  disabled={mentorLoading}
                />
                <button
                  type="submit"
                  disabled={!mentorInput.trim() || mentorLoading}
                  className="absolute right-2 bottom-2 p-1 text-secondary hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatusPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-ink/10 bg-white/78 px-3 py-1.5">
      {icon}
      {label}
    </span>
  );
}

function Reaction({ label, value, onClick }: { label: string; value: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded border border-ink/10 bg-white px-2 py-1 text-ink/70 hover:border-sky/50 hover:text-ink"
    >
      {label} {value}
    </button>
  );
}

function EmptyWorkbench() {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center text-center">
      <Sprout className="mb-3 text-leaf" size={44} />
      <h2 className="text-2xl font-bold">Plant a skill to begin.</h2>
      <p className="mt-2 max-w-md text-sm text-ink/65">
        Skillgarden will generate staged milestones, daily and weekly tasks, contextual tutorials, and a growing visual plant.
      </p>
    </div>
  );
}

function getProgress(skill: SkillGarden) {
  const tasks = skill.stages.flatMap((stage) => stage.milestones.flatMap((milestone) => milestone.tasks));
  if (tasks.length === 0) return 0;
  const completed = tasks.filter((task) => task.completed).length;
  return (completed / tasks.length) * 100;
}

function getGrowthState(progress: number): GrowthState {
  if (progress >= 82) return "bloom";
  if (progress >= 58) return "bud";
  if (progress >= 34) return "leaf";
  if (progress >= 10) return "sprout";
  return "seed";
}

function getStreak(skill: SkillGarden) {
  const completedTasks = skill.stages
    .flatMap((stage) => stage.milestones.flatMap((milestone) => milestone.tasks))
    .filter((task) => task.completed).length;
  return Math.min(12, completedTasks);
}

function isWilted(skill: SkillGarden) {
  if (!skill.lastCompletedAt) return false;
  const last = new Date(skill.lastCompletedAt).getTime();
  return Date.now() - last > 1000 * 60 * 60 * 48;
}

function getRecommendedHive(hives: Hive[], hobby?: string) {
  if (!hobby) return hives[0];

  const hobbyWords = hobby
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2);

  return (
    hives.find((hive) => {
      const topic = hive.topic.toLowerCase();
      const name = hive.name.toLowerCase();
      return hobbyWords.some((word) => topic.includes(word) || name.includes(word));
    }) ?? hives[0]
  );
}
