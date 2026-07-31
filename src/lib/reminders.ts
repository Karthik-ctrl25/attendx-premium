/**
 * Local evening reminder: "Did you attend today's classes?"
 *
 * Fully offline — uses the Notification API when permitted and always falls
 * back to an in-app toast. Fires at most once per calendar day.
 */
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import type { AppMeta, ClassSlot } from "./types";

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

function fire(count: number) {
  const body = count
    ? `You had ${count} class${count > 1 ? "es" : ""} today. Mark them in under 30 seconds.`
    : "Open AttendX to keep your record up to date.";
  if (notificationsSupported() && Notification.permission === "granted") {
    try {
      new Notification("Did you attend today's classes?", { body, tag: "attendx-daily" });
      return;
    } catch {
      /* fall through to toast */
    }
  }
  toast("Did you attend today's classes?", { description: body, duration: 10_000 });
}

/** Polls every minute while the app is open and fires once past the set time. */
export function useDailyReminder(
  meta: AppMeta,
  timetable: ClassSlot[],
  updateMeta: (patch: Partial<AppMeta>) => Promise<void>,
) {
  const latest = useRef({ meta, timetable, updateMeta });
  latest.current = { meta, timetable, updateMeta };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const check = () => {
      const { meta: m, timetable: tt, updateMeta: save } = latest.current;
      if (!m.setupComplete || m.reminderEnabled === false) return;

      const key = todayKey();
      if (m.lastReminderDate === key) return;

      const now = new Date();
      const [h, min] = (m.reminderTime || DEFAULT_REMINDER_TIME).split(":").map(Number);
      const due = now.getHours() > h || (now.getHours() === h && now.getMinutes() >= min);
      if (!due) return;

      const classes = tt.filter((s) => s.day === now.getDay()).length;
      void save({ lastReminderDate: key });
      fire(classes);
    };

    const timer = window.setInterval(check, 60_000);
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);
    const first = window.setTimeout(check, 4_000);

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
