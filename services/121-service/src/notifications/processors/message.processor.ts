import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { ProcessNameMessage } from '@121-service/src/notifications/enum/process-names.enum';
import { MessageService } from '@121-service/src/notifications/message.service';
import { CreateMessageQueueNames } from '@121-service/src/queues-registry/enum/create-message-queue-names.enum';

@Processor(CreateMessageQueueNames.replyOnIncoming)
export class MessageProcessorReplyOnIncoming {
  constructor(private readonly messageService: MessageService) {}

  @Process(ProcessNameMessage.send)
  async handleSend(job: Job): Promise<void> {
    await this.messageService.sendTextMessage(job.data);
  }
}

@Processor(CreateMessageQueueNames.smallBulk)
export class MessageProcessorSmallBulk {
  constructor(private readonly messageService: MessageService) {}

  @Process(ProcessNameMessage.send)
  public async handleSend(job: Job): Promise<void> {
    await this.messageService.sendTextMessage(job.data);
  }
}

@Processor(CreateMessageQueueNames.mediumBulk)
export class MessageProcessorMediumBulk {
  constructor(private readonly messageService: MessageService) {}

  @Process(ProcessNameMessage.send)
  public async handleSend(job: Job): Promise<void> {
    await this.messageService.sendTextMessage(job.data);
  }
}

@Processor(CreateMessageQueueNames.largeBulk)
export class MessageProcessorLargeBulk {
  constructor(private readonly messageService: MessageService) {}

  @Process(ProcessNameMessage.send)
  public async handleSend(job: Job): Promise<void> {
    await this.messageService.sendTextMessage(job.data);
  }
}

@Processor(CreateMessageQueueNames.lowPriority)
export class MessageProcessorLowPriority {
  constructor(private readonly messageService: MessageService) {}

  @Process(ProcessNameMessage.send)
  public async handleSend(job: Job): Promise<void> {
    await this.messageService.sendTextMessage(job.data);
  }
}
