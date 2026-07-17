import { createAdminClient } from "@/lib/supabase/admin";

export const DAILY_FREE_BASIC_LIMIT = 3;

export type AccountUsage = {
  dailyFreeLimit: number;
  dailyFreeUsed: number;
  dailyFreeRemaining: number;
  resetsAt: string;
  creditBalance: number;
};

export function utcUsageWindow(now = new Date()) {
  const usageDate = now.toISOString().slice(0, 10);
  const resetsAt = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  )).toISOString();
  return { usageDate, resetsAt };
}

export async function getAccountUsage(userId: string): Promise<AccountUsage> {
  const admin = createAdminClient();
  const { usageDate, resetsAt } = utcUsageWindow();
  const [dailyResult, creditResult] = await Promise.all([
    admin
      .from("daily_free_usage")
      .select("used_count")
      .eq("user_id", userId)
      .eq("usage_date", usageDate)
      .maybeSingle(),
    admin
      .from("credit_accounts")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (dailyResult.error) throw new Error(`Daily free usage could not be loaded: ${dailyResult.error.message}`);
  if (creditResult.error) throw new Error(`Credit balance could not be loaded: ${creditResult.error.message}`);

  const dailyFreeUsed = Math.min(DAILY_FREE_BASIC_LIMIT, Math.max(0, dailyResult.data?.used_count ?? 0));
  return {
    dailyFreeLimit: DAILY_FREE_BASIC_LIMIT,
    dailyFreeUsed,
    dailyFreeRemaining: DAILY_FREE_BASIC_LIMIT - dailyFreeUsed,
    resetsAt,
    creditBalance: creditResult.data?.balance ?? 0,
  };
}
