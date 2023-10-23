import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { TwilioMessageEntity } from '../notifications/twilio.entity';
import { AudioController } from './audio.controller';
import { AudioProcessor } from './audio.processor';
@Module({
  imports: [
    TypeOrmModule.forFeature([TwilioMessageEntity]),
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
