import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CooperativeBankOfOromiaMockService } from '@mock-service/src/fsp-integration/cooperative-bank-of-oromia/cooperative-bank-of-oromia.mock.service';

@ApiTags('fsp/cooperative-bank-of-oromia')
@Controller()
export class CooperativeBankOfOromiaMockController {
  public constructor(private readonly mockService: CooperativeBankOfOromiaMockService) {}

  @ApiOperation({ summary: 'Initiate Payment' })
  @Post('payments')
  @HttpCode(200)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token for API authentication',
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment initiated successfully',
    example: {
      status: 'success',
      data: {
        transfer_id: 'txn_k389djrzn',
        from_account: 'acc_123456',
        to_account: 'acc_789012',
        amount: 100,
        currency: 'USD',
        status: 'completed',
        created_at: '2025-11-17T10:04:54.925Z',
      },
    },
  })
  public async initiatePayment(
    @Headers() headers: Record<string, string>,
    @Body() body: any,
  ): Promise<any> {
    const response = await this.mockService.initiatePayment({
      headers,
      body,
    });
    
    if ('error' in response) {
      throw new BadRequestException(response);
    }
    
    return response;
  }
}

  @ApiOperation({ summary: 'Get Oauth2 access token' })
  @Post('auth/oauth2/token')
  // CooperativeBankOfOromia API responds with 200
  @HttpCode(200)
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Incorrect request. See response for details.',
    type: CooperativeBankOfOromiaAuthenticateResponseFailDto,
    example: {
      error_description: 'Invalid client authentication',
      error: 'invalid_client',
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OAuth Access token generated. See response for details.',
    type: CooperativeBankOfOromiaAuthenticateResponseSuccessDto,
    example: {
      token_type: 'bearer',
      access_token: CooperativeBankOfOromiaAuthToken,
      expires_in: 180,
    },
  })
  public async getAccessToken(
    @Headers() headers: Record<string, string>,
    @Body() body: CooperativeBankOfOromiaAuthenticateRequestDto,
  ): Promise<
    CooperativeBankOfOromiaAuthenticateResponseSuccessDto | CooperativeBankOfOromiaAuthenticateResponseFailDto
  > {
    const response = await this.airtelMockService.getAccessToken({
      headers,
      body,
    });
    if ('error' in response) {
      throw new BadRequestException(response);
    }
    return response;
  }

  @ApiOperation({ summary: 'Disbursement API v2' })
  @Post('standard/v2/disbursements')
  @HttpCode(200)
  @ApiHeader({
    name: 'X-Country',
    description:
      'Country code in "ISO 3166-1 alpha-2" format, for example: "ZM" for Zambia.',
    required: true,
  })
  @ApiHeader({
    name: 'X-Currency',
    description:
      'Currency code in "ISO 4217" format, for example: "ZMW" for Zambian Kwacha.',
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
    description: `Oauth Bearer token, needs to be exactly: "Bearer ${CooperativeBankOfOromiaAuthToken}". <br/> In the production API the header is called "Authorization", for technical reasons it\'s called "Authorization_" here.`,
    required: true,
  })
  public async disburseV2(
    @Body() disburseV2Body: CooperativeBankOfOromiaDisbursementV2RequestDto,
    @Headers() headers: CooperativeBankOfOromiaAuthenticatedRequestHeadersDto,
    // We use type "object" here because we have a bunch of different response bodies.
  ): Promise<CooperativeBankOfOromiaDisbursementV2ResponseSuccessDto | object> {
    const [http, body] = await this.airtelMockService.disburseV2(
      disburseV2Body,
      headers,
    );

    if (http === HttpStatus.FORBIDDEN) throw new ForbiddenException(body);
    if (http === HttpStatus.BAD_REQUEST) throw new BadRequestException(body);

    return body;
  }

  @ApiOperation({ summary: 'Enquiry API v2' })
  @Get('standard/v2/disbursements/:id')
  @HttpCode(200)
  @ApiHeader({
    name: 'X-Country',
    description:
      'Country code in "ISO 3166-1 alpha-2" format, for example: "ZM" for Zambia.',
    required: true,
  })
  @ApiHeader({
    name: 'X-Currency',
    description:
      'Currency code in "ISO 4217" format, for example: "ZMW" for Zambian Kwacha.',
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
    description: `Oauth Bearer token, needs to be exactly: "Bearer ${CooperativeBankOfOromiaAuthToken}". <br/> In the production API the header is called "Authorization", for technical reasons it's called "Authorization_" here.`,
    required: true,
  })
  @ApiParam({ name: 'id', required: true, type: 'string' })
  @ApiQuery({
    name: 'transactionType',
    required: true,
    type: 'string',
    description: 'Always "B2C" for CooperativeBankOfOromia.',
  })
  public async enquiryV2(
    @Headers() headers: CooperativeBankOfOromiaAuthenticatedRequestHeadersDto,
    @Param('id') id: string,
    @Query('transactionType')
    transactionType: string, // Always "B2C" for CooperativeBankOfOromia.
    // We use type "object" here because we have a bunch of different response bodies.
  ): Promise<CooperativeBankOfOromiaDisbursementV2ResponseSuccessDto | object> {
    const [http, body] = await this.airtelMockService.enquiryV2({
      id,
      transactionType,
      headers,
    });

    if (http === HttpStatus.FORBIDDEN) throw new ForbiddenException(body);
    if (http === HttpStatus.BAD_REQUEST) throw new BadRequestException(body);

    return body;
  }
}
