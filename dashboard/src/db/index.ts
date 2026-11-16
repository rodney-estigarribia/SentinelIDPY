import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

export const db = connectionString ? drizzle(neon(connectionString), { schema }) : null;
export { schema };
