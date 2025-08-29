INSERT
	INTO
	"121-service"."registration_attribute_data" (
	SELECT
		id + (
		SELECT
			max(id)
		FROM
			"121-service"."registration_attribute_data") AS id,
		created,
		updated,
		"registrationId" + (
		SELECT
			max("registrationId")
		FROM
			"121-service"."registration_attribute_data") AS "registrationId",
		"projectRegistrationAttributeId",
		value
	FROM
		"121-service"."registration_attribute_data");
