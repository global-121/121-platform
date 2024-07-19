@portal
Feature: Make a new payment

  Background:
    Given a logged-in user with the "PaymentCREATE" permission
    And the user views the "payment" page

  Scenario: Show maximum total amount
    Given a new payment is possible on the program
    Given the number of "PA included" is more then "0"
    Given the generic "select bulk action" scenario (see View_and_Manage_people_affected.feature)
    When the user selects the "Do payment" action
    Then a "row checkbox" appears in the "select" column for eligible rows
    When the user selects 1 or more PA's
    Then the "apply action" button is enabled
    When clicking the "apply action" button
    Then the pop-up "Do payment" is shown
    And the "Transfer Value" is filled in with the program's default value
    And the pop-up shows the number of PAs to pay out to
    And it shows the maximum total amount to pay out
    And this total amount reflects that some PAs may receive more than the supplied "Transfer Value" because of a "paymentAmountMultiplier" greater than 1
    And this total amount is a maximum because some transactions might fail

  Scenario: Send payment instructions with changed transfer value
    Given the "Do payment" prompt is open
    Given the user changes the Transfer value to "20"
    When the user clicks the button "start payout now"
    Then the total maximum amount reflects the changed amount per PA
    When the user clicks the button "OK"
    Then the payment instructions list is sent to the Financial Service Provider
    And the payment instructions for each PA contain the transfer value "20" times the PA's "paymentAmountMultiplier"
    And a popup shows for how many PAs the instructions were successfully sent

  Scenario: Send payment instructions
    Given this is not the last payment for the program
    When the user confirms the payout
    Then the payment instructions list is sent to the Financial Service Provider
    And the payment instructions for each PA contain the transfer value times the PA's "paymentAmountMultiplier"
    And the message "Payout request successfully sent to X PAs" is shown
    And it shows an "OK" button
    When the users presses "OK"
    Then the page refreshes
    And the "export payment data" component now shows that the payment is "closed"
    And the "export payment data" component now has the next payment enabled
    And the "bulk action" dropdown list now shows the next available payment to do
    When clicking "Payment history"
    Then the payment history popup opens
    And it shows the payment number, the payment state, the payment date+time and the transaction amount
    And the payment state shows 'Success' when the payment went through
    And it shows 'Failed' for failed transactions
    And it shows 'Waiting' for waiting transactions
    And - for successful transactions - the PA receives (notification about) voucher/cash depending on the FSP
    And the 'Export people affected' in the 'Registration' phase now contains 3 new columns for the new payment: status, amount, timestamp

  Scenario: Send payment instructions for 10000 PAs
    Given there are 10000 PAs in the system
    And they are included (see e.g. Portal/Include_people_affected_Run_Program_role.feature)
    Then the user selects the "Do payment" action
    And the user selects all 10000 PAs
    And the user clicks the "Apply action" button and the "Do payment" popup shows up
    When the user clicks the "start payout now" button
    Then the message "Payout request successfully sent to X PAs" is shown
    And it mentions that it can take some time (very rough estimation: 0.5 seconds per PA)
    And it shows an "OK" button
    When the users presses "OK"
    Then the page refreshes
    And the "payout" button  is now disabled
    And it mentions that a payout is in progress
    And it shows a refresh icon
    When the user clicks the refresh icon
    Then the "Payment History" column will start showing more and more PA's with status waiting
    When the user clicks the refresh icon again
    Then the "Payment History" column will upgrade more and more PA's from 'waiting' to 'success' or 'error'
    When the user clicks the refresh icon again (given the payment has finished)
    Then the payout-in-progress message is gone
    And the "payout" button for the next payment is enabled again
    And the "Payment History" column may still contain PA's on 'waiting', as the status-callbacks go on longer then the request-loop
    When the user refreshes the page again
    Then eventually all 'waiting' PAs have upgraded to 'success' or 'error' (unless some status callback fails for some reason)

  Scenario: Retry failed payment for 1 PA
    Given the payment has failed for a PA
    When the user clicks the "Payment #x failed" button for this PA
    Then the "Payment History" popup appears
    And it shows all payments for this PA
    And the failed payment button shows the date and is red
    When the user clicks the button a new popup shows
    And it contains the error message and a retry-button
    Then the user clicks the retry-button
    And a normal payment scenario is started for this 1 PA only (see other scenario)

  Scenario: Retry payment for all failed payments of PAs
    Given the payment has failed for more than 1 PA
    Then the user sees the "Retry all failed" button above the bulk action dropdown
    When the user clicks it
    Then a popup appears
    And it shows the number of PAs for which the payment will be retried
    When the user clicks 'OK'
    And a normal payment scenario is started for this all the PAs  (see other scenario)

  -- "Intersolve-voucher"

  Scenario: Send payment instructions to a Person Affected with Financial Service Provider "Intersolve-voucher"
    Given the Person Affected has chosen the option "receive voucher via whatsApp"
    When payment instructions are successfully sent (see scenario: Send payment instructions with at least 1 successful transaction)
    Then the Person Affected receives a whatsApp message
    And it explains the Person Affected to reply 'yes' to receive the voucher
    When the Person Affected replies 'yes' (or anything else)
    Then the Person Affected receives a voucher image
    And it is accompanied by text that explains what is sent
    And a separate "explanation" image is sent that explains how to use the voucher in the store (only if instruction-image is uploaded)
    And a separate voucher image is sent for any old uncollected vouchers or for any other registrations on the same "whatsappPhoneNumber"

  -- "Intersolve-visa"

  Scenario: Send first payment instructions to a Person Affected with SMS created with registrations import endpoint with Financial Service Provider "Intersolve-visa"
    Given the Person Affected has been created directly via registrations import endpoint as registered with Financial Service Provider "Intersolve-visa"
    And the PA has correctly filled "firstName", "lastName", "phoneNumber", "addressStreet", "addressHouseNumber", "addressPostalCode", "addressCity"
    And the PA has status "included"
    When payment instructions are successfully sent (see scenario: Send payment instructions with at least 1 successful transaction)
    Then the Person Affected receives 1 notification on SMS via generic send message feature "./Send_message_to_people_affected.feature"
    And the notification is about receiving their Visa card

  Scenario: Send first payment instructions to a Person Affected with Whatsapp created registrations import endpoint with Financial Service Provider "Intersolve-visa"
    Given the Person Affected has been created directly via registrations import endpoint as registered with Financial Service Provider "Intersolve-visa"
    And the PA has correctly filled "firstName", "lastName", "phoneNumber", "whatsappPhoneNumber", "addressStreet", "addressHouseNumber", "addressPostalCode", "addressCity"
    And the PA has status "included"
    When payment instructions are successfully sent (see scenario: Send payment instructions with at least 1 successful transaction)
    Then the Person Affected receives 1 notification on WhatsApp via generic send message feature "./Send_message_to_people_affected.feature"
    And the notification is about receiving their Visa card

  Scenario: Send first payment instructions to a Person Affected who changed from Intersolve Financial Service Provider "Intersolve-voucher" to Financial Service Provider "Intersolve-visa"
    Given the Person Affected has been updated having Intersolve Financial Service Provider "Intersolve-voucher" to having with Financial Service Provider "Intersolve-visa"
    When payment instructions are successfully sent (see scenario: Send payment instructions with at least 1 successful transaction)
    Then the Person Affected receives 1 notification on SMS via generic send message feature "./Send_message_to_people_affected.feature"
    And the notification is about receiving their Visa card


  Scenario: Send 2nd or higher payment instructions to a Person Affected with Financial Service Provider "Intersolve-visa"
    Given the Person Affected has successfully completed send first payment with Financial Service Provider "Intersolve-visa"
    # Set Visa Card to ACTIVE using Intersolve's Swagger UI (https://service-integration.intersolve.nl/pointofsale/swagger/index.html)
    And the Visa Debit Card of the Person Affected is "ACTIVE"
    When payment instructions are successfully sent (see scenario: Send payment instructions with at least 1 successful transaction)
    Then the Person Affected receives 1 notification (WhatsApp or SMS) via generic send message feature "./Send_message_to_people_affected.feature"
    And the notification is about the topup of their Visa card

  # TODO: Remove this scenario at some point when we feel it is no longer necessary to test, as it is pretty specificically oriented at a bug which is now solved
  Scenario: Send payment instructions in parts to a People Affected with Financial Service Provider "Intersolve-visa"
    Given PAs are registered with test-file '121-import-test-registrations-OCW.csv'
    And PAs have status "included"
    And a payment has been done for part of the PAs already
    And after that the payment amount multiplier has been updated for some of those PAs
    And the payment is then executed for the rest of the PAs
    And it fails for some of those PAs
    When then using 'retry all'
    Then all PAs who have correct registration data for receiving a payment have been paid the correct amount
    And all PAs have received a notification about the top-up their Visa card

  Scenario: Unsuccessfully send payment instructions for Person Affected with inactive card with Financial Service Provider "Intersolve-visa"
    Given PAs are registerd with test-file '121-import-test-registrations-OCW.csv'
    And 1 PA with correct registration data for payment has status "included"
    And this PA has received their first payment for Financial Service Prodiver "Intersolve-visa"
    And this PA has not yet activated their card
    When executing the next payment for this PA
    Then the transaction of this payment for this PA will show as "failed" with an error message that the card is "inactive"

  Scenario: Limit top-up (calculated amount > 0) with Financial Service Provider "Intersolve-visa"
    Given 1 PA with correct registration data for payment has status "included"
    And the PA has already received a payment with Financial Service Provider "Intersolve-visa"
    When executing a payment for a PA with amount 140 euros
    Then the service will check what the maximum amount is that can be topped up
    And the payment instructions will be successfully sent with either the calculated amount or the maximum amount (whichever is lower)

  Scenario: Limit top-up (calculated amount =< 0) with Financial Service Provider "Intersolve-visa"
    Given 1 PA with correct registration data for payment has status "included"
    And the PA has already received a payment with Financial Service Provider "Intersolve-visa"
    When executing a payment for a PA with amount 140 euros
    Then the service will check what the maximum amount is that can be topped up
    And no API call will be made to Intersolve
    And a succesfull transaction will be created with amount 0

  Scenario: Successfully retry payment after correcting registration data for PA with Financial Service Provider "Intersolve-visa"
    # TODO: Test with other types of missing data? (phone number, lastName, ...)
    Given 1 PA with missing "addressCity" and has status "included"
    When executing a payment for a PA
    Then the payment fails because of a INVALID_PARAMETERS error
    When updating the PA with a lastName and retrying the payment
    Then the payment shows with status "success"

  Scenario: Send first payment instructions to a Person Affected with incorrect (SMS) phoneNumer with Financial Service Provider "Intersolve-visa"
    Given a Person Affected has been registered with Financial Service Provider "Intersolve-visa"
    And the PA has correctly filled "firstName", "lastName", "addressStreet", "addressHouseNumber", "addressPostalCode", "addressCity"
    And the PA has a non-existing phone number in field "phoneNumber"
    And the PA has no "whatsappPhoneNumber"
    And the PA has status "included"
    When payment instructions are successfully sent (see scenario: Send payment instructions with at least 1 successful transaction)
    Then the payment shows as "success" in the Portal
    And the notification shows as "failed" in the Portal

  Scenario: Send 2nd or higher payment instructions to a Person Affected with invalid whatsappPhoneNumber with Financial Service Provider "Intersolve-visa"
    Given a Person Affected has been registered with Financial Service Provider "Intersolve-visa"
    And the PA has correctly filled "firstName", "lastName", "phoneNumber", "addressStreet", "addressHouseNumber", "addressPostalCode", "addressCity"
    And the PA has a "whatsappPhoneNumber" without a Whatsapp account on it
    And the PA has status "included"
    And the PA already received a payment with Financial Service Provider "Intersolve-visa"
    When payment instructions are successfully sent (see scenario: Send payment instructions with at least 1 successful transaction)
    Then the payment shows as "success" in the Portal
    And the notification shows as "failed" in the Portal

  # TODO: Add scenarios for successful retry send payment after unsuccessful send paymen due to:
  # 1. 121 Platform sends correct data, but create customer endpoint fails (assumption that Intersolve provides way to test this)
  # 2. Create wallet endpoint fails (assumption that Intersolve provides way to test this)
  # 3. Link customer to  wallet endpoint fails (assumption that Intersolve provides way to test this)
  # 4. Create debit card endpoint fails (assumption that Intersolve provides way to test this)
  # 5. Load balance endpoint fails (assumption that Intersolve provides way to test this)

  --"Safaricom Kenya"

  Scenario: Successfully make a payment to a Person Affected with Financial Service provider "Safaricom"
    Given the Person Affected has been imported as registered
    Given all fields have correctly filled ("FullName", "Age", "FamilyMembers", "phoneNumber", "National ID number", "Language")
    Given age is not under 18
    Given PA requests valid transaction value
    When payment is successfully requested
    Then a successful payment appears in the payment column and the payment history popup
    And payment details are displayed with accordion open


  Scenario: Unsuccessfully make a payment to a Person Affected with Financial Service provider "Safaricom" with missing data
    Given the Person Affected has been imported as registered
    Given an obligatory field is missing ("phoneNumber", "National ID number")
    Given requested value is not valid
    When payment is requested
    Then a failed payment appears for the PA with the missing data
    And error is displayed

      """
    ------------------------------------------------------------------------------------------------------------------------------------

    See the 'Send payments instructions diagram' at './wiki/Send-payment-instructions' for more info, oriented at Financial Service Provider: "Intersolve-voucher".

    ------------------------------------------------------------------------------------------------------------------------------------

    One or multiple registrations with the same payment-address(phone-number)

    1. There is maximum one registration per payment-address.
    - Payment succeeds for all People Affected
    - Person Affected receives initial WhatsApp message about receiving one voucher (+ any older uncollected vouchers)
    - If replied "_yes_", the Person Affected receives:
    * a WhatsApp message about receiving one voucher (incl. the voucher image)
    * ... + any older uncollected vouchers (without text)
    * ... + one explanation image

    2. There is 1 rejected and 1 included registration on one payment-address.
    - Works exactly as (1)

    3. There are 2 or more _included_ registrations on one payment-address.
    - Payment succeeds
    - All Persons Affected receive (on the same phonenumber) the same initial WhatsApp message about receiving one voucher for this week + also any older uncollected vouchers
    - If replied 'yes' just once, all Persons Affected receive together:
    * a WhatsApp message about receiving multiple vouchers (incl. the first voucher image)
    * ... + any additional vouchers for this week (without text)
    * ... + any older uncollected vouchers (without text)
    * ... + one explanation image per Person Affected (without text)

      4. There are 2 (or more) included registrations on one payment address at moment of payout. But before "_yes_" reply, 1 (or more) are rejected.
      - Works exactly as (3)
      - The status at moment of payout is relevant, not the status at the moment of the "_yes_" reply.
      - This specifically enables to immediately end inclusion for People Affected after their last payout, without having to wait for their reply.

      """
