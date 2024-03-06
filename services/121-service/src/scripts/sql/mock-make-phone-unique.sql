update "121-service".registration_data
   set "value" = CAST(10000000000 + floor(random() * 90000000000) AS bigint)
  WHERE "programQuestionId" IN (SELECT id FROM "121-service".program_question WHERE "name" = 'phoneNumber') OR "fspQuestionId" IN (SELECT id FROM "121-service".financial_service_provider_question WHERE "name" = 'whatsappPhoneNumber');
;
update "121-service".registration r
  set "phoneNumber" = rd."value"
  from "121-service".registration_data rd
  where rd."registrationId" = r."id" and rd."programQuestionId" in (SELECT id FROM "121-service".program_question WHERE "name" = 'phoneNumber')
;
