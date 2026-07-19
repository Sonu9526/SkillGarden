import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.trim().toLowerCase();

    let dbHives = await prisma.hive.findMany({
      include: {
        posts: {
          orderBy: { createdAt: "desc" },
          include: {
            user: true,
            reactions: true
          }
        },
        members: true
      }
    });

    if (dbHives.length === 0) {
      // Seed default users
      const usersData = [
        { email: "maya@gmail.com", name: "Maya" },
        { email: "priya@gmail.com", name: "Priya" },
        { email: "jon@gmail.com", name: "Jon" },
        { email: "elena@gmail.com", name: "Elena" },
        { email: "sam@gmail.com", name: "Sam" },
        { email: "nora@gmail.com", name: "Nora" },
        { email: "ibrahim@gmail.com", name: "Ibrahim" },
        { email: "ari@gmail.com", name: "Ari" }
      ];

      const users = await Promise.all(
        usersData.map(u =>
          prisma.user.upsert({
            where: { email: u.email },
            update: {},
            create: { email: u.email, name: u.name }
          })
        )
      );

      const userMap = new Map(users.map(u => [u.name, u.id]));

      // Seed Hives
      const hivesData = [
        {
          id: "creative-starters",
          name: "The Starter Greenhouse",
          topic: "creative hobbies",
          description: "A gentle general-purpose hive for people building any new creative or technical habit.",
          category: "General",
          tags: "creative,hobbies,habits",
          visibility: "PUBLIC",
          coverImage: "https://images.unsplash.com/photo-1497002901387-49a211a40fc9?w=800&auto=format&fit=crop&q=60",
          profileImage: "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=150&auto=format&fit=crop&q=60",
          challenge: "Share one tiny win and one thing you want to repeat tomorrow."
        },
        {
          id: "guitar-grove",
          name: "Guitar Grove",
          topic: "guitar",
          description: "Short practice check-ins for chord changes, rhythm, songs, and clean repetition.",
          category: "Music",
          tags: "guitar,music,instrument",
          visibility: "PUBLIC",
          coverImage: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&auto=format&fit=crop&q=60",
          profileImage: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=150&auto=format&fit=crop&q=60",
          challenge: "Record one clean chord transition at slow tempo, then encourage someone else."
        },
        {
          id: "code-conservatory",
          name: "Code Conservatory",
          topic: "coding python programming",
          description: "A small group for coding learners practicing concepts through tiny working projects.",
          category: "Coding",
          tags: "coding,python,javascript",
          visibility: "PUBLIC",
          coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60",
          profileImage: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=150&auto=format&fit=crop&q=60",
          challenge: "Build or improve one 20-line script and post what changed."
        },
        {
          id: "chess-orchard",
          name: "Chess Orchard",
          topic: "chess",
          description: "Puzzle reps, opening principles, and post-game reflections without the pressure spiral.",
          category: "Gaming",
          tags: "chess,boardgames,strategy",
          visibility: "PUBLIC",
          coverImage: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&auto=format&fit=crop&q=60",
          profileImage: "https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=150&auto=format&fit=crop&q=60",
          challenge: "Solve three puzzles slowly and write the candidate moves before choosing."
        },
        {
          id: "paint-patch",
          name: "Paint Patch",
          topic: "watercolor painting drawing art",
          description: "Color, shape, and sketch studies for visual artists growing through small sessions.",
          category: "Art",
          tags: "watercolor,painting,sketching",
          visibility: "PUBLIC",
          coverImage: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&auto=format&fit=crop&q=60",
          profileImage: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=150&auto=format&fit=crop&q=60",
          challenge: "Make one small study using only two colors and post what you noticed."
        }
      ];

      for (const h of hivesData) {
        await prisma.hive.create({ data: h });
      }

      // Seed Hive Members
      const membersData = [
        { hiveId: "creative-starters", userName: "Maya", role: "ADMIN" },
        { hiveId: "creative-starters", userName: "Priya", role: "MEMBER" },
        { hiveId: "guitar-grove", userName: "Jon", role: "ADMIN" },
        { hiveId: "guitar-grove", userName: "Elena", role: "MEMBER" },
        { hiveId: "code-conservatory", userName: "Sam", role: "ADMIN" },
        { hiveId: "code-conservatory", userName: "Nora", role: "MEMBER" },
        { hiveId: "chess-orchard", userName: "Ibrahim", role: "ADMIN" },
        { hiveId: "paint-patch", userName: "Ari", role: "ADMIN" }
      ];

      for (const m of membersData) {
        const userId = userMap.get(m.userName);
        if (userId) {
          await prisma.hiveMember.create({
            data: { hiveId: m.hiveId, userId, role: m.role }
          });
        }
      }

      // Seed posts
      const postsData = [
        {
          hiveId: "creative-starters",
          userName: "Maya",
          body: "Finished a 12-minute value study today. The tiny timer made it much less intimidating.",
          reactions: [{ type: "CHEER", count: 14 }, { type: "INSPIRED", count: 6 }, { type: "HELPFUL", count: 3 }]
        },
        {
          hiveId: "creative-starters",
          userName: "Priya",
          body: "Refactored one tiny script and explained the change in plain English. It made the code feel less mysterious.",
          reactions: [{ type: "CHEER", count: 11 }, { type: "INSPIRED", count: 8 }, { type: "HELPFUL", count: 12 }]
        },
        {
          hiveId: "guitar-grove",
          userName: "Jon",
          body: "Shared a clean C to G transition: five slow reps, then one recorded pass.",
          reactions: [{ type: "CHEER", count: 9 }, { type: "INSPIRED", count: 4 }, { type: "HELPFUL", count: 7 }]
        },
        {
          hiveId: "guitar-grove",
          userName: "Elena",
          body: "Kept strumming through mistakes instead of restarting. That alone felt like progress.",
          reactions: [{ type: "CHEER", count: 18 }, { type: "INSPIRED", count: 10 }, { type: "HELPFUL", count: 5 }]
        },
        {
          hiveId: "code-conservatory",
          userName: "Sam",
          body: "Turned my calculator exercise into functions. Still basic, but now I can actually read it.",
          reactions: [{ type: "CHEER", count: 15 }, { type: "INSPIRED", count: 7 }, { type: "HELPFUL", count: 11 }]
        },
        {
          hiveId: "code-conservatory",
          userName: "Nora",
          body: "Today I learned to print intermediate values while debugging instead of guessing.",
          reactions: [{ type: "CHEER", count: 8 }, { type: "INSPIRED", count: 3 }, { type: "HELPFUL", count: 14 }]
        },
        {
          hiveId: "chess-orchard",
          userName: "Ibrahim",
          body: "I stopped moving instantly in puzzle mode and found a tactic I normally miss.",
          reactions: [{ type: "CHEER", count: 12 }, { type: "INSPIRED", count: 5 }, { type: "HELPFUL", count: 8 }]
        },
        {
          hiveId: "paint-patch",
          userName: "Ari",
          body: "Limited myself to blue and burnt sienna. The shadows were easier to compare.",
          reactions: [{ type: "CHEER", count: 17 }, { type: "INSPIRED", count: 13 }, { type: "HELPFUL", count: 6 }]
        }
      ];

      for (const p of postsData) {
        const userId = userMap.get(p.userName);
        if (userId) {
          const post = await prisma.hivePost.create({
            data: {
              hiveId: p.hiveId,
              userId,
              body: p.body
            }
          });

          // Seed reactions
          for (const r of p.reactions) {
            const count = Math.min(r.count, users.length);
            for (let i = 0; i < count; i++) {
              if (users[i].id !== userId) {
                try {
                  await prisma.reaction.create({
                    data: {
                      postId: post.id,
                      userId: users[i].id,
                      type: r.type
                    }
                  });
                } catch (e) {
                  // ignore duplicates
                }
              }
            }
          }
        }
      }

      // Re-fetch dbHives after seeding
      dbHives = await prisma.hive.findMany({
        include: {
          posts: {
            orderBy: { createdAt: "desc" },
            include: {
              user: true,
              reactions: true
            }
          },
          members: true
        }
      });
    }

    // Map to client schema format
    const result = dbHives.map(hive => ({
      id: hive.id,
      name: hive.name,
      topic: hive.topic,
      description: hive.description,
      challenge: hive.challenge,
      members: hive.members.length,
      posts: hive.posts.map(post => {
        const cheerCount = post.reactions.filter(r => r.type === "CHEER").length;
        const inspiredCount = post.reactions.filter(r => r.type === "INSPIRED").length;
        const helpfulCount = post.reactions.filter(r => r.type === "HELPFUL").length;

        const timeDiff = Date.now() - new Date(post.createdAt).getTime();
        const mins = Math.floor(timeDiff / (1000 * 60));
        const hrs = Math.floor(mins / 60);
        let timeStr = "just now";
        if (hrs > 0) {
          timeStr = `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
        } else if (mins > 0) {
          timeStr = `${mins} min${mins > 1 ? "s" : ""} ago`;
        }

        return {
          id: post.id,
          author: post.user.name || post.user.email.split("@")[0],
          authorImage: post.user.image,
          skill: hive.topic.split(" ")[0],
          body: post.body,
          time: timeStr,
          reactions: {
            cheer: cheerCount,
            inspired: inspiredCount,
            helpful: helpfulCount
          }
        };
      })
    }));

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

    return NextResponse.json({ hives: result, joinedHiveIds });
  } catch (error) {
    console.error("Hives GET error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
