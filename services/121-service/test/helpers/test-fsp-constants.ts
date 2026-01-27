import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * A minimal valid PNG buffer for testing image uploads
 * This loads a 1x1 pixel PNG image from the test resources
 */
export const MINIMAL_PNG_BUFFER = fs.readFileSync(
  path.join(__dirname, '../voucher/resources/test-image.png'),
);
