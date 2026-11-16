
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        router.replace("/login");
        return;
      }

      setUser(user);

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (profileError) {
        setMessage("Could not load your profile. Please try again.");
      } else {
        setFullName(data?.full_name || user.user_metadata?.full_name || "");
      }

      setLoading(false);
    }

    loadProfile();
  }, [supabase, router]);

  async function handleSave(event) {
    event.preventDefault();
    setMessage("");

    if (!fullName.trim()) {
      setMessage("Please enter your full name.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() })
      .eq("id", user.id);

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    const { error: metadataError } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim() },
    });

    if (metadataError) {
      setMessage("Profile saved, but account name could not be updated.");
    } else {
      setMessage("Profile updated successfully!");
    }

    setSaving(false);
  }

  if (loading) {
    return <div className="card">Loading your profile...</div>;
  }

  return (
    <section className="auth-card card">
      <h2>My Profile</h2>
      <p className="muted">View and update your student account details.</p>

      <form onSubmit={handleSave}>
        <label>Full Name</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Enter your full name"
          required
        />

        <label>Email Address</label>
        <input type="email" value={user?.email || ""} disabled />

        <button className="btn auth-submit" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {message && <p className="auth-success">{message}</p>}
    </section>
  );
}
