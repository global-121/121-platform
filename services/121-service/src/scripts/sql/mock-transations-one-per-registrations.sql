INSERT INTO "121-service"."transaction" (
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
  "projectFinancialServiceProviderConfigurationId"
)
SELECT
  created + INTERVAL '1 millisecond' * ROW_NUMBER() OVER (ORDER BY id),
  status,
  "errorMessage",
  payment,
  "customData",
  "transactionStep",
  "programId",
  "registrationId" + (SELECT max("registrationId") FROM "121-service"."transaction"),
  amount,
  updated,
  "userId",
  "projectFinancialServiceProviderConfigurationId"
FROM
  "121-service"."transaction"
WHERE
  payment = 1;
