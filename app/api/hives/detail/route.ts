import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hiveId = searchParams.get("hiveId");
    const email = searchParams.get("email")?.trim().toLowerCase();

    if (!hiveId) {
      return NextResponse.json({ error: "hiveId is required." }, { status: 400 });
    }

    const hive = await prisma.hive.findUnique({
      where: { id: hiveId },
      include: {
        members: {
          include: {
            user: true
          }
        },
        posts: {
          orderBy: [
            { pinned: "desc" },
            { createdAt: "desc" }
          ],
          include: {
            user: true,
            reactions: true,
            comments: {
              orderBy: { createdAt: "asc" },
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    if (!hive) {
      return NextResponse.json({ error: "Hive not found." }, { status: 404 });
    }

    // Determine current user role
    let userRole: string | null = null;
    let isJoined = false;
    let currentUserDbId = "";

    if (email) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        currentUserDbId = user.id;
        const membership = hive.members.find(m => m.userId === user.id);
        if (membership) {
          userRole = membership.role;
          isJoined = true;
        }
      }
    }

    // Map posts and comment threads
    const posts = hive.posts.map(post => {
      // Group reactions by type count
      const cheerCount = post.reactions.filter(r => r.type === "CHEER").length;
      const inspiredCount = post.reactions.filter(r => r.type === "INSPIRED").length;
      const helpfulCount = post.reactions.filter(r => r.type === "HELPFUL").length;
      const userReactedTypes = post.reactions.filter(r => r.userId === currentUserDbId).map(r => r.type);

      // Thread comments
      const allComments = post.comments.map(c => ({
        id: c.id,
        postId: c.postId,
        userId: c.userId,
        body: c.body,
        parentId: c.parentId,
        createdAt: c.createdAt,
        author: c.user.name || c.user.email.split("@")[0],
        authorImage: c.user.image,
        time: formatRelativeTime(c.createdAt)
      }));

      // Separate root comments and replies
      const roots = allComments.filter(c => !c.parentId);
      const replies = allComments.filter(c => c.parentId);

      const threadedComments = roots.map(root => ({
        ...root,
        replies: replies.filter(reply => reply.parentId === root.id)
      }));

      return {
        id: post.id,
        author: post.user.name || post.user.email.split("@")[0],
        authorImage: post.user.image,
        authorEmail: post.user.email,
        body: post.body,
        mediaUrls: post.mediaUrls ? JSON.parse(post.mediaUrls) : [],
        pinned: post.pinned,
        reported: post.reported,
        time: formatRelativeTime(post.createdAt),
        reactions: {
          cheer: cheerCount,
          inspired: inspiredCount,
          helpful: helpfulCount
        },
        userReactedTypes,
        comments: threadedComments
      };
    });

    const members = hive.members.map(m => ({
      userId: m.userId,
      name: m.user.name || m.user.email.split("@")[0],
      email: m.user.email,
      image: m.user.image,
      role: m.role
    }));

    return NextResponse.json({
      hive: {
        id: hive.id,
        name: hive.name,
        topic: hive.topic,
        description: hive.description,
        category: hive.category,
        coverImage: hive.coverImage,
        profileImage: hive.profileImage,
        tags: hive.tags ? hive.tags.split(",") : [],
        visibility: hive.visibility,
        challenge: hive.challenge,
        memberCount: hive.members.length
      },
      posts,
      members,
      userRole,
      isJoined
    });
  } catch (error) {
    console.error("Fetch hive details error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

function formatRelativeTime(date: Date): string {
  const timeDiff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(timeDiff / (1000 * 60));
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hrs > 0) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  if (mins > 0) return `${mins} min${mins > 1 ? "s" : ""} ago`;
  return "just now";
}
