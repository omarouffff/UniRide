/**
 * Supabase + Prisma connection URL normalization and validation.
 *
 * Railway / Prisma production setup (recommended):
 *   DATABASE_URL        → Transaction pooler (port 6543) OR direct (port 5432)
 *   DIRECT_DATABASE_URL → Direct connection (port 5432) for migrations — required when using pooler
 *
 * Simplest setup (single URL, no pooler):
 *   DATABASE_URL only → db.<project>.supabase.co:5432
 */
const { logger } = require('../utils/logger');

function isSupabaseHost(hostname) {
  return (
    hostname.endsWith('.supabase.co') ||
    hostname.includes('.pooler.supabase.com') ||
    hostname.includes('supabase.com')
  );
}

function parseDatabaseUrl(raw) {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

function normalizeDatabaseUrl(raw, label = 'DATABASE_URL') {
  if (!raw || typeof raw !== 'string') {
    return { url: null, error: `${label} is not set` };
  }

  let value = raw.trim();
  if (!value.startsWith('postgresql://') && !value.startsWith('postgres://')) {
    return {
      url: null,
      error: `${label} must start with postgresql:// (got invalid scheme)`,
    };
  }

  // Prisma expects postgresql://
  if (value.startsWith('postgres://')) {
    value = `postgresql://${value.slice('postgres://'.length)}`;
  }

  const parsed = parseDatabaseUrl(value);
  if (!parsed) {
    return { url: null, error: `${label} is not a valid URL` };
  }

  const hostname = parsed.hostname;
  const port = parsed.port || '5432';
  const isPooler = hostname.includes('pooler.supabase.com');
  const isTransactionPooler = isPooler && port === '6543';

  if (isSupabaseHost(hostname) && !parsed.searchParams.has('sslmode')) {
    parsed.searchParams.set('sslmode', 'require');
    value = parsed.toString();
  }

  if (isTransactionPooler && parsed.searchParams.get('pgbouncer') !== 'true') {
    parsed.searchParams.set('pgbouncer', 'true');
    value = parsed.toString();
  }

  // P1013: pooler requires username postgres.<project-ref>, not plain "postgres"
  if (isPooler) {
    const user = decodeURIComponent(parsed.username || '');
    if (user === 'postgres') {
      return {
        url: value,
        error:
          `${label}: Supabase pooler requires username postgres.<project-ref> (not "postgres"). ` +
          'In Supabase Dashboard → Project Settings → Database → Connection string → URI (Session/Transaction pooler).',
        warning: true,
      };
    }
    if (!/^postgres\.[a-z0-9]+$/i.test(user)) {
      logger.warn(`${label}: unexpected pooler username format`, { user: user.replace(/:[^@]+$/, '') });
    }
  }

  if (isSupabaseHost(hostname) && parsed.password && /[#@/?&=%+]/.test(parsed.password)) {
    logger.warn(
      `${label}: password contains special characters — ensure it is URL-encoded in the connection string`
    );
  }

  return { url: value, hostname, port, isPooler, isTransactionPooler };
}

function resolveDirectUrl(databaseUrl, explicitDirect) {
  if (explicitDirect?.trim()) {
    const normalized = normalizeDatabaseUrl(explicitDirect.trim(), 'DIRECT_DATABASE_URL');
    return normalized.url || explicitDirect.trim();
  }

  const parsed = parseDatabaseUrl(databaseUrl);
  if (!parsed) return databaseUrl;

  // Pooler host → direct host: db.<project-ref>.supabase.co
  if (parsed.hostname.includes('pooler.supabase.com')) {
    const user = decodeURIComponent(parsed.username || '');
    const projectRef = user.startsWith('postgres.') ? user.slice('postgres.'.length) : null;
    if (projectRef) {
      const direct = new URL(databaseUrl);
      direct.hostname = `db.${projectRef}.supabase.co`;
      direct.port = '5432';
      direct.username = 'postgres';
      if (!direct.searchParams.has('sslmode')) {
        direct.searchParams.set('sslmode', 'require');
      }
      direct.searchParams.delete('pgbouncer');
      return direct.toString();
    }
  }

  return databaseUrl;
}

/**
 * Call once at process startup (before Prisma). Mutates process.env for Prisma schema env().
 */
function configureDatabaseEnv() {
  const rawDb = process.env.DATABASE_URL;
  const dbResult = normalizeDatabaseUrl(rawDb, 'DATABASE_URL');

  if (!dbResult.url) {
    return { ok: false, error: dbResult.error };
  }

  if (dbResult.error && dbResult.warning) {
    return { ok: false, error: dbResult.error };
  }

  process.env.DATABASE_URL = dbResult.url;

  const directRaw =
    process.env.DIRECT_DATABASE_URL || process.env.DIRECT_URL || process.env.DATABASE_URL_DIRECT;
  const directUrl = resolveDirectUrl(dbResult.url, directRaw);
  process.env.DIRECT_DATABASE_URL = directUrl;

  const hints = [];
  if (dbResult.isTransactionPooler) {
    hints.push('Using Supabase transaction pooler (6543) for app runtime');
    hints.push(`Migrations use DIRECT_DATABASE_URL → ${maskUrl(directUrl)}`);
  } else if (dbResult.isPooler) {
    hints.push('Using Supabase session pooler (5432)');
  } else if (isSupabaseHost(dbResult.hostname || '')) {
    hints.push('Using Supabase direct connection (recommended for Railway long-running servers)');
  }

  return {
    ok: true,
    mode: dbResult.isTransactionPooler ? 'pooler-transaction' : dbResult.isPooler ? 'pooler-session' : 'direct',
    hints,
  };
}

function maskUrl(url) {
  try {
    const u = new URL(url);
    if (u.password) u.password = '****';
    return u.toString();
  } catch {
    return '[invalid url]';
  }
}

function validateDatabaseEnvForProduction() {
  const result = configureDatabaseEnv();
  if (!result.ok) {
    return result;
  }

  const parsed = parseDatabaseUrl(process.env.DATABASE_URL);
  if (!parsed) {
    return { ok: false, error: 'DATABASE_URL is invalid after normalization' };
  }

  if (isSupabaseHost(parsed.hostname) && parsed.hostname.includes('pooler') && parsed.port === '6543') {
    const direct = parseDatabaseUrl(process.env.DIRECT_DATABASE_URL);
    if (!direct || direct.hostname.includes('pooler')) {
      return {
        ok: false,
        error:
          'When using Supabase transaction pooler (port 6543), set DIRECT_DATABASE_URL to the direct connection ' +
          '(db.<project-ref>.supabase.co:5432) or let auto-derive work by using username postgres.<project-ref> on pooler URL.',
      };
    }
  }

  return result;
}

module.exports = {
  configureDatabaseEnv,
  validateDatabaseEnvForProduction,
  normalizeDatabaseUrl,
  maskUrl,
};
