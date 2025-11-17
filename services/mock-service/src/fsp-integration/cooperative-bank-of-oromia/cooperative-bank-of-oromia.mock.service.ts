import { Injectable } from '@nestjs/common';

@Injectable()
export class CooperativeBankOfOromiaMockService {
  public async initiatePayment({
    headers,
    body,
  }: {
    headers: Record<string, string>;
    body: any;
  }): Promise<any> {
    // Mock implementation - always returns success
    return {
      status: 'success',
      data: {
        transfer_id: `txn_${Math.random().toString(36).substring(7)}`,
        from_account: body.from_account || 'acc_123456',
        to_account: body.to_account || 'acc_789012',
        amount: body.amount || 100,
        currency: body.currency || 'USD',
        status: 'completed',
        created_at: new Date().toISOString(),
      },
    };
  }
}
