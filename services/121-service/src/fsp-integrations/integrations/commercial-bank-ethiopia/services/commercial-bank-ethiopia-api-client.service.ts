import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { AxiosError } from '@nestjs/terminus/dist/errors/axios.error';
import soapRequest from 'easy-soap-request';
import https from 'node:https';
import * as convert from 'xml-js';

import { env } from '@121-service/src/env';
import { FspMode } from '@121-service/src/fsp-integrations/shared/enum/fsp-mode.enum';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Injectable()
export class CommercialBankEthiopiaApiClientService implements OnModuleDestroy {
  private httpsAgent: https.Agent | undefined;

  public constructor(private readonly httpService: CustomHttpService) {
    this.httpsAgent = this.createHttpsAgent();
  }

  onModuleDestroy(): void {
    this.httpsAgent?.destroy();
  }

  private createHttpsAgent(): https.Agent | undefined {
    if (this.httpsAgent) {
      return this.httpsAgent;
    }

    const cbeConnectionConfig: https.AgentOptions = {
      // The connection with CBE can be unstable/unpredictable;
      // We want to reuse any open connections as much as possible, and reduce the chance of running into connection errors (ECONNRESET)
      // Probably, the first request after some idle time might still run into a connection error, but subsequent requests should be fine.
      keepAlive: true,
    };

    if (
      env.COMMERCIAL_BANK_ETHIOPIA_MODE === FspMode.external &&
      env.COMMERCIAL_BANK_ETHIOPIA_CERTIFICATE_PATH
    ) {
      return this.httpService.createHttpsAgentWithSelfSignedCertificateOnly(
        env.COMMERCIAL_BANK_ETHIOPIA_CERTIFICATE_PATH,
        cbeConnectionConfig,
      );
    }
    // Use a 'default' https agent for non-production modes, without certificate
    return new https.Agent(cbeConnectionConfig);
  }

  public async makeApiRequest({
    apiUrl,
    payload,
    soapAction,
  }: {
    apiUrl: string;
    payload: any;
    soapAction: string;
  }): Promise<any> {
    const soapRequestXml = convert.js2xml(payload, {
      compact: false,
      spaces: 4,
    });

    return soapRequest({
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        soapAction,
      },
      url: apiUrl,
      xml: soapRequestXml,
      timeout: 150_000,
      extraOpts: {
        httpsAgent: this.httpsAgent,
      },
    })
      .then(
        (rawResponse: {
          response: {
            headers: any;
            body: any;
            statusCode: number;
          };
        }) => {
          const response = rawResponse.response;
          this.httpService.logMessageRequest(
            { url: apiUrl, payload: soapRequestXml },
            {
              status: response.statusCode,
              statusText: '',
              data: response.body,
            },
          );

          // Parse the SOAP response if needed
          const parsedResponse = convert.xml2js(response.body, {
            compact: true,
          });

          if (
            parsedResponse['S:Envelope']['S:Body'][
              'ns10:RMTFundtransferResponse'
            ]
          ) {
            return parsedResponse['S:Envelope']['S:Body'][
              'ns10:RMTFundtransferResponse'
            ];
          } else if (
            parsedResponse['S:Envelope']['S:Body'][
              'ns10:CBERemitanceTransactionStatusResponse'
            ]
          ) {
            return parsedResponse['S:Envelope']['S:Body'][
              'ns10:CBERemitanceTransactionStatusResponse'
            ];
          } else if (
            parsedResponse['S:Envelope']['S:Body'][
              'ns10:AccountEnquiryResponse'
            ]
          ) {
            return parsedResponse['S:Envelope']['S:Body'][
              'ns10:AccountEnquiryResponse'
            ];
          }
          return null;
        },
      )
      .catch((err: any | AxiosError) => {
        this.httpService.logErrorRequest(
          { url: apiUrl, payload: soapRequestXml },
          {
            status: err.response?.code ?? err.code ?? undefined,
            statusText: err.response?.status ?? err.status ?? undefined,
            data: { error: err },
          },
        );
        throw err;
      });
  }
}
