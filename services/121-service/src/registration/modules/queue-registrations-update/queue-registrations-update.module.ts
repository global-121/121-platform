import { Module } from '@nestjs/common';

import { QueueRegistryModule } from '@121-service/src/queue-registry/queue-registry.module';
import { QueueRegistrationUpdateService } from '@121-service/src/registration/modules/queue-registrations-update/queue-registrations-update.service';

@Module({
  imports: [QueueRegistryModule],
  providers: [QueueRegistrationUpdateService],
  controllers: [],
  exports: [QueueRegistrationUpdateService],
})
export class QueueRegistrationUpdateModule {}
