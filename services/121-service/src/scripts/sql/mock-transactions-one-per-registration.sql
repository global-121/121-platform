INSERT INTO "121-service"."transaction" (
  created,
  status,
  "errorMessage",
  "paymentId",
  "customData",
  "transactionStep",
  "registrationId",
  amount,
  updated,
  "userId",
  "programFspConfigurationId"
)
SELECT
  created + INTERVAL '1 millisecond' * ROW_NUMBER() OVER (ORDER BY id),
  status,
  "errorMessage",
  "paymentId",
  "customData",
  "transactionStep",
  "registrationId" + (SELECT max("registrationId") FROM "121-service"."transaction"),
  amount,
  updated,
  "userId",
  "programFspConfigurationId"
FROM
  "121-service"."transaction"
