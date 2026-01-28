import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import stream from 'node:stream';

export function sendImageResponse(blob: string, response: Response): void {
  const bufferStream = new stream.PassThrough();
  bufferStream.end(Buffer.from(blob, 'binary'));
  response.writeHead(HttpStatus.OK, {
    'Content-Type': 'image/png',
  });
  bufferStream.pipe(response);
}
