export class SafaricomTransferPayload {
  public initiatorName: string;
  public securityCredential: string;
  public commandID: string;
  public amount: number;
  public partyA: string;
  public partyB: string;
  public remarks: string;
  public queueTimeOutURL: string;
  public resultURL: string;
  public occassion: string;
  public status?: string;
  public requestResult?: JSON;
  public paymentResult?: JSON;
}
