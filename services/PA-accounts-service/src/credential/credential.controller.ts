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
  public async getCredentialHandleProof(@Body()
  payload: {
    didProgramDto: DidProgramIdDto;
    apiKey: string;
  }): Promise<void> {
    if (payload.apiKey === process.env.PA_API_KEY) {
      return await this.credentialService.getCredentialHandleProof(
        payload.didProgramDto.did,
        payload.didProgramDto.programId,
      );
    }
  }
}
