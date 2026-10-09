import type { AppEnvironment } from './environment.js';

/** Fails closed on unsafe production origin/DB configuration. */
export function assertProductionEnvironment(
  environment: AppEnvironment,
): void {
  if (environment.nodeEnv !== 'production') return;
  let origin: URL;
  try {
    origin = new URL(environment.webUrl);
  } catch {
    throw new Error('Production WEB_URL must be an HTTPS origin');
  }
  const host = origin.hostname.toLowerCase();
  if (
    origin.protocol !== 'https:' ||
    !!origin.username || !!origin.password ||
    !host ||
    ['localhost', '127.0.0.1', '[::1]'].includes(host) ||
    origin.pathname !== '/' || !!origin.search || !!origin.hash
  ) {
    throw new Error('Production WEB_URL must be one public HTTPS origin');
  }
  let database: URL;
  try {
    database = new URL(environment.databaseUrl);
  } catch {
    throw new Error('Production DATABASE_URL must be a PostgreSQL URL');
  }
  if (
    !['postgres:', 'postgresql:'].includes(database.protocol) ||
    !database.hostname || !database.pathname || database.pathname === '/'
  ) {
    throw new Error('Production DATABASE_URL must be a PostgreSQL URL');
  }
}
