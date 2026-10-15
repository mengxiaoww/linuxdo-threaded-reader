import { spawnSync } from 'node:child_process';
const cases = [['--check', 'linuxdo-comments.user.js'], ['tests/progress.mjs'], ['tests/native-timeline.mjs'], ['tests/native-reader.mjs'], ['tests/reply-sync.mjs'], ['tests/reply-transition.mjs'], ['tests/navigation-footer.mjs'], ['tests/navigation-footer.mjs', { FIRST_NATIVE: '1' }], ['tests/paging.mjs'], ['tests/paging.mjs', { TAIL_END: '1' }], ['tests/paging.mjs', { TAIL_END: '1', FAST_UP: '1' }], ['tests/paging.mjs', { TAIL_JUMP: '1' }]];
for (const entry of cases) {
  const args = entry.filter(value => typeof value === 'string');
  const extra = entry.find(value => typeof value === 'object') || {};
  const result = spawnSync(process.execPath, args, { stdio: 'inherit', env: { ...process.env, ...extra } });
  if (result.status !== 0) process.exit(result.status || 1);
}
