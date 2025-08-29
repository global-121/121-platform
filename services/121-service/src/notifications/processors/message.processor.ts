import { Process } from '@nestjs/bull';
import { Job } from 'bull';

import { ProcessNameMessage } from '@121-service/src/notifications/enum/process-names.enum';
import { MessageService } from '@121-service/src/notifications/services/message.service';
import { QueueNames } from '@121-service/src/queues-registry/enum/queue-names.enum';
import { RegisteredProcessor } from '@121-service/src/queues-registry/register-processor.decorator';

@RegisteredProcessor(QueueNames.createMessageReplyOnIncoming)
export class MessageProcessorReplyOnIncoming {
  constructor(private readonly messageService: MessageService) {}

  @Process(ProcessNameMessage.send)
  async handleSend(job: Job): Promise<void> {
    await this.messageService.sendTextMessage(job.data);
  }
}

@RegisteredProcessor(QueueNames.createMessageSmallBulk)
export class MessageProcessorSmallBulk {
  constructor(private readonly messageService: MessageService) {}

  @Process(ProcessNameMessage.send)
  public async handleSend(job: Job): Promise<void> {
    await this.messageService.sendTextMessage(job.data);
  }
}

@RegisteredProcessor(QueueNames.createMessageMediumBulk)
export class MessageProcessorMediumBulk {
  constructor(private readonly messageService: MessageService) {}

  @Process(ProcessNameMessage.send)
  public async handleSend(job: Job): Promise<void> {
    await this.messageService.sendTextMessage(job.data);
  }
}

@RegisteredProcessor(QueueNames.createMessageLargeBulk)
export class MessageProcessorLargeBulk {
  constructor(private readonly messageService: MessageService) {}

  @Process(ProcessNameMessage.send)
  public async handleSend(job: Job): Promise<void> {
    await this.messageService.sendTextMessage(job.data);
  }
}

@RegisteredProcessor(QueueNames.createMessageLowPriority)
export class MessageProcessorLowPriority {
  constructor(private readonly messageService: MessageService) {}

  @Process(ProcessNameMessage.send)
  public async handleSend(job: Job): Promise<void> {
    await this.messageService.sendTextMessage(job.data);
  }
}
