// TODO: Remove, this DTO is replaced by IntersolveVisaTransferDto (and CreateIntersolveVisaTransferJobDto sort-of, the logic moves)
export class PaymentDetailsDto {
  public firstName: string;
  public lastName: string;
  public addressStreet: string;
  public addressHouseNumber: string;
  public addressHouseNumberAddition: string;
  public addressPostalCode: string;
  public addressCity: string;
  public phoneNumber: string;
  public referenceId: string;
  public transactionAmount: number;
  public programId: number;
  public paymentNr: number;
  public bulkSize: number;
  public userId: number;
}
