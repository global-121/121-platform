--------------------------------------------
-- CREATE LARGE DATASETS FOR LOAD TESTING --
--------------------------------------------
-- This script can be used to quickly create large datasets for load testing.
-- IMPORTANT: this query needs to be kept up-to-date with changes to the datamodel (registration + registration_data + transaction + twilio_message entities)

-- PREREQUISITES
--     1. reset to nlrc-multiple
-- 	   2. Register 1 PA (via import or PA-app or any way you like)
--	   3. (optional) include this PA first >> if you want included PAs for your test-data-set
--	   4. (optional) do 1 payment for this PA already >> if you want existing transactions for your test-data-set 
--	   5. (optional) send 1 message for this PA already >> if you want existing messages for your test-data-set

-- RUN SCRIPT
-- 	   6. Run scripts of section A below to create registrations
--     7. (optional) run section B if you want transacations also in your database (and if you have done step 3 and 4 above)
--	   8. (optional) run section C if you want messages also in your databse (and if you have done step 5 above)

--------------------------------
-- A.1: Blow up registrations --
--------------------------------

-- This will duplicate the existing registrations 10 times, so to 1024 PAs. If you want more, simply increase the number 10 in the loop

DO $$ DECLARE i record;

BEGIN FOR i IN 1..10 LOOP
INSERT
	INTO
	"121-service".registration (
	SELECT
		id + (
		SELECT
			max(id)
		FROM
			"121-service".registration),
		created,
		"registrationStatus",
		concat("referenceId", md5(random()::text)),
		"phoneNumber",
		"preferredLanguage",
		"inclusionScore",
		"paymentAmountMultiplier",
		note,
		"noteUpdated",
		"programId",
		"userId",
		"fspId",
		updated,
		"registrationProgramId" + (
		SELECT
			max("registrationProgramId")
		FROM
			"121-service"."registration"),
		"maxPayments"
	FROM
		"121-service".registration);
END LOOP;
END;

$$ ;

-- CHECK VIA:
-- select count(*) from "121-service"."registration"


------------------------------------
-- A.2: Blow up registration_data --
------------------------------------

-- Always run this part as well if you run the part above. There is no realistic use case for loading registrations without registration_data
-- Make sure that if you changed the number of duplications from 10 to something else, you apply the same change here

DO $$ DECLARE i record;

BEGIN FOR i IN 1..10 LOOP
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
		"monitoringQuestionId",
		value,
		updated
	FROM
		"121-service"."registration_data");
END LOOP;
END;

$$ ;

-- CHECK VIA:
-- select count(*) from "121-service"."registration_data"


-----------------------------------
-- A.3: Make phonenumbers unique --
-----------------------------------
-- The same phone number occuring many times can have unwanted consequences in load testing
update "121-service".registration_data
   set "value" = CAST(10000000000 + floor(random() * 90000000000) AS bigint)
  WHERE "programQuestionId" IN (SELECT id FROM "121-service".program_question WHERE "name" = 'phoneNumber') OR "fspQuestionId" IN (SELECT id FROM "121-service".fsp_attribute WHERE "name" = 'whatsappPhoneNumber');
;
  
  

-------------------------------------------
-- B.1: Blow up 1 transaction to all PAs --
-------------------------------------------
  
-- Only use this if you have first done one transaction for 1 PA #1 already manually
-- Make sure to adjust the number of duplications (10) to something else if changed above as well

DO $$ DECLARE i record;

BEGIN FOR i IN 1..10 LOOP
INSERT
	INTO
	"121-service"."transaction" (
	SELECT
		id + (
		SELECT
			max(id)
		FROM
			"121-service"."transaction"),
		created,
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
		updated
	FROM
		"121-service"."transaction"
	WHERE
		payment = 1);
END LOOP;
END;

$$ ;

-- CHECK VIA:
-- select count(*) from "121-service"."transaction"


--------------------------------------------
-- B.2: Blow up nr of transactions per PA --
--------------------------------------------
  
-- Only use this if you have first done one transaction per PA already (through above script or done manually)
-- This will create 5 transactions per PA, change the number in the loop if you want more or less

DO $$ DECLARE i record;

BEGIN FOR i IN 1..4 LOOP
INSERT
	INTO
	"121-service"."transaction" (
	SELECT
		id + (
		SELECT
			count(id)
		FROM
			"121-service"."transaction"),
		created,
		status,
		"errorMessage",
		i + 1,
		"customData",
		"transactionStep",
		"programId",
		"financialServiceProviderId",
		"registrationId",
		amount,
		updated
	FROM
		"121-service"."transaction"
	WHERE
		payment = i);
END LOOP;
END;

$$ ;

-- CHECK VIA:
-- select count(*) from "121-service"."transaction"



---------------------------------------
-- C.1: Blow up 1 message to all PAs --
---------------------------------------

-- Only use this if you have first done one message for 1 PA #1 already manually
-- Make sure to adjust the number of duplications (10) to something else if changed above as well

DO $$ DECLARE i record;

BEGIN FOR i IN 1..10 LOOP
INSERT
	INTO
	"121-service"."twilio_message" (
	select
		id + (
		SELECT
			count(id)
		FROM
			"121-service"."twilio_message"),
		created,
		"accountSid",
		body,
		"to",
		"from",
		sid,
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
END LOOP;
END;

$$ ;

-- CHECK VIA:
-- select count(*) from "121-service"."twilio_message"

----------------------------------------
-- C.2: Blow up nr of messages per PA --
----------------------------------------
  
-- Only use this if you have first done one message per PA already (through above script or done manually)
-- This will duplicate the number of messages per PA 4 times, so to 16 per PA, if you want more or less, change the number below

DO $$ DECLARE i record;

BEGIN FOR i IN 1..4 LOOP
INSERT
	INTO
	"121-service"."twilio_message" (
	SELECT
		id + (
		SELECT
			count(id)
		FROM
			"121-service"."twilio_message"),
		created,
		"accountSid",
		body,
		"to",
		"from",
		sid,
		status,
		"type",
		"dateCreated",
		"registrationId",
		"mediaUrl",
		updated,
		"contentType",
		"errorCode",
		"errorMessage"
	FROM
		"121-service"."twilio_message");
END LOOP;
END;

$$ ;

-- CHECK VIA:
-- select count(*) from "121-service"."twilio_message"
