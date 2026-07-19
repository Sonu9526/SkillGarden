import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, hiveId, body, mediaUrls } = await request.json();
    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanEmail || !hiveId || !body?.trim()) {
      return NextResponse.json({ error: "Email, hiveId, and body are required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const post = await prisma.hivePost.create({
      data: {
        hiveId,
        userId: user.id,
        body: body.trim(),
        mediaUrls: mediaUrls ? JSON.stringify(mediaUrls) : null
      },
      include: {
        user: true
      }
    });

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        author: post.user.name || post.user.email.split("@")[0],
        authorImage: post.user.image,
        body: post.body,
        mediaUrls: mediaUrls || [],
        time: "just now",
        reactions: { cheer: 0, inspired: 0, helpful: 0 },
        comments: []
      }
    });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
