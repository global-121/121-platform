# Module Dependencies Graph

```mermaid
graph LR
  ProgramModule-->FspModule
  ProgramModule-->LookupModule
  ProgramModule-->ProgramAttributesModule
  ProgramModule-->KoboConnectModule
  MessageTemplateModule-->ProgramAttributesModule
  CronjobModule-->ExchangeRateModule
  RegistrationsModule-->LookupModule
  RegistrationsModule-->ProgramModule
  RegistrationsModule-->FspModule
  RegistrationsModule-->QueueMessageModule
  QueueMessageModule-->ProgramAttributesModule
  QueueMessageModule-->RegistrationDataModule
  RegistrationsModule-->IntersolveVisaModule
  IntersolveVisaModule-->TransactionsModule
  TransactionsModule-->QueueMessageModule
  TransactionsModule-->MessageTemplateModule
  TransactionsModule-->RegistrationUtilsModule
  RegistrationUtilsModule-->RegistrationDataModule
  TransactionsModule-->EventsModule
  IntersolveVisaModule-->QueueMessageModule
  IntersolveVisaModule-->RegistrationDataModule
  IntersolveVisaModule-->RedisModule
  RegistrationsModule-->RegistrationDataModule
  RegistrationsModule-->RegistrationUtilsModule
  RegistrationsModule-->EventsModule
  RegistrationsModule-->QueueRegistrationUpdateModule
  MessageModule-->WhatsappModule
  WhatsappModule-->ImageCodeModule
  WhatsappModule-->MessageTemplateModule
  MessageModule-->SmsModule
  MessageModule-->QueueMessageModule
  MessageModule-->IntersolveVoucherModule
  IntersolveVoucherModule-->ImageCodeModule
  IntersolveVoucherModule-->TransactionsModule
  IntersolveVoucherModule-->QueueMessageModule
  IntersolveVoucherModule-->MessageTemplateModule
  IntersolveVoucherModule-->RegistrationDataModule
  IntersolveVoucherModule-->RegistrationUtilsModule
  IntersolveVoucherModule-->RedisModule
  MessageModule-->MessageTemplateModule
  MessageModule-->ProgramModule
  MetricsModule-->RegistrationsModule
  MetricsModule-->PaymentsModule
  PaymentsModule-->IntersolveVoucherModule
  PaymentsModule-->IntersolveVisaModule
  PaymentsModule-->IntersolveJumboModule
  IntersolveJumboModule-->TransactionsModule
  IntersolveJumboModule-->RegistrationDataModule
  PaymentsModule-->AfricasTalkingModule
  AfricasTalkingModule-->TransactionsModule
  PaymentsModule-->BelcashModule
  BelcashModule-->TransactionsModule
  PaymentsModule-->TransactionsModule
  PaymentsModule-->BobFinanceModule
  BobFinanceModule-->TransactionsModule
  BobFinanceModule-->RegistrationDataModule
  PaymentsModule-->UkrPoshtaModule
  UkrPoshtaModule-->TransactionsModule
  UkrPoshtaModule-->RegistrationDataModule
  PaymentsModule-->VodacashModule
  VodacashModule-->TransactionsModule
  VodacashModule-->RegistrationDataModule
  VodacashModule-->RegistrationsModule
  PaymentsModule-->SafaricomModule
  SafaricomModule-->TransactionsModule
  SafaricomModule-->RedisModule
  PaymentsModule-->ExcelModule
  ExcelModule-->TransactionsModule
  ExcelModule-->RegistrationsModule
  PaymentsModule-->CommercialBankEthiopiaModule
  CommercialBankEthiopiaModule-->TransactionsModule
  CommercialBankEthiopiaModule-->RedisModule
  PaymentsModule-->RegistrationsModule
  PaymentsModule-->ProgramModule
  PaymentsModule-->RegistrationUtilsModule
  PaymentsModule-->RegistrationDataModule
  MetricsModule-->IntersolveVisaModule
  MetricsModule-->IntersolveVoucherModule
  MetricsModule-->EventsModule
  MessageIncomingModule-->ImageCodeModule
  MessageIncomingModule-->IntersolveVoucherModule
  MessageIncomingModule-->WhatsappModule
  MessageIncomingModule-->QueueMessageModule
  MessageIncomingModule-->MessageTemplateModule
  MessageIncomingModule-->RegistrationDataModule
  NoteModule-->RegistrationsModule
```
