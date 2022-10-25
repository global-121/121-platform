import { AdminAuthGuard } from './../../guards/admin.guard';
import { PermissionsGuard } from './../../guards/permissions.guard';
import {
  Controller,
  Get,
  Header,
  Res,
  Post,
  Param,
  Body,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiParam,
  ApiOperation,
  ApiConsumes,
} from '@nestjs/swagger';
import { VoiceService } from './voice.service';
import { Response } from 'express-serve-static-core';
import { Admin } from '../../guards/admin.decorator';

@UseGuards(PermissionsGuard, AdminAuthGuard)
@ApiTags('notifications')
@Controller('notifications/voice')
export class VoiceController {
  private readonly voiceService: VoiceService;
  public constructor(voiceService: VoiceService) {
    this.voiceService = voiceService;
  }

  @Admin()
  @ApiResponse({ status: 200, description: 'Test voice call' })
  @ApiParam({ name: 'number' })
  @Get(':number')
  public notifyByVoice(@Param() params): void {
    return this.voiceService.notifyByVoice(
      1,
      params.number,
      'en',
      'included',
      1,
    );
  }

  @ApiOperation({
    summary: 'Return xml that specifies the mp3 location to play in call',
  })
  @ApiParam({ name: 'mp3' })
  @ApiResponse({ status: 200, description: 'Returns xml' })
  @Get('/xml/:mp3')
  @Header('resonse-type', 'text/xml')
  public getXml(@Param() params, @Res() response: Response): void {
    const twimlString = this.voiceService.xmlResponse(params.mp3);
    response.set('Content-Type', 'text/xml');
    response.send(twimlString);
  }

  @ApiOperation({
    summary: 'Returns mp3 to play in call',
  })
  @ApiParam({ name: 'mp3', description: '1REPLACEenREPLACEincluded' })
  @ApiResponse({ status: 200, description: 'Returns xml' })
  @Get('/mp3/:mp3')
  @Header('resonse-type', 'audio/mpeg')
  public returnMp3(@Param() params, @Res() response: Response): void {
    const mp3Stream = this.voiceService.returnMp3Stream(params.mp3);
    response.writeHead(HttpStatus.OK, {
      'Content-Type': 'audio/mpeg',
      'Content-Length': mp3Stream.stat.size,
    });
    mp3Stream.readStream.pipe(response);
  }

  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  @Post('status')
  public async statusCallback(@Body() callbackData: any): Promise<void> {
    return await this.voiceService.statusCallback(callbackData);
  }
}
