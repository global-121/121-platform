# Workflows / Playbook / Manual

In this file we document "how to do X", manually. As not everything is possible (yet) via the interfaces.

---

> ⚠️ All links here go to the [test-vm](https://test-vm.121.global/), so all URLs mentioned need to be changed to the correct environment.

---

## Change SMS and/or WhatsApp phone-numbers for Person Affected

1. PA gets in contact with **Pilot-team** if phone is lost
2. **Pilot-team** provides to **121-dev-team**:
   - Name: can be any of the first/second/third/last name attributes
   - Old phone number(s): can be SMS and/or WhatsApp phone number
   - New WhatsApp phone(s)-number (if need to replace)
   - New SMS phone-number (if need to replace)
3. **121-dev-team**:
   1. Find the `connection` of the PA that we want to update, using `Find DID of PA in database based on name and/or phone number` scenario below.
   2. Use the found connection `did` to update the phone-numbers.
      - Use: [`/connection/phone/overwrite`](https://test-vm.121.global/121-service/docs/#/connection/post_connection_phone_overwrite)  
        To store the new SMS phone-number. (Make sure to ONLY include the numbers, no whitespace or `+`)
      - Use: [`/connection/custom-data/overwrite`](https://test-vm.121.global/121-service/docs/#/connection/post_connection_custom_data_overwrite)  
        To store the new WhatsApp phone-number, with: `key` set to `whatsappPhoneNumber`. (Make sure to ONLY include the numbers, no whitespace or `+`)

---

## Change Financial Service Provider for Person Affected

1. PA gets in contact with **Pilot-team** if Financial Service Provider needs to be updated
2. **Pilot-team** provides to **121-dev-team**:
   - Name: can be any of the first/second/third/last name attributes
   - and/or Phone number(s): can be SMS and/or WhatsApp phone number
   - New FSP: (Intersolve-whatsapp or Intersolve-no-whatsapp)
   - New WhatsApp phonenumber (if switching to Intersolve-whatsapp)
3. **121-dev-team**:
   1. Find the `connection` of the PA that we want to update, using `Find DID of PA in database based on name and/or phone number` scenario below.
   2. Update FSP: Use the found connection `did` to update the Financial Service Provider.
      - Use: [`/connection/update-chosen-fsp`](https://test-vm.121.global/121-service/docs/#/connection/post_connection_update_chosen_fsp)
      - Fill in the found `did`
      - Choose the right new FSP name. It must be one out of the provided list.
      - Fill in the required attributes. If the new FSP requires more attributes than the example-provided `whatsappPhoneNumber`, you can manually change this.
      - When you use the endpoint, it will tell you anyway if you are missing attributes and if so, which.

---

## Find DID of PA in database based on name and/or phone number

1. [Log-in with Swagger-UI](./README.md#api-sign-uplog-in) with a user with the "`personal-data`"-role
2. Find the `connection` of the PA that we want to update.  
   Use the endpoint: [`/connection/get-did/name-phone`](https://test-vm.121.global/121-service/docs/#/connection/post_connection_get_did_name_phone)  
   Where you can optionally fill in `name` and/or old `phoneNumber` to search for.

   This will return all connections that match _at least one_ of the parameters.

   - If 0 connections are returned, try spelling variations.
   - If multiple connections are returned, try to figure out which is the correct one.
     - Maybe there are PA with the same name, but different phone-numbers?
     - Maybe one is an unfinished registration?
     - Check back with the **Pilot-team** if still unclear.
   - If 1 connection is returned, continue

---

## Get monitoring data

1. [Log-in with Swagger-UI](./README.md#api-sign-uplog-in) with a user with the "`admin`"-role
2. Use the endpoint: [`/programs/monitoring/{programId}`](https://test-vm.121.global/121-service/docs/#/programs/get_programs_monitoring__programId_)  
   Fill in the `programId` = 1.

   This will return all connections, with attributes:

   - Monitoring-question answer
   - Registration duration (in seconds)
   - PA status

---

## Translations

### Update translations in seed-data from Transifex

1. From the "Resources" page: <https://www.transifex.com/redcrossnl/121-platform/content/>
2. Select one of the "`Instance: *`", "`FSP: *`" or "`Program: *`" resources.
3. Select the language to get the latest translations for.
4. Click "**Download for use**" from the pop-up.
5. Open the file in an (code-)editor, to:
   - Replace all instances of `"en"` with the selected language's code, i.e: `"saq_KE"` (for Samburu, Kenya)
   - Save the file (temporarily), for example as "`instance-kenya.saq_KE.json`"
6. Merge this file with the existing file in the repository
   - This can be done in-code via JavaScript.  
     See: <https://stackoverflow.com/a/21450110>
   - With a command-line tool.
     - `jq` <https://stedolan.github.io/jq/>
     - `json` <http://trentm.com/json/#FEATURE-Merging>
   - By-hand.
     - Add each `"saq_KE"`-property next-to its `"en"`-sibling. (Take note of the last comma!)
     - Make sure the output is valid JSON and properly formatted with [Prettier](https://prettier.io/).
7. Commit this version of the file.

### Update source-text for translations in Transifex

1. Take the preferred source-file (`instance`, `fsp` or `program`)
2. Remove **_ALL OTHER_** language-texts except "`en`"
3. Use this edited version of the file to upload in Transifex

   1. Go to "Resources" page: <https://www.transifex.com/redcrossnl/121-platform/content/>
   2. Select one of the "`Instance: *`", "`FSP: *`" or "`Program: *`" resources.
   3. Click the "**[ Update source file ]**"-button and use the edited, English only version.

### Add initial whatsApp message to Twilio approved messages

1. Go to <https://www.twilio.com/console/sms/whatsapp/templates>
2. Find 'voucher_double_new_line_dynamic' and click 'Add translations'.
3. Select the new language.
4. Copy-paste the `notifications[languageCOde].whatsappPayment` property from the appropriate `program-<program>.json` in `services/121-service/seed-data/`
5. Change any coded newlines (`\n`) to actual new lines using Enter.
6. Remove any escape characters, e.g. '`..reply \“yes\” to..`' becomes '`..reply “yes” to..`'
7. Fix any other code-problems there might be.
8. Save. It might take a few hours for the message to be approved.
9. Test this by registering a PA on the test-vm in the new language. Then include and send a payment from the HO-portal. You should receive the whatsApp-message in the right language.

---
