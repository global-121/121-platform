import { Injectable } from '@nestjs/common';
import { SoapService } from '../../../utils/soap/soap.service';
import { IntersolveCreatePreOrderResponse } from './dto/intersolve-create-pre-order-response.dto';
import { PreOrderInfoDto } from './dto/pre-order-info.dto';
import { IntersolveJumboSoapElements } from './enum/intersolve-jumbo-soap.enum';
import { IntersolveJumboApiMockService } from './intersolve-jumbo.api-mock.service';

@Injectable()
export class IntersolveJumboApiService {
  public constructor(
    private soapService: SoapService,
    private intersolveJumboApiMockService: IntersolveJumboApiMockService,
  ) {}

  public async createPreOrder(
    preOrderDtoBatch: PreOrderInfoDto[],
    payment: number,
  ): Promise<any> {
    if (process.env.MOCK_INTERSOLVE) {
      return this.intersolveJumboApiMockService.createPreOrder(
        preOrderDtoBatch,
      );
    } else {
      const mainElem = `tns:${IntersolveJumboSoapElements.CreatePreOrder}`;
      let payload = await this.soapService.readXmlAsJs(
        IntersolveJumboSoapElements.CreatePreOrder,
      );
      payload = this.soapService.changeSoapBody(
        payload,
        mainElem,
        ['CustomerNr'],
        process.env.INTERSOLVE_JUMBO_CUSTOMER_ID,
      );

      payload = this.soapService.changeSoapBody(
        payload,
        mainElem,
        ['NewOrder', 'ExpectedDeliveryDate'],
        new Date().toISOString(),
      );

      for (const preOrderDto of preOrderDtoBatch) {
        let orderImportLinePayload = (
          await this.soapService.readXmlAsJs(
            IntersolveJumboSoapElements.OrderImportLine,
          )
        ).elements[0];
        const newOrderProductMapping = {
          ProductCode: process.env.INTERSOLVE_JUMBO_PRODUCT_CODE,
          PackageCode: process.env.INTERSOLVE_JUMBO_PACKAGE_CODE,
          ProductValue: String(preOrderDto.transactionAmount),
          Amount: String(1),
          Custom2: String(payment),
        };

        for (const [key, value] of Object.entries(newOrderProductMapping)) {
          orderImportLinePayload = this.soapService.setValueByName(
            orderImportLinePayload,
            key,
            value,
          );
        }

        const newOrderDtoMapping = {
          CustomShipToFirstName: 'firstName',
          CustomShipToLastName: 'lastName',
          CustomShipToStreet: 'addressStreet',
          CustomShipToHouseNr: 'addressHouseNumber',
          CustomShipToHouseNrAddition: 'addressHouseNumberAddition',
          CustomShipToZipCode: 'addressPostalCode',
          CustomShipToCity: 'addressCity',
          Custom1: 'referenceId',
        };
        for (const [key, value] of Object.entries(newOrderDtoMapping)) {
          orderImportLinePayload = this.soapService.setValueByName(
            orderImportLinePayload,
            key,
            preOrderDto[value],
          );
        }

        // find right place to insert orderImportLine
        const orderLine = payload['elements'][0]['elements']
          .find((e) => e.name === 'soap:Body')
          ['elements'].find((e) => e.name === 'tns:CreatePreOrder')
          ['elements'].find((e) => e.name === 'NewOrder')
          ['elements'].find((e) => e.name === 'OrderLine');

        // create empty array for 1st orderImportLine in batch
        if (!orderLine['elements']) {
          orderLine['elements'] = [];
        }

        // insert orderImportLine
        orderLine['elements'].push(orderImportLinePayload);
      }

      return await this.soapService.post(
        payload,
        IntersolveJumboSoapElements.TradeHeader,
        process.env.INTERSOLVE_JUMBO_USERNAME,
        process.env.INTERSOLVE_JUMBO_PASSWORD,
        process.env.INTERSOLVE_JUMBO_URL,
      );
    }
  }

  public async approvePreOrder(
    createPreOrder: IntersolveCreatePreOrderResponse,
  ): Promise<any> {
    if (process.env.MOCK_INTERSOLVE) {
      return this.intersolveJumboApiMockService.approvePreOrder();
    } else {
      let payload = await this.soapService.readXmlAsJs(
        IntersolveJumboSoapElements.ApprovePreOrder,
      );
      const mainElem = `tns:${IntersolveJumboSoapElements.ApprovePreOrder}`;
      payload = this.soapService.changeSoapBody(
        payload,
        mainElem,
        ['OrderNr'],
        createPreOrder['tns:CreatePreOrderResponse'].WebserviceRequest.ReturnId
          ._cdata,
      );
      payload = this.soapService.changeSoapBody(
        payload,
        mainElem,
        ['PrePaid'],
        'true',
      );
      payload = this.soapService.changeSoapBody(
        payload,
        mainElem,
        ['TransactionInfo'],
        'TransactionInfoPlaceholder',
      );

      return await this.soapService.post(
        payload,
        IntersolveJumboSoapElements.TradeHeader,
        process.env.INTERSOLVE_JUMBO_USERNAME,
        process.env.INTERSOLVE_JUMBO_PASSWORD,
        process.env.INTERSOLVE_JUMBO_URL,
      );
    }
  }
}
