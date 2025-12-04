import { Injectable } from '@nestjs/common';

import { EXTERNAL_API } from '@121-service/src/config';
import { env } from '@121-service/src/env';
import { TransferRequestSafaricomApiDto } from '@121-service/src/fsp-integrations/api-integrations/safaricom/dtos/safaricom-api/transfer-request-safaricom-api.dto';
import { TransferResponseSafaricomApiDto } from '@121-service/src/fsp-integrations/api-integrations/safaricom/dtos/safaricom-api/transfer-response-safaricom-api.dto';
import { DuplicateOriginatorConversationIdError } from '@121-service/src/fsp-integrations/api-integrations/safaricom/errors/duplicate-originator-conversation-id.error';

@Injectable()
export class SafaricomApiHelperService {
  public createTransferPayload({
    transferValue,
    phoneNumber,
    idNumber,
    originatorConversationId,
  }): TransferRequestSafaricomApiDto {
    const callbackBaseUrl = EXTERNAL_API.rootApi;
    const safaricomTimeoutCallbackUrl = `${callbackBaseUrl}/fsps/safaricom/timeout-callback`;
    const safaricomTransferCallbacktUrl = `${callbackBaseUrl}/fsps/safaricom/transfer-callback`;

    return {
      InitiatorName: env.SAFARICOM_INITIATORNAME,
      SecurityCredential: env.SAFARICOM_SECURITY_CREDENTIAL,
      CommandID: 'BusinessPayment',
      Amount: transferValue,
      PartyA: env.SAFARICOM_PARTY_A,
      PartyB: phoneNumber,
      Remarks: 'No remarks', // Not used for reconciliation by clients. Required to be non-empty, so filled with default value.
      QueueTimeOutURL: safaricomTimeoutCallbackUrl,
      ResultURL: safaricomTransferCallbacktUrl,
      OriginatorConversationID: originatorConversationId,
      IDType: env.SAFARICOM_IDTYPE,
      IDNumber: idNumber,
    };
  }

  public createErrorMessageIfApplicable(
    transferResponse: TransferResponseSafaricomApiDto,
    originatorConversationId: string,
  ): string | undefined {
    if (!transferResponse || !transferResponse.data) {
      return `Error: No response data from Safaricom API`;
    } else if (transferResponse.data.errorCode) {
      if (transferResponse.data.errorCode === '500.002.1001') {
        // This happens only in case of unintended Redis job re-attempt, and only if the API-request already went through the first time
        // Return custom error, as it should be handled differently than other errors
        const duplicateOriginatorConversationIdErrorMessage = `Error: ${transferResponse.data.errorMessage} for originatorConversationId ${originatorConversationId}`;
        throw new DuplicateOriginatorConversationIdError(
          duplicateOriginatorConversationIdErrorMessage,
        );
      }
      return `${transferResponse.data.errorCode} - ${transferResponse.data.errorMessage}`;
    } else if (!transferResponse.data.ResponseCode) {
      return `Error: ${transferResponse.data?.statusCode} ${transferResponse.data?.error}`;
    } else if (transferResponse.data.ResponseCode !== '0') {
      return `Response: ${transferResponse.data?.ResponseCode} - ${transferResponse.data?.ResponseDescription}`;
    }
    return; // All the checks above mean that at this stage transferResponse.data.ResponseCode === '0', which implies success
  }
}
