import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, hiveId } = await request.json();
    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanEmail || !hiveId) {
      return NextResponse.json({ error: "Email and hiveId are required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Check if membership exists
    const existing = await prisma.hiveMember.findUnique({
      where: {
        hiveId_userId: {
          hiveId,
          userId: user.id
        }
      }
    });

    if (existing) {
      // Leave hive
      await prisma.hiveMember.delete({
        where: { id: existing.id }
      });
      return NextResponse.json({ joined: false });
    } else {
      // Join hive
      await prisma.hiveMember.create({
        data: {
          hiveId,
          userId: user.id
        }
      });
      return NextResponse.json({ joined: true });
    }
  } catch (error) {
    console.error("Join hive error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
