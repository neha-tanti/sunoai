import { app } from '@/server/app';

export function GET() {
  return app.request('/api/checklist.md');
}
