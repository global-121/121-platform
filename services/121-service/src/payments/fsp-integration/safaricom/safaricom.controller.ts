import { Controller, Get } from '@nestjs/common';
import { SafaricomService } from './safaricom.service';

@Controller('safaricom')
export class SafaricomController {
  constructor(private readonly SafaricomService: SafaricomService) {}

  @Get('/access-token')
  public async getAccessToken(): Promise<string> {
    const accessToken = await this.SafaricomService.getAccessToken();
    console.log("Access Token: " + accessToken);
    return accessToken;
  }
}
