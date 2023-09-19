        INSERT INTO "121-service"."transaction"
        (
          id,
          created,
          status,
          "errorMessage",
          payment,
          "customData",
          "transactionStep",
          "programId",
          "financialServiceProviderId",
          "registrationId",
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
        "registrationId",
        amount,
        updated
        FROM
          "121-service"."transaction"
        WHERE
          payment = $2;
