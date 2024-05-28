CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

INSERT INTO "121-service"."intersolve_visa_child_wallet" (
  created,
  updated,
  "intersolveVisaParentWalletId",
  "tokenCode",
  "isLinkedToParentWallet",
  "isTokenBlocked",
  "isDebitCardCreated",
  "walletStatus",
  "cardStatus",
  "lastUsedDate",
  "lastExternalUpdate"
)
SELECT
  NOW(),
  NOW(),
  id,
  uuid_generate_v4(),
  true,
  false,
  true,
  'ACTIVE',
  'CARD_OK',
  NOW(),
  NOW()
FROM
  "121-service".intersolve_visa_parent_wallet;
