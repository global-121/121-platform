// See: https://www.npmjs.com/package/lockfile-lint
export default {
  'allowed-hosts': ['npm'],
  'allowed-package-name-aliases': [
    'string-width-cjs:string-width', // Used by `lockfile-lint`
    'strip-ansi-cjs:strip-ansi', // Used by `lockfile-lint`
    'wrap-ansi-cjs:wrap-ansi', // Used by `lockfile-lint`
  ],
  'allowed-schemes': [
    'https:',
    'file:', // To allow for local vendored dependencies
  ],
  path: 'package-lock.json',
  type: 'npm',
  'validate-integrity': true,
  'validate-integrity-strict': true,
  'validate-package-names': true,
};
