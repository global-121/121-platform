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
		value,
		updated
	FROM
		"121-service"."registration_data");
