INSERT INTO "121-service"."twilio_message" (
  created,
  "accountSid",
  body,
  "to",
  "from",
  sid,
  status,
  "type",
  "dateCreated",
  "registrationId",
  "mediaUrl",
  updated,
  "contentType",
  "errorCode",
  "errorMessage",
  "userId"
)
SELECT
  created + (20 * INTERVAL '1 minute'),
  "accountSid",
  body,
  "to",
  "from",
  CONCAT('SM', SUBSTR(MD5(RANDOM()::text), 0, 33)),
  status,
  "type",
  "dateCreated",
  "registrationId" + (SELECT MAX("registrationId") FROM "121-service"."twilio_message"),
  "mediaUrl",
  updated,
  "contentType",
  "errorCode",
  "errorMessage",
  "userId"
FROM
  "121-service".twilio_message;