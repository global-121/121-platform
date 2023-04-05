-- IMPORTANT: this query needs to be kept up-to-date with changes to registration and transaction entities
-- You can create a dataset of 1024 PAs with 64 payments:

--     1. reset to nlrc-multiple
--     2. Register & include 1 pa
--     3. Do 1 payment for pa #1
--     4. Run the below queries in dbeaver


DO $$ DECLARE i record;

BEGIN FOR i IN 1..10 LOOP
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
		concat("referenceId", md5(random()::text)),
		"phoneNumber",
		"preferredLanguage",
		"inclusionScore",
		"paymentAmountMultiplier",
		note,
		"noteUpdated",
		"programId",
		"userId",
		"fspId",
		updated,
		"registrationProgramId" + (
		SELECT
			max("registrationProgramId")
		FROM
			"121-service"."registration"),
		"maxPayments"
	FROM
		"121-service".registration);
END LOOP;
END;

$$ ;

DO $$ DECLARE i record;

BEGIN FOR i IN 1..10 LOOP
INSERT
	INTO
	"121-service"."registration_data" (
	SELECT
		id + (
		SELECT
			max(id)
		FROM
			"121-service"."registration_data") AS id,
		created,
		"registrationId" + (
		SELECT
			max("registrationId")
		FROM
			"121-service"."registration_data") AS "registrationId",
		"programQuestionId",
		"fspQuestionId",
		"programCustomAttributeId",
		"monitoringQuestionId",
		value,
		updated
	FROM
		"121-service"."registration_data");
END LOOP;
END;

$$ ;

DO $$ DECLARE i record;

BEGIN FOR i IN 1..10 LOOP
INSERT
	INTO
	"121-service"."transaction" (
	SELECT
		id + (
		SELECT
			max(id)
		FROM
			"121-service"."transaction"),
		created,
		status,
		"errorMessage",
		payment,
		"customData",
		"transactionStep",
		"programId",
		"financialServiceProviderId",
		"registrationId" + (
		SELECT
			max("registrationId")
		FROM
			"121-service"."transaction"),
		amount,
		updated
	FROM
		"121-service"."transaction"
	WHERE
		payment = 1);
END LOOP;
END;

$$ ;

DO $$ DECLARE i record;

BEGIN FOR i IN 1..63 LOOP
INSERT
	INTO
	"121-service"."transaction" (
	SELECT
		id + (
		SELECT
			count(id)
		FROM
			"121-service"."transaction"),
		created,
		status,
		"errorMessage",
		i + 1,
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
		payment = i);
END LOOP;
END;

$$ ;
