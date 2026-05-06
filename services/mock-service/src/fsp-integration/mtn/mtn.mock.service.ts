import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable } from '@nestjs/common';
import { setTimeout } from 'node:timers/promises';
import { lastValueFrom } from 'rxjs';

import { API_PATHS, EXTERNAL_API_ROOT } from '@mock-service/src/config';
import { MtnAuthenticateResponseDto } from '@mock-service/src/fsp-integration/mtn/dto/mtn-authenticate-response.dto';
import { MtnCreateTransferRequestDto } from '@mock-service/src/fsp-integration/mtn/dto/mtn-create-transfer-request.dto';
import { MtnTransferStatusResponseDto } from '@mock-service/src/fsp-integration/mtn/dto/mtn-transfer-status-response.dto';

enum MtnMockPhoneNumber {
  failDuplicate = '100000001',
  failInternalError = '100000002',
}

export const MtnAuthToken = 'mock-mtn-access-token-12345';

@Injectable()
export class MtnMockService {
  private readonly transfers = new Map<string, MtnCreateTransferRequestDto>();

  private static readonly uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  public authenticate({
    authorization,
    subscriptionKey,
  }: {
    authorization: string | undefined;
    subscriptionKey: string | undefined;
  }): [HttpStatus, MtnAuthenticateResponseDto | object] {
    if (!subscriptionKey) {
      return [
        HttpStatus.UNAUTHORIZED,
        { message: 'Access denied due to missing subscription key.' },
      ];
    }

    if (!authorization || !authorization.startsWith('Basic ')) {
      return [
        HttpStatus.UNAUTHORIZED,
        { message: 'Invalid or missing Authorization header.' },
      ];
    }

    return [
      HttpStatus.OK,
      {
        access_token: MtnAuthToken,
        token_type: 'access_token',
        expires_in: 3600,
      } satisfies MtnAuthenticateResponseDto,
    ];
  }

  public createTransfer({
    referenceId,
    subscriptionKey,
    body,
  }: {
    referenceId: string | undefined;
    subscriptionKey: string | undefined;
    body: MtnCreateTransferRequestDto;
  }): [HttpStatus, object | undefined] {
    if (!subscriptionKey) {
      return [
        HttpStatus.UNAUTHORIZED,
        { message: 'Access denied due to missing subscription key.' },
      ];
    }

    if (!referenceId) {
      return [
        HttpStatus.BAD_REQUEST,
        { message: 'X-Reference-Id header is required.' },
      ];
    }

    if (!MtnMockService.uuidPattern.test(referenceId)) {
      return [
        HttpStatus.BAD_REQUEST,
        { message: 'X-Reference-Id must be a valid UUID.' },
      ];
    }

    if (this.transfers.has(referenceId)) {
      return [
        HttpStatus.CONFLICT,
        { code: 'RESOURCE_ALREADY_EXIST', message: 'Duplicated reference id.' },
      ];
    }

    if (body.payee.partyId === MtnMockPhoneNumber.failDuplicate) {
      // Simulate a queue retry: the original transfer went through, so store it,
      // then return 409 as the MTN API would for a duplicate referenceId.
      this.transfers.set(referenceId, body);
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

    this.sendStatusCallback({
      referenceId,
      externalId: body.externalId,
      status: 'SUCCESSFUL',
    })
      // eslint-disable-next-line promise/prefer-await-to-callbacks, promise/prefer-await-to-then -- We want to log errors from the callback but not fail the main request
      .catch((error) => console.log(error));

    return [HttpStatus.ACCEPTED, undefined];
  }

  public getTransferStatus({
    referenceId,
    subscriptionKey,
  }: {
    referenceId: string;
    subscriptionKey: string | undefined;
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

  private async sendStatusCallback({
    referenceId,
    externalId,
    status,
  }: {
    referenceId: string;
    externalId: string;
    status: string;
  }): Promise<void> {
    await setTimeout(300);

    const url = `${EXTERNAL_API_ROOT}/${API_PATHS.mtnTransferCallback}`;
    const payload = { referenceId, externalId, status };

    const httpService = new HttpService();
    await lastValueFrom(httpService.post(url, payload)).catch((error) =>
      console.log(error),
    );
  }
}
