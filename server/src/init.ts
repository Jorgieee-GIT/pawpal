import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {pool} from './db.js';
const sql=await readFile(fileURLToPath(new URL('../../database/schema.sql',import.meta.url)),'utf8');
await pool.query(sql);
console.log('Database tables created successfully.');
await pool.end();
