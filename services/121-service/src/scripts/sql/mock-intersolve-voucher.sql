INSERT INTO "121-service"."intersolve_voucher"
SELECT
    id + (SELECT COUNT(id) FROM "121-service"."intersolve_voucher"),
    created,
    payment,
    "whatsappPhoneNumber",
    pin,
    barcode,
    send,
    "balanceUsed",
    amount,
    updated,
    "updatedLastRequestedBalance",
    "lastRequestedBalance",
    "reminderCount"
FROM
    "121-service"."intersolve_voucher";
