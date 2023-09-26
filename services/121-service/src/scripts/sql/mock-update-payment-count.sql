UPDATE "121-service".registration oreg
      SET "paymentCount" = (
        SELECT COUNT(DISTINCT payment)
        FROM "121-service".transaction t
        WHERE t."registrationId" = oreg.id
    )
