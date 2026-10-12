const pending: Promise<unknown>[] = [];

export function collectAfter(task: Promise<unknown> | (() => unknown)) {
  pending.push(
    typeof task === 'function' ? Promise.resolve().then(task) : task,
  );
}

export async function flushAfter() {
  return Promise.all(pending.splice(0));
}
