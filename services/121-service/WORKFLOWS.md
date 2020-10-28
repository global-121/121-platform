# Workflows / Playbook / Manual

In this file we document "how to do X", manually. As not everything is possible (yet) via the interfaces.

---

     
## Export supermarket voucher for PA
There are 2 reasons why a voucher would need to be exported.
- Because the PA has selected not to have whatsApp.
- If PA has lost phone, and has for some reason no access to old vouchers anymore.

Steps to follow:
1. **Pilot-team** provides to **121-dev-team**:
   - Name: can be any of the first/second/third/last name attributes
   - Phone number: can be SMS and/or Whatsapp phone number. If lost phone, than this should be old number(s)
   - Payment/installment number for which they want the voucher (e.g. 1st payment = 1, etc.). If multiple payments, provide all numbers, or a range (1-5).
2. **121-dev-team**:
  
   1. Find the `connection` of the PA that we want to update, using `Find DID of PA in database based on name and/or phone number` scenario below.
   2. Use the found connection `did` to export the voucher
      - Use: [`/fsp/intersolve/export-voucher`](https://test-vm.121.global/121-service/docs/#/fsp/post_fsp_intersolve_export_voucher) to export the voucher.
        Fill in the `did` and the `installment` number (e.g. 1).
      - Repeat this exercise if multiple installments.
      - Send the images back to the **Pilot-team** and make sure it's clear what PA (name/phone number) and payment/installment they're about.
   3. If the use case is a lost phone, continue with the `Change SMS and/or WhatsApp phone-number for PA` manual below

3. **Pilot-team** will either e-mail or physically hand voucher(s) to PA. 
     

## Change SMS and/or WhatsApp phone-numbers for PA

1. PA gets in contact with **Pilot-team** if phone is lost
2. **Pilot-team** provides to **121-dev-team**:
   - Name: can be any of the first/second/third/last name attributes
   - Old phone number(s): can be SMS and/or Whatsapp phone number
   - New WhatsApp phone(s)-number (if need to replace)
   - New SMS phone-number (if need to replace)
3. **121-dev-team**:

   1. Find the `connection` of the PA that we want to update, using `Find DID of PA in database based on name and/or phone number` scenario below.
   2. Use the found connection `did` to update the phone-numbers.
      - Use: [`/sovrin/create-connection/phone/overwrite`](https://test-vm.121.global/121-service/docs/#/sovrin/post_sovrin_create_connection_phone_overwrite)  
        To store the new SMS phone-number. (Make sure to ONLY include the numbers, no whitespace or `+`)
      - Use: [`/sovrin/create-connection/custom-data/overwrite`](https://test-vm.121.global/121-service/docs/#/sovrin/post_sovrin_create_connection_custom_data_overwrite)  
        To store the new WhatsApp phone-number, with: `key` set to `whatsappPhoneNumber`. (Make sure to ONLY include the numbers, no whitespace or `+`)

## Find DID of PA in database based on name and/or phone number 
1. [Log-in with Swagger-UI](./README.md#api-sign-uplog-in) as a "`program-manager`"-role user
2. Find the `connection` of the PA that we want to update.  
  (All links here go to the `test-vm`, so URL needs to be changed to correct environment)

  Use the endpoint: [`/sovrin/create-connection/get-did/name-phone`](https://test-vm.121.global/121-service/docs/#/sovrin/post_sovrin_create_connection_get_did_name_phone)  
  Where you can optionally fill in `name` and/or old `phoneNumber` to search for.

  This will return all connections that match _at least one_ of the parameters.

  - If 0 connections are returned, try spelling variations.
  - If multiple connections are returned, try to figure out which is the correct one.
    - Maybe there are PA with the same name, but different phone-numbers?
    - Maybe one is an unfinished registration?
    - Check back with the **Pilot-team** if still unclear.
  - If 1 connection is returned, continue
