import { IntersolveCreatePreOrderResponse } from '@121-service/src/payments/fsp-integration/intersolve-jumbo/dto/intersolve-create-pre-order-response.dto';
import { PreOrderInfoDto } from '@121-service/src/payments/fsp-integration/intersolve-jumbo/dto/pre-order-info.dto';
import { IntersolveJumboSoapElements } from '@121-service/src/payments/fsp-integration/intersolve-jumbo/enum/intersolve-jumbo-soap.enum';
import { IntersolveJumboApiMockService } from '@121-service/src/payments/fsp-integration/intersolve-jumbo/intersolve-jumbo.api-mock.service';
import { SoapService } from '@121-service/src/utils/soap/soap.service';
import { Injectable } from '@nestjs/common';

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

    if (process.env.MOCK_INTERSOLVE) {
      return await this.intersolveJumboApiMockService.createPreOrder(
        preOrderDtoBatch,
      );
    } else {
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

    if (process.env.MOCK_INTERSOLVE) {
      return await this.intersolveJumboApiMockService.approvePreOrder();
    } else {
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
