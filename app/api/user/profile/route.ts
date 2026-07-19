import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({
      email: user.email,
      name: user.name || user.email.split("@")[0],
      image: user.image
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
