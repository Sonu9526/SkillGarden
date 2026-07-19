import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim().toLowerCase() || "";
    const category = searchParams.get("category")?.trim() || "";
    const email = searchParams.get("email")?.trim().toLowerCase() || "";

    const where: any = {};

    if (category && category !== "All") {
      where.category = category;
    }

    if (query) {
      where.OR = [
        { name: { contains: query } },
        { description: { contains: query } },
        { tags: { contains: query } }
      ];
    }

    const hives = await prisma.hive.findMany({
      where,
      include: {
        members: true
      }
    });

    let joinedHiveIds: string[] = [];
    if (email) {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { memberships: true }
      });
      if (user) {
        joinedHiveIds = user.memberships.map(m => m.hiveId);
      }
    }

    const result = hives.map(hive => ({
      id: hive.id,
      name: hive.name,
      description: hive.description,
      category: hive.category,
      coverImage: hive.coverImage,
      profileImage: hive.profileImage,
      tags: hive.tags,
      memberCount: hive.members.length,
      isJoined: joinedHiveIds.includes(hive.id)
    }));

    return NextResponse.json({ hives: result });
  } catch (error) {
    console.error("Discover hives error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
