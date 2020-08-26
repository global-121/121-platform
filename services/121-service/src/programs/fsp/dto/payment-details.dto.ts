import { ConnectionEntity } from "../../../sovrin/create-connection/connection.entity";

export class PaymentDetailsDto {
  public readonly paymentList: any[];
  public readonly connectionsForFsp: ConnectionEntity[];
  public readonly payload: object;
}
