import { Injectable } from '@nestjs/common';
import soapRequest from 'easy-soap-request';
import fs from 'fs';
import https from 'https';
import * as convert from 'xml-js';

import { env } from '@121-service/src/env';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Injectable()
export class SoapService {
  public constructor(private readonly httpService: CustomHttpService) {}

  public async post(
    soapBodyPayload: Record<string, unknown>,
    headerFile: string,
    username: string,
    password: string,
    url: string,
  ): Promise<unknown> {
    const jsonSoapBody = convert.js2xml(soapBodyPayload);
    const payload = await this.setSoapHeader(
      soapBodyPayload,
      headerFile,
      username,
      password,
    );
    const xml = convert.js2xml(payload);
    const headers = {
      'user-agent': 'sampleTest',
      'Content-Type': 'text/xml;charset=UTF-8',
    };
    return soapRequest({
      headers,
      url,
      xml,
      timeout: 150000,
    })
      .then(
        (rawResponse: { response: { statusCode: number; body: string } }) => {
          const response = rawResponse.response;
          this.httpService.logMessageRequest(
            { url, payload: jsonSoapBody },
            {
              status: response.statusCode,
              statusText: undefined,
              data: response.body,
            },
          );
          const { body } = response;
          const jsonResponse = convert.xml2js(body, { compact: true });
          return jsonResponse['soap:Envelope']['soap:Body'];
        },
      )
      .catch((error: Error) => {
        this.httpService.logErrorRequest(
          { url, payload: jsonSoapBody },
          {
            status: 500,
            statusText: error.message,
            data: error,
          },
        );
        throw error;
      });
  }

  private async setSoapHeader(
    payload: Record<string, unknown>,
    headerFile: string,
    username: string,
    password: string,
  ): Promise<Record<string, unknown>> {
    const header = await this.readXmlAsJs(headerFile);
    let headerPart = this.getChild(header, 0);
    headerPart = this.setValue(headerPart, [0, 0, 0], username);
    headerPart = this.setValue(headerPart, [0, 1, 0], password);
    (payload['elements'] as any[])[0]['elements'].unshift(headerPart);
    return payload;
  }

  public async readXmlAsJs(xmlName: string): Promise<Record<string, unknown>> {
    const path = './src/shared/xml/' + xmlName + '.xml';
    const xml = fs.readFileSync(path, 'utf-8');
    const jsObject = convert.xml2js(xml);
    return jsObject as Record<string, unknown>;
  }

  public findSoapIndex(
    soapElement: Record<string, unknown>,
    q: string,
  ): number {
    return (soapElement['elements'] as any[]).findIndex(
      (x: any) => x.name === q,
    );
  }

  public changeSoapBody(
    payload: Record<string, unknown>,
    mainElement: string,
    subElements: string[],
    value: string,
  ): Record<string, unknown> {
    const envelopeXML = this.getChild(payload, 0);
    const bodyIndex = this.findSoapIndex(envelopeXML, 'soap:Body');
    const soapBodyXML = this.getChild(envelopeXML, bodyIndex);
    const mainElementIndex = this.findSoapIndex(soapBodyXML, mainElement);
    const mainElementXML = (soapBodyXML['elements'] as any[])[mainElementIndex];
    let rootElement = mainElementXML;
    const pathIndices: number[] = [0, bodyIndex, mainElementIndex];
    let subElementXMLIndex = -1;
    for (const subElementIndex in subElements) {
      subElementXMLIndex = this.findSoapIndex(
        rootElement,
        subElements[subElementIndex],
      );
      if (subElementXMLIndex >= 0) {
        pathIndices.push(subElementXMLIndex);
        rootElement = this.getChild(rootElement, subElementXMLIndex);
      }
    }
    pathIndices.push(0);
    payload = this.setValue(payload, pathIndices, value);
    return payload;
  }

  private getChild(
    xml: Record<string, unknown>,
    index: number,
  ): Record<string, unknown> {
    return (xml['elements'] as unknown[])[index] as Record<string, unknown>;
  }

  private setValue(
    xml: Record<string, unknown>,
    indices: number[],
    value: string,
  ): Record<string, unknown> {
    const firstIndex = indices.shift();
    if (firstIndex == undefined) {
      throw new Error('Invalid indices array.');
    }
    if (indices.length > 0) {
      (xml['elements'] as unknown[])[firstIndex] = this.setValue(
        this.getChild(xml, firstIndex),
        indices,
        value,
      );
    } else {
      ((xml['elements'] as unknown[])[firstIndex] as Record<string, unknown>)[
        'text'
      ] = value;
    }
    return xml;
  }

  public setValueByName(
    xml: Record<string, unknown>,
    attributeName: string,
    value?: string,
  ): Record<string, unknown> {
    for (const el of xml.elements as unknown[]) {
      if ((el as Record<string, unknown>).name === attributeName) {
        (
          ((el as Record<string, unknown>).elements as unknown[])[0] as Record<
            string,
            unknown
          >
        ).text = value;
      }
    }
    return xml;
  }

  async postCBERequest({
    apiUrl,
    payload,
    soapAction,
  }: {
    apiUrl: string | undefined;
    payload: Record<string, unknown>;
    soapAction: string;
  }): Promise<unknown> {
    const soapRequestXml = convert.js2xml(payload, {
      compact: false,
      spaces: 4,
    });

    // Configure and send the SOAP request
    const headers = {
      'Content-Type': 'text/xml;charset=UTF-8',
      soapAction,
    };

    // TODO: REFACTOR: See the NedbankApiClientService for how to handle the certificate, so it works on Azure and locally
    let agent;
    if (env.MOCK_COMMERCIAL_BANK_ETHIOPIA) {
      // Mock enabled
      agent = new https.Agent();
    } else {
      // Mock disabled
      if (!!env.COMMERCIAL_BANK_ETHIOPIA_CERTIFICATE_PATH) {
        try {
          const certificate = fs.readFileSync(
            env.COMMERCIAL_BANK_ETHIOPIA_CERTIFICATE_PATH,
          );
          agent = new https.Agent({
            ca: certificate,
          });
        } catch (error) {
          throw error;
        }
      } else {
        // If no certificate path is provided, create an agent without certificate (for use with the sandbox CBE-API)
        agent = new https.Agent();
      }
    }
    return soapRequest({
      headers,
      url: apiUrl,
      xml: soapRequestXml,
      timeout: 150000,
      extraOpts: {
        httpsAgent: agent,
      },
    })
      .then(
        (rawResponse: { response: { statusCode: number; body: string } }) => {
          const response = rawResponse.response;
          this.httpService.logMessageRequest(
            { url: apiUrl, payload: soapRequestXml },
            {
              status: response.statusCode,
              statusText: undefined,
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
      .catch((err: Error) => {
        this.httpService.logErrorRequest(
          { url: apiUrl, payload: soapRequestXml },
          {
            status: undefined,
            statusText: undefined,
            data: { error: err },
          },
        );
        throw err;
      });
  }
}
