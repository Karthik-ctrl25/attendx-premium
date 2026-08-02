import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset password — AttendX" },
      {
        name: "description",
        content: "Set a new password for your AttendX account and get back to your attendance.",
      },
      { property: "og:title", content: "Reset password — AttendX" },
      {
        property: "og:description",
        content: "Set a new AttendX password and return to your attendance dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Supabase delivers the recovery session through the URL fragment.
    const hash = window.location.hash;
    const isRecovery = hash.includes("type=recovery");
    supabase.auth.getSession().then(({ data }) => {
      if (data.session || isRecovery) setReady(true);
      else setError("This reset link is invalid or has expired. Request a new one.");
    });
  }, []);

  const submit = async () => {
    setBusy(true);
    setError("");
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    toast.success("Password updated");
    navigate({ to: "/", replace: true });
  };

  const canSubmit = password.length >= 6 && password === confirm && !busy && ready;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-16">
      <div className="glass-strong space-y-3 rounded-3xl p-5">
        <div>
          <h1 className="font-display text-[22px] font-semibold tracking-tight">
            Set a new password
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Choose a password with at least 6 characters.
          </p>
        </div>
        <Input
          type="password"
          autoComplete="new-password"
          placeholder="New password"
          aria-label="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 rounded-2xl border-white/70 bg-white/70 text-[15px] shadow-none"
        />
        <Input
          type="password"
          autoComplete="new-password"
          placeholder="Confirm password"
          aria-label="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="h-12 rounded-2xl border-white/70 bg-white/70 text-[15px] shadow-none"
        />
        {error ? <p className="text-[13px] text-destructive">{error}</p> : null}
        <Button disabled={!canSubmit} onClick={submit} className="h-12 w-full rounded-2xl">
          Update password
        </Button>
      </div>
    </div>
  );
}
