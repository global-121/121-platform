 WITH fsp_data AS (
  SELECT pra.id
  FROM "121-service".project_registration_attribute pra
  LEFT JOIN "121-service".project p ON p.id = pra."projectId"
  LEFT JOIN "121-service".project_fsp_configuration f ON f."projectId" = p.id
  WHERE pra."name" = 'whatsappPhoneNumber' AND f."fspName" = 'Intersolve-voucher-whatsapp'
)

UPDATE "121-service".intersolve_voucher iv
SET "whatsappPhoneNumber" = rd."value"
FROM "121-service".imagecode_export_vouchers iev
LEFT JOIN "121-service".registration r ON r.id = iev."registrationId"
LEFT JOIN "121-service".registration_attribute_data rd ON r.id = rd."registrationId", fsp_data fd
WHERE iv.id = iev."voucherId" AND rd."projectRegistrationAttributeId" = fd.id;
