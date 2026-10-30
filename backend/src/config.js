export function loadConfig(env = process.env) {
  const url = env.DATABASE_URL;
  return {
    port: Number(env.PORT) || 4000,
    db: url
      ? { uri: url }
      : {
          host: env.DB_HOST || '127.0.0.1',
          port: Number(env.DB_PORT) || 3306,
          user: env.DB_USER || 'root',
          password: env.DB_PASSWORD || '',
          database: env.DB_NAME || 'acme_salary',
        },
    staticDir: env.STATIC_DIR || '../frontend/dist',
  };
}
