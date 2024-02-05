INSERT
    INTO
    "121-service".registration (
    SELECT
        id + (
        SELECT
            max(id)
        FROM
            "121-service".registration),
        created,
        "registrationStatus",
        concat(md5(random()::text)),
        "phoneNumber",
        "preferredLanguage",
        "inclusionScore",
        "paymentAmountMultiplier",
        "programId",
        "userId",
        "fspId",
        updated,
        "registrationProgramId" + (
        SELECT
            max("registrationProgramId")
        FROM
            "121-service"."registration"),
        "maxPayments",
        "paymentCount",
        CASE
            WHEN "programId" = 2 THEN
                CASE
                    WHEN random() < 0.5 THEN 'utrecht.houten'
                    ELSE 'zeeland.goes'
                END
            ELSE scope
        END
    FROM
        "121-service".registration);
