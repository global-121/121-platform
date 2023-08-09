# Workflows / Playbook / Manual

In this file we document "how to do X", manually. As not everything is possible (yet) via the interfaces.

---

> ⚠️ All links here go to the [test-environment](https://test.121.global/), so all URLs mentioned need to be changed to the correct environment.

---

## Delete PA

In the 121-portal only PAs with certain status can be deleted, while the API endpoint gives more flexibility.

1. [Log-in via Swagger-UI](./README.md#api-sign-uplog-in)
2. Look up the right `referenceId`s using the workflow above
3. Use the DELETE endpoint: [`/registrations`] (https://test.121.global/docs/#/registrations/post_registrations_delete)
4. Fill in one or multiple `referenceId`s

---

## Get monitoring data

1. [Log-in via Swagger-UI](./README.md#api-sign-uplog-in) as a user with the "`program:metrics.read`"-permission
2. Use the endpoint: [`/programs/monitoring/{programId}`](https://test.121.global/docs/#/programs/get_programs_monitoring__programId_)
   Fill in the `programId` = 1.

   This will return all registrations, with attributes:

   - Monitoring-question answer
   - Registration duration (in seconds)
   - PA status

---

## Get list of vouchers marked as 'to cancel' (Intersolve)

Since 2022-01-04 (code-date not deploy-date) we are not canceling vouchers any more, but do keep marking them as 'to cancel'.
This workflow explains how to get out a list of 'to cancel' vouchers.

1. [Log-in via Swagger-UI](./README.md#api-sign-uplog-in) as a user with the "`registration:personal.export`"-permission
2. Use the endpoint: [`/export-metrics/export-list`](https://test.121.global/docs/#/export-metrics/post_export_metrics_export_list)
   Fill in `type` = "to-cancel-vouchers" and `programId` = 1. Delete the other (optional) properties.

   This will return an object which includes the relevant 'data' property in json-format

3. Use any online json-to-csv converter if needed.
4. Filter on date before/after 2022-01-04 to distinguish between actual canceled vouchers or 'marked as canceled' vouchers

---
