import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { test as setup } from '@playwright/test';
import {
  createTeamLeader,
  signIn,
  TEAM_LEADER_ID_FILE,
  TEAM_LEADER_STATE,
} from './support/team-leader';

setup('sign in a team leader made for this run', async ({ page }) => {
  const teamLeader = await createTeamLeader();
  mkdirSync(dirname(TEAM_LEADER_ID_FILE), { recursive: true });
  writeFileSync(TEAM_LEADER_ID_FILE, teamLeader.id);

  await signIn(page, teamLeader);

  await page.context().storageState({ path: TEAM_LEADER_STATE });
});
