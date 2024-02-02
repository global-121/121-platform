INSERT INTO "121-service"."imagecode_export_vouchers"
SELECT
    id + (SELECT COUNT(id) FROM "121-service"."imagecode_export_vouchers"),
    created,
    "registrationId" + (SELECT MAX("registrationId") FROM "121-service"."imagecode_export_vouchers"),
    "voucherId" + (SELECT MAX("voucherId") FROM "121-service"."imagecode_export_vouchers"),
      updated
FROM
    "121-service"."imagecode_export_vouchers";

