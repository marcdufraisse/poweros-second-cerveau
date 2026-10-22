// editing-os/lib/git.mjs
// ActivityState: branch, dirty count, last 20 commits via execFile git (5 s timeout,
// no shell). recentFiles is threaded in from the scan (no second tree walk). On any
// git failure return safe empties rather than throwing.

import { execFile } from 'node:child_process';

import { ROOT } from './scan.mjs';

function git(args) {
  return new Promise((resolve) => {
    execFile('git', args, { cwd: ROOT, timeout: 5000, maxBuffer: 4 * 1024 * 1024 }, (err, stdout) => {
      if (err) resolve(null);
      else resolve(stdout);
    });
  });
}

export async function buildActivity(recentFiles) {
  let branch = 'unknown';
  let dirtyCount = 0;
  let commits = [];

  const branchOut = await git(['rev-parse', '--abbrev-ref', 'HEAD']);
  if (branchOut != null) {
    const b = branchOut.trim();
    if (b) branch = b;
  }

  const statusOut = await git(['status', '--porcelain']);
  if (statusOut != null) {
    dirtyCount = statusOut.split('\n').filter((l) => l.trim().length > 0).length;
  }

  // Unit separator between fields, record per line. %ct = committer date, unix seconds.
  const logOut = await git(['log', '-n', '20', '--pretty=format:%H%x1f%s%x1f%ct']);
  if (logOut != null) {
    commits = logOut
      .split('\n')
      .filter((l) => l.trim().length > 0)
      .map((line) => {
        const [hash, subject, ct] = line.split('\x1f');
        return {
          hash: (hash || '').trim(),
          subject: subject || '',
          date: (Number(ct) || 0) * 1000,
        };
      });
  }

  return {
    branch,
    dirtyCount,
    commits,
    recentFiles: Array.isArray(recentFiles) ? recentFiles.slice(0, 30) : [],
  };
}
