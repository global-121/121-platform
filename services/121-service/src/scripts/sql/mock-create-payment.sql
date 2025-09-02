INSERT INTO "121-service"."payment" (
  id,
  created,
  updated,
  "programId"
) VALUES (
  $1,
  NOW(),
  NOW(),
  $2
);
