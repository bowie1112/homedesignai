import { z } from "zod";
import { aspectRatios, tools } from "@/lib/site";

const toolKeys = tools.map((tool) => tool.key) as [string, ...string[]];

export const generationInputSchema = z.object({
  tool: z.enum(toolKeys),
  tier: z.enum(["basic", "pro"]),
  prompt: z.string().trim().min(12).max(20_000),
  inputAssetIds: z.array(z.string().uuid()).max(14).default([]),
  roomType: z.string().trim().max(80).default("Living room"),
  style: z.string().trim().max(100).default("Warm minimal"),
  aspectRatio: z.enum(aspectRatios).default("4:3"),
});

export type GenerationInput = z.infer<typeof generationInputSchema>;

export type GenerationJobStatus = "queued" | "processing" | "delayed" | "persisting" | "success" | "failed" | "refunded";

export type GenerationJobRow = {
  id: string;
  user_id: string;
  tool: string;
  tier: "basic" | "pro";
  prompt: string;
  input_asset_ids: string[];
  room_type: string;
  style: string;
  aspect_ratio: string;
  status: GenerationJobStatus;
  credit_cost: number;
  kie_task_id: string | null;
  provider_state: string | null;
  provider_credits_consumed: number | null;
  result_asset_id: string | null;
  result_migrated_at: string | null;
  error_code: string | null;
  error_message: string | null;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;
};
