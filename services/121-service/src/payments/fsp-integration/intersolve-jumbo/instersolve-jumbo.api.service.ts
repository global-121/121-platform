import { Injectable } from '@nestjs/common';
import * as convert from 'xml-js';
import { IntersolveSoapElements } from '../../../utils/soap/intersolve-soap.enum';
import { SoapService } from '../../../utils/soap/soap.service';
import { PreOrderInfoDto } from './dto/pre-order-info.dto';
import { IntersolveJumboMockService } from './instersolve-jumbo.mock';

@Injectable()
export class IntersolveJumboApiService {
  public constructor(
    private soapService: SoapService,
    private intersolveMock: IntersolveJumboMockService,
  ) {}

  public async createPreOrder(
    preOrderDto: PreOrderInfoDto,
    payment: number,
  ): Promise<any> {
    console.log('preOrderDto: ', preOrderDto);

    let payload = await this.soapService.readXmlAsJs(
      IntersolveSoapElements.CreatePreOrder,
    );
    const mainElem = `tns:${IntersolveSoapElements.CreatePreOrder}`;
    payload = this.soapService.changeSoapBody(
      payload,
      mainElem,
      ['CustomerNr'],
      process.env.INTERSOLVE_JUMBO_CUSTOMER_ID,
    );
    console.log('payload: afterfirst ', payload);

    const newOrderEnvMapping = {
      ProductCode: 'INTERSOLVE_JUMBO_PRODUCT_CODE',
      PackageCode: 'INTERSOLVE_JUMBO_PACKAGE_CODE',
    };

    for (const [key, value] of Object.entries(newOrderEnvMapping)) {
      payload = this.soapService.changeSoapBody(
        payload,
        mainElem,
        ['NewOrder', 'OrderLine', 'OrderImportLine', key],
        process.env[value],
      );
    }

    payload = this.soapService.changeSoapBody(
      payload,
      mainElem,
      ['NewOrder', 'ExpectedDeliveryDate'],
      new Date().toISOString(),
    );

    const newOrderDtoMapping = {
      CustomShipToLastName: 'lastName',
      CustomShipToStreet: 'addressStreet',
      CustomShipToHouseNr: 'addressHouseNumber',
      CustomShipToHouseNrAddition: 'addressHouseNumberAddition',
      CustomShipToZipCode: 'addressPostalCode',
      CustomShipToCity: 'addressCity',
      Custom1: 'referenceId',
      Custom2: 'payment',
    };
    for (const [key, value] of Object.entries(newOrderDtoMapping)) {
      payload = this.soapService.changeSoapBody(
        payload,
        mainElem,
        ['NewOrder', 'OrderLine', 'OrderImportLine', key],
        preOrderDto[value],
      );
    }
    payload = this.soapService.changeSoapBody(
      payload,
      mainElem,
      ['NewOrder', 'OrderLine', 'OrderImportLine', 'Custom2'],
      String(payment),
    );

    const xml = convert.js2xml(payload);
    console.log('xml: ', xml);
    return await this.soapService.post(
      payload,
      IntersolveSoapElements.TradeHeader,
      process.env.INTERSOLVE_JUMBO_USERNAME,
      process.env.INTERSOLVE_JUMBO_PASSWORD,
      `${process.env.INTERSOLVE_JUMBO_URL}/CreatePreOrder`,
    );
  }

  // public async getCard(
  //   cardId: string,
  //   pin: string,
  // ): Promise<IntersolveGetCardResponse> {
  //   let payload = await this.soapService.readXmlAsJs(
  //     IntersolveSoapElements.GetCard,
  //   );
  //   payload = this.soapService.changeSoapBody(
  //     payload,
  //     IntersolveSoapElements.GetCard,
  //     ['CardId'],
  //     cardId,
  //   );
  //   payload = this.soapService.changeSoapBody(
  //     payload,
  //     IntersolveSoapElements.GetCard,
  //     ['PIN'],
  //     pin,
  //   );

  //   const responseBody = !!process.env.MOCK_INTERSOLVE
  //     ? await this.intersolveMock.post(payload)
  //     : await this.soapService.post(payload);
  //   const result = {
  //     resultCode: responseBody.GetCardResponse.ResultCode._text,
  //     resultDescription: responseBody.GetCardResponse.ResultDescription._text,
  //     status: responseBody.GetCardResponse.Card?.Status?._text,
  //     balance: parseInt(responseBody.GetCardResponse.Card?.Balance?._text),
  //     balanceFactor: parseInt(
  //       responseBody.GetCardResponse.Card?.BalanceFactor?._text,
  //     ),
  //   };
  //   return result;
  // }
}
