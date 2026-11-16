
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.replace("/login");
        return;
      }

      setUser(user);

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("id", user.id)
        .single();

      if (profileError) {
        setMessage("Could not load your profile. Please try again.");
      } else {
        setFullName(
          data?.full_name || user.user_metadata?.full_name || ""
        );

        const savedUsername = data?.username || "";
        setUsername(savedUsername);
        setOriginalUsername(savedUsername);
      }

      setLoading(false);
    }

    loadProfile();
  }, [supabase, router]);

  function handleUsernameChange(value) {
    const clean = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(clean);
    setUsernameStatus("");
    setMessage("");
  }

  async function checkUsername() {
    const clean = username.trim().toLowerCase();

    if (clean === originalUsername) {
      setUsernameStatus("Your current username.");
      return true;
    }

    if (!/^[a-z0-9_]{3,20}$/.test(clean)) {
      setUsernameStatus(
        "Use 3–20 lowercase letters, numbers or underscores."
      );
      return false;
    }

    setCheckingUsername(true);
    setUsernameStatus("");

    try {
      const response = await fetch("/api/check-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: clean }),
      });

      const result = await response.json();

      if (!response.ok) {
        setUsernameStatus(
          result.error || "Could not check username."
        );
        return false;
      }

      if (result.available) {
        setUsernameStatus("Username is available!");
        return true;
      }

      setUsernameStatus("This username is already taken.");
      return false;
    } catch {
      setUsernameStatus("Could not check username. Try again.");
      return false;
    } finally {
      setCheckingUsername(false);
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    setMessage("");

    const cleanName = fullName.trim();
    const cleanUsername = username.trim().toLowerCase();

    if (!cleanName) {
      setMessage("Please enter your full name.");
      return;
    }

    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
      setMessage(
        "Username must be 3–20 characters and contain only lowercase letters, numbers and underscores."
      );
      return;
    }

    setSaving(true);

    if (cleanUsername !== originalUsername) {
      const available = await checkUsername();

      if (!available) {
        setMessage("Please choose an available username.");
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: cleanName,
        username: cleanUsername,
      })
      .eq("id", user.id);

    if (error) {
      if (error.code === "23505") {
        setMessage("This username is already taken. Choose another.");
      } else {
        setMessage(error.message);
      }

      setSaving(false);
      return;
    }

    const { error: metadataError } = await supabase.auth.updateUser({
      data: { full_name: cleanName },
    });

    setOriginalUsername(cleanUsername);

    if (metadataError) {
      setMessage("Profile saved, but account name could not be updated.");
    } else {
      setMessage("Profile updated successfully!");
    }

    setUsernameStatus("Your username is saved.");
    setSaving(false);
  }

  if (loading) {
    return <div className="card">Loading your profile...</div>;
  }

  return (
    <section className="auth-card card">
      <h2>My Profile</h2>
      <p className="muted">
        View and update your student account details.
      </p>

      <form onSubmit={handleSave}>
        <label>Full Name</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Enter your full name"
          required
        />

        <label>Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => handleUsernameChange(e.target.value)}
          onBlur={checkUsername}
          placeholder="e.g. assam_learner27"
          minLength={3}
          maxLength={20}
          autoComplete="username"
          spellCheck={false}
          required
        />

        <p className="muted">
          3–20 characters. Lowercase letters, numbers and underscores only.
          You can change your username anytime.
        </p>

        {usernameStatus && (
          <p
            className={
              usernameStatus === "Username is available!" ||
              usernameStatus === "Your current username." ||
              usernameStatus === "Your username is saved."
                ? "auth-success"
                : "auth-error"
            }
            role="status"
          >
            {checkingUsername ? "Checking..." : usernameStatus}
          </p>
        )}

        <label>Email Address</label>
        <input
          type="email"
          value={user?.email || ""}
          disabled
        />

        <button
          className="btn auth-submit"
          type="submit"
          disabled={saving || checkingUsername}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {message && <p className="auth-success">{message}</p>}
    </section>
  );
}
