INSERT INTO "121-service"."latest_message" ("registrationId", "messageId") 
SELECT t."registrationId", t.id AS messageId 
FROM (
  SELECT "registrationId", MAX(created) AS max_created 
  FROM "121-service"."twilio_message" 
  GROUP BY "registrationId") AS latest_messages 
  INNER JOIN "121-service"."twilio_message" AS t 
  ON t."registrationId" = latest_messages."registrationId" 
  AND t.created = latest_messages.max_created
