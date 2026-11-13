// Prefixed so debug scope usernames cannot collide with debug access group usernames
export const getDebugScopeUsername = ({ scope }: { scope: string }): string =>
  `scope-${scope}@example.org`;
