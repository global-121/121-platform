update "121-service".registration_attribute_data
   set "value" = CAST(left("value", 2) || CAST(100000000 + floor(random() * 900000000) AS bigint) AS bigint)
  WHERE "projectRegistrationAttributeId" IN (SELECT id FROM "121-service".project_registration_attribute WHERE "name" = 'phoneNumber' OR "name" = 'whatsappPhoneNumber');
;
update "121-service".registration r
  set "phoneNumber" = rd."value"
  from "121-service".registration_attribute_data rd
  where rd."registrationId" = r."id" and rd."projectRegistrationAttributeId" in (SELECT id FROM "121-service".project_registration_attribute WHERE "name" = 'phoneNumber')
;
