import { app } from '@/server/app';

export function GET(request: Request) {
  const { search } = new URL(request.url);
  return app.request(`/api/checklist.md${search}`);
}
