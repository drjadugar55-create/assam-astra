import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Response.json(
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
      return Response.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { attemptId } = body;

    if (!attemptId) {
      return Response.json(
        { error: "Attempt ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.rpc(
      "pause_cbt_attempt",
      {
        p_attempt_id: attemptId,
        p_student_id: user.id,
      }
    );

    if (error) {
      const message = error.message || "";

      if (message.includes("Attempt not found")) {
        return Response.json(
          { error: "Attempt not found" },
          { status: 404 }
        );
      }

      if (message.includes("Attempt is not active")) {
        return Response.json(
          { error: "Attempt is not active" },
          { status: 409 }
        );
      }

      if (message.includes("Deadline expired")) {
        return Response.json(
          { error: "Deadline expired" },
          { status: 409 }
        );
      }

      console.error("Pause attempt error:", error);

      return Response.json(
        { error: "Unable to pause attempt" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      attempt: data,
    });
  } catch (error) {
    console.error("Pause API error:", error);

    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}