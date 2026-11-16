
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ChangePasswordPage() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        router.replace("/login");
        return;
      }

      setLoading(false);
    }

    checkUser();
  }, [supabase, router]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);

    if (password.length < 8) {
      setMessage("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setSuccess(true);
      setMessage("Your password has been changed successfully!");
      setPassword("");
      setConfirmPassword("");
    }

    setSaving(false);
  }

  if (loading) {
    return <div className="card">Checking your account...</div>;
  }

  return (
    <section className="auth-card card">
      <h2>Change Password</h2>
      <p className="muted">
        Choose a new password for your ASSAM ASTRA account.
      </p>

      <form onSubmit={handleSubmit}>
        <label>New Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter new password"
          minLength={8}
          required
        />

        <label>Confirm New Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          minLength={8}
          required
        />

        <button className="btn auth-submit" type="submit" disabled={saving}>
          {saving ? "Updating..." : "Update Password"}
        </button>
      </form>

      {message && (
        <p className={success ? "auth-success" : "auth-error"}>
          {message}
        </p>
      )}
    </section>
  );
}
