import { EXTERNAL_API } from '@121-service/src/config';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { DoTransferReturnParams } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/do-transfer-return-type.interface';
import { SafaricomTransferPayloadParams } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/safaricom-transfer-payload.interface';
import { SafaricomTransferParams } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/safaricom-transfer.interface';
import { SafaricomTransferEntity } from '@121-service/src/payments/fsp-integration/safaricom/safaricom-transfer.entity';
import { SafaricomApiService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.api.service';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { generateRandomString } from '@121-service/src/utils/getRandomValue.helper';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SafaricomService
  implements FinancialServiceProviderIntegrationInterface
{
  @InjectRepository(SafaricomTransferEntity)
  private readonly safaricomTransferRepository: Repository<SafaricomTransferEntity>;

  public constructor(
    private readonly safaricomApiService: SafaricomApiService,
  ) {}

  /**
   * Do not use! This function was previously used to send payments.
   * It has been deprecated and should not be called anymore.
   */
  public async sendPayment(
    _paymentList: PaPaymentDataDto[],
    _programId: number,
    _paymentNr: number,
  ): Promise<void> {
    throw new Error('Method should not be called anymore.');
  }

  public async doTransfer(
    transferData: SafaricomTransferParams,
  ): Promise<DoTransferReturnParams> {
    await this.safaricomApiService.authenticate();

    // TODO: simplify input
    const payload = this.createPayloadPerPa(
      transferData.programId,
      transferData.paymentNr,
      transferData.transactionAmount,
      transferData.phoneNumber,
      transferData.referenceId,
      transferData.nationalId,
      transferData.registrationProgramId,
    );
    console.log('payload: ', payload);

    return await this.sendPaymentPerPa(payload);
  }

  public createPayloadPerPa(
    programId: number,
    paymentNr: number,
    transactionAmount: number,
    phoneNumber: string,
    referenceId: string,
    nationalId: string | undefined,
    registrationProgramId: number | undefined,
  ): SafaricomTransferPayloadParams {
    function padTo2Digits(num: number): string {
      return num.toString().padStart(2, '0');
    }

    function formatDate(date: Date): string {
      return [
        date.getFullYear().toString().substring(2),
        padTo2Digits(date.getMonth() + 1),
        padTo2Digits(date.getDate()),
      ].join('');
    }

    return {
      InitiatorName: process.env.SAFARICOM_INITIATORNAME!,
      SecurityCredential: process.env.SAFARICOM_SECURITY_CREDENTIAL!,
      CommandID: 'BusinessPayment',
      Amount: transactionAmount,
      PartyA: process.env.SAFARICOM_PARTY_A!,
      PartyB: phoneNumber, // Set to empty string to trigger mock failure
      Remarks: `Payment ${paymentNr}`,
      QueueTimeOutURL: EXTERNAL_API.safaricomQueueTimeoutUrl,
      ResultURL: EXTERNAL_API.safaricomResultUrl,
      Occassion: referenceId,
      OriginatorConversationID: `P${programId}PA${registrationProgramId}_${formatDate(
        new Date(),
      )}_${generateRandomString(3)}`,
      IDType: process.env.SAFARICOM_IDTYPE!,
      IDNumber: nationalId,
    };
  }

  public async sendPaymentPerPa(
    payload: SafaricomTransferPayloadParams,
  ): Promise<DoTransferReturnParams> {
    const result = await this.safaricomApiService.transfer(payload);

    if (result && result.ResponseCode !== '0') {
      //TODO: currently no customData.requestResult is returned and stored in case of failure. Check later if this is OK?
      throw new Error(result.errorMessage);
    }

    return {
      amountTransferredInMajorUnit: payload.Amount,
      customData: {
        requestResult: result,
      },
    };
  }

  public async createAndSaveSafaricomTransferData(
    safaricomDoTransferResult: DoTransferReturnParams,
    transaction: TransactionEntity,
  ): Promise<any> {
    const safaricomTransferEntity = new SafaricomTransferEntity();

    const safaricomCustomData = { ...safaricomDoTransferResult.customData };
    safaricomTransferEntity.mpesaConversationId =
      safaricomCustomData &&
      safaricomCustomData.requestResult &&
      safaricomCustomData.requestResult['ConversationID']
        ? safaricomCustomData.requestResult['ConversationID']
        : 'Invalid Request';
    safaricomTransferEntity.originatorConversationId =
      safaricomCustomData &&
      safaricomCustomData.requestResult &&
      safaricomCustomData.requestResult['OriginatorConversationID']
        ? safaricomCustomData.requestResult['OriginatorConversationID']
        : 'Invalid Request';

    safaricomTransferEntity.mpesaTransactionId = transaction.id;

    await this.safaricomTransferRepository.save(safaricomTransferEntity);
  }

  public async processSafaricomResult(
    _safaricomPaymentResultData: any,
    _attempt = 1,
  ): Promise<void> {
    // TODO: uncomment this method again, but refactor where needed and so that transactionRepository is not needed
    // const safaricomDbRequest = await this.safaricomTransferRepository
    //   .createQueryBuilder('safaricom_request')
    //   .leftJoinAndSelect('safaricom_request.transaction', 'transaction')
    //   .where(
    //     'safaricom_request.originatorConversationID = :originatorConversationID',
    //     {
    //       originatorConversationID:
    //         safaricomPaymentResultData.Result.OriginatorConversationID,
    //     },
    //   )
    //   .getMany();
    // if (safaricomDbRequest[0] === undefined && attempt <= 3) {
    //   attempt++;
    //   await waitFor(850);
    //   await this.processSafaricomResult(safaricomPaymentResultData, attempt);
    //   return;
    // }
    // let paymentStatus: StatusEnum | null = null;
    // if (
    //   safaricomPaymentResultData &&
    //   safaricomPaymentResultData.Result &&
    //   safaricomPaymentResultData.Result.ResultCode === 0
    // ) {
    //   paymentStatus = StatusEnum.success;
    // } else {
    //   paymentStatus = StatusEnum.error;
    //   safaricomDbRequest[0].transaction.errorMessage =
    //     safaricomPaymentResultData.Result.ResultDesc;
    // }
    // safaricomDbRequest[0].status = paymentStatus;
    // safaricomDbRequest[0].paymentResult = safaricomPaymentResultData;
    // const safaricomCustomData = {
    //   ...safaricomDbRequest[0].transaction.customData,
    // };
    // safaricomCustomData['paymentResult'] = safaricomPaymentResultData;
    // safaricomDbRequest[0].transaction.status = paymentStatus;
    // safaricomDbRequest[0].transaction.customData = safaricomCustomData;
    // await this.safaricomTransferRepository.save(safaricomDbRequest);
    // await this.transactionRepository.save(safaricomDbRequest[0].transaction);
  }
}
