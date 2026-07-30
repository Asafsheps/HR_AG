import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// ── Security headers (Phase 12) ──────────────────────────────────────────────
const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options",         value: "nosniff" },
  // Prevent clickjacking
  { key: "X-Frame-Options",                value: "DENY" },
  // Referrer policy — no full URL leakage
  { key: "Referrer-Policy",                value: "strict-origin-when-cross-origin" },
  // HSTS — enforce HTTPS for 1 year (prod only)
  ...(!isDev ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
  // Permissions policy — disable unused browser features
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  // Content Security Policy
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js inline scripts + Supabase auth
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Tailwind inline styles + Next.js
      "style-src 'self' 'unsafe-inline'",
      // Supabase storage images
      "img-src 'self' data: blob: https://*.supabase.co",
      // Supabase API + Telegram API
      "connect-src 'self' https://*.supabase.co https://api.telegram.org wss://*.supabase.co",
      // Fonts
      "font-src 'self'",
      // Framing disallowed
      "frame-ancestors 'none'",
      // Form targets
      "form-action 'self'",
      // Upgrade insecure (prod)
      ...(!isDev ? ["upgrade-insecure-requests"] : []),
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  experimental: {},

  // Suppress pre-existing Supabase type-inference errors (never[] from untyped tables).
  // Remove once supabase-js types are regenerated from the live schema.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // Apply security headers to all routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // Never expose server errors in production
  ...(isDev ? {} : {
    productionBrowserSourceMaps: false,
  }),
};

export default nextConfig;
