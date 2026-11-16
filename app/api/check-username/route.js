
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();

    const username = String(body.username || "")
      .trim()
      .toLowerCase();

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json(
        { error: "Invalid username format." },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data, error } = await supabase.rpc(
      "is_username_available",
      {
        candidate_username: username,
      }
    );

    if (error) {
      console.error("Username check failed:", error.message);

      return NextResponse.json(
        { error: "Could not check username availability." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { available: data },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}
