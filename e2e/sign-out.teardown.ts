import { readFileSync, rmSync } from 'node:fs';
import { test as teardown } from '@playwright/test';
import {
  createDevAdminClient,
  TEAM_LEADER_ID_FILE,
  TEAM_LEADER_STATE,
} from './support/team-leader';

teardown('delete the team leader made for this run', async () => {
  const userId = readFileSync(TEAM_LEADER_ID_FILE, 'utf8');
  const deleted = await createDevAdminClient().auth.admin.deleteUser(userId);
  if (deleted.error) throw deleted.error;
  rmSync(TEAM_LEADER_ID_FILE, { force: true });
  rmSync(TEAM_LEADER_STATE, { force: true });
});
