INSERT
	INTO
	"121-service"."intersolve_visa_customer" (
	select
		id + (
		SELECT
			count(id)
		FROM
			"121-service"."intersolve_visa_customer"),
		created,
		updated,
		"holderId",
		"registrationId" + (
		SELECT
			max("registrationId")
		FROM
			"121-service"."intersolve_visa_customer")
	from
		"121-service".intersolve_visa_customer);