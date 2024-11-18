CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
INSERT INTO "121-service"."intersolve_visa_wallet" (
  select id
			,created
			,created
			,uuid_generate_v4()
			,false
			,true 
			,true 
			,0
			,null
			,null
			,id
			,null
			,null
			,0
		from "121-service".intersolve_visa_customer);
