import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiResponse, ApiUseTags, ApiImplicitParam } from '@nestjs/swagger';
import { ImageCodeService } from './image-code.service';
import { Response } from 'express-serve-static-core';

@ApiUseTags('notifications')
@Controller('notifications/imageCode')
export class ImageCodeController {
  private readonly imageCodeService: ImageCodeService;
  public constructor(imageCodeService: ImageCodeService) {
    this.imageCodeService = imageCodeService;
  }

  @ApiResponse({
    status: 200,
    description: 'Test controller to test sending imageCode',
  })
  @ApiImplicitParam({ name: 'secret' })
  @Get(':secret')
  public async get(@Param() params, @Res() response: Response): Promise<void> {
    const blob = await this.imageCodeService.get(params.secret);
    var stream = require('stream');
    var bufferStream = new stream.PassThrough();
    bufferStream.end(new Buffer(blob, 'binary'));
    response.writeHead(200, {
      'Content-Type': 'image/png',
    });
    // res is standered express res object
    bufferStream.pipe(response);
  }
}
