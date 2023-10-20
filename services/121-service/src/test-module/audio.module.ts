import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { join } from 'path';
import { AudioController } from './audio.controller';
import { AudioProcessor } from './audio.processor';
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'audio',
      processors: [
        {
          name: 'optimize',
          path: join(__dirname, 'audio.processor.ts'),
        },
      ],
    }),
  ],
  controllers: [AudioController],
  providers: [AudioProcessor],
})
export class AudioModule {}
