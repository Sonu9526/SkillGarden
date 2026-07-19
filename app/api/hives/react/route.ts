import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, postId, reaction } = await request.json();
    const cleanEmail = email?.trim().toLowerCase();
    const upperReaction = reaction?.toUpperCase(); // CHEER, INSPIRED, HELPFUL

    if (!cleanEmail || !postId || !upperReaction) {
      return NextResponse.json({ error: "Email, postId, and reaction are required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Toggle reaction (due to @@unique([postId, userId, type]))
    const existing = await prisma.reaction.findUnique({
      where: {
        postId_userId_type: {
          postId,
          userId: user.id,
          type: upperReaction
        }
      }
    });

    if (existing) {
      // Remove reaction
      await prisma.reaction.delete({
        where: { id: existing.id }
      });
      return NextResponse.json({ success: true, reacted: false });
    } else {
      // Add reaction
      await prisma.reaction.create({
        data: {
          postId,
          userId: user.id,
          type: upperReaction
        }
      });

      // Trigger notification
      try {
        const post = await prisma.hivePost.findUnique({ where: { id: postId } });
        if (post && post.userId !== user.id) {
          await prisma.notification.create({
            data: {
              userId: post.userId,
              senderId: user.id,
              type: "LIKE",
              postId,
              hiveId: post.hiveId
            }
          });
        }
      } catch (notifErr) {
        console.error("Failed to generate reaction notification:", notifErr);
      }

      return NextResponse.json({ success: true, reacted: true });
    }
  } catch (error) {
    console.error("React to post error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
