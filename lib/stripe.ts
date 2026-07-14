import Stripe from "stripe";
import { requireEnv } from "@/lib/env";

export function getStripe() {
  return new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
    appInfo: { name: "Home Design AI", version: "0.1.0" },
  });
}
