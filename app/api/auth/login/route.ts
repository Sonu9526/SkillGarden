import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, password, name, image, isGoogle } = await request.json();
    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanEmail) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    if (isGoogle) {
      // Find or upsert Google user
      const user = await prisma.user.upsert({
        where: { email: cleanEmail },
        update: {
          name: name || undefined,
          image: image || undefined
        },
        create: {
          email: cleanEmail,
          name: name || cleanEmail.split("@")[0],
          image: image || null
        }
      });
      return NextResponse.json({ success: true, email: user.email, name: user.name, image: user.image });
    }

    // Standard Sign In
    if (!password) {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    // Seed default users if it's the first time
    if (!user && (cleanEmail === "admin@gmail.com" || cleanEmail === "sonusnair@gmail.com" || cleanEmail === "bloom.demo@gmail.com") && password === "password") {
      const defaultUser = await prisma.user.create({
        data: {
          email: cleanEmail,
          password: "password",
          name: cleanEmail.split("@")[0]
        }
      });
      return NextResponse.json({ success: true, email: defaultUser.email, name: defaultUser.name, image: defaultUser.image });
    }

    if (!user || user.password !== password) {
      return NextResponse.json({ error: "Invalid email or password. Please check your credentials or register." }, { status: 401 });
    }

    return NextResponse.json({ success: true, email: user.email, name: user.name, image: user.image });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
