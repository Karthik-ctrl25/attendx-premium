import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, MailCheck, Sparkles } from "lucide-react";

import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Google "G" mark — inline so the screen works fully offline. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.500-4.9 7.2l7.6 5.9c4.4-4.1 7.1-10.2 7.1-17.6z"
      />
      <path
        fill="#FBBC05"
        d="M10.4 28.7a14.6 14.6 0 0 1 0-9.4l-7.8-6.1a24 24 0 0 0 0 21.6l7.8-6.1z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.8 2.3-8.3 2.3-6.4 0-11.7-3.7-13.6-9.9l-7.8 6.1C6.5 42.6 14.6 48 24 48z"
      />
    </svg>
  );
}

type Mode = "signin" | "signup" | "forgot";

const field = "h-12 rounded-2xl border-white/70 bg-white/70 text-[15px] shadow-none";

export function AuthScreen({ onContinue }: { onContinue?: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const reset = () => {
    setError("");
    setNotice("");
  };

  const signInGoogle = async () => {
    setBusy(true);
    reset();
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Could not sign in with Google. Please try again.");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    onContinue?.();
    setBusy(false);
  };

  const submitEmail = async () => {
    setBusy(true);
    reset();
    try {
      if (mode === "forgot") {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (err) throw err;
        setNotice("Password reset link sent. Check your inbox.");
        return;
      }
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (err) throw err;
        if (!data.session) {
          setNotice("Account created. Verify your email, then sign in.");
          setMode("signin");
          setPassword("");
        } else {
          onContinue?.();
        }
        return;
      }
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (err) throw err;
      onContinue?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const canSubmit =
    email.trim().includes("@") && (mode === "forgot" || password.length >= 6) && !busy;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="grid size-24 place-items-center rounded-[30px] bg-[image:var(--gradient-ink)] text-ink-foreground shadow-float"
      >
        <Sparkles className="size-10" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mt-9 font-display text-[40px] font-semibold leading-[1.05] tracking-tight"
      >
        Welcome to AttendX
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mt-3 text-[15px] text-muted-foreground"
      >
        Built for CMR University Students
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mt-10 w-full space-y-3"
      >
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={signInGoogle}
          disabled={busy}
          className="glass-strong flex h-14 w-full items-center justify-center gap-3 rounded-[22px] text-[15px] font-medium transition-transform duration-300 hover:-translate-y-0.5"
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : <GoogleMark />}
          Continue with Google
        </motion.button>
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">
          Recommended
        </p>

        <div className="flex items-center gap-3 pt-2">
          <span className="h-px flex-1 bg-foreground/10" />
          <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">or</span>
          <span className="h-px flex-1 bg-foreground/10" />
        </div>

        <form
          className="space-y-2.5 pt-2 text-left"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) void submitEmail();
          }}
        >
          <Input
            type="email"
            autoComplete="email"
            placeholder="Email"
            aria-label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={field}
          />
          {mode === "forgot" ? null : (
            <Input
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder="Password"
              aria-label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={field}
            />
          )}

          <Button
            type="submit"
            disabled={!canSubmit}
            className="h-12 w-full rounded-2xl text-[15px]"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            {mode === "forgot"
              ? "Send reset link"
              : mode === "signup"
                ? "Create Account"
                : "Sign In"}
          </Button>

          <div className="flex items-center justify-between pt-1 text-[13px]">
            <button
              type="button"
              className="text-muted-foreground underline-offset-4 hover:underline"
              onClick={() => {
                reset();
                setMode(mode === "signup" ? "signin" : "signup");
              }}
            >
              {mode === "signup" ? "Sign In" : "Create Account"}
            </button>
            <button
              type="button"
              className="text-muted-foreground underline-offset-4 hover:underline"
              onClick={() => {
                reset();
                setMode(mode === "forgot" ? "signin" : "forgot");
              }}
            >
              {mode === "forgot" ? "Back to sign in" : "Forgot Password"}
            </button>
          </div>
        </form>
      </motion.div>

      {error ? <p className="mt-4 text-[13px] text-destructive">{error}</p> : null}
      {notice ? (
        <p className="mt-4 flex items-center justify-center gap-2 text-[13px] text-muted-foreground">
          <MailCheck className="size-4" /> {notice}
        </p>
      ) : null}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.6 }}
        className="mt-10 max-w-xs text-[13px] leading-relaxed text-muted-foreground"
      >
        Your data stays private. Nothing is uploaded without your permission.
      </motion.p>
    </div>
  );
}
