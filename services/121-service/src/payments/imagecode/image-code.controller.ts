import { Controller, Get, Param, Res, HttpStatus } from '@nestjs/common';
import { ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { ImageCodeService } from './image-code.service';
import { Response } from 'express-serve-static-core';
import stream from 'stream';

@ApiTags('notifications')
// I am afraid to change this url as it may break already sent whatsapps
@Controller('notifications/imageCode')
export class ImageCodeController {
  private readonly imageCodeService: ImageCodeService;
  public constructor(imageCodeService: ImageCodeService) {
    this.imageCodeService = imageCodeService;
  }

  @ApiResponse({
    status: 200,
    description: 'Collect voucher image via WhatsApp',
  })
  @ApiParam({ name: 'secret' })
  @Get(':secret')
  public async get(@Param() params, @Res() response: Response): Promise<void> {
    const blob = await this.imageCodeService.get(params.secret);
    var bufferStream = new stream.PassThrough();
    bufferStream.end(Buffer.from(blob, 'binary'));
    response.writeHead(HttpStatus.OK, {
      'Content-Type': 'image/png',
    });
    bufferStream.pipe(response);
  }
}
