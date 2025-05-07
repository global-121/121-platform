// Wrapping the import of xlsx allows us to use dynamic imports, which means we only load these ~300kb of code when we need them.
// https://docs.sheetjs.com/docs/getting-started/installation/frameworks#dynamic-imports

import { utils, writeFile } from 'xlsx';
export { utils, writeFile };
