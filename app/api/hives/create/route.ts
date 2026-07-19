import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const {
      email,
      name,
      description,
      category,
      coverImage,
      profileImage,
      tags,
      visibility
    } = await request.json();

    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanEmail || !name?.trim() || !description?.trim() || !category) {
      return NextResponse.json(
        { error: "Email, name, description, and category are required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      return NextResponse.json({ error: "Creator user not found." }, { status: 404 });
    }

    // Generate unique ID
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    
    // Check uniqueness of ID
    let hiveId = slug;
    let counter = 1;
    while (await prisma.hive.findUnique({ where: { id: hiveId } })) {
      hiveId = `${slug}-${counter}`;
      counter++;
    }

    // Create the Hive
    const hive = await prisma.hive.create({
      data: {
        id: hiveId,
        name: name.trim(),
        topic: tags || name.toLowerCase(),
        description: description.trim(),
        category,
        coverImage: coverImage || "https://images.unsplash.com/photo-1497002901387-49a211a40fc9?w=800&auto=format&fit=crop&q=60",
        profileImage: profileImage || null,
        tags: tags || null,
        visibility: visibility || "PUBLIC",
        challenge: "Welcome! Introduce yourself and share your first learning milestone."
      }
    });

    // Automatically make creator the ADMIN member
    await prisma.hiveMember.create({
      data: {
        hiveId: hive.id,
        userId: user.id,
        role: "ADMIN"
      }
    });

    return NextResponse.json({ success: true, hiveId: hive.id });
  } catch (error) {
    console.error("Create hive error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
