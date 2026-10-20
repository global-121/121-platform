// See: https://www.npmjs.com/package/lockfile-lint
export default {
  'allowed-hosts': ['npm'],
  'allowed-schemes': ['https:'],
  path: 'package-lock.json',
  type: 'npm',
  'validate-integrity': true,
  'validate-integrity-strict': true,
  'validate-package-names': true,
};
