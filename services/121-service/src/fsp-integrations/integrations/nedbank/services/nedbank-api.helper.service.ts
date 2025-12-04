import { Injectable } from '@nestjs/common';

import { ErrorReponseNedbankApiDto } from '@121-service/src/fsp-integrations/integrations/nedbank/dtos/nedbank-api/error-response-nedbank-api.dto';

@Injectable()
export class NedbankApiHelperService {
  public isNedbankErrorResponse(
    response: unknown,
  ): response is ErrorReponseNedbankApiDto {
    return (response as { Data?: unknown })?.Data === undefined;
  }

  public createErrorMessageIfApplicable(
    responseBody: ErrorReponseNedbankApiDto,
  ): string {
    let errorMessage = '';

    if (responseBody.Errors && responseBody.Errors.length > 0) {
      const errorMessages = responseBody.Errors.map(
        (error) => error.Message,
      ).filter(Boolean);
      errorMessage = `Errors: ${errorMessages.join('; ')}`;
    }

    const additionalInfo: string[] = [];
    if (responseBody.Message) {
      additionalInfo.push(`Message: ${responseBody.Message}`);
    }

    if (responseBody.Code) {
      additionalInfo.push(`Code: ${responseBody.Code}`);
    }
    if (responseBody.Id) {
      additionalInfo.push(`Id: ${responseBody.Id}`);
    }

    if (additionalInfo.length > 0) {
      errorMessage += ` (${additionalInfo.join(', ')})`;
    }

    if (errorMessage === '') {
      errorMessage = JSON.stringify(responseBody);
    }

    return errorMessage;
  }
}
