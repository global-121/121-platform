import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { MessageService } from '../message.service';

import { ProcessName, QueueNameCreateMessage } from '../enum/queue.names.enum';

@Processor(QueueNameCreateMessage.replyOnIncoming)
export class MessageProcessorReplyOnIncoming {
  constructor(private readonly messageService: MessageService) {}

  @Process(ProcessName.send)
  async handleSend(job: Job): Promise<void> {
    await this.messageService.sendTextMessage(job.data);
  }
}

@Processor(QueueNameCreateMessage.smallBulk)
export class MessageProcessorSmallBulk {
  constructor(private readonly messageService: MessageService) {}

  @Process(ProcessName.send)
  public async handleSend(job: Job): Promise<void> {
    await this.messageService.sendTextMessage(job.data);
  }
}

@Processor(QueueNameCreateMessage.mediumBulk)
export class MessageProcessorMediumBulk {
  constructor(private readonly messageService: MessageService) {}

  @Process(ProcessName.send)
  public async handleSend(job: Job): Promise<void> {
    await this.messageService.sendTextMessage(job.data);
  }
}

@Processor(QueueNameCreateMessage.largeBulk)
export class MessageProcessorLargeBulk {
  constructor(private readonly messageService: MessageService) {}

  @Process(ProcessName.send)
  public async handleSend(job: Job): Promise<void> {
    await this.messageService.sendTextMessage(job.data);
  }
}

@Processor(QueueNameCreateMessage.lowPriority)
export class MessageProcessorLowPriority {
  constructor(private readonly messageService: MessageService) {}

  @Process(ProcessName.send)
  public async handleSend(job: Job): Promise<void> {
    await this.messageService.sendTextMessage(job.data);
  }
}
