CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
INSERT INTO "121-service"."intersolve_visa_wallet" (
  id,
  created,
  updated,
  "tokenBlocked",
  "linkedToVisaCustomer",
  "debitCardCreated",
  balance,
  "cardStatus",
  "walletStatus",
  "intersolveVisaCustomerId"
)
SELECT
  id + (
    SELECT count(id)
    FROM "121-service"."intersolve_visa_wallet"
  ),
  created,
  updated,
  "tokenBlocked",
  "linkedToVisaCustomer",
  "debitCardCreated",
  balance,
  "cardStatus",
  "walletStatus",
  "intersolveVisaCustomerId" + (
    SELECT max("intersolveVisaCustomerId")
    FROM "121-service"."intersolve_visa_wallet"
  )
FROM "121-service".intersolve_visa_wallet;
