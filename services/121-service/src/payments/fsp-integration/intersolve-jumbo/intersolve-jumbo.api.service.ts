import { Injectable } from '@nestjs/common';
import { SoapService } from '../../../utils/soap/soap.service';
import { IntersolveCreatePreOrderResponse } from './dto/intersolve-create-pre-order-response.dto';
import { PreOrderInfoDto } from './dto/pre-order-info.dto';
import { IntersolveJumboSoapElements } from './enum/intersolve-jumbo-soap.enum';
import { IntersolveJumboMockService } from './intersolve-jumbo.mock';

@Injectable()
export class IntersolveJumboApiService {
  public constructor(
    private soapService: SoapService,
    private intersolveMock: IntersolveJumboMockService,
  ) {}

  public async createPreOrder(
    preOrderDto: PreOrderInfoDto,
    payment: number,
    amount: number,
  ): Promise<any> {
    let payload = await this.soapService.readXmlAsJs(
      IntersolveJumboSoapElements.CreatePreOrder,
    );
    const mainElem = `tns:${IntersolveJumboSoapElements.CreatePreOrder}`;
    payload = this.soapService.changeSoapBody(
      payload,
      mainElem,
      ['CustomerNr'],
      process.env.INTERSOLVE_JUMBO_CUSTOMER_ID,
    );

    const newOrderProductMapping = {
      ProductCode: process.env.INTERSOLVE_JUMBO_PRODUCT_CODE,
      PackageCode: process.env.INTERSOLVE_JUMBO_PACKAGE_CODE,
      ProductValue: String(amount),
      Amount: String(preOrderDto.paymentAmountMultiplier),
    };

    for (const [key, value] of Object.entries(newOrderProductMapping)) {
      payload = this.soapService.changeSoapBody(
        payload,
        mainElem,
        ['NewOrder', 'OrderLine', 'OrderImportLine', key],
        value,
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

    return await this.soapService.post(
      payload,
      IntersolveJumboSoapElements.TradeHeader,
      process.env.INTERSOLVE_JUMBO_USERNAME,
      process.env.INTERSOLVE_JUMBO_PASSWORD,
      process.env.INTERSOLVE_JUMBO_URL,
    );
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

    return await this.soapService.post(
      payload,
      IntersolveJumboSoapElements.TradeHeader,
      process.env.INTERSOLVE_JUMBO_USERNAME,
      process.env.INTERSOLVE_JUMBO_PASSWORD,
      process.env.INTERSOLVE_JUMBO_URL,
    );
  }
}
