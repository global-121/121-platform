import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { API_PATHS, EXTERNAL_API } from '../../config';
import { SafaricomTransferPayload } from './safaricom.dto';

@Injectable()
export class SafaricomMockService {
  public async authenticate(): Promise<object> {
    console.log('authenticate: ');
    return {
      access_token: 'mock_access_token',
      expires_in: 3600,
    };
  }

  public async transfer(
    transferDto: SafaricomTransferPayload,
  ): Promise<object> {
    const response = {
      ConversationID: transferDto.conversationId,
      OriginatorConversationID: transferDto.OriginatorConversationID,
      ResponseCode: '0', // means success
      ResponseDescription: 'string',
    };
    console.log('response: ', response);

    // TODO: trigger callback
    this.sendStatusCallback(transferDto);

    return response;
  }

  private async sendStatusCallback(
    transferDto: SafaricomTransferPayload,
  ): Promise<void> {
    // await setTimeout(30);
    const request = {
      Result: {
        OriginatorConversationId: transferDto.OriginatorConversationID,
        ResultCode: '0',
      },
    };
    console.log('request: ', request);
    const httpService = new HttpService();
    const path = API_PATHS.safaricomCallback;
    const urlExternal = `${process.env.EXTERNAL_121_SERVICE_URL}api/${path}`;
    try {
      // Try to reach 121-service through external API url
      await lastValueFrom(httpService.post(urlExternal, request));
    } catch (error) {
      // In case external API is not reachable try internal network
      const urlInternal = `${EXTERNAL_API.rootApi}/${path}`;
      await lastValueFrom(httpService.post(urlInternal, request)).catch(
        (error) => console.log(error),
      );
    }
  }
}
