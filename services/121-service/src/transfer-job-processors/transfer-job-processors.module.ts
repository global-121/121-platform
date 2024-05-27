import { Module } from '@nestjs/common';
import { TransferJobProcessorsService } from './transfer-job-processors.service';
/* TODO: For the IntersolveVisa Re-implementation, this Module should depend on the following other 121 Service Modules:
  - ProgramFinancialServiceProviderConfigurations
  - IntersolveVisa
  - MessageTemplate
  - MessageQueues (renamed from QueueMessage)
  - Transactions
  - Registration
  - Event
  - Redis
  
  For the segregation of duties implementation, it will also depend on the other (maintained only) FSP modules.
  In case other 121 Service Modules need to be added, please take a step back and reconsider the diagrams/architecture and have a conversation.

  Also see the stuff injected into the TransferJobProcessorsService.
*/

@Module({
  providers: [TransferJobProcessorsService],
})
export class TransferJobProcessorsModule {}
