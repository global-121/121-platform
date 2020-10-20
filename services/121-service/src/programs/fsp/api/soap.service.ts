import soapRequest from 'easy-soap-request';
import fs from 'fs';
import * as convert from 'xml-js';
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
      url: process.env.INTERSOLVE_URL,
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
    let headerPart = this.getChild(header, 0);
    headerPart = this.setValue(
      headerPart,
      [0, 0, 0],
      process.env.INTERSOLVE_USERNAME,
    );
    headerPart = this.setValue(
      headerPart,
      [0, 1, 0],
      process.env.INTERSOLVE_PASSWORD,
    );
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
    subElements: string[],
    value: string,
  ): any {
    console.log('changeSoapBody', mainElement, subElements, value);
    const envelopeXML = this.getChild(payload, 0);
    const bodyIndex = this.findSoapIndex(envelopeXML, 'soap:Body');
    const soapBodyXML = this.getChild(envelopeXML, bodyIndex);
    const mainElementIndex = this.findSoapIndex(soapBodyXML, mainElement);
    const mainElementXML = soapBodyXML['elements'][mainElementIndex];
    let rootElement = mainElementXML;
    let pathIndices: number[] = [0, bodyIndex, mainElementIndex];
    let subElementIndex = -1;
    for (let subElement in subElements) {
      console.log('changeSoapBody subElements', subElements);
      console.log('changeSoapBody subElement', subElement);
      console.log('changeSoapBody rootElement', rootElement);
      console.log('changeSoapBody subElementIndex', subElementIndex);
      subElementIndex = this.findSoapIndex(rootElement, subElement);
      if (subElementIndex >= 0) {
        pathIndices.push(subElementIndex);
        rootElement = this.getChild(rootElement, subElementIndex);
      }
    }
    pathIndices.push(0);
    payload = this.setValue(payload, pathIndices, value);
    return payload;
  }

  private getChild(xml: any, index: number): any {
    return xml['elements'][index];
  }

  private setValue(xml: any, indices: number[], value: string): any {
    console.log(
      'setValue start',
      JSON.stringify(xml),
      JSON.stringify(indices),
      value,
    );
    const firstIndex = indices.shift();
    if (indices.length > 0) {
      // console.log(
      //   'setValue loop',
      //   JSON.stringify(xml),
      //   JSON.stringify(indices),
      //   value,
      // );
      xml['elements'][firstIndex] = this.setValue(
        this.getChild(xml, firstIndex),
        indices,
        value,
      );
    } else {
      // console.log(
      //   'setValue exit',
      //   JSON.stringify(xml),
      //   JSON.stringify(indices),
      //   value,
      // );
      xml['elements'][firstIndex]['text'] = value;
    }
    // console.log(
    //   'setValue end',
    //   JSON.stringify(xml),
    //   JSON.stringify(indices),
    //   value,
    // );
    return xml;
  }
}
