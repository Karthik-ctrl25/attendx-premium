/**
 * Weekly ERP verification reminder.
 *
 * Fully offline — uses the Notification API when permitted and always falls
 * back to an in-app toast. Fires at most once every seven days.
 */
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import type { AppMeta } from "./types";

export const DEFAULT_REMINDER_TIME = "19:00";

export const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export const WEEKLY_REMINDER_MESSAGE =
  "It's been a week since your last attendance verification. Open the CMR ERP, take a screenshot and upload it into AttendX.";

function fire() {
  if (notificationsSupported() && Notification.permission === "granted") {
    try {
      new Notification("\uD83D\uDCF8 Weekly attendance check", {
        body: WEEKLY_REMINDER_MESSAGE,
        tag: "attendx-weekly",
      });
      return;
    } catch {
      /* fall through to toast */
    }
  }
  toast("\uD83D\uDCF8 Weekly attendance check", {
    description: WEEKLY_REMINDER_MESSAGE,
    duration: 10_000,
  });
}

const WEEK_MS = 7 * 86_400_000;

/**
 * Weekly ERP verification reminder. Fires at most once every 7 days, and only
 * when the last verification is itself at least a week old.
 */
export function useWeeklyReminder(
  meta: AppMeta,
  updateMeta: (patch: Partial<AppMeta>) => Promise<void>,
) {
  const latest = useRef({ meta, updateMeta });
  latest.current = { meta, updateMeta };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const check = () => {
      const { meta: m, updateMeta: save } = latest.current;
      if (!m.setupComplete || m.reminderEnabled === false) return;

      const now = Date.now();
      if (m.lastVerifiedAt && now - m.lastVerifiedAt < WEEK_MS) return;

      const lastFired = m.lastReminderDate ? Date.parse(`${m.lastReminderDate}T00:00:00`) : 0;
      if (Number.isFinite(lastFired) && lastFired && now - lastFired < WEEK_MS) return;

      void save({ lastReminderDate: todayKey() });
      fire();
    };

    const timer = window.setInterval(check, 60 * 60_000);
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);
    const first = window.setTimeout(check, 5_000);

    return () => {
      window.clearInterval(timer);
      window.clearTimeout(first);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}

/** Days since the last ERP verification (Infinity when never verified). */
export function daysSinceVerified(meta: AppMeta): number {
  if (!meta.lastVerifiedAt) return Infinity;
  return (Date.now() - meta.lastVerifiedAt) / 86_400_000;
}

export const needsWeeklyVerification = (meta: AppMeta) =>
  meta.setupComplete && daysSinceVerified(meta) >= 7;
