import soapRequest from 'easy-soap-request';
import fs from 'fs';
import * as convert from 'xml-js';
import { INTERSOLVE } from '../../../tokens/intersolve';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SoapService {
  public constructor() {}

  public async post(payload: any): Promise<any> {
    payload = await this.setSoapHeader(payload);
    const xml = convert.js2xml(payload);
    console.log('xml request: ', xml);
    const headersIntersolve = {
      'user-agent': 'sampleTest',
      'Content-Type': 'text/xml;charset=UTF-8',
    };
    const { response } = await soapRequest({
      headers: headersIntersolve,
      url: INTERSOLVE.url,
      xml: xml,
      timeout: 2000,
    });
    const { body, statusCode } = response;
    console.log('statusCode: ', statusCode);
    const jsonResponse = convert.xml2js(body, { compact: true });
    return jsonResponse['soap:Envelope']['soap:Body'];
  }

  private async setSoapHeader(payload: any): Promise<any> {
    let header = await this.readXmlAsJs('header');
    const headerPart = header['elements'][0];
    headerPart['elements'][0]['elements'][0]['elements'][0]['text'] =
      INTERSOLVE.username;
    headerPart['elements'][0]['elements'][1]['elements'][0]['text'] =
      INTERSOLVE.password;
    payload['elements'][0]['elements'].unshift(headerPart);
    return payload;
  }

  public async readXmlAsJs(xmlName: string): Promise<any> {
    const path = './src/programs/fsp/api/xml/' + xmlName + '.xml';
    const xml = fs.readFileSync(path, 'utf-8');
    const jsObject = convert.xml2js(xml);
    return jsObject;
  }

  public findSoapIndex(soapElement: any, q: string): any {
    return soapElement['elements'].findIndex(x => x.name === q);
  }

  public changeSoapBody(
    payload: any,
    mainElement: string,
    subElement: string,
    value: string,
  ): any {
    const iBody = this.findSoapIndex(payload['elements'][0], 'soap:Body');
    const soapBody = payload['elements'][0]['elements'][iBody];
    const iMainEl = this.findSoapIndex(soapBody, mainElement);
    const mainElementPart = soapBody['elements'][iMainEl];
    const iSubEl = this.findSoapIndex(mainElementPart, subElement);
    payload['elements'][0]['elements'][iBody]['elements'][iMainEl]['elements'][
      iSubEl
    ]['elements'][0]['text'] = value;
    return payload;
  }
}
