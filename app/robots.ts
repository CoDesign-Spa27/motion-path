import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
    const base = getSiteUrl();
    return {
        rules: {
            userAgent: "*",
            allow: "/",
        },
        sitemap: `${base}/sitemap.xml`,
        host: new URL(base).host,
    };
}
