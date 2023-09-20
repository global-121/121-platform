CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
INSERT
	INTO
	"121-service"."intersolve_visa_wallet" (
	select
		id + (
		SELECT
			count(id)
		FROM
			"121-service"."intersolve_visa_wallet"),
		created,
		updated,
		uuid_generate_v4(),
		"tokenBlocked",
		"linkedToVisaCustomer",
		"debitCardCreated",
		balance,
		status,
		"lastUsedDate",
		"intersolveVisaCustomerId" + (
		SELECT
			max("intersolveVisaCustomerId")
		FROM
			"121-service"."intersolve_visa_wallet")
	from
		"121-service".intersolve_visa_wallet);