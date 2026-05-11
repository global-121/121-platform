import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { MtnAuthenticateResponseDto } from '@mock-service/src/fsp-integration/mtn/dto/mtn-authenticate-response.dto';
import { MtnCreateTransferRequestDto } from '@mock-service/src/fsp-integration/mtn/dto/mtn-create-transfer-request.dto';
import { MtnTransferStatusResponseDto } from '@mock-service/src/fsp-integration/mtn/dto/mtn-transfer-status-response.dto';

enum MtnMockPhoneNumber {
  failDuplicate = '100000001',
  failInternalError = '100000002',
}

const MTN_MOCK_NOT_FOUND_REFERENCE_ID = '00000000-0000-0000-0000-000000000404';

export const MtnAuthToken = 'mock-mtn-access-token-12345';

@Injectable()
export class MtnMockService {
  private static readonly uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

    // Transfer accepted. The 121-service polls getTransferStatus and triggers
    // its own callback, so the mock does not need to push a callback here.
  }

  public getTransferStatus({
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

    if (referenceId === MTN_MOCK_NOT_FOUND_REFERENCE_ID) {
      throw new HttpException(
        {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Requested resource was not found.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return { status: 'SUCCESSFUL' };
  }
}
