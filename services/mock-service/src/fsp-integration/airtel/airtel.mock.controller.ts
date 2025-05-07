import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  AirtelAuthenticateBodyDto,
  AirtelAuthenticateResponseBodyFailDto,
  AirtelAuthenticateResponseBodySuccessDto,
  AirtelDisbursementV1PayloadDto,
  AirtelDisbursementV1ResponseSuccessBodyDto,
} from '@mock-service/src/fsp-integration/airtel/airtel.dto';
import {
  AirtelAuthToken,
  AirtelMockService,
} from '@mock-service/src/fsp-integration/airtel/airtel.mock.service';

@ApiTags('fsp/airtel')
@Controller('fsp/airtel')
export class AirtelMockController {
  public constructor(private readonly airtelMockService: AirtelMockService) {}

  @ApiOperation({ summary: 'Get Oauth2 access token' })
  @Post('auth/oauth2/token')
  // Airtel API responds with 200
  @HttpCode(200)
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Incorrect request. See response for details.',
    type: AirtelAuthenticateResponseBodyFailDto,
    example: {
      error_description: 'Invalid client authentication',
      error: 'invalid_client',
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OAuth Access token generated. See response for details.',
    type: AirtelAuthenticateResponseBodySuccessDto,
    example: {
      token_type: 'bearer',
      access_token: 'FjE953LG40P0hdehYEiSkUd0hGWshyFf',
      expires_in: 180,
    },
  })
  public async getAccessToken(
    @Body() authenticateBody: AirtelAuthenticateBodyDto,
  ): Promise<
    | AirtelAuthenticateResponseBodySuccessDto
    | AirtelAuthenticateResponseBodyFailDto
  > {
    const response =
      await this.airtelMockService.getAccessToken(authenticateBody);
    if ('error' in response) {
      throw new BadRequestException(response);
    }
    return response;
  }

  @ApiOperation({ summary: 'Disbursement API v1' })
  @Post('standard/v1/disbursements/')
  // Airtel API responds with 200 on success
  @HttpCode(200)
  @ApiHeader({
    name: 'X-Currency',
    description:
      'Currency code in "ISO 4217" format, for example: "ZMW" for Zambian Kwacha.',
    required: true,
  })
  @ApiHeader({
    name: 'X-Country',
    description:
      'Country code in "ISO 3166-1 alpha-2" format, for example: "ZM" for Zambia.',
    required: true,
  })
  // Using @ApiHeader with "Authorization" does not work. Actually using Having
  // "Authorization" headers is possible but then we'd have to create full auth
  // for the whole mock-service. So we use "Authorization_" instead and accept
  // both in the service. In the Swagger UI we can just fill in the value for
  // "Authorization_". But integration tests can then use "Authorization" as
  // it's in production.
  @ApiHeader({
    name: 'Authorization_',
    description: `Oauth Bearer token, needs to be exactly: "Bearer ${AirtelAuthToken}". <br/> In the production API the header is called "Authorization", for technical reasons it\'s called "Authorization_" here.`,
    required: true,
  })
  public async disburseV1(
    @Body() disburseV1Body: AirtelDisbursementV1PayloadDto,
    @Headers() headers: Record<string, string>,
    // We use type "object" here because we have a bunch of different response bodies.
  ): Promise<AirtelDisbursementV1ResponseSuccessBodyDto | object> {
    const [http, body] = await this.airtelMockService.disburseV1(
      disburseV1Body,
      headers,
    );

    if (http === 403) throw new ForbiddenException(body);
    if (http === 400) throw new BadRequestException(body);

    return body;
  }
}
