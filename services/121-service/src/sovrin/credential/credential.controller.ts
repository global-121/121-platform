import { DownloadData } from './interfaces/download-data.interface';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUseTags,
  ApiImplicitParam,
} from '@nestjs/swagger';
import { Controller, Get, Body, Post, Param, UseGuards } from '@nestjs/common';
import { CredentialService } from './credential.service';
import { EncryptedMessageDto } from '../encrypted-message-dto/encrypted-message.dto';
import { PrefilledAnswersDto } from './dto/prefilled-answers.dto';
import { CredentialRequestDto } from './dto/credential-request.dto';
import { CredentialIssueDto } from './dto/credential-issue.dto';
import { DidDto } from '../../programs/program/dto/did.dto';
import { DeleteResult } from 'typeorm';
import { RolesGuard } from '../../roles.guard';
import { Roles } from '../../roles.decorator';
import { UserRole } from '../../user-role.enum';
import { DidProgramDto } from './dto/did-program.dto';
import { User } from '../../user/user.decorator';
import { CredentialAttributesEntity } from './credential-attributes.entity';

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

  @Roles(UserRole.FieldValidation)
  @ApiOperation({ title: 'Get prefilled answers (for AW)' })
  @ApiResponse({ status: 200, description: 'Prefilled answers received' })
  @Post('/get-answers')
  public async getPrefilledAnswers(
    @Body() getAnswers: DidProgramDto,
  ): Promise<any[]> {
    return await this.credentialService.getPrefilledAnswers(
      getAnswers.did,
      getAnswers.programId,
    );
  }

  @Roles(UserRole.FieldValidation)
  @ApiOperation({ title: 'Get all prefilled answers (for pre-download)' })
  @ApiResponse({ status: 200, description: 'Prefilled answers downloaded' })
  @Get('/download-data')
  public async getAllPrefilledAnswers(
    @User('id') userId: number,
  ): Promise<DownloadData> {
    return await this.credentialService.downloadData(userId);
  }

  @ApiOperation({ title: 'Post credential request (for PA)' })
  @ApiResponse({ status: 200, description: 'Credential request received' })
  @Post('/request')
  public async request(
    @Body() credRequest: CredentialRequestDto,
  ): Promise<void> {
    return await this.credentialService.request(credRequest);
  }

  @Roles(UserRole.FieldValidation)
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
  @Post('/get')
  public async get(@Body() did: DidDto): Promise<EncryptedMessageDto> {
    return await this.credentialService.get(did.did);
  }

  @ApiOperation({ title: 'Delete credentials (For PA)' })
  @ApiResponse({ status: 200, description: 'Credentials deleted' })
  @Post('delete')
  public async delete(@Body() did: DidDto): Promise<DeleteResult> {
    return await this.credentialService.delete(did.did);
  }
}
