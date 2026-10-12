import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

export const TEAM_LEADER_STATE = 'e2e/.auth/team-leader.json';
export const TEAM_LEADER_ID_FILE = 'e2e/.auth/team-leader-id.txt';

export function createDevAdminClient() {
  process.loadEnvFile('.env.local');
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
