import { AirtelDisbursementResponseDto } from '@121-service/src/payments/fsp-integration/airtel/dtos/airtel-disbursement-response.dto';
import { AirtelDisbursementResponseWithMessageDto } from '@121-service/src/payments/fsp-integration/airtel/dtos/airtel-disbursement-response-with-message.dto';

export const AirtelDisbursementResponseToWithMessageMapper = (
  airtelDisbursementResponse: AirtelDisbursementResponseDto,
): AirtelDisbursementResponseWithMessageDto => {
  const { result, data } = airtelDisbursementResponse;

  let message = '';
  // We're not sure this exists.
  if (data?.status?.message) {
    message = data.status.message;
  } else {
    // Put whatever is in data as a string.
    // This is a fallback in case the message is not structured as expected.
    message = JSON.stringify(data);
  }

  return {
    result,
    message,
  };
};
