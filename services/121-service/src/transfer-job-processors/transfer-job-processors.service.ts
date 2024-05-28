import { Injectable } from '@nestjs/common';

@Injectable()
export class TransferJobProcessorsService {
  /* TODO: For the IntersolveVisa Re-implementation this Service needs the following dependencies from the 121 Service:
    - ProgramFinancialServiceProviderConfigurationsCustomRepository  
    - IntersolveVisaService
    - MessageTemplateService
    - MessageQueuesService (renamed from QueueMessageService)
    - TransactionScopedRepository
    - LatestTransactionRepository
    - RegistrationScopedRepository
    - EventService
    - Redis

    For the segregation of duties implementation, it will also depend on the other (maintained only) FSP Services.
    In case other 121 Service Services/Repositories need to be added, please take a step back and reconsider the diagrams/architecture and have a conversation.

    Also see the modules imported into the TransferJobProcessorsModule.
  */

  public async processIntersolveVisaTransferJob(): Promise<void> {
    /*TODO: Implement this function:

      Note: for easy insight into the code / simplication, there may be optimization in refactoring what is done in this function into additional private functions, each with a single responsibility.

      - Get the IntersolveVisa-related ProgramFinancialServiceProviderConfigurations: brand code and cover letter code.
        - Call ProgramFinancialServiceProviderConfigurationsCustomRepository.findByProgramIdAndFinancialServiceProviderId()

      - Do the actual top-up of the Visa card, or have a new customer, wallets, card be created.
        - Call IntersolveVisaService.doTransferOrIssueCard with data from the job and the retrieved brand code and cover letter code.

      - Prepare the correct message that needs to be sent to the PA.
        - Call this.buildMessageObject() with data returned from doTransfer.

      - Get the relevant message template.
        - Call MessageTemplateService.getMessageTemplatesByProgramId()

      - Create a Message Job DTO and add the job to the queue.
        - Call MessageQueues.addMessageJob() (refactored from QueueMessage.addMessageToQueue)

      - Create a new Transaction.
        - Call TransactionScopedRepository.save()
        
      - Update paymentCount and if necessary status (to Completed) in the Registration.
        - Call RegistrationScopedRepository.findOne(), to get the related registration.
        - Call RegistrationScopedRepository.updateUnscoped() (Why unscoped?)

      - Update the LatestTransaction entity.
        - Call this.updateLatestTransaction()

      - Add a new Event for this transaction.
        - Call EventService.log()

      - Update the inProgressRedisSet, to remove the job from the set.
        - Call this.updateInProgressRedisSet()

    */
  }

  //TODO: Can we come up with a better name for this thing than a "Message Object"? What is that?
  private async buildMessageObject(): Promise<void> {
    /*TODO: Implement this function:
      - Build a message object with the data returned from doTransfer.
      - Logic can probably be found in the to-be-removed IntersolveVisaService.buildNotificationObjectIssueDebitCard(), and .buildNotificationObjectLoadBalance()
      - Maybe also relevant: to-be-removed function TransactionsService.getMessageText()
      - 
    
    */
  }

  private async addMessageJobToQueue(): Promise<void> {
    //TODO: Implement this function.
  }

  private async updateLatestTransaction(): Promise<void> {
    /*TODO: Implement this function:
      - Get the latesttransaction.
      - Update the latest transaction with the new transaction data.
      - Call TransactionScopedRepository.insert() (??)
    */
  }

  private async updateInProgressRedisSet(): Promise<void> {
    /*TODO: Implement this function:
      - Call Redis.srem()
    */
  }
}
