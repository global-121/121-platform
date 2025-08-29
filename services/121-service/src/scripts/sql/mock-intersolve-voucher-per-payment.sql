INSERT INTO "121-service"."intersolve_voucher"
SELECT
    id + (SELECT max(id) FROM "121-service"."intersolve_voucher"),
    created,
    $1,
    "whatsappPhoneNumber",
    pin,
    barcode,
    send,
    "balanceUsed",
    amount,
    updated,
    "updatedLastRequestedBalance",
    "lastRequestedBalance",
    "reminderCount",
    "userId"
FROM
    "121-service"."intersolve_voucher"
WHERE
    "paymentId" = (SELECT MIN(id) FROM "121-service"."payment" p2 WHERE p2."projectId" = $2)
