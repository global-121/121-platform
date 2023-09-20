INSERT
	INTO
	"121-service"."twilio_message" (
	select
		id + (
		SELECT
			count(id)
		FROM
			"121-service"."twilio_message"),
		created  + (20 * interval '1 minute'),
		"accountSid",
		body,
		"to",
		"from",
		concat('SM',substr(md5(random()::text), 0, 33)) as sid,
		status,
		"type",
		"dateCreated",
		"registrationId" + (
		SELECT
			max("registrationId")
		FROM
			"121-service"."twilio_message"),
		"mediaUrl",
		updated,
		"contentType",
		"errorCode",
		"errorMessage"
	from
		"121-service".twilio_message);
