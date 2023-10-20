import { InjectQueue } from '@nestjs/bull';
import { Controller, Post } from '@nestjs/common';
import { Queue } from 'bull';

@Controller('audio')
export class AudioController {
  constructor(@InjectQueue('audio') private readonly audioQueue: Queue) {}

  @Post('transcode')
  async transcode(): Promise<void> {
    console.log('tuk');
    const test = await this.audioQueue.add('transcode', {
      file: 'audio.mp3',
    });
    console.log(test);
  }
}
