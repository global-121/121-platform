import { HttpStatus, Injectable } from '@nestjs/common';

import { MtnCreateTransferRequestDto } from '@mock-service/src/fsp-integration/mtn/dto/mtn-create-transfer-request.dto';
import { MtnTransferStatusResponseDto } from '@mock-service/src/fsp-integration/mtn/dto/mtn-transfer-status-response.dto';

enum MtnMockPhoneNumber {
  failDuplicate = '000000001',
  failInternalError = '000000002',
}

@Injectable()
export class MtnMockService {
  private readonly transfers = new Map<string, MtnCreateTransferRequestDto>();

  public createTransfer({
    referenceId,
    subscriptionKey,
    body,
  }: {
    referenceId: string;
    subscriptionKey: string;
    body: MtnCreateTransferRequestDto;
  }): [HttpStatus, object | undefined] {
    if (!subscriptionKey) {
      return [
        HttpStatus.UNAUTHORIZED,
        { message: 'Access denied due to missing subscription key.' },
      ];
    }

    if (this.transfers.has(referenceId)) {
      return [
        HttpStatus.CONFLICT,
        { code: 'RESOURCE_ALREADY_EXIST', message: 'Duplicated reference id.' },
      ];
    }

    if (body.payee.partyId === MtnMockPhoneNumber.failDuplicate) {
      return [
        HttpStatus.CONFLICT,
        { code: 'RESOURCE_ALREADY_EXIST', message: 'Duplicated reference id.' },
      ];
    }

    if (body.payee.partyId === MtnMockPhoneNumber.failInternalError) {
      return [
        HttpStatus.INTERNAL_SERVER_ERROR,
        { code: 'INTERNAL_PROCESSING_ERROR', message: 'Internal error.' },
      ];
    }

    this.transfers.set(referenceId, body);

    return [HttpStatus.ACCEPTED, undefined];
  }

  public getTransferStatus({
    referenceId,
    subscriptionKey,
  }: {
    referenceId: string;
    subscriptionKey: string;
  }): [HttpStatus, MtnTransferStatusResponseDto | object] {
    if (!subscriptionKey) {
      return [
        HttpStatus.UNAUTHORIZED,
        { message: 'Access denied due to missing subscription key.' },
      ];
    }

    const transfer = this.transfers.get(referenceId);

    if (!transfer) {
      return [
        HttpStatus.NOT_FOUND,
        {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Requested resource was not found.',
        },
      ];
    }

    return [
      HttpStatus.OK,
      { status: 'SUCCESSFUL' } satisfies MtnTransferStatusResponseDto,
    ];
  }

  public reset(): void {
    this.transfers.clear();
  }
}
