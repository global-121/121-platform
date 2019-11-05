import { TWILIO_MP3 } from './../twilio.client';
import { Controller, Get, Header, Req, Res, Post, Param } from '@nestjs/common';
import {
  ApiUseTags,
  ApiResponse,
  ApiImplicitParam,
  ApiOperation,
} from '@nestjs/swagger';
import { VoiceService } from './voice.service';
import { Request, Response } from 'express-serve-static-core';

@ApiUseTags('voice')
@Controller('voice')
export class VoiceController {
  private readonly voiceService: VoiceService;
  public constructor(voiceService: VoiceService) {
    this.voiceService = voiceService;
  }
  @ApiResponse({ status: 200, description: 'Returns xml' })
  @Get()
  public makeVoiceCall(): void {
    return this.voiceService.makeVoiceCall(
      TWILIO_MP3.negativeInclusion.param,
      '+0031600000000',
    );
  }

  @ApiOperation({
    title: 'Return xml that specifies the mp3 location to play in call',
  })
  @ApiImplicitParam({ name: 'mp3' })
  @ApiResponse({ status: 200, description: 'Returns xml' })
  @Get('/xml/:mp3')
  @Header('resonse-type', 'text/xml')
  public getXml(@Param() params, @Res() response: Response): any {
    const twimlString = this.voiceService.xmlTest(response, params.mp3);
    response.set('Content-Type', 'text/xml');
    response.send(twimlString);
  }
}
