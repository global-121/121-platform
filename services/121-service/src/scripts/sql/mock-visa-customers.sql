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
	left join "121-service".project_fsp_configuration f on r."projectFspConfigurationId" = f.id
	where f."fspName" = 'Intersolve-visa');
