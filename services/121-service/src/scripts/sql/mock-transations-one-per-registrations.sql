INSERT
	INTO
	"121-service"."transaction" (
	SELECT
		id + (
		SELECT
			max(id)
		FROM
			"121-service"."transaction"),
		created + INTERVAL '1 millisecond' * ROW_NUMBER() OVER (ORDER BY id),
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
		updated,
    "userId"
	FROM
		"121-service"."transaction"
	WHERE
		payment = 1);
