import { config } from 'dotenv';

config({ path: process.env.SUPABASE_TEST_ENV_FILE || '.env.test' });
