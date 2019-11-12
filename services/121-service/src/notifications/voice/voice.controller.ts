import { TWILIO_MP3 } from './../twilio.client';
import { Controller, Get, Header, Req, Res, Post, Param, Body } from '@nestjs/common';
import {
  ApiUseTags,
  ApiResponse,
  ApiImplicitParam,
  ApiOperation,
} from '@nestjs/swagger';
import { VoiceService } from './voice.service';
import { Request, Response } from 'express-serve-static-core';
import fs from 'fs';

@ApiUseTags('voice')
@Controller('voice')
export class VoiceController {
  private readonly voiceService: VoiceService;
  public constructor(voiceService: VoiceService) {
    this.voiceService = voiceService;
  }
  @ApiResponse({ status: 200, description: 'Returns xml' })
  @Get()
  public notifyByVoice(): void {
    return this.voiceService.notifyByVoice(
      '+0031600000000',
      'en',
      'included',
      1,
    );
  }

  @ApiOperation({
    title: 'Return xml that specifies the mp3 location to play in call',
  })
  @ApiImplicitParam({ name: 'mp3' })
  @ApiResponse({ status: 200, description: 'Returns xml' })
  @Get('/xml/:mp3')
  @Header('resonse-type', 'text/xml')
  public getXml(@Param() params, @Res() response: Response): void {
    const twimlString = this.voiceService.xmlResponse(params.mp3);
    response.set('Content-Type', 'text/xml');
    response.send(twimlString);
  }

  @ApiOperation({
    title: 'Returns mp3 to play in call',
  })
  @ApiImplicitParam({ name: 'mp3', description: '1%2Fen%2Fincluded' })
  @ApiResponse({ status: 200, description: 'Returns xml' })
  @Get('/mp3/:mp3')
  @Header('resonse-type', 'audio/mpeg')
  public returnMp3(@Param() params, @Res() response: Response): void {
    const mp3Stream = this.voiceService.returnMp3Stream(params.mp3)
    response.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Content-Length': mp3Stream.stat.size,
    });
    mp3Stream.readStream.pipe(response);
  }

  @Post('status')
  public async statusCallback(@Body() callbackData: any): Promise<void> {
    return await this.voiceService.statusCallback(callbackData);
  }
}
