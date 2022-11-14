# Module Dependencies Graph

```mermaid
graph LR
  ProgramModule-->SmsModule
  ProgramModule-->VoiceModule
  ProgramModule-->FspModule
  ProgramModule-->LookupModule
  CronjobModule-->WhatsappModule
  WhatsappModule-->ImageCodeModule
  WhatsappModule-->IntersolveModule
  IntersolveModule-->ImageCodeModule
  IntersolveModule-->TransactionsModule
  IntersolveModule-->WhatsappModule
  CronjobModule-->IntersolveModule
  RegistrationsModule-->LookupModule
  RegistrationsModule-->SmsModule
  RegistrationsModule-->ProgramModule
  RegistrationsModule-->FspModule
  RegistrationsModule-->WhatsappModule
  ExportMetricsModule-->ProgramModule
  ExportMetricsModule-->RegistrationsModule
  ExportMetricsModule-->PaymentsModule
  PaymentsModule-->FspModule
  PaymentsModule-->IntersolveModule
  PaymentsModule-->AfricasTalkingModule
  AfricasTalkingModule-->TransactionsModule
  PaymentsModule-->BelcashModule
  BelcashModule-->TransactionsModule
  PaymentsModule-->TransactionsModule
  PaymentsModule-->BobFinanceModule
  BobFinanceModule-->TransactionsModule
  PaymentsModule-->UkrPoshtaModule
  UkrPoshtaModule-->TransactionsModule
  PaymentsModule-->VodacashModule
  VodacashModule-->TransactionsModule
  ExportMetricsModule-->TransactionsModule
```
