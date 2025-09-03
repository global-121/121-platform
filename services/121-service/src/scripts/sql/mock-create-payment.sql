INSERT INTO "121-service"."payment" (
  id,
  created,
  updated,
  "projectId"
) VALUES (
  $1,
  NOW(),
  NOW(),
  $2
);
