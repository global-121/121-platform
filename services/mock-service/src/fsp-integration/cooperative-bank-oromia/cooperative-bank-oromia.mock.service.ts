import { Injectable } from '@nestjs/common';

@Injectable()
export class CooperativeBankOromiaMockService {
  public transaction(body: object): object {
    return {
      status: 'SUCCESS',
      transaction_id: 'mock-transaction-id-12345',
      amount: body['Data'].amount,
      currency: body['Data'].currency,
      from_account: body['Data'].from_account,
      to_account: body['Data'].to_account,
      description: body['Data'].description,
    };
  }
}
