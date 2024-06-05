export class BelcashTransferPayload {
  public amount: number;
  public to: string;
  public currency: string | null;
  public description: string;
  public referenceid: string;
  public tracenumber: string;
  public notifyto: boolean;
  public notifyfrom: boolean;
}
