import Stripe from "stripe";
import { ConfigurationError, requireEnv } from "@/lib/env";

const controlCharacters = /[\u0000-\u001f\u007f]/;

function requireStripeEnv(name: string, prefix: string) {
  const value = requireEnv(name).trim();
  if (!value.startsWith(prefix) || controlCharacters.test(value)) {
    throw new ConfigurationError(`${name} is invalid.`);
  }
  return value;
}

export function getStripe() {
  return new Stripe(requireStripeEnv("STRIPE_SECRET_KEY", "sk_"), {
    appInfo: { name: "Home Design AI", version: "0.1.0" },
  });
}

export function getStripeWebhookSecret() {
  return requireStripeEnv("STRIPE_WEBHOOK_SECRET", "whsec_");
}
