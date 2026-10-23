import { readFileSync, rmSync } from 'node:fs';
import { test as teardown } from '@playwright/test';
import {
  deleteTeamLeader,
  TEAM_LEADER_ID_FILE,
  TEAM_LEADER_STATE,
} from './support/team-leader';

teardown('delete the team leader made for this run', async () => {
  await deleteTeamLeader(readFileSync(TEAM_LEADER_ID_FILE, 'utf8'));
  rmSync(TEAM_LEADER_ID_FILE, { force: true });
  rmSync(TEAM_LEADER_STATE, { force: true });
});
