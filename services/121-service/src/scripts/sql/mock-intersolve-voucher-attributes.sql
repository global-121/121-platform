 WITH fsp_data AS (
  SELECT pra.id
  FROM "121-service".program_registration_attribute pra
  LEFT JOIN "121-service".program p ON p.id = pra."programId"
  LEFT JOIN "121-service".program_fsp_configuration f ON f."programId" = p.id
  WHERE pra."name" = 'whatsappPhoneNumber' AND f."fspName" = 'Intersolve-voucher-whatsapp'
)

UPDATE "121-service".intersolve_voucher iv
SET "whatsappPhoneNumber" = rd."value"
FROM "121-service".imagecode_export_vouchers iev
LEFT JOIN "121-service".registration r ON r.id = iev."registrationId"
LEFT JOIN "121-service".registration_attribute_data rd ON r.id = rd."registrationId", fsp_data fd
WHERE iv.id = iev."voucherId" AND rd."programRegistrationAttributeId" = fd.id;
