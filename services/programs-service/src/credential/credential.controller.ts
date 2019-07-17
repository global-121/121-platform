import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUseTags,
  ApiImplicitParam,
} from '@nestjs/swagger';
import { Controller, Get, Body, Post, Param, UsePipes, ValidationPipe } from '@nestjs/common';
import { CredentialService } from './credential.service';
import { ConnectionRequestDto } from '../create-connection/dto/connection-request.dto';
import { EncryptedMessageDto } from '../encrypted-message-dto/encrypted-message.dto';
import { CredentialValuesDto } from './dto/credential-values.dto';


@ApiUseTags('credential')
@Controller('credential')
export class CredentialController {
  private readonly credentialService: CredentialService;
  public constructor(credentialService: CredentialService) {
    this.credentialService = credentialService;
  }

  @ApiOperation({ title: 'Get credential offer' })
  @ApiResponse({ status: 200, description: 'Credential offer is sent' })
  @ApiImplicitParam({ name: 'did', required: true, type: 'string' })
  @Get('/offer')
  public async getOffer(@Param() params): Promise<EncryptedMessageDto> {
    return await this.credentialService.getOffer(params);
  }

  @ApiOperation({ title: 'Post credential request' })
  @ApiResponse({ status: 200, description: 'Credential request received' })
  @Post('/request')
  public async request(
    @Body() encryptedCredRequest: EncryptedMessageDto,
  ): Promise<void> {
    return await this.credentialService.request(encryptedCredRequest);
  }

  @ApiBearerAuth()
  @ApiOperation({ title: 'Issue credentials' })
  @ApiResponse({ status: 200, description: 'Credentials issued' })
  @UsePipes(new ValidationPipe())
  @Post('/issue')
  public async issue(
    @Body() credentialValues: CredentialValuesDto,
  ): Promise<void> {
    return await this.credentialService.issue(credentialValues);
  }

  @ApiOperation({ title: 'Get credentials' })
  @ApiResponse({ status: 200, description: 'Credentials sent' })
  @ApiImplicitParam({ name: 'did', required: true, type: 'string' })
  @Get(':did')
  public async get(@Param() params): Promise<EncryptedMessageDto> {
    return await this.credentialService.get(params);
  }
}
