# Workflows / Playbook / Manual

In this file we document "how to do X", manually. As not everything is possible (yet) via the interfaces.

---

> ⚠️ All links here go to the [test-vm](https://test-vm.121.global/), so all URLs mentioned need to be changed to the correct environment.

---

## What to do in case of 'waiting' or 'failed' payments

- See [Activity Diagram for 'Send payment instructions'](https://github.com/global-121/121-platform/wiki/Send-payment-instructions) for more insight into possible scenarios.
- If transaction is on "failed"
  - If `whatsappPhoneNumber` is invalid (most observed scenario so far)
    - **Pilot-team** updates `whatsappPhoneNumber` in HO-portal
    - **Pilot-team** retries payment for each payment number from payment-status-popup in HO-portal
  - If failed for other reason
    - **Pilot-team** informs **121-dev-team**
    - **121-dev-team** does ad-hoc investigation
- If transaction is on "waiting"
  - Do not do anything for 24 hours. If the 'delivered' event was not properly communicated by Twilio to us for some reason, then the 'read' event is a 2nd chance to inform us of success.
  - After that: **Pilot-team** gets in contact with PA to find out what's going on.
  - If PA claims no voucher has been received and there is no reason to doubt this, then:
    - **121-dev-team** manually cancels and deletes voucher: no endpoint available as of yet > do manually
    - **121-dev-team** manually repeats payment for that PA: use [`/programs/payout`](https://test-vm.121.global/121-service/docs/#/programs/post_programs_payout)

---

## Change SMS and/or WhatsApp phone-numbers for Person Affected

> ⚠️ This is now possible directly from HO-portal.

1. PA gets in contact with **Pilot-team** if phone is lost
2. **Pilot-team** provides to **121-dev-team**:
   - Name: can be any of the first/second/third/last name attributes
   - Old phone number(s): can be SMS and/or WhatsApp phone number
   - New WhatsApp phone(s)-number (if need to replace)
   - New SMS phone-number (if need to replace)
3. **121-dev-team**:
   1. Find the `registration` of the PA that we want to update, using `Find Reference ID of PA in database based on name and/or phone number` scenario below.
   2. Use the found registration `referenceId` to update the phone-numbers.
      - Use: [`/registrations/attribute`](https://test-vm.121.global/121-service/docs/#/registrations/post_registrations_attribute)
        - To store the new WhatsApp phone-number, with: `key` set to `whatsappPhoneNumber`)
        - To store the new SMS phone-number use the same endpoint with: `key` set to `phoneNumer` (For bot a phone number check is included, with automatic sanitization as far as possible.)

---

## Change Financial Service Provider for Person Affected

1. PA gets in contact with **Pilot-team** if Financial Service Provider needs to be updated
2. **Pilot-team** provides to **121-dev-team**:
   - Name: can be any of the first/second/third/last name attributes
   - and/or Phone number(s): can be SMS and/or WhatsApp phone number
   - New FSP: (`Intersolve-whatsapp` or `Intersolve-no-whatsapp`)
   - New WhatsApp phone number (if switching to `Intersolve-whatsapp`)
3. **121-dev-team**:
   1. Find the `registration` of the PA that we want to update, using `Find Reference ID of PA in database based on name and/or phone number` scenario below.
   2. Update FSP: Use the found registration `referenceId` to update the Financial Service Provider.
      - Use: [`/registrations/update-chosen-fsp`](https://test-vm.121.global/121-service/docs/#/registrations/post_registrations_update_chosen_fsp)
      - Fill in the found `referenceId`
      - Choose the right new FSP name. It must be one out of the provided list.
      - Fill in the required attributes. If the new FSP requires more attributes than the example-provided `whatsappPhoneNumber`, you can manually change this.
      - When you use the endpoint, it will tell you anyway if you are missing attributes and if so, which.

---

## Find Reference ID of PA in database based on name and/or phone number

1. [Log-in with Swagger-UI](./README.md#api-sign-uplog-in) with a user with the "`personal-data`"-role
2. Find the `registration` of the PA that we want to update.
   Use the endpoint: [`/registrations/search-name-phone`](https://test-vm.121.global/121-service/docs/#/registrations/post_registrations_search_name_phone)
   Where you can optionally fill in `name` and/or old `phoneNumber` to search for.

   This will return all registrations that match _at least one_ of the parameters.

   - If 0 registrations are returned, try spelling variations.
   - If multiple registrations are returned, try to figure out which is the correct one.
     - Maybe there are PA with the same name, but different phone-numbers?
     - Maybe one is an unfinished registration?
     - Check back with the **Pilot-team** if still unclear.
   - If 1 registration is returned, continue

---

## Get monitoring data

1. [Log-in with Swagger-UI](./README.md#api-sign-uplog-in) with a user with the "`admin`"-role
2. Use the endpoint: [`/programs/monitoring/{programId}`](https://test-vm.121.global/121-service/docs/#/programs/get_programs_monitoring__programId_)
   Fill in the `programId` = 1.

   This will return all registrations, with attributes:

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
5. Update the translations with:

   ```sh
   node ./seed-data/process-translation-files.js convert-to-locale --locale <translated-locale> --in <downloaded-file> --out <target-file> --merge
   ```

6. Review the (automatic) changes
7. Commit the changes to the target-file.

### Update source-text for translations in Transifex

1. Take the preferred source-file (`instance`, `fsp` or `program`)
2. Remove **_ALL OTHER_** language-texts except "`en`" with:

   ```sh
   node ./seed-data/process-translation-files.js prepare-to-update-transifex --in <source-file> --out <destination-file>
   ```

3. Use this edited version of the file to upload in Transifex

   1. Go to "Resources" page: <https://www.transifex.com/redcrossnl/121-platform/content/>
   2. Select one of the "`Instance: *`", "`FSP: *`" or "`Program: *`" resources.
   3. Click the "**[ Update source file ]**"-button and use the edited, English only version.

### Add initial WhatsApp message & translations to Twilio approved messages

1. Go to <https://www.twilio.com/console/sms/whatsapp/templates>
2. Find `notifications_whatsapp_payment` or `notifications_whatsapp_payment_multiple` and click '_Add translations_'.
3. Select the new language.
4. Copy-paste the `notifications[languageCOde].whatsappPayment` (or `whatsappPaymentMultiple`) property from the appropriate `program-<program>.json` in `services/121-service/seed-data/`
5. Change any coded newlines (`\n`) to actual new lines using Enter.
6. Remove any escape characters, e.g. '`..reply \"yes\" to..`' becomes '`..reply "yes" to..`'
7. Fix any other code-problems there might be.
8. Save. It might take a few hours for the message to be approved.
9. Make sure the [Twilio Sandbox Configuration](https://www.twilio.com/console/sms/whatsapp/sandbox) is set-up to point to the Test-VM and you've joined the sandbox with the number you'r going to register a PA with.
10. Test by registering a PA on the Test-VM in the new language. Include the PA and send a payment from the HO-portal.
11. You should receive the WhatsApp-message in the chosen language.
12. Reply in the WhatsApp sandbox-conversation to trigger calls to the "incoming"-endpoint on the Test-VM

---
