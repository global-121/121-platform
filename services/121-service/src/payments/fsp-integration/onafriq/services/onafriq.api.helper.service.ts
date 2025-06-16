import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto'; // Add this import
import { v4 as uuid } from 'uuid';

import { CallServiceRequestOnafriqApiDto } from '@121-service/src/payments/fsp-integration/onafriq/dtos/onafriq-api/call-service-request-onafriq-api.dto';
import { CallServiceResponseOnafriqApiDto } from '@121-service/src/payments/fsp-integration/onafriq/dtos/onafriq-api/call-service-response-onafriq-api.dto';
import { DuplicateThirdPartyTransIdError } from '@121-service/src/payments/fsp-integration/onafriq/errors/duplicate-third-party-trans-id.error';

@Injectable()
export class OnafriqApiHelperService {
  public createCallServicePayload({
    transferAmount,
    phoneNumber,
    firstName,
    lastName,
    thirdPartyTransId,
  }): CallServiceRequestOnafriqApiDto {
    const batchId = uuid(); // Generate a new batch ID for each request
    const mfsSign = this.generateMfsSign(
      process.env.ONAFRIQ_PASSWORD!,
      batchId,
      process.env.ONAFRIQ_UNIQUE_KEY!,
    );
    const currencyCode = 'CDF'; // ##TODO: already change this to env/fsp-config?
    const countryCode = 'CD'; // ##TODO: already change this to env/fsp-config?
    const callServicePayload: CallServiceRequestOnafriqApiDto = {
      corporateCode: process.env.ONAFRIQ_CORPORATE_CODE!,
      password: process.env.ONAFRIQ_PASSWORD!,
      mfsSign,
      batchId,
      requestBody: [
        {
          instructionType: {
            destAcctType: 1, // 1 = Mobile Money
            amountType: 2, // 2 = Receive Amount
          },
          amount: {
            amount: transferAmount,
            currencyCode,
          },
          sendFee: {
            // ##TODO: sendFee should not be needed with amountType = 2, so can be removed
            amount: 0,
            currencyCode,
          },
          sender: {
            // ##TODO: this can be anything for now in sandbox, just fill in something
            msisdn: '1234567890', // ##TODO
            fromCountry: countryCode,
            name: 'Help a child DRC',
            surname: 'Help a child DRC',
            document: {
              idNumber: '123456789', // ##TODO
              idType: 'ID1', // ##TODO
              idCountry: countryCode, // ##TODO
              idExpiry: '2025-12-31', // ##TODO: conditional. on what?
            },
          },
          recipient: {
            msisdn: phoneNumber,
            toCountry: countryCode,
            name: firstName,
            surname: lastName,
            address: 'Recipient Address', // ##TODO: conditional. on what?
            city: 'Kinshasa', // ##TODO: conditional. on what?
            destinationAccount: {
              accountNumber: '1234567890', // ##TODO: conditional. on what?
            },
          },
          thirdPartyTransId,
          reference: null, // ##TODO: This is optional. Do we need if for anything, reconciliation-related?
          purposeOfTransfer: 'PT3', // ##TODO: PT3 = BUSINESS PAYMENT. Is this correct?
          sourceOfFunds: 'SF6', // ##TODO: SF6 = OTHER (see https://developers.onafriq.com/docs/remittance-apis-v1/ltkyfhltgh35s-async-api-methods). Is this correct? (And is this needed? It says 'conditional'.)
        },
      ],
    };
    return callServicePayload;
  }

  private generateMfsSign(
    password: string,
    batchId: string,
    uniqueKey: string,
  ): string {
    // Concatenate the values
    const dataToHash = password + batchId + uniqueKey;

    // Create SHA-256 hash
    return crypto.createHash('sha256').update(dataToHash).digest('hex');
  }

  public createErrorMessageIfApplicable(
    callServiceResponse: CallServiceResponseOnafriqApiDto,
    thirdPartyTransId: string,
  ): string | undefined {
    // ##TODO: should we assume/enforce here that we send only 1 transaction per batch?
    // ##TODO: check/scrutinize possible error scenarios a lot more
    if (!callServiceResponse || !callServiceResponse.data) {
      return `Error: No response data from Onafriq API`;
    } else if (
      callServiceResponse.data.details?.transResponse[0]?.status
        ?.messageDetail === 'Transaction already exist with given ThirdParty' //##TODO: get exact code for this?
    ) {
      // This happens only in case of unintended queue retry, and only if the API-request already went through the first time
      // Return custom error, as it should be handled differently than other errors
      const duplicateThirdPartyTransIdErrorMessage = `Error: duplicate thirdPartyTransId error for thirdPartyTransId ${thirdPartyTransId}`;
      throw new DuplicateThirdPartyTransIdError(
        duplicateThirdPartyTransIdErrorMessage,
      );
    } else if (callServiceResponse.data.noTxRejected === 1) {
      const errorObj =
        callServiceResponse.data.details?.transResponse[0]?.status;
      return `Error: ${errorObj?.code} - ${errorObj?.message} - ${errorObj?.messageDetail}`;
    }

    return; // All the checks above mean that at this stage 'success' is implied' ##TODO: enforce this more strictly
  }
}
