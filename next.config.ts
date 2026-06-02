"use strict";
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://firebasestorage.googleapis.com https://lh3.googleusercontent.com",
  // connect-src: incluye accounts.google.com para el redirect OAuth y Firebase
  "connect-src 'self' " +
    "https://firestore.googleapis.com https://identitytoolkit.googleapis.com " +
    "https://securetoken.googleapis.com wss://*.firebaseio.com " +
    "https://zodi-2.firebaseapp.com https://zodi-2.web.app " +
    "https://www.googleapis.com https://oauth2.googleapis.com " +
    "https://accounts.google.com https://apis.google.com " +
    "https://api.anthropic.com https://api.openai.com https://generativelanguage.googleapis.com " +
    "https://fcmregistrations.googleapis.com",
  // frame-src: para el manejador de auth de Firebase
  "frame-src 'self' https://zodi-2.firebaseapp.com https://zodi-2.web.app " +
    "https://apis.google.com https://accounts.google.com",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    qualities: [60, 75],
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
