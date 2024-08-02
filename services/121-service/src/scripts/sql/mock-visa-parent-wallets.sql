CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

INSERT INTO "121-service"."intersolve_visa_parent_wallet" (
  created,
  updated,
  "intersolveVisaCustomerId",
  "tokenCode",
  "isLinkedToVisaCustomer",
  balance,
  "lastExternalUpdate",
  "spentThisMonth",
  "lastUsedDate"
)
SELECT
  NOW(),
  NOW(),
  id,
  uuid_generate_v4(),
  true,
  58,
  NOW(),
  12,
  NOW()
FROM
  "121-service".intersolve_visa_customer;
