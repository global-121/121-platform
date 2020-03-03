import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUseTags,
  ApiImplicitParam,
  ApiImplicitQuery,
} from '@nestjs/swagger';
import {
  Controller,
  Get,
  Body,
  Post,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CredentialService } from './credential.service';
import { EncryptedMessageDto } from '../encrypted-message-dto/encrypted-message.dto';
import { PrefilledAnswersDto } from './dto/prefilled-answers.dto';
import { CredentialRequestDto } from './dto/credential-request.dto';
import { CredentialIssueDto } from './dto/credential-issue.dto';
import { DeleteResult } from 'typeorm';
import { RolesGuard } from '../../roles.guard';
import { Roles } from '../../roles.decorator';
import { UserRole } from '../../user-role.enum';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiUseTags('sovrin')
@Controller('sovrin/credential')
export class CredentialController {
  private readonly credentialService: CredentialService;
  public constructor(credentialService: CredentialService) {
    this.credentialService = credentialService;
  }

  @ApiOperation({ title: 'Get credential offer' })
  @ApiResponse({ status: 200, description: 'Credential offer is sent' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'string' })
  @Get('/offer/:programId')
  public async getOffer(@Param() params): Promise<object> {
    return await this.credentialService.getOffer(params.programId);
  }

  @ApiOperation({ title: 'PA gets credential attributes' })
  @ApiResponse({ status: 200, description: 'Attributes received' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'string' })
  @Get('/attributes/:programId')
  public async getAttributes(@Param() params): Promise<any[]> {
    return await this.credentialService.getAttributes(params.programId);
  }

  @ApiOperation({ title: 'PA posts prefilled answers to attributes' })
  @ApiResponse({ status: 200, description: 'Prefilled answers sent' })
  @Post('/attributes')
  public async prefilledAnswers(
    @Body() prefilledAnswers: PrefilledAnswersDto,
  ): Promise<any[]> {
    return await this.credentialService.prefilledAnswers(
      prefilledAnswers.did,
      prefilledAnswers.programId,
      prefilledAnswers.attributes,
    );
  }

  @Roles(UserRole.Aidworker)
  @ApiOperation({ title: 'Get prefilled answers (for AW)' })
  @ApiResponse({ status: 200, description: 'Prefilled answers received' })
  @ApiImplicitParam({
    name: 'did',
    required: true,
    type: 'string',
    description: 'did:sov:2wJPyULfLLnYTEFYzByfUR',
  })
  @ApiImplicitQuery({
    name: 'programId',
    required: false,
    type: 'number',
  })
  @Get('/answers/:did')
  public async getPrefilledAnswers(
    @Param() params,
    @Query() query,
  ): Promise<any[]> {
    return await this.credentialService.getPrefilledAnswers(
      params.did,
      query.programId,
    );
  }

  @Roles(UserRole.Aidworker)
  @ApiOperation({
    title: 'Delete prefilled answers (for AW, after issuing credential)',
  })
  @ApiResponse({ status: 200, description: 'Prefilled answers deleted' })
  @ApiImplicitParam({
    name: 'did',
    required: true,
    type: 'string',
    description: 'did:sov:12351352kl',
  })
  @ApiImplicitQuery({
    name: 'programId',
    required: false,
    type: 'number',
  })
  @Delete('/answers/:did')
  public async deletePrefilledAnswers(
    @Param() params,
    @Query() query,
  ): Promise<DeleteResult> {
    return await this.credentialService.deletePrefilledAnswers(
      params.did,
      query.programId,
    );
  }

  @ApiOperation({ title: 'Post credential request (for PA)' })
  @ApiResponse({ status: 200, description: 'Credential request received' })
  @Post('/request')
  public async request(
    @Body() credRequest: CredentialRequestDto,
  ): Promise<void> {
    return await this.credentialService.request(credRequest);
  }

  @Roles(UserRole.Aidworker)
  @ApiOperation({ title: 'Issue credentials (For AW)' })
  @ApiResponse({ status: 200, description: 'Credentials issued' })
  @Post('/issue')
  public async issue(
    @Body() credentialIssue: CredentialIssueDto,
  ): Promise<void> {
    return await this.credentialService.issue(credentialIssue);
  }

  @ApiOperation({ title: 'Get credentials (For PA)' })
  @ApiResponse({ status: 200, description: 'Credentials sent' })
  @ApiImplicitParam({ name: 'did', required: true, type: 'string' })
  @Get(':did')
  public async get(@Param() params): Promise<EncryptedMessageDto> {
    return await this.credentialService.get(params.did);
  }

  @ApiOperation({ title: 'Delete credentials (For PA)' })
  @ApiResponse({ status: 200, description: 'Credentials deleted' })
  @ApiImplicitParam({ name: 'did', required: true, type: 'string' })
  @Delete(':did')
  public async delete(@Param() params): Promise<DeleteResult> {
    return await this.credentialService.delete(params.did);
  }
}
