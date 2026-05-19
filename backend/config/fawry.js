/**
 * Fawry API base URLs — sandbox in development, production in production.
 */
function getFawryBaseUrl() {
  if (process.env.FAWRY_API_BASE_URL) {
    return process.env.FAWRY_API_BASE_URL.replace(/\/$/, '');
  }
  return process.env.NODE_ENV === 'production'
    ? 'https://www.atfawry.com'
    : 'https://atfawry.fawrystaging.com';
}

module.exports = { getFawryBaseUrl };
