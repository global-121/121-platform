        INSERT INTO "121-service"."transaction"
        (
          id,
          created,
          status,
          "errorMessage",
          "registrationId",
          "customData",
          "transactionStep",
          "programId",
          "financialServiceProviderId",
          amount,
          updated
        )
        SELECT
          id + (
            SELECT count(id)
            FROM "121-service"."transaction"
          ),
          created,
          status,
          "errorMessage",
          $1,
          "customData",
          "transactionStep",
          "programId",
          "financialServiceProviderId",
          amount,
          updated
        FROM
          "121-service"."transaction"
        WHERE
          payment = $2;
