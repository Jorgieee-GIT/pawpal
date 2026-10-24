import 'dotenv/config';
import pg from 'pg';
if(!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL in server/.env');
export const pool = new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==='true'?{rejectUnauthorized:true}:undefined});
