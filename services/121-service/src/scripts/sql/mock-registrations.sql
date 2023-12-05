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
