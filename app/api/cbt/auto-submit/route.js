import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { attemptId } = body;

    if (!attemptId) {
      return NextResponse.json(
        { error: "Attempt ID is required" },
        { status: 400 }
      );
    }

    const { data: attempt, error: attemptError } =
      await supabaseAdmin
        .from("test_attempts")
        .select("id, student_id, status, deadline_at")
        .eq("id", attemptId)
        .eq("student_id", user.id)
        .single();

    if (attemptError || !attempt) {
      return NextResponse.json(
        { error: "Attempt not found" },
        { status: 404 }
      );
    }

    if (attempt.status === "submitted") {
      return NextResponse.json(
        { error: "Already submitted" },
        { status: 409 }
      );
    }

    if (attempt.status !== "in_progress") {
      return NextResponse.json(
        { error: "Attempt is not active" },
        { status: 400 }
      );
    }

    if (!attempt.deadline_at) {
      return NextResponse.json(
        { error: "Attempt deadline not found" },
        { status: 400 }
      );
    }

    if (new Date(attempt.deadline_at).getTime() > Date.now()) {
      return NextResponse.json(
        { error: "Deadline has not expired" },
        { status: 400 }
      );
    }

    const { data, error: submitError } =
      await supabaseAdmin.rpc("submit_cbt_attempt", {
        p_attempt_id: attempt.id,
        p_student_id: user.id,
        p_auto_submit: true,
      });

    if (submitError) {
      return NextResponse.json(
        { error: submitError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Test auto-submitted successfully",
      result: data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}