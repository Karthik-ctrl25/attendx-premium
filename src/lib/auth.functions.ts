import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ServerRole = "student" | "cr" | "admin";

/**
 * Server-verified role. The client never decides who is an admin — this reads
 * the `roles` table with the caller's own bearer token and returns the highest
 * role it actually owns.
 */
export const getMyRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ role: ServerRole; userId: string }> => {
    const { data, error } = await context.supabase
      .from("roles")
      .select("role")
      .eq("user_id", context.userId);
    if (error) throw error;
    const owned = (data ?? []).map((r) => r.role as ServerRole);
    const ranked: ServerRole[] = ["admin", "cr", "student"];
    return {
      role: ranked.find((r) => owned.includes(r)) ?? "student",
      userId: context.userId,
    };
  });
