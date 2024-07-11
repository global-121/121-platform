INSERT INTO "121-service"."transaction"
(
  created,
  status,
  "errorMessage",
  payment,
  "customData",
  "transactionStep",
  "programId",
  "financialServiceProviderId",
  "registrationId",
  amount,
  updated,
  "userId"
)
SELECT
  created + INTERVAL '1 millisecond' * ROW_NUMBER() OVER (ORDER BY id),
  status,
  "errorMessage",
  $1,
  "customData",
  "transactionStep",
  "programId",
  "financialServiceProviderId",
  "registrationId",
  amount,
  updated,
  "userId"
FROM
  "121-service"."transaction"
WHERE
  payment = $2;
