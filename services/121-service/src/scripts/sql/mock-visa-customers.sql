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
	left join "121-service".program_financial_service_provider_configuration f on r."projectFinancialServiceProviderConfigurationId" = f.id 
	where f."financialServiceProviderName" = 'Intersolve-visa');