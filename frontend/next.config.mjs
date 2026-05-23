/** @type {import('next').NextConfig} */

function getBackendOrigin() {
  const raw = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!raw?.trim()) return null;
  const trimmed = raw.trim().replace(/\/$/, '');
  return trimmed.endsWith('/api') ? trimmed.slice(0, -4) : trimmed;
}

// Fail Vercel/production builds when the API URL is not configured
if (process.env.VERCEL === '1') {
  const missing = [];
  if (!process.env.NEXT_PUBLIC_API_URL?.trim() && !process.env.NEXT_PUBLIC_API_BASE_URL?.trim()) {
    missing.push('NEXT_PUBLIC_API_URL');
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL');
  }
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseKey?.trim()) {
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  if (missing.length > 0) {
    throw new Error(
      `[UniRide] Build blocked — set in Vercel Environment Variables: ${missing.join(', ')}`
    );
  }
}

const backendOrigin = getBackendOrigin();

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
    ],
  },
  // Optional: proxy /api to Render when env is set at build time (backup for misconfigured clients)
  async rewrites() {
    if (!backendOrigin) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
