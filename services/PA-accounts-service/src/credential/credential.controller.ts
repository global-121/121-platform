import { CredentialService } from './credential.service';
import { Controller, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiBearerAuth, ApiUseTags } from '@nestjs/swagger';
import { DidProgramIdDto } from './dto/did-program-id.dto';

@ApiBearerAuth()
@ApiUseTags('credential')
@Controller()
export class CredentialController {
  private readonly credentialService: CredentialService;

  public constructor(credentialService: CredentialService) {
    this.credentialService = credentialService;
  }
  @ApiOperation({ title: 'Gets the credential and stores it in the wallet' })
  @Post('get-credential-handle-proof')
  public async getAndStoreCredential(
    @Body() didProgramDto: DidProgramIdDto,
  ): Promise<void> {
    return await this.credentialService.getCredentialHandleProof(
      didProgramDto.did,
      didProgramDto.programId,
    );
  }
}
