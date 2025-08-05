INSERT INTO "121-service"."latest_transaction" ("paymentId", "registrationId", "transactionId")
SELECT t."paymentId", t."registrationId", t.id AS transactionId
FROM (
  SELECT "paymentId", "registrationId", MAX(id) AS max_id
  FROM "121-service"."transaction"
  WHERE status = 'success'
  GROUP BY "paymentId", "registrationId"
) AS latest_transactions
INNER JOIN "121-service"."transaction" AS t
ON t."paymentId" = latest_transactions."paymentId"
AND t."registrationId" = latest_transactions."registrationId"
AND t.id = latest_transactions.max_id;
