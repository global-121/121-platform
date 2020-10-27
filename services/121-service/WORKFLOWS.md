# Workflows / Playbook / Manual

In this file we document "how to do X", manually. As not everything is possible (yet) via the interfaces.

---

## Change SMS and/or WhatsApp phone-numbers for PA

1. PA gets in contact with **Pilot-team** if phone is lost
2. **Pilot-team** provides to **121-dev-team**:
   - Name and/or old WhatsApp phone-number and/or old SMS phone-number (as entered in the PA-App)
   - Name can be any of the first/second/third/last name attributes
   - New WhatsApp phone-number (if need to replace)
   - New SMS phone-number (if need to replace)
3. **121-dev-team**:

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

   3. Use the found connection `did` to update the phone-numbers.
      - Use: [`/sovrin/create-connection/phone/overwrite`](https://test-vm.121.global/121-service/docs/#/sovrin/post_sovrin_create_connection_phone_overwrite)  
        To store the new SMS phone-number. (Make sure to ONLY include the numbers, no whitespace or `+`)
      - Use: [`/sovrin/create-connection/custom-data/overwrite`](https://test-vm.121.global/121-service/docs/#/sovrin/post_sovrin_create_connection_custom_data_overwrite)  
        To store the new WhatsApp phone-number, with: `key` set to `whatsappPhoneNumber`. (Make sure to ONLY include the numbers, no whitespace or `+`)
