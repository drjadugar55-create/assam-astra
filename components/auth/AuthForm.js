"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/components/Site";

export default function AuthForm({ mode }) {
  const router = useRouter();
  const { lang } = useLang();
  const en = lang === "en";
  const isRegister = mode === "register";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const supabase = createClient();

      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (error) throw error;

        if (data.session) {
          router.push("/dashboard");
          router.refresh();
        } else {
          setMessage(
            en
              ? "Registration successful! Check your email and click the confirmation link before logging in."
              : "পঞ্জীয়ন সফল হৈছে! ইমেইল পৰীক্ষা কৰি নিশ্চিতকৰণ লিংকত ক্লিক কৰক।"
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card login auth-card">
      <small>ASSAM ASTRA · STUDENT ACCOUNT</small>

      <h2>
        {isRegister
          ? en ? "Create your account" : "আপোনাৰ একাউণ্ট সৃষ্টি কৰক"
          : en ? "Student sign in" : "ছাত্ৰ লগইন"}
      </h2>

      <p>
        {isRegister
          ? en ? "Join ASSAM ASTRA and start your preparation."
                : "ASSAM ASTRA-ত যোগ দি প্ৰস্তুতি আৰম্ভ কৰক।"
          : en ? "Welcome back. Sign in to continue learning."
                : "পুনৰ স্বাগতম। পঢ়া অব্যাহত ৰাখিবলৈ লগইন কৰক।"}
      </p>

      <form onSubmit={handleSubmit}>
        {isRegister && (
          <input
            type="text"
            placeholder={en ? "Full name" : "সম্পূৰ্ণ নাম"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
            maxLength={100}
          />
        )}

        <input
          type="email"
          placeholder={en ? "Email address" : "ইমেইল ঠিকনা"}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <input
          type="password"
          placeholder={en ? "Password (minimum 8 characters)" : "পাছৱৰ্ড (কমেও ৮টা আখৰ)"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={isRegister ? "new-password" : "current-password"}
          minLength={8}
          required
        />

        {error && <p className="auth-error" role="alert">{error}</p>}
        {message && <p className="auth-success" role="status">{message}</p>}

        <button className="btn auth-submit" type="submit" disabled={loading}>
          {loading
            ? en ? "Please wait..." : "অপেক্ষা কৰক..."
            : isRegister
              ? en ? "Create account" : "একাউণ্ট সৃষ্টি কৰক"
              : en ? "Sign in" : "লগইন কৰক"}
        </button>
      </form>

      <p className="auth-switch">
        {isRegister
          ? en ? "Already have an account?" : "ইতিমধ্যে একাউণ্ট আছে?"
          : en ? "New to ASSAM ASTRA?" : "ASSAM ASTRA-ত নতুন?"}
        {" "}
        <Link href={isRegister ? "/login" : "/register"}>
          {isRegister
            ? en ? "Sign in" : "লগইন"
            : en ? "Register" : "পঞ্জীয়ন"}
        </Link>
      </p>
    </section>
  );
}
