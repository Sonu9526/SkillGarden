import { NextResponse } from "next/server";
import type { Video } from "@/app/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ videos: [] });
  }

  if (!process.env.YOUTUBE_API_KEY) {
    return NextResponse.json({ videos: fallbackVideos(query), source: "fallback" });
  }

  try {
    const params = new URLSearchParams({
      key: process.env.YOUTUBE_API_KEY,
      part: "snippet",
      q: query,
      type: "video",
      maxResults: "4",
      videoEmbeddable: "true",
      safeSearch: "moderate",
      relevanceLanguage: "en"
    });
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);

    if (!response.ok) {
      throw new Error(`YouTube request failed with ${response.status}`);
    }

    const data = await response.json();
    const videos: Video[] = (data.items ?? []).map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.default?.url ?? "",
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`
    }));

    return NextResponse.json({ videos, source: "youtube" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ videos: fallbackVideos(query), source: "fallback" });
  }
}

function fallbackVideos(query: string): Video[] {
  const encoded = encodeURIComponent(query);
  return [
    {
      id: "search",
      title: `Find a focused tutorial for "${query}"`,
      channel: "YouTube search",
      thumbnail: "",
      url: `https://www.youtube.com/results?search_query=${encoded}`,
      embedUrl: "https://www.youtube.com/embed?listType=search&list=" + encoded
    }
  ];
}
