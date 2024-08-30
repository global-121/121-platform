 INSERT INTO "121-service"."twilio_message"
        (
          created,
          "accountSid",
          body,
          "to",
          "from",
          sid,
          status,
          type,
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
          created + random() * (timestamp '2023-01-01 00:00:00' -
                   timestamp '2023-01-02 00:00:00'),
          "accountSid",
          body,
          "to",
          "from",
		      concat('SM',substr(md5(random()::text), 0, 33)) as sid,
          status,
          type,
          "dateCreated",
          "registrationId",
          "mediaUrl",
          updated,
          "contentType",
          "errorCode",
          "errorMessage",
          "userId"
        FROM
          "121-service"."twilio_message";