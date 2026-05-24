/** @type {import('next').NextConfig} */

function pickEnv(...keys) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return '';
}

const resolvedSupabaseUrl = pickEnv(
  'NEXT_PUBLIC_SUPABASE_URL',
  'VITE_SUPABASE_URL',
  'SUPABASE_URL'
);

const resolvedSupabaseAnonKey = pickEnv(
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_ANON_KEY'
);

const resolvedApiUrl = pickEnv('NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_API_BASE_URL');

function getBackendOrigin() {
  if (!resolvedApiUrl) return null;
  const trimmed = resolvedApiUrl.replace(/\/$/, '');
  return trimmed.endsWith('/api') ? trimmed.slice(0, -4) : trimmed;
}

const isCiProductionBuild =
  process.env.VERCEL === '1' ||
  process.env.RAILWAY_ENVIRONMENT === 'production' ||
  (process.env.NODE_ENV === 'production' && process.env.CI === 'true');

if (isCiProductionBuild) {
  const missing = [];
  if (!resolvedApiUrl) missing.push('NEXT_PUBLIC_API_URL');
  if (!resolvedSupabaseUrl) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL (or VITE_SUPABASE_URL)');
  }
  if (!resolvedSupabaseAnonKey) {
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY (or VITE_SUPABASE_ANON_KEY)');
  }
  if (missing.length > 0) {
    throw new Error(
      `[UniRide] Build blocked — set environment variables: ${missing.join(', ')}`
    );
  }
}

const backendOrigin = getBackendOrigin();

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  // Expose resolved values to browser (supports VITE_* aliases set on Railway)
  env: {
    NEXT_PUBLIC_SUPABASE_URL: resolvedSupabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: resolvedSupabaseAnonKey,
    ...(resolvedApiUrl ? { NEXT_PUBLIC_API_URL: resolvedApiUrl } : {}),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
    ],
  },
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
