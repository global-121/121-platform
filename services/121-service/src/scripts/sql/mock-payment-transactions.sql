INSERT INTO "121-service"."transaction"
(
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
  t.created + INTERVAL '1 millisecond' * ROW_NUMBER() OVER (ORDER BY t.id),
  t.status,
  t."errorMessage",
  $1,
  t."customData",
  t."transactionStep",
  t."registrationId",
  t.amount,
  t.updated,
  t."userId",
  t."programFspConfigurationId"
FROM
  "121-service"."transaction" t
WHERE
  t."paymentId" = (SELECT MIN(id) FROM "121-service"."payment" p2 WHERE p2."programId" = $2)
