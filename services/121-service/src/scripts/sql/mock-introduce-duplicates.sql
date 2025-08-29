WITH RankedRecords AS (
    SELECT id, value, "projectRegistrationAttributeId", "registrationId",
           ROW_NUMBER() OVER (PARTITION BY "projectRegistrationAttributeId" ORDER BY id) AS rn
    FROM "121-service".registration_attribute_data
    WHERE "projectRegistrationAttributeId" = $1
),
MockDuplicates AS (
    UPDATE "121-service".registration_attribute_data rad1
    SET value = rr2.value
    FROM RankedRecords rr1
    JOIN RankedRecords rr2 ON rr2.rn = rr1.rn + 1
    WHERE rad1.id = rr1.id
      AND rr1.rn % 30 = 0
      AND rr1."projectRegistrationAttributeId" = rr2."projectRegistrationAttributeId"
    RETURNING rr1."registrationId" AS duplicate1, rr2."registrationId" AS duplicate2
),
RandomSample AS (
    SELECT DISTINCT LEAST(duplicate1, duplicate2) AS smallerRegistrationId,
                    GREATEST(duplicate1, duplicate2) AS largerRegistrationId
    FROM MockDuplicates
    WHERE RANDOM() < 0.05
)
INSERT INTO "121-service".unique_registration_pair ("smallerRegistrationId", "largerRegistrationId")
SELECT smallerRegistrationId, largerRegistrationId
FROM RandomSample
ON CONFLICT DO NOTHING;
