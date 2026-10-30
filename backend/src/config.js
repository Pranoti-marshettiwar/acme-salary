export function loadConfig(env = process.env) {
  const url = env.DATABASE_URL;
  // Hosted MySQL (Aiven, TiDB Cloud, ...) usually requires TLS. Opt in with DB_SSL=true.
  const ssl = env.DB_SSL === 'true' ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined;
  return {
    port: Number(env.PORT) || 4000,
    db: url
      ? { uri: url, ...(ssl && { ssl }) }
      : {
          host: env.DB_HOST || '127.0.0.1',
          port: Number(env.DB_PORT) || 3306,
          user: env.DB_USER || 'root',
          password: env.DB_PASSWORD || '',
          database: env.DB_NAME || 'acme_salary',
          ...(ssl && { ssl }),
        },
    staticDir: env.STATIC_DIR || '../frontend/dist/frontend/browser',
  };
}
