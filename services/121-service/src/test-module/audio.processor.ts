import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bull';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { TwilioMessageEntity } from '../notifications/twilio.entity';

@Processor('audio')
export class AudioProcessor {
  @InjectRepository(TwilioMessageEntity)
  private readonly twilioMessageRepo: Repository<TwilioMessageEntity>;
  private readonly logger = new Logger(AudioProcessor.name);

  @Process('transcode')
  handleTranscode(job: Job): any {
    this.logger.debug('Start transcoding...');
    this.logger.debug(job.data);
    this.logger.debug('Transcoding completed');

    const twilioMessage = {
      from: job.data.from,
      to: job.data.to,
      body: job.data.body,
      status: 'queued',
      accountSid: job.data.accountSid,
      sid: uuid(),
      registrationId: 1,
      type: 'sms' as any,
      dateCreated: new Date(),
    };
    this.twilioMessageRepo
      .save(twilioMessage)
      .then((res) => {
        this.logger.debug(res);
      })
      .catch((err) => {
        this.logger.error(err);
      });
  }
}
