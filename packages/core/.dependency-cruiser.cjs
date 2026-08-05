module.exports = {
  forbidden: [
    {
      name: 'core-stays-platform-pure',
      severity: 'error',
      comment:
        'packages/core must not import React, Next.js, Supabase, or Node built-ins.',
      from: { path: '^src' },
      to: {
        path: '(^|/)node_modules/(react|react-dom|next|@supabase)(/|$)|^(react|react-dom|next|@supabase)(/|$)|^(fs|path|os|crypto|child_process|node:)',
      },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    // Catch unused / type-only impure imports (TS elides them post-compile).
    tsPreCompilationDeps: true,
  },
}
