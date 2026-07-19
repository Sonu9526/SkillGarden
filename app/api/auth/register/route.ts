import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanEmail || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
    }

    // Create new user (using plain text password for this mock/simple project)
    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        password: password,
        name: cleanEmail.split("@")[0] // default name
      }
    });

    return NextResponse.json({ success: true, email: user.email, name: user.name });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
