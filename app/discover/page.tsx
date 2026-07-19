"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Search, Plus, Users, ShieldAlert, ArrowLeft, Loader2, Sparkles, Tag, Eye, EyeOff
} from "lucide-react";

interface Hive {
  id: string;
  name: string;
  description: string;
  category: string;
  coverImage: string | null;
  profileImage: string | null;
  tags: string | null;
  memberCount: number;
  isJoined: boolean;
}

const CATEGORIES = ["All", "Coding", "Fitness", "Music", "Reading", "Gaming", "AI", "Art", "General"];

// Stock covers mapping for premium visuals
const STOCK_COVERS = [
  { name: "Neon Coding", url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60" },
  { name: "Cozy Studio", url: "https://images.unsplash.com/photo-1497002901387-49a211a40fc9?w=800&auto=format&fit=crop&q=60" },
  { name: "Live Concert", url: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&auto=format&fit=crop&q=60" },
  { name: "Chess Board", url: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&auto=format&fit=crop&q=60" },
  { name: "Sunset Canvas", url: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&auto=format&fit=crop&q=60" },
  { name: "Warm Library", url: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&auto=format&fit=crop&q=60" }
];

export default function DiscoverHivesPage() {
  const [profile, setProfile] = useState<{ email: string; name: string } | null>(null);
  const [hives, setHives] = useState<Hive[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [error, setError] = useState("");

  // Create Hive Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    category: "Coding",
    tags: "",
    visibility: "PUBLIC",
    coverImage: STOCK_COVERS[0].url
  });
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    // Auth Guard
    const auth = window.localStorage.getItem("bloom-authenticated");
    if (auth !== "true") {
      window.location.href = "/login";
      return;
    }
    const email = window.localStorage.getItem("bloom-user-email") ?? "";
    const name = window.localStorage.getItem("bloom-user-name") ?? email.split("@")[0];
    setProfile({ email, name });

    fetchHives(email, search, selectedCategory);
  }, []);

  const fetchHives = async (email: string, queryStr: string, catStr: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        email,
        q: queryStr,
        category: catStr
      });
      const res = await fetch(`/api/hives/discover?${params}`);
      const data = await res.json();
      if (res.ok) {
        setHives(data.hives || []);
      } else {
        setError(data.error || "Failed to load hives.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to communicate with the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    if (profile) {
      fetchHives(profile.email, val, selectedCategory);
    }
  };

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    if (profile) {
      fetchHives(profile.email, search, cat);
    }
  };

  const handleJoinToggle = async (hiveId: string, currentJoined: boolean) => {
    if (!profile) return;
    try {
      const res = await fetch("/api/hives/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile.email, hiveId })
      });
      if (res.ok) {
        setHives(prev =>
          prev.map(h =>
            h.id === hiveId
              ? {
                  ...h,
                  isJoined: !currentJoined,
                  memberCount: h.memberCount + (currentJoined ? -1 : 1)
                }
              : h
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateHiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !createForm.name.trim() || !createForm.description.trim()) return;

    setCreateLoading(true);
    setError("");

    try {
      const res = await fetch("/api/hives/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: profile.email,
          ...createForm
        })
      });
      const data = await res.json();

      if (res.ok && data.hiveId) {
        setShowCreateModal(false);
        // Redirect to detail page
        window.location.href = `/hives/${data.hiveId}`;
      } else {
        setError(data.error || "Failed to create hive.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred during creation.");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fcfbfa] px-4 pt-20 pb-10 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl flex flex-col gap-6">
        
        {/* Navigation / Header */}
        <header className="flex flex-col gap-4 border-b border-ink/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href="/garden" 
              className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 bg-white shadow-soft transition hover:bg-ink hover:text-white cursor-pointer"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Communal Hives</h1>
              <p className="text-sm text-ink/60">Discover or create hubs focused on shared goals and learning.</p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-2.5 font-semibold text-white shadow-md transition duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-sm"
          >
            <Plus size={16} />
            Create new Hive
          </button>
        </header>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search */}
          <div className="relative max-w-md flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink/40" />
            <input
              type="text"
              placeholder="Search by name, description, or tags..."
              className="w-full rounded-full border border-ink/10 bg-white pl-9 pr-4 py-2 text-sm outline-none focus:border-leaf shadow-soft"
              value={search}
              onChange={handleSearchChange}
            />
          </div>

          {/* Categories list */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition duration-150 cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-leaf text-white border-leaf shadow-soft"
                    : "bg-white text-ink/70 border-ink/10 hover:border-ink/20"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Discovery Grid */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="animate-pulse rounded-2xl border border-ink/10 bg-white/60 p-4 shadow-soft">
                <div className="h-36 rounded-xl bg-ink/5 mb-4" />
                <div className="h-5 w-2/3 rounded bg-ink/10 mb-2" />
                <div className="h-4 w-full rounded bg-ink/5 mb-1" />
                <div className="h-4 w-5/6 rounded bg-ink/5 mb-4" />
                <div className="flex items-center justify-between">
                  <div className="h-5 w-20 rounded bg-ink/5" />
                  <div className="h-8 w-24 rounded-full bg-ink/10" />
                </div>
              </div>
            ))}
          </div>
        ) : hives.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink/15 py-16 text-center bg-white/30 backdrop-blur-sm">
            <Users className="text-ink/20 mb-3" size={48} />
            <h3 className="text-lg font-bold text-ink/80">No communities found</h3>
            <p className="text-sm text-ink/50 mt-1 max-w-sm">Try broadening your search or be the first to create a community for this topic!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 rounded-full bg-ink px-4 py-2 font-semibold text-white text-xs cursor-pointer shadow hover:scale-[1.02] active:scale-[0.98] transition"
            >
              Create Hive
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {hives.map(hive => (
              <div 
                key={hive.id} 
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div>
                  {/* Cover image */}
                  <div className="relative h-36 w-full overflow-hidden bg-ink/5">
                    {hive.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={hive.coverImage}
                        alt={hive.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-leaf/10 to-leaf/30 text-leaf">
                        <Users size={32} />
                      </div>
                    )}
                    <span className="absolute top-3 right-3 rounded-full bg-white/90 backdrop-blur px-2.5 py-0.5 text-[10px] font-bold text-leaf shadow">
                      {hive.category}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-4">
                    <Link href={`/hives/${hive.id}`} className="group-hover:text-leaf transition">
                      <h3 className="text-base font-bold truncate">{hive.name}</h3>
                    </Link>
                    <p className="text-xs text-ink/60 mt-1 line-clamp-2 h-8">{hive.description}</p>
                    
                    {hive.tags && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {hive.tags.split(",").slice(0, 3).map(tag => (
                          <span key={tag} className="flex items-center gap-0.5 rounded bg-ink/5 px-2 py-0.5 text-[9px] text-ink/70 font-medium">
                            <Tag size={8} />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer bar */}
                <div className="flex items-center justify-between border-t border-ink/5 px-4 py-3 bg-[#faf9f6]">
                  <span className="flex items-center gap-1 text-xs font-semibold text-ink/65">
                    <Users size={14} className="text-leaf" />
                    {hive.memberCount} member{hive.memberCount !== 1 ? "s" : ""}
                  </span>
                  
                  <div className="flex gap-2">
                    <Link
                      href={`/hives/${hive.id}`}
                      className="rounded-full border border-ink/10 hover:border-ink/20 px-3.5 py-1.5 text-xs font-semibold text-ink/80 transition bg-white"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleJoinToggle(hive.id, hive.isJoined)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition shadow-sm cursor-pointer ${
                        hive.isJoined
                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                          : "bg-leaf text-white hover:bg-leaf/90"
                      }`}
                    >
                      {hive.isJoined ? "Leave" : "Join"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* CREATE HIVE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-ink/10 bg-white p-6 shadow-xl animate-scale-up">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="text-sun" size={20} />
              Create a Communal Hive
            </h2>
            <p className="text-xs text-ink/60 mt-1">Start a new group centered around a shared hobby or goal.</p>

            <form onSubmit={handleCreateHiveSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink/75">Hive Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next.js Masterminds, Daily Yoga Win"
                  className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2 text-sm outline-none focus:border-leaf"
                  value={createForm.name}
                  onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-ink/75">Category</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2 text-sm outline-none focus:border-leaf bg-white"
                    value={createForm.category}
                    onChange={e => setCreateForm({ ...createForm, category: e.target.value })}
                  >
                    {CATEGORIES.filter(c => c !== "All").map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink/75">Visibility</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2 text-sm outline-none focus:border-leaf bg-white"
                    value={createForm.visibility}
                    onChange={e => setCreateForm({ ...createForm, visibility: e.target.value })}
                  >
                    <option value="PUBLIC">Public (Anyone can search)</option>
                    <option value="PRIVATE">Private (Invite only)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/75">Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="What is this community about? What are the core topics and guidelines?"
                  className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2 text-sm outline-none focus:border-leaf resize-none"
                  value={createForm.description}
                  onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/75">Tags / Keywords (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. coding,javascript,webdev"
                  className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2 text-sm outline-none focus:border-leaf"
                  value={createForm.tags}
                  onChange={e => setCreateForm({ ...createForm, tags: e.target.value })}
                />
              </div>

              {/* Cover presets selector */}
              <div>
                <label className="block text-xs font-semibold text-ink/75 mb-1.5">Select Cover Style</label>
                <div className="grid grid-cols-3 gap-2">
                  {STOCK_COVERS.map(cover => (
                    <button
                      key={cover.name}
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, coverImage: cover.url })}
                      className={`relative h-12 overflow-hidden rounded-lg border transition ${
                        createForm.coverImage === cover.url ? "border-leaf ring-2 ring-leaf/20" : "border-ink/10"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cover.url} alt={cover.name} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-ink/20 flex items-end p-1">
                        <span className="text-[8px] font-bold text-white truncate">{cover.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-ink/10 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-full border border-ink/10 px-4 py-2 text-xs font-semibold text-ink/75 hover:bg-ink/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex items-center justify-center gap-1 rounded-full bg-ink px-5 py-2 text-xs font-bold text-white hover:bg-ink/90 cursor-pointer disabled:opacity-50"
                >
                  {createLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      Creating...
                    </>
                  ) : (
                    "Create Hive"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
