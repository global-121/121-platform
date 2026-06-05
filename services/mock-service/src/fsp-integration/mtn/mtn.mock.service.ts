import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

import { API_PATHS, EXTERNAL_API_ROOT } from '@mock-service/src/config';
import { MtnAuthenticateResponseDto } from '@mock-service/src/fsp-integration/mtn/dto/mtn-authenticate-response.dto';
import { MtnCreateTransferRequestDto } from '@mock-service/src/fsp-integration/mtn/dto/mtn-create-transfer-request.dto';
import { MtnTransferStatusResponseDto } from '@mock-service/src/fsp-integration/mtn/dto/mtn-transfer-status-response.dto';

// Used to drive createTransfer error responses based on phone number.
enum MtnMockPhoneNumber {
  failDuplicate = '100000001',
  failInternalError = '100000002',
}

// Mock referenceIds used to drive the (stateless) mock from end-to-end tests.
// `MtnService.generateMtnReferenceId` passes them through unchanged so the
// mock can derive the scenario from the referenceId alone.
export enum MtnMockReferenceId {
  notFound = '00000000-0000-0000-0000-000000000404',
  failPayeeNotFound = '00000000-0000-0000-0000-000000000402',
}

export const MtnAuthToken = 'mock-mtn-access-token-12345';

@Injectable()
export class MtnMockService {
  private static readonly uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  constructor(private readonly httpService: HttpService) {}

  public authenticate({
    authorization,
    subscriptionKey,
  }: {
    authorization: string | undefined;
    subscriptionKey: string | undefined;
  }): MtnAuthenticateResponseDto {
    if (!subscriptionKey) {
      throw new HttpException(
        { message: 'Access denied due to missing subscription key.' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!authorization?.startsWith('Basic ')) {
      throw new HttpException(
        { message: 'Invalid or missing Authorization header.' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    return {
      access_token: MtnAuthToken,
      token_type: 'access_token',
      expires_in: 3600,
    };
  }

  public createTransfer({
    referenceId,
    subscriptionKey,
    body,
  }: {
    referenceId: string | undefined;
    subscriptionKey: string | undefined;
    body: MtnCreateTransferRequestDto;
  }): void {
    if (!subscriptionKey) {
      throw new HttpException(
        { message: 'Access denied due to missing subscription key.' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!referenceId) {
      throw new HttpException(
        { message: 'X-Reference-Id header is required.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!MtnMockService.uuidPattern.test(referenceId)) {
      throw new HttpException(
        { message: 'X-Reference-Id must be a valid UUID.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (body.payee.partyId === MtnMockPhoneNumber.failDuplicate) {
      throw new HttpException(
        { code: 'RESOURCE_ALREADY_EXIST', message: 'Duplicated reference id.' },
        HttpStatus.CONFLICT,
      );
    }

    if (body.payee.partyId === MtnMockPhoneNumber.failInternalError) {
      throw new HttpException(
        { code: 'INTERNAL_PROCESSING_ERROR', message: 'Internal error.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Fire-and-forget: send a callback to the 121-service, mimicking MTN's
    // production behavior where they POST the transfer result.
    const callbackStatus = this.deriveCallbackStatus({ referenceId });
    void this.sendTransferCallback({
      externalId: body.externalId,
      referenceId,
      status: callbackStatus.status,
      reason: callbackStatus.reason,
    });
  }

  private deriveCallbackStatus({ referenceId }: { referenceId: string }): {
    status: string;
    reason?: string;
  } {
    if (referenceId === MtnMockReferenceId.failPayeeNotFound) {
      return { status: 'FAILED', reason: 'PAYEE_NOT_FOUND' };
    }
    return { status: 'SUCCESSFUL' };
  }

  private async sendTransferCallback({
    externalId,
    referenceId,
    status,
    reason,
  }: {
    externalId: string;
    referenceId: string;
    status: string;
    reason?: string;
  }): Promise<void> {
    const url = `${EXTERNAL_API_ROOT}/${API_PATHS.mtnTransferCallback}`;
    const body = { externalId, referenceId, status, reason: reason ?? '' };

    try {
      await lastValueFrom(this.httpService.post(url, body));
    } catch (error) {
      console.error('[MTN Mock] Failed to send transfer callback:', error);
    }
  }

  public getTransfer({
    referenceId,
    subscriptionKey,
  }: {
    referenceId: string;
    subscriptionKey: string | undefined;
  }): MtnTransferStatusResponseDto {
    if (!subscriptionKey) {
      throw new HttpException(
        { message: 'Access denied due to missing subscription key.' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (referenceId === MtnMockReferenceId.notFound) {
      throw new HttpException(
        {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Requested resource was not found.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    if (referenceId === MtnMockReferenceId.failPayeeNotFound) {
      return { status: 'FAILED', reason: 'PAYEE_NOT_FOUND' };
    }

    return { status: 'SUCCESSFUL' };
  }
}
