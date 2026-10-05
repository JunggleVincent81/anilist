import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(process.cwd(), '../../.env') });

export interface AppEnvironment {
  nodeEnv: 'development' | 'test' | 'production';
  apiPort: number;
  webUrl: string;
  databaseUrl: string;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function port(name: string, fallback: number): number {
  const value = process.env[name] ?? String(fallback);
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`${name} must be a valid TCP port`);
  }
  return parsed;
}

export function loadEnvironment(): AppEnvironment {
  const nodeEnv = (process.env.NODE_ENV ?? 'development') as AppEnvironment['nodeEnv'];
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be development, test, or production');
  }

  return {
    nodeEnv,
    apiPort: port('API_PORT', 4000),
    webUrl: process.env.WEB_URL ?? 'http://localhost:3000',
    databaseUrl: required('DATABASE_URL')
  };
}

export function getDatabaseUrl(): string {
  return loadEnvironment().databaseUrl;
}
