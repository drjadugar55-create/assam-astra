
"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const C = createContext(null);

export const useLang = () => useContext(C);

export default function Site({ children }) {
  const [lang, setLang] = useState("en");
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  const en = lang === "en";

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (mounted && !error) {
        setUser(data.session?.user ?? null);
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const links = en
    ? [
        ["Home", "/"],
        ["ADRE Grade III", "/adre-grade-iii"],
        ["Mock Tests", "/mock-tests"],
        ["PYQs", "/pyqs"],
        ["Current Affairs", "/current-affairs"],
        ["Dashboard", "/dashboard"],
      ]
    : [
        ["মুখ্য পৃষ্ঠা", "/"],
        ["ADRE তৃতীয় শ্ৰেণী", "/adre-grade-iii"],
        ["মক টেষ্ট", "/mock-tests"],
        ["পূৰ্বৰ প্ৰশ্ন", "/pyqs"],
        ["সাম্প্ৰতিক পৰিঘটনা", "/current-affairs"],
        ["ডেশ্বব'ৰ্ড", "/dashboard"],
      ];

  const studentName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Student";

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    setMenuOpen(false);
    setUser(null);
    router.replace("/");
    router.refresh();
  }

  return (
    <C.Provider value={{ lang }}>
      <header className="header">
        <Link href="/" className="brand">
          <b>A</b>
          <span>
            ASSAM <i>ASTRA</i>
            <small>LEARN · PRACTICE · SUCCEED</small>
          </span>
        </Link>

        <nav>
          {links.map(([name, url]) => (
            <Link href={url} key={url}>
              {name}
            </Link>
          ))}
        </nav>

        <div className="actions">
          <button onClick={() => setLang(en ? "as" : "en")}>
            {en ? "অসমীয়া" : "English"}
          </button>

          {!user ? (
            <Link href="/login">
              {en ? "Login" : "লগইন"}
            </Link>
          ) : (
            <div className="account-wrap">
              <button
                className="account-trigger"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-expanded={menuOpen}
              >
                <span className="account-avatar">
                  {studentName.charAt(0).toUpperCase()}
                </span>
                <span className="account-name">
                  {studentName}
                </span>
                <span>⌄</span>
              </button>

              {menuOpen && (
                <div className="account-dropdown">
                  <div className="account-info">
                    <strong>{studentName}</strong>
                    <small>{user.email}</small>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                  >
                    My Dashboard
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                  >
                    Edit Profile
                  </Link>

                  <Link
                    href="/change-password"
                    onClick={() => setMenuOpen(false)}
                  >
                    Change Password
                  </Link>

                  <button onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="wrap">{children}</main>

      <footer className="footer">
        © {new Date().getFullYear()} ASSAM ASTRA ·{" "}
        {en
          ? "An independent learning platform for Assam exam aspirants."
          : "অসমৰ পৰীক্ষাৰ্থীৰ বাবে এক স্বতন্ত্ৰ শিক্ষণ মঞ্চ।"}
      </footer>
    </C.Provider>
  );
}
