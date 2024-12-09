update "121-service".registration_attribute_data
   set "value" = CAST(10000000000 + floor(random() * 90000000000) AS bigint)
  WHERE "programRegistrationAttributeId" IN (SELECT id FROM "121-service".program_registration_attribute WHERE "name" = 'phoneNumber' OR "name" = 'whatsappPhoneNumber' OR "name" = 'nationalId' or "name" = 'fullName');
;
update "121-service".registration r
  set "phoneNumber" = rd."value"
  from "121-service".registration_attribute_data rd
  where rd."registrationId" = r."id" and rd."programRegistrationAttributeId" in (SELECT id FROM "121-service".program_registration_attribute WHERE "name" = 'phoneNumber')
;
