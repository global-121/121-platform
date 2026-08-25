import { Injectable } from '@nestjs/common';

import { AlfouadCreateTransactionRequestDto } from '@mock-service/src/fsp-integration/alfouad/dto/alfouad-create-transaction-request.dto';
import { AlfouadTransactionResponseDto } from '@mock-service/src/fsp-integration/alfouad/dto/alfouad-transaction-response.dto';

// Copied from 121-service enums: no easy way to share code between the two services.
enum AlfouadMockResponseState {
  success = '1',
  failed = '0',
}

enum AlfouadMockErrorCode {
  transactionNotFound = '821',
  duplicateReferenceNumber = '822',
  // Mock-only code: Al Fouad returns a descriptive Message without a fixed code for general errors.
  businessError = '999',
}

enum AlfouadMockTransactionState {
  pendingApproval = '1',
  approved = '2',
  paid = '3',
  hold = '4',
  canceled = '5',
}

// Used to drive create-transaction responses based on beneficiary phone number.
export enum AlfouadMockPhoneNumber {
  failBusinessError = '963000000001',
  failDuplicateExisting = '963000000002',
  failDuplicateMissing = '963000000003',
  statePendingApproval = '963000000010',
  stateApproved = '963000000011',
  stateHold = '963000000012',
  stateCanceled = '963000000013',
}

const stateByPhoneNumber = new Map<string, AlfouadMockTransactionState>([
  [AlfouadMockPhoneNumber.statePendingApproval, AlfouadMockTransactionState.pendingApproval],
  [AlfouadMockPhoneNumber.stateApproved, AlfouadMockTransactionState.approved],
  [AlfouadMockPhoneNumber.stateHold, AlfouadMockTransactionState.hold],
  [AlfouadMockPhoneNumber.stateCanceled, AlfouadMockTransactionState.canceled],
]);

@Injectable()
export class AlfouadMockService {
  // In-memory only: correlates created transactions with later status lookups,
  // as the real Al Fouad API does. Nothing is persisted.
  private readonly transactionStateByReferenceNumber = new Map<
    string,
    AlfouadMockTransactionState
  >();

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
      AlfouadMockPhoneNumber.failDuplicateMissing
    ) {
      // Reports a duplicate, but the transaction cannot be found afterwards.
      return this.duplicateReferenceNumberResponse();
    }

    this.transactionStateByReferenceNumber.set(
      body.ReferenceNumber,
      stateByPhoneNumber.get(body.BeneficiaryPhoneNumber) ??
        AlfouadMockTransactionState.paid,
    );

    if (
      body.BeneficiaryPhoneNumber ===
      AlfouadMockPhoneNumber.failDuplicateExisting
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
    const state =
      this.transactionStateByReferenceNumber.get(referenceNumber);

    if (!state) {
      return {
        State: AlfouadMockResponseState.failed,
        Message: 'No results were found.',
        ErrorCode: AlfouadMockErrorCode.transactionNotFound,
      };
    }

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
