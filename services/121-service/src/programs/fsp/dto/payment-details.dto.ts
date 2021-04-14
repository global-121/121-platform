import { ConnectionEntity } from '../../../connection/connection.entity';

export class PaymentDetailsDto {
  public readonly paymentList: any[];
  public readonly connectionsForFsp: ConnectionEntity[];
}
