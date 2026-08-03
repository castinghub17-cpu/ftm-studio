import type { MetadataRoute } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://castly.co.uk").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep private / logged-in / transactional areas out of Google.
        // Jobs and talent profiles are members-only and excluded from search.
        disallow: [
          "/jobs", // the job board + every individual job page
          "/browse", // talent directory
          "/profile", // individual talent profiles
          "/admin",
          "/dashboard",
          "/messages",
          "/edit-profile",
          "/complete-profile",
          "/payment-success",
          "/reset-password",
          "/p/", // single-use share codes
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
