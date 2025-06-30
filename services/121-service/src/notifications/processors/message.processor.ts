import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { ProcessNameMessage } from '@121-service/src/notifications/enum/process-names.enum';
import { MessageService } from '@121-service/src/notifications/message.service';
import { QueueNames } from '@121-service/src/queues-registry/enum/queue-names.enum';

@Processor(QueueNames.createMessageReplyOnIncoming)
export class MessageProcessorReplyOnIncoming {
  constructor(private readonly messageService: MessageService) {}

  @Process(ProcessNameMessage.send)
  async handleSend(job: Job): Promise<void> {
    await this.messageService.sendTextMessage(job.data);
  }
}

@Processor(QueueNames.createMessageSmallBulk)
export class MessageProcessorSmallBulk {
  constructor(private readonly messageService: MessageService) {}

  @Process(ProcessNameMessage.send)
  public async handleSend(job: Job): Promise<void> {
    await this.messageService.sendTextMessage(job.data);
  }
}

@Processor(QueueNames.createMessageMediumBulk)
export class MessageProcessorMediumBulk {
  constructor(private readonly messageService: MessageService) {}

  @Process(ProcessNameMessage.send)
  public async handleSend(job: Job): Promise<void> {
    await this.messageService.sendTextMessage(job.data);
  }
}

@Processor(QueueNames.createMessageLargeBulk)
export class MessageProcessorLargeBulk {
  constructor(private readonly messageService: MessageService) {}

  @Process(ProcessNameMessage.send)
  public async handleSend(job: Job): Promise<void> {
    await this.messageService.sendTextMessage(job.data);
  }
}

@Processor(QueueNames.createMessageLowPriority)
export class MessageProcessorLowPriority {
  constructor(private readonly messageService: MessageService) {}

  @Process(ProcessNameMessage.send)
  public async handleSend(job: Job): Promise<void> {
    await this.messageService.sendTextMessage(job.data);
  }
}
