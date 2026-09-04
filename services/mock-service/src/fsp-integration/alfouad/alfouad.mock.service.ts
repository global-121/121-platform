import { Injectable } from '@nestjs/common';

import { AlfouadCreateTransactionRequestDto } from '@mock-service/src/fsp-integration/alfouad/dto/alfouad-create-transaction-request.dto';
import { AlfouadTransactionResponseDto } from '@mock-service/src/fsp-integration/alfouad/dto/alfouad-transaction-response.dto';

enum AlfouadMockResponseState {
  success = '1',
  failed = '0',
}

enum AlfouadMockErrorCode {
  transactionNotFound = '821',
  duplicateReferenceNumber = '822',
  // The real Al Fouad API returns a descriptive Message but no fixed code for general errors.
  businessError = '999',
}

enum AlfouadMockTransactionState {
  pendingApproval = '1',
  approved = '2',
  paid = '3',
  hold = '4',
  canceled = '5',
}

enum AlfouadMockPhoneNumber {
  failBusinessError = '963000000001',
  failDuplicateExisting = '963000000002',
  failDuplicateMissing = '963000000003',
}

enum AlfouadMockReferenceNumber {
  stateNotFound = '00000000-0000-0000-0000-000000000404',
  statePendingApproval = '00000000-0000-0000-0000-000000000001',
  stateApproved = '00000000-0000-0000-0000-000000000002',
  stateHold = '00000000-0000-0000-0000-000000000004',
  stateCanceled = '00000000-0000-0000-0000-000000000005',
}

const stateByReferenceNumber = new Map<string, AlfouadMockTransactionState>([
  [
    AlfouadMockReferenceNumber.statePendingApproval,
    AlfouadMockTransactionState.pendingApproval,
  ],
  [
    AlfouadMockReferenceNumber.stateApproved,
    AlfouadMockTransactionState.approved,
  ],
  [AlfouadMockReferenceNumber.stateHold, AlfouadMockTransactionState.hold],
  [
    AlfouadMockReferenceNumber.stateCanceled,
    AlfouadMockTransactionState.canceled,
  ],
]);

@Injectable()
export class AlfouadMockService {
  public createTransaction(
    body: AlfouadCreateTransactionRequestDto,
  ): AlfouadTransactionResponseDto {
    if (
      body.BeneficiaryPhoneNumber === AlfouadMockPhoneNumber.failBusinessError
    ) {
      return {
        State: AlfouadMockResponseState.failed,
        Message: 'Transaction could not be created: beneficiary rejected',
        ErrorCode: AlfouadMockErrorCode.businessError,
      };
    }

    if (
      body.BeneficiaryPhoneNumber ===
        AlfouadMockPhoneNumber.failDuplicateExisting ||
      body.BeneficiaryPhoneNumber === AlfouadMockPhoneNumber.failDuplicateMissing
    ) {
      return this.duplicateReferenceNumberResponse();
    }

    return {
      State: AlfouadMockResponseState.success,
      Message: 'Transaction created successfully',
    };
  }

  public getTransactionByRef(
    referenceNumber: string,
  ): AlfouadTransactionResponseDto {
    if (referenceNumber === AlfouadMockReferenceNumber.stateNotFound) {
      return {
        State: AlfouadMockResponseState.failed,
        Message: 'No results were found.',
        ErrorCode: AlfouadMockErrorCode.transactionNotFound,
      };
    }

    const state =
      stateByReferenceNumber.get(referenceNumber) ??
      AlfouadMockTransactionState.paid;

    return {
      State: state,
      Message: 'Transaction found',
    };
  }

  private duplicateReferenceNumberResponse(): AlfouadTransactionResponseDto {
    return {
      State: AlfouadMockResponseState.failed,
      Message: 'Duplicate ReferenceNumber',
      ErrorCode: AlfouadMockErrorCode.duplicateReferenceNumber,
    };
  }
}
