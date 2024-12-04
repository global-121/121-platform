INSERT INTO "121-service"."transaction"
(
  created,
  status,
  "errorMessage",
  payment,
  "customData",
  "transactionStep",
  "programId",
  "registrationId",
  amount,
  updated,
  "userId",
  "programFinancialServiceProviderConfigurationId"
)
SELECT
  created + INTERVAL '1 millisecond' * ROW_NUMBER() OVER (ORDER BY id),
  status,
  "errorMessage",
  $1,
  "customData",
  "transactionStep",
  "programId",
  "registrationId",
  amount,
  updated,
  "userId",
  "programFinancialServiceProviderConfigurationId"
FROM
  "121-service"."transaction"
WHERE
  payment = $2;
