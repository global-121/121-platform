insert
	into
	"121-service"."imagecode_export_vouchers"
select
	iev.id + (
	select
		max(id)
	from
		"121-service"."imagecode_export_vouchers"),
	iev.created,
	iev."registrationId",
	iev.id + (
	select
		max(id)
	from
		"121-service"."imagecode_export_vouchers"),
	iev.updated
from
	"121-service".intersolve_voucher iv
left join "121-service".imagecode_export_vouchers iev on
	iv.id = iev."voucherId"
where
	iv.payment = 1
