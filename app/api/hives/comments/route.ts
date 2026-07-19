import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, postId, body, parentId } = await request.json();
    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanEmail || !postId || !body?.trim()) {
      return NextResponse.json({ error: "Email, postId, and body are required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const post = await prisma.hivePost.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        postId,
        userId: user.id,
        body: body.trim(),
        parentId: parentId || null
      },
      include: {
        user: true
      }
    });

    // Create Notification
    try {
      if (parentId) {
        // Nested Reply Notification
        const parentComment = await prisma.comment.findUnique({ where: { id: parentId } });
        if (parentComment && parentComment.userId !== user.id) {
          await prisma.notification.create({
            data: {
              userId: parentComment.userId,
              senderId: user.id,
              type: "REPLY",
              postId,
              hiveId: post.hiveId
            }
          });
        }
      } else {
        // Direct Comment Notification
        if (post.userId !== user.id) {
          await prisma.notification.create({
            data: {
              userId: post.userId,
              senderId: user.id,
              type: "COMMENT",
              postId,
              hiveId: post.hiveId
            }
          });
        }
      }
    } catch (notifErr) {
      console.error("Failed to generate notification:", notifErr);
    }

    return NextResponse.json({
      success: true,
      comment: {
        id: comment.id,
        body: comment.body,
        parentId: comment.parentId,
        author: comment.user.name || comment.user.email.split("@")[0],
        authorImage: comment.user.image,
        time: "just now",
        replies: []
      }
    });
  } catch (error) {
    console.error("Post comment error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
