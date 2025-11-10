import { Injectable } from '@nestjs/common';

@Injectable()
export class CooperativeBankOromiaMockService {
  public transaction(body: object): object {
    console.log(
      'Mock Cooperative Bank Oromia transaction called with body:',
      body,
    );
    return {
      status: 'success',
      data: {
        transfer_id: 'txn_adb41kkwi',
        from_account: 'acc_123456',
        to_account: 'acc_789012',
        amount: 100,
        currency: 'USD',
        status: 'completed',
        created_at: '2025-11-10T14:05:15.746Z',
      },
    };
  }
}
