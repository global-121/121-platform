import { Injectable } from '@nestjs/common';
import soapRequest from 'easy-soap-request';
import fs from 'fs';
import * as convert from 'xml-js';
import { CustomHttpService } from '../../shared/services/custom-http.service';

@Injectable()
export class SoapService {
  public constructor(private readonly httpService: CustomHttpService) {}

  public async post(
    soapBodyPayload: any,
    headerFile: string,
    username: string,
    password: string,
    url: string,
  ): Promise<any> {
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
      headers: headers,
      url: url,
      xml: xml,
      timeout: 150000,
    })
      .then((rawResponse: any) => {
        const response = rawResponse.response;
        this.httpService.logMessage(
          { url, payload: jsonSoapBody },
          {
            status: response.statusCode,
            statusText: null,
            data: response.body,
          },
        );
        const { body } = response;
        const jsonResponse = convert.xml2js(body, { compact: true });
        return jsonResponse['soap:Envelope']['soap:Body'];
      })
      .catch((err: any) => {
        this.httpService.logError(
          { url, payload: jsonSoapBody },
          {
            status: null,
            statusText: null,
            data: { error: err },
          },
        );
        return err;
      });
  }

  private async setSoapHeader(
    payload: any,
    headerFile: string,
    username: string,
    password: string,
  ): Promise<any> {
    const header = await this.readXmlAsJs(headerFile);
    let headerPart = this.getChild(header, 0);
    headerPart = this.setValue(headerPart, [0, 0, 0], username);
    headerPart = this.setValue(headerPart, [0, 1, 0], password);
    payload['elements'][0]['elements'].unshift(headerPart);
    return payload;
  }

  public async readXmlAsJs(xmlName: string): Promise<any> {
    const path = './src/shared/xml/' + xmlName + '.xml';
    const xml = fs.readFileSync(path, 'utf-8');
    const jsObject = convert.xml2js(xml);
    return jsObject;
  }

  public findSoapIndex(soapElement: any, q: string): any {
    return soapElement['elements'].findIndex((x) => x.name === q);
  }

  public changeSoapBody(
    payload: any,
    mainElement: string,
    subElements: string[],
    value: string,
  ): any {
    const envelopeXML = this.getChild(payload, 0);
    const bodyIndex = this.findSoapIndex(envelopeXML, 'soap:Body');
    const soapBodyXML = this.getChild(envelopeXML, bodyIndex);
    const mainElementIndex = this.findSoapIndex(soapBodyXML, mainElement);
    const mainElementXML = soapBodyXML['elements'][mainElementIndex];
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

  private getChild(xml: any, index: number): any {
    return xml['elements'][index];
  }

  private setValue(xml: any, indices: number[], value: string): any {
    const firstIndex = indices.shift();
    if (indices.length > 0) {
      xml['elements'][firstIndex] = this.setValue(
        this.getChild(xml, firstIndex),
        indices,
        value,
      );
    } else {
      xml['elements'][firstIndex]['text'] = value;
    }
    return xml;
  }

  public setValueByName(xml: any, attributeName: string, value: string): any {
    for (const el of xml.elements) {
      if (el.name === attributeName) {
        el.elements[0].text = value;
      }
    }
    return xml;
  }
}
