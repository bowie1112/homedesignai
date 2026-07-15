import type { MetadataRoute } from "next";
import { converterPages, ideaPages, roomPages, tools } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const paths = [
    "",
    ...tools.map((tool) => tool.href),
    ...roomPages.map((page) => `/${page.slug}`),
    ...ideaPages.map((page) => `/ideas/${page.slug}`),
    ...converterPages.map((page) => `/tools/${page.slug}`),
    "/pricing",
    "/affiliate",
    "/privacy",
    "/terms",
  ];
  return paths.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path.startsWith("/ideas/") ? "monthly" : "weekly",
    priority: path === "" ? 1 : path === "/pricing" ? 0.8 : 0.7,
  }));
}
