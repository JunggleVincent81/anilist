import type { AppEnvironment } from './environment.js';
import { assertProductionEnvironment } from './production-readiness.js';

const safe: AppEnvironment = {
  nodeEnv: 'production',
  apiPort: 4000,
  webUrl: 'https://frontend.example.test',
  databaseUrl: 'postgresql://user:pass@db.example.test:5432/anime',
};

describe('production readiness environment', () => {
  it('accepts explicit HTTPS origin and PostgreSQL connection', () => {
    expect(() => assertProductionEnvironment(safe)).not.toThrow();
  });
  it('allows development mode without a public HTTPS origin', () => {
    expect(() => assertProductionEnvironment({ ...safe, nodeEnv: 'development', webUrl: 'http://localhost:3000' })).not.toThrow();
  });
  it.each(['http://localhost:3000', 'http://site.example.test', 'https://localhost', 'https://user:pass@frontend.example.test', 'https://frontend.example.test/path', 'https://frontend.example.test?x=1', 'not-a-url'])(
    'rejects unsafe production origin %s',
    (webUrl) => {
      expect(() => assertProductionEnvironment({ ...safe, webUrl })).toThrow();
    },
  );
  it.each(['file:///data/sqlite.db', 'https://example.test/db', 'postgres://', 'not-a-url'])(
    'rejects invalid production database URL %s',
    (databaseUrl) => {
      expect(() => assertProductionEnvironment({ ...safe, databaseUrl })).toThrow();
    },
  );
});
