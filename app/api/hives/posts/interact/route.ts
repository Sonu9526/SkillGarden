import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, postId, action, body } = await request.json();
    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanEmail || !postId || !action) {
      return NextResponse.json({ error: "Email, postId, and action are required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const post = await prisma.hivePost.findUnique({
      where: { id: postId },
      include: {
        hive: {
          include: {
            members: true
          }
        }
      }
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const userMembership = post.hive.members.find(m => m.userId === user.id);
    const isAdmin = userMembership?.role === "ADMIN";
    const isAuthor = post.userId === user.id;

    if (action === "DELETE") {
      if (!isAuthor && !isAdmin) {
        return NextResponse.json({ error: "Unauthorized. Only the author or an admin can delete posts." }, { status: 403 });
      }
      await prisma.hivePost.delete({ where: { id: postId } });
      return NextResponse.json({ success: true, deleted: true });
    }

    if (action === "EDIT") {
      if (!isAuthor) {
        return NextResponse.json({ error: "Unauthorized. Only the author can edit their post." }, { status: 403 });
      }
      if (!body?.trim()) {
        return NextResponse.json({ error: "Post body cannot be empty." }, { status: 400 });
      }
      await prisma.hivePost.update({
        where: { id: postId },
        data: { body: body.trim() }
      });
      return NextResponse.json({ success: true, edited: true });
    }

    if (action === "PIN") {
      if (!isAdmin) {
        return NextResponse.json({ error: "Unauthorized. Only admins can pin posts." }, { status: 403 });
      }
      await prisma.hivePost.update({
        where: { id: postId },
        data: { pinned: true }
      });
      return NextResponse.json({ success: true, pinned: true });
    }

    if (action === "UNPIN") {
      if (!isAdmin) {
        return NextResponse.json({ error: "Unauthorized. Only admins can unpin posts." }, { status: 403 });
      }
      await prisma.hivePost.update({
        where: { id: postId },
        data: { pinned: false }
      });
      return NextResponse.json({ success: true, pinned: false });
    }

    if (action === "REPORT") {
      if (!userMembership) {
        return NextResponse.json({ error: "Only hive members can report content." }, { status: 403 });
      }
      await prisma.hivePost.update({
        where: { id: postId },
        data: { reported: true }
      });
      return NextResponse.json({ success: true, reported: true });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("Post interaction error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
