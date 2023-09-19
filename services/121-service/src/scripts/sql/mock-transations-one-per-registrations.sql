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
