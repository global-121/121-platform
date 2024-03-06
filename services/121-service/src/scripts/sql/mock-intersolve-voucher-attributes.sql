 WITH fsp_data AS (
  SELECT fa.id
  FROM "121-service".financial_service_provider_question fa
  LEFT JOIN "121-service".financial_service_provider f ON f.id = fa."fspId"
  WHERE "name" = 'whatsappPhoneNumber' AND f.fsp = 'Intersolve-voucher-whatsapp'
)

UPDATE "121-service".intersolve_voucher iv
SET "whatsappPhoneNumber" = rd."value"
FROM "121-service".imagecode_export_vouchers iev
LEFT JOIN "121-service".registration r ON r.id = iev."registrationId"
LEFT JOIN "121-service".registration_data rd ON r.id = rd."registrationId", fsp_data fd
WHERE iv.id = iev."voucherId" AND rd."fspQuestionId" = fd.id;
