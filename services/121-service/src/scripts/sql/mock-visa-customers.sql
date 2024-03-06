truncate "121-service".intersolve_visa_wallet;
truncate "121-service".intersolve_visa_customer cascade;
INSERT
	INTO
	"121-service"."intersolve_visa_customer" (
		select r.id 
			,r.created
			,r.created
			,'mock-holderId'
			,r.id
	from "121-service".registration r 
	left join "121-service".financial_service_provider f on r."fspId" = f.id 
	where f.fsp = 'Intersolve-visa');