import { Injectable } from '@nestjs/common';

import { AlFouadCreateTransactionRequestDto } from '@mock-service/src/fsp-integration/al-fouad/dto/al-fouad-create-transaction-request.dto';
import { AlFouadTransactionResponseDto } from '@mock-service/src/fsp-integration/al-fouad/dto/al-fouad-transaction-response.dto';

enum AlFouadMockResponseState {
  success = '1',
  failed = '0',
}

enum AlFouadMockErrorCode {
  transactionNotFound = '821',
  duplicateReferenceNumber = '822',
  // The real Al Fouad API returns a descriptive Message but no fixed code for general errors.
  businessError = '999',
}

enum AlFouadMockTransactionState {
  pendingApproval = '1',
  approved = '2',
  paid = '3',
  hold = '4',
  canceled = '5',
}

enum AlFouadMockPhoneNumber {
  failBusinessError = '963000000001',
  failDuplicateExisting = '963000000002',
  failDuplicateMissing = '963000000003',
}

enum AlFouadMockReferenceNumber {
  stateNotFound = '00000000-0000-0000-0000-000000000404',
  statePendingApproval = '00000000-0000-0000-0000-000000000001',
  stateApproved = '00000000-0000-0000-0000-000000000002',
  stateHold = '00000000-0000-0000-0000-000000000004',
  stateCanceled = '00000000-0000-0000-0000-000000000005',
}

const stateByReferenceNumber = new Map<string, AlFouadMockTransactionState>([
  [
    AlFouadMockReferenceNumber.statePendingApproval,
    AlFouadMockTransactionState.pendingApproval,
  ],
  [
    AlFouadMockReferenceNumber.stateApproved,
    AlFouadMockTransactionState.approved,
  ],
  [AlFouadMockReferenceNumber.stateHold, AlFouadMockTransactionState.hold],
  [
    AlFouadMockReferenceNumber.stateCanceled,
    AlFouadMockTransactionState.canceled,
  ],
]);

@Injectable()
export class AlFouadMockService {
  public createTransaction(
    body: AlFouadCreateTransactionRequestDto,
  ): AlFouadTransactionResponseDto {
    if (
      body.BeneficiaryPhoneNumber === AlFouadMockPhoneNumber.failBusinessError
    ) {
      return {
        State: AlFouadMockResponseState.failed,
        Message: 'Transaction could not be created: beneficiary rejected',
        ErrorCode: AlFouadMockErrorCode.businessError,
      };
    }

    if (
      body.BeneficiaryPhoneNumber ===
        AlFouadMockPhoneNumber.failDuplicateExisting ||
      body.BeneficiaryPhoneNumber === AlFouadMockPhoneNumber.failDuplicateMissing
    ) {
      return this.duplicateReferenceNumberResponse();
    }

    return {
      State: AlFouadMockResponseState.success,
      Message: 'Transaction created successfully',
    };
  }

  public getTransactionByRef(
    referenceNumber: string,
  ): AlFouadTransactionResponseDto {
    if (referenceNumber === AlFouadMockReferenceNumber.stateNotFound) {
      return {
        State: AlFouadMockResponseState.failed,
        Message: 'No results were found.',
        ErrorCode: AlFouadMockErrorCode.transactionNotFound,
      };
    }

    const state =
      stateByReferenceNumber.get(referenceNumber) ??
      AlFouadMockTransactionState.paid;

    return {
      State: state,
      Message: 'Transaction found',
    };
  }

  private duplicateReferenceNumberResponse(): AlFouadTransactionResponseDto {
    return {
      State: AlFouadMockResponseState.failed,
      Message: 'Duplicate ReferenceNumber',
      ErrorCode: AlFouadMockErrorCode.duplicateReferenceNumber,
    };
  }
}
