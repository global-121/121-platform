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
        "projectId",
        "userId",
        updated,
        "registrationProjectId" + (
        SELECT
            max("registrationProjectId")
        FROM
            "121-service"."registration"),
        "maxPayments",
        "paymentCount",
        CASE
            WHEN "projectId" = 2 THEN
                CASE
                    WHEN random() < 0.5 THEN 'kisumu.kisumu-west'
                    ELSE 'turkana.turkana-north'
                END
            ELSE scope
        END,
        "projectFspConfigurationId"
    FROM
        "121-service".registration);
