"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Users, Trophy, Pin, Shield, MoreVertical, Heart, MessageSquare, 
  Trash2, Edit3, ShieldAlert, Sparkles, Send, CornerDownRight, Image, Check, Loader2
} from "lucide-react";

interface Comment {
  id: string;
  body: string;
  parentId: string | null;
  author: string;
  authorImage: string | null;
  time: string;
  replies?: Comment[];
}

interface Post {
  id: string;
  author: string;
  authorImage: string | null;
  authorEmail: string;
  body: string;
  mediaUrls: string[];
  pinned: boolean;
  reported: boolean;
  time: string;
  reactions: {
    cheer: number;
    inspired: number;
    helpful: number;
  };
  userReactedTypes: string[];
  comments: Comment[];
}

interface Member {
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
}

interface Hive {
  id: string;
  name: string;
  topic: string;
  description: string;
  category: string;
  coverImage: string | null;
  profileImage: string | null;
  tags: string[];
  visibility: string;
  challenge: string;
  memberCount: number;
}

export default function HiveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const hiveId = resolvedParams.id;

  const [profile, setProfile] = useState<{ email: string; name: string } | null>(null);
  const [hive, setHive] = useState<Hive | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Post composer state
  const [newPostBody, setNewPostBody] = useState("");
  const [mediaUrlsInput, setMediaUrlsInput] = useState<string[]>([]);
  const [tempMediaUrl, setTempMediaUrl] = useState("");
  const [posting, setPosting] = useState(false);

  // Active inputs / states
  const [commentDrafts, setCommentDrafts] = useState<{ [postId: string]: string }>({});
  const [replyDrafts, setReplyDrafts] = useState<{ [commentId: string]: string }>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);

  useEffect(() => {
    const auth = window.localStorage.getItem("bloom-authenticated");
    const email = window.localStorage.getItem("bloom-user-email");
    if (auth !== "true" || !email) {
      window.location.href = "/login";
      return;
    }
    let name = window.localStorage.getItem("bloom-user-name") ?? "";
    if (!name || name === "null" || name === "undefined") {
      name = email.split("@")[0] || "User";
    }
    setProfile({ email, name });

    fetchHiveDetails(email);
  }, [hiveId]);

  const fetchHiveDetails = async (email: string) => {
    try {
      const params = new URLSearchParams({ hiveId, email });
      const res = await fetch(`/api/hives/detail?${params}`);
      const data = await res.json();
      if (res.ok) {
        setHive(data.hive);
        setPosts(data.posts || []);
        setMembers(data.members || []);
        setUserRole(data.userRole);
        setIsJoined(data.isJoined);
      } else {
        setError(data.error || "Failed to load hive details.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to communicate with the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinToggle = async () => {
    if (!profile || !hive) return;
    try {
      const res = await fetch("/api/hives/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile.email, hiveId: hive.id })
      });
      if (res.ok) {
        fetchHiveDetails(profile.email);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMediaUrl = () => {
    if (tempMediaUrl.trim()) {
      setMediaUrlsInput([...mediaUrlsInput, tempMediaUrl.trim()]);
      setTempMediaUrl("");
    }
  };

  const handleRemoveMediaUrl = (idx: number) => {
    setMediaUrlsInput(mediaUrlsInput.filter((_, i) => i !== idx));
  };

  const handleCreatePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !hive || !newPostBody.trim()) return;

    setPosting(true);
    try {
      const res = await fetch("/api/hives/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: profile.email,
          hiveId: hive.id,
          body: newPostBody.trim(),
          mediaUrls: mediaUrlsInput.length > 0 ? mediaUrlsInput : undefined
        })
      });
      if (res.ok) {
        setNewPostBody("");
        setMediaUrlsInput([]);
        fetchHiveDetails(profile.email);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  const handlePostAction = async (postId: string, action: "PIN" | "UNPIN" | "DELETE" | "REPORT" | "EDIT", editPayload?: string) => {
    if (!profile) return;
    try {
      const res = await fetch("/api/hives/posts/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: profile.email,
          postId,
          action,
          body: editPayload
        })
      });
      if (res.ok) {
        setOpenMenuPostId(null);
        setEditingPostId(null);
        fetchHiveDetails(profile.email);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReactionToggle = async (postId: string, type: "cheer" | "inspired" | "helpful") => {
    if (!profile) return;
    try {
      const res = await fetch("/api/hives/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: profile.email,
          postId,
          reaction: type
        })
      });
      if (res.ok) {
        fetchHiveDetails(profile.email);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (postId: string, parentId?: string) => {
    if (!profile) return;
    const body = parentId ? replyDrafts[parentId]?.trim() : commentDrafts[postId]?.trim();
    if (!body) return;

    try {
      const res = await fetch("/api/hives/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: profile.email,
          postId,
          body,
          parentId
        })
      });
      if (res.ok) {
        if (parentId) {
          setReplyDrafts({ ...replyDrafts, [parentId]: "" });
          setActiveReplyId(null);
        } else {
          setCommentDrafts({ ...commentDrafts, [postId]: "" });
        }
        fetchHiveDetails(profile.email);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fcfbfa]">
        <Loader2 className="animate-spin text-leaf" size={32} />
      </div>
    );
  }

  if (error || !hive) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#fcfbfa] p-4 text-center">
        <ShieldAlert className="text-red-500 mb-2" size={48} />
        <h2 className="text-lg font-bold text-ink">Hive not found</h2>
        <p className="text-sm text-ink/60 mt-1">{error || "This communal community does not exist."}</p>
        <Link href="/discover" className="mt-4 rounded-full bg-ink px-5 py-2 font-bold text-white text-xs">
          Back to Discovery
        </Link>
      </div>
    );
  }

  const isAdmin = userRole === "ADMIN";

  return (
    <main className="min-h-screen bg-[#fcfbfa] px-4 pt-20 pb-10 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl flex flex-col gap-6">

        {/* Dynamic Cover Banner */}
        <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-ink/10 bg-ink/5 shadow-soft">
          {hive.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hive.coverImage} alt={hive.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-leaf/10 to-leaf/30" />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end p-6">
            <div className="flex flex-col gap-1 text-white">
              <span className="w-fit rounded-full bg-leaf px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase">
                {hive.category}
              </span>
              <h1 className="text-2xl font-bold tracking-tight mt-1">{hive.name}</h1>
              <p className="text-xs text-white/80 line-clamp-1">{hive.description}</p>
            </div>
          </div>

          <Link
            href="/discover"
            className="absolute top-4 left-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow hover:scale-105 transition"
          >
            <ArrowLeft size={16} />
          </Link>
        </div>

        {/* Main Grid Content */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">

          {/* Social Feed & Composer */}
          <div className="flex flex-col gap-6">

            {/* Composer Card */}
            {isJoined ? (
              <section className="rounded-2xl border border-ink/10 bg-white p-4 shadow-soft">
                <h3 className="text-sm font-bold flex items-center gap-1.5 mb-3 text-ink/80">
                  <Sparkles size={16} className="text-sun" />
                  Post an Update or Achievement
                </h3>
                
                <form onSubmit={handleCreatePostSubmit} className="space-y-3">
                  <textarea
                    rows={3}
                    placeholder={`Share your latest wins in ${hive.name}...`}
                    className="w-full rounded-xl border border-ink/10 p-3 text-sm outline-none focus:border-leaf resize-none"
                    value={newPostBody}
                    onChange={e => setNewPostBody(e.target.value)}
                  />

                  {/* Media attachment input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste image/video URL to attach..."
                      className="flex-1 rounded-lg border border-ink/10 px-3 py-1.5 text-xs outline-none focus:border-leaf"
                      value={tempMediaUrl}
                      onChange={e => setTempMediaUrl(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleAddMediaUrl}
                      className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-ink/90 cursor-pointer"
                    >
                      Attach
                    </button>
                  </div>

                  {/* Attached media list */}
                  {mediaUrlsInput.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {mediaUrlsInput.map((url, i) => (
                        <div key={i} className="relative h-14 w-20 rounded-lg border border-ink/10 overflow-hidden shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="attachment" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveMediaUrl(i)}
                            className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end pt-2 border-t border-ink/5">
                    <button
                      type="submit"
                      disabled={posting || !newPostBody.trim()}
                      className="flex items-center gap-1.5 rounded-full bg-leaf hover:bg-leaf/90 px-5 py-2 font-bold text-white text-xs cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      {posting ? (
                        <>
                          <Loader2 className="animate-spin" size={12} />
                          Posting...
                        </>
                      ) : (
                        <>
                          <Send size={12} />
                          Publish Post
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </section>
            ) : (
              <div className="rounded-2xl border border-dashed border-ink/15 p-6 text-center bg-white/40">
                <Users className="mx-auto text-ink/20 mb-2" size={32} />
                <h3 className="text-sm font-bold text-ink/80">Join Hive to participate</h3>
                <p className="text-xs text-ink/50 mt-1">Become a member of this hive to write posts, comments, and share progress logs!</p>
                <button
                  onClick={handleJoinToggle}
                  className="mt-3 rounded-full bg-leaf px-5 py-2 font-bold text-white text-xs cursor-pointer shadow hover:scale-[1.02] active:scale-[0.98] transition"
                >
                  Join Community
                </button>
              </div>
            )}

            {/* FEED POSTS */}
            <div className="flex flex-col gap-4">
              {posts.length === 0 ? (
                <div className="rounded-2xl border border-ink/10 bg-white p-8 text-center shadow-soft">
                  <MessageSquare className="mx-auto text-ink/20 mb-2" size={32} />
                  <h3 className="text-sm font-bold text-ink/80">No posts yet</h3>
                  <p className="text-xs text-ink/50 mt-1">Be the first to share your achievements or introduce yourself in this hive!</p>
                </div>
              ) : (
                posts.map(post => (
                  <article 
                    key={post.id} 
                    className={`relative rounded-2xl border bg-white p-5 shadow-soft transition duration-150 ${
                      post.pinned ? "border-sun/30 bg-sun/3" : "border-ink/10"
                    }`}
                  >
                    
                    {/* Pinned Marker */}
                    {post.pinned && (
                      <div className="absolute top-4 right-12 flex items-center gap-1 text-[10px] font-bold text-sun">
                        <Pin size={10} className="fill-current" />
                        Pinned by Admin
                      </div>
                    )}

                    {/* Author Meta */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {post.authorImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.authorImage}
                            alt={post.author}
                            className="w-10 h-10 rounded-full border border-ink/10 object-cover shadow-sm"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-leaf/10 border border-leaf/20 text-leaf font-bold flex items-center justify-center text-xs">
                            {post.author.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-ink">{post.author}</span>
                            {members.find(m => m.email === post.authorEmail)?.role === "ADMIN" && (
                              <span className="rounded bg-sun/12 text-sun font-bold text-[8px] px-1 py-0.5 border border-sun/20 flex items-center gap-0.5">
                                <Shield size={8} />
                                Admin
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-ink/50 mt-0.5 block">{post.time}</span>
                        </div>
                      </div>

                      {/* Dropdown Options */}
                      {isJoined && (
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuPostId(openMenuPostId === post.id ? null : post.id)}
                            className="p-1 rounded-full hover:bg-ink/5 text-ink/60"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {openMenuPostId === post.id && (
                            <div className="absolute right-0 mt-1 w-36 rounded-xl border border-ink/10 bg-white p-1 shadow-lg z-10 animate-fade-in text-xs">
                              {post.authorEmail === profile?.email && (
                                <button
                                  onClick={() => {
                                    setEditingPostId(post.id);
                                    setEditBody(post.body);
                                    setOpenMenuPostId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-ink/5 text-left text-ink/80"
                                >
                                  <Edit3 size={12} />
                                  Edit Post
                                </button>
                              )}
                              
                              {(post.authorEmail === profile?.email || isAdmin) && (
                                <button
                                  onClick={() => handlePostAction(post.id, "DELETE")}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-red-50 text-left text-red-600 font-medium"
                                >
                                  <Trash2 size={12} />
                                  Delete Post
                                </button>
                              )}

                              {isAdmin && (
                                <button
                                  onClick={() => handlePostAction(post.id, post.pinned ? "UNPIN" : "PIN")}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-ink/5 text-left text-ink/80"
                                >
                                  <Pin size={12} />
                                  {post.pinned ? "Unpin Post" : "Pin Post"}
                                </button>
                              )}

                              {post.authorEmail !== profile?.email && (
                                <button
                                  onClick={() => handlePostAction(post.id, "REPORT")}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-orange-50 text-left text-orange-600"
                                >
                                  <ShieldAlert size={12} />
                                  {post.reported ? "Reported" : "Report Post"}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Post Content */}
                    <div className="mt-3">
                      {editingPostId === post.id ? (
                        <div className="space-y-2">
                          <textarea
                            rows={2}
                            className="w-full rounded-lg border border-ink/10 p-2 text-sm outline-none focus:border-leaf"
                            value={editBody}
                            onChange={e => setEditBody(e.target.value)}
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setEditingPostId(null)}
                              className="rounded-full border border-ink/10 px-3 py-1 text-[10px] font-semibold text-ink/75 hover:bg-ink/5"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handlePostAction(post.id, "EDIT", editBody)}
                              className="rounded-full bg-leaf px-3 py-1 text-[10px] font-bold text-white shadow-sm"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-ink/90 whitespace-pre-wrap leading-relaxed">{post.body}</p>
                      )}

                      {/* Display media */}
                      {post.mediaUrls.length > 0 && (
                        <div className={`mt-3 grid gap-2 ${post.mediaUrls.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                          {post.mediaUrls.map((url, i) => (
                            <div key={i} className="overflow-hidden rounded-xl border border-ink/5 bg-ink/5 max-h-80 shadow-soft">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt="attached media" className="w-full h-full object-cover max-h-80" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Likes & Actions Row */}
                    <div className="mt-4 flex items-center gap-4 border-t border-b border-ink/5 py-2 text-xs">
                      
                      {/* Cheer Toggle */}
                      <button
                        onClick={() => handleReactionToggle(post.id, "cheer")}
                        disabled={!isJoined}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full cursor-pointer transition ${
                          post.userReactedTypes.includes("CHEER")
                            ? "bg-petal/10 text-petal font-bold border border-petal/20"
                            : "hover:bg-ink/5 text-ink/70"
                        }`}
                      >
                        <Heart size={14} className={post.userReactedTypes.includes("CHEER") ? "fill-current" : ""} />
                        <span>Cheer ({post.reactions.cheer})</span>
                      </button>

                      {/* Inspired */}
                      <button
                        onClick={() => handleReactionToggle(post.id, "inspired")}
                        disabled={!isJoined}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full cursor-pointer transition ${
                          post.userReactedTypes.includes("INSPIRED")
                            ? "bg-sun/10 text-sun font-bold border border-sun/20"
                            : "hover:bg-ink/5 text-ink/70"
                        }`}
                      >
                        <Sparkles size={14} />
                        <span>Inspire ({post.reactions.inspired})</span>
                      </button>

                      {/* Helpful */}
                      <button
                        onClick={() => handleReactionToggle(post.id, "helpful")}
                        disabled={!isJoined}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full cursor-pointer transition ${
                          post.userReactedTypes.includes("HELPFUL")
                            ? "bg-leaf/10 text-leaf font-bold border border-leaf/20"
                            : "hover:bg-ink/5 text-ink/70"
                        }`}
                      >
                        <Check size={14} />
                        <span>Helpful ({post.reactions.helpful})</span>
                      </button>
                    </div>

                    {/* Comments Section */}
                    <div className="mt-4 space-y-3">
                      <h4 className="text-xs font-bold text-ink/70 flex items-center gap-1.5">
                        <MessageSquare size={13} />
                        Comments ({post.comments.length})
                      </h4>

                      {/* Root Comments List */}
                      {post.comments.length > 0 && (
                        <div className="space-y-3 pl-1">
                          {post.comments.map(c => (
                            <div key={c.id} className="group/comment flex flex-col gap-1 border-l-2 border-ink/5 pl-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {c.authorImage ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={c.authorImage} alt={c.author} className="w-6 h-6 rounded-full border border-ink/10 object-cover" />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-leaf/15 text-leaf font-bold text-[9px] flex items-center justify-center">
                                      {c.author.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <span className="font-bold text-xs text-ink/95">{c.author}</span>
                                  <span className="text-[9px] text-ink/40">{c.time}</span>
                                </div>
                                
                                {isJoined && (
                                  <button
                                    onClick={() => {
                                      setActiveReplyId(activeReplyId === c.id ? null : c.id);
                                      setReplyDrafts({ ...replyDrafts, [c.id]: "" });
                                    }}
                                    className="text-[10px] font-bold text-leaf hover:underline cursor-pointer opacity-0 group-hover/comment:opacity-100 transition"
                                  >
                                    Reply
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-ink/80 mt-0.5 leading-relaxed">{c.body}</p>

                              {/* Nested Replies Rendering */}
                              {c.replies && c.replies.length > 0 && (
                                <div className="mt-2 space-y-2.5 pl-3 border-l border-ink/5">
                                  {c.replies.map(reply => (
                                    <div key={reply.id} className="flex flex-col gap-0.5">
                                      <div className="flex items-center gap-2">
                                        <CornerDownRight size={10} className="text-ink/30" />
                                        {reply.authorImage ? (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img src={reply.authorImage} alt={reply.author} className="w-5 h-5 rounded-full border border-ink/10 object-cover" />
                                        ) : (
                                          <div className="w-5 h-5 rounded-full bg-leaf/15 text-leaf font-bold text-[8px] flex items-center justify-center">
                                            {reply.author.slice(0, 2).toUpperCase()}
                                          </div>
                                        )}
                                        <span className="font-bold text-xs text-ink/95">{reply.author}</span>
                                        <span className="text-[8px] text-ink/40">{reply.time}</span>
                                      </div>
                                      <p className="text-xs text-ink/80 pl-5 mt-0.5 leading-relaxed">{reply.body}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Reply composer */}
                              {activeReplyId === c.id && (
                                <div className="mt-2 flex gap-2 pl-3">
                                  <input
                                    type="text"
                                    placeholder={`Reply to ${c.author}...`}
                                    className="flex-1 rounded-lg border border-ink/10 px-2.5 py-1 text-xs outline-none focus:border-leaf"
                                    value={replyDrafts[c.id] || ""}
                                    onChange={e => setReplyDrafts({ ...replyDrafts, [c.id]: e.target.value })}
                                  />
                                  <button
                                    onClick={() => handleAddComment(post.id, c.id)}
                                    className="rounded-lg bg-leaf hover:bg-leaf/90 px-3 py-1 text-xs font-semibold text-white shadow-sm cursor-pointer"
                                  >
                                    Send
                                  </button>
                                </div>
                              )}

                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add comment composer */}
                      {isJoined && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add a comment to this post..."
                            className="flex-1 rounded-lg border border-ink/10 px-3 py-1.5 text-xs outline-none focus:border-leaf"
                            value={commentDrafts[post.id] || ""}
                            onChange={e => setCommentDrafts({ ...commentDrafts, [post.id]: e.target.value })}
                          />
                          <button
                            onClick={() => handleAddComment(post.id)}
                            className="rounded-lg bg-ink hover:bg-ink/90 px-4 py-1.5 text-xs font-semibold text-white shadow-sm cursor-pointer"
                          >
                            Comment
                          </button>
                        </div>
                      )}
                    </div>

                  </article>
                ))
              )}
            </div>

          </div>

          {/* Sidebar Panels (Details, Admin, Members) */}
          <aside className="flex flex-col gap-5">
            
            {/* Join button card */}
            <section className="rounded-2xl border border-ink/10 bg-white p-4 shadow-soft text-center">
              <h3 className="font-bold text-ink text-sm">Membership status</h3>
              <p className="text-xs text-ink/50 mt-1">Joined with {hive.memberCount} other member{hive.memberCount !== 1 ? "s" : ""}.</p>
              
              <button
                onClick={handleJoinToggle}
                className={`mt-4 w-full rounded-full py-2 font-bold text-xs transition shadow-sm cursor-pointer ${
                  isJoined
                    ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                    : "bg-leaf text-white hover:bg-leaf/90"
                }`}
              >
                {isJoined ? "Leave Communal Hive" : "Join Communal Hive"}
              </button>
            </section>

            {/* Info panel */}
            <section className="rounded-2xl border border-ink/10 bg-white p-4 shadow-soft flex flex-col gap-3">
              <div>
                <h3 className="font-bold text-ink text-sm">Community Guidelines</h3>
                <p className="text-xs text-ink/65 leading-relaxed mt-1">
                  1. Respect all members and their learning speed.<br />
                  2. Share constructive feedback on project updates.<br />
                  3. Keep posts and updates safe and hobby-focused.
                </p>
              </div>

              <div className="border-t border-ink/5 pt-3">
                <h3 className="font-bold text-ink text-sm flex items-center gap-1 text-sun">
                  <Trophy size={14} className="fill-current" />
                  Active Challenge
                </h3>
                <p className="text-xs text-ink/75 leading-relaxed mt-1 italic">
                  "{hive.challenge}"
                </p>
              </div>
            </section>

            {/* Active Members List */}
            <section className="rounded-2xl border border-ink/10 bg-white p-4 shadow-soft">
              <h3 className="font-bold text-ink text-sm mb-3">Members ({members.length})</h3>
              <div className="space-y-2.5">
                {members.map(member => (
                  <div key={member.userId} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {member.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={member.image} alt={member.name} className="w-6 h-6 rounded-full border border-ink/10 object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-leaf/10 border border-leaf/20 text-leaf font-bold flex items-center justify-center text-[9px]">
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium truncate max-w-[150px]">{member.name}</span>
                    </div>

                    {member.role === "ADMIN" ? (
                      <span className="rounded bg-sun/12 text-sun font-bold text-[8px] px-1 py-0.5 border border-sun/20">
                        Admin
                      </span>
                    ) : (
                      <span className="text-[9px] text-ink/40 font-semibold uppercase">
                        Member
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>

          </aside>

        </div>

      </div>
    </main>
  );
}
