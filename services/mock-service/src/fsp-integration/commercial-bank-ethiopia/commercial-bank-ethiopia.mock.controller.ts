import { Controller, Headers, Post, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import * as convert from 'xml-js';

import { CommercialBankEthiopiaMockService } from '@mock-service/src/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia.mock.service';
import { SoapPayload } from '@mock-service/src/fsp-integration/commercial-bank-ethiopia/interfaces/soap-payload.interface';

@ApiTags('fsp/commercial-bank-ethiopia')
@Controller('fsp/commercial-bank-ethiopia')
export class CommercialBankEthiopiaMockController {
  public constructor(
    private readonly CommercialBankEthiopiaMockService: CommercialBankEthiopiaMockService,
  ) {}

  @ApiOperation({ summary: 'Handle SOAP call' })
  @Post('/services')
  public async handleSoapCall(
    @Headers('soapAction') soapAction: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const rawBody = req.body;
      const parsedBody = convert.xml2js(rawBody, {
        compact: true,
        ignoreDeclaration: true,
      }) as SoapPayload<any>;

      // Route the request based on the soapAction
      let responseObject;
      if (soapAction.endsWith('xsd=2')) {
        responseObject =
          await this.CommercialBankEthiopiaMockService.doAccountEnquiry(
            parsedBody,
          );
      } else if (soapAction.endsWith('xsd=4')) {
        responseObject =
          await this.CommercialBankEthiopiaMockService.doTransferCredit(
            parsedBody,
          );
      } else if (soapAction.endsWith('xsd=6')) {
        responseObject =
          await this.CommercialBankEthiopiaMockService.doTransactionStatusEnquiry(
            parsedBody,
          );
      } else {
        throw new Error(`Unsupported soapAction: ${soapAction}`);
      }

      const responseXml = convert.js2xml(responseObject, {
        compact: true,
        spaces: 4,
      });

      res.set('Content-Type', 'text/xml');
      res.status(200).send(responseXml);
    } catch (error) {
      res.set('Content-Type', 'text/xml');
      res.status(500).send(
        `<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
          <S:Body>
            <S:Fault>
              <faultcode>SOAP-ENV:Server</faultcode>
              <faultstring>${error.message}</faultstring>
            </S:Fault>
          </S:Body>
        </S:Envelope>`,
      );
    }
  }
}
