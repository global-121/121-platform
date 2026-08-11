export interface AlfouadCreateTransactionRequestBodyDto {
  readonly SenderFullName: string;
  readonly SenderPhoneNumber: string;
  readonly BeneficiaryFullName: string;
  readonly BeneficiaryPhoneNumber: string;
  readonly ReferenceNumber: string;
  readonly CountryCode: string;
  readonly CityCode: string;
  readonly AgentCode: number;
  readonly DeliveryCurrencyCode: string;
  readonly DeliveryAmount: number;
  readonly ReasonCode?: string;
}
