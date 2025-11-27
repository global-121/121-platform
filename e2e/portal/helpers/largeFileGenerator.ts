import fs from 'node:fs';
import { finished } from 'node:stream/promises';

export async function generateLargeTestFile(
  filePath: string,
  sizeInBytes: number,
): Promise<void> {
  const chunkSize = 1024 * 1024;
  const buffer = Buffer.alloc(chunkSize, 'A');
  const writeStream = fs.createWriteStream(filePath);
  let written = 0;
  while (written < sizeInBytes) {
    const remaining = sizeInBytes - written;
    const toWrite = Math.min(chunkSize, remaining);
    if (!writeStream.write(buffer.subarray(0, toWrite))) {
      await new Promise<void>((resolve) =>
        writeStream.once('drain', () => resolve()),
      );
    }
    written += toWrite;
  }
  writeStream.end();
  await finished(writeStream);
}
