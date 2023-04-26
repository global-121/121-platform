@portal
Feature: Make a new payment

  >> These scenarios are also (partly) done with Cypress. See: payment.cy.ts

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
    When the user clicks the button "start payout now"
    Then the pop-up "Are you sure?" is shown
    And the pop-up shows the number of PAs to pay out to
    And it shows the maximum total amount to pay out
    And this total amount reflects that some PAs may receive more than the supplied "Transfer Value" because of a "paymentAmountMultiplier" greater than 1
    And this total amount is a maximum because some transactions might fail

  Scenario: Send payment instructions with changed transfer value
    Given the "Do payment" prompt is open
    Given the user changes the Transfer value to "20"
    And the user clicks the button "start payout now"
    And the pop-up "Are you sure?" is shown
    And the total maximum amount reflects the changed amount per PA
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
    And the "PA-table" now shows the payment just completed in the "Payment History" column for all PAs that were selected
    When clicking
    Then the payment history popup opens
    And it shows the payment number, the payment state, the payment date+time and the transaction amount
    And the payment state shows 'Success' when the payment went through
    And it shows 'Failed' for failed transactions
    And it shows 'Waiting' for waiting transactions
    And - for successful transactions - the PA receives (notification about) voucher/cash depending on the FSP
    And the 'Export people affected' in the 'Registration' phase now contains 3 new columns for the new payment: status, amount, date

  Scenario: Send payment instructions for 5000 PAs
    Given there are 5000 PAs in the system
    And they are included (see e.g. HO-Portal/Include_people_affected_Run_Program_role.feature)
    Then the user selects the "Do payment" action
    And the user selects all 5000 PAs
    And the user clicks the "Apply action" button and the "Do payment" popup shows up
    When the user clicks the "start payout now" button and confirms the confirm prompt
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

  Scenario: Send first payment instructions to a Person Affected with Financial Service Provider "Intersolve-visa"
    Given the Person Affected has been imported as registered with a "tokenCodeVisa"
    When payment instructions are successfully sent (see scenario: Send payment instructions with at least 1 successful transaction)
    Then the Person Affected receives 2 notifications (WhatsApp or SMS) via generic send message feature "./Send_message_to_people_affected.feature"
    And the first notification is about the activation of their Visa card
    And the second notification is about the topup of their Visa card

  Scenario: Send 2nd or higher payment instructions to a Person Affected with Financial Service Provider "Intersolve-visa"
    Given the Person Affected has been imported as registered with a "tokenCodeVisa"
    When payment instructions are successfully sent (see scenario: Send payment instructions with at least 1 successful transaction)
    Then the Person Affected receives 1 notifications (WhatsApp or SMS) via generic send message feature "./Send_message_to_people_affected.feature"
    And the notification is about the topup of their Visa card

  Scenario: Unsuccessfully send payment instructions for payment #1 with Financial Service Provider "Intersolve-visa"
    Given PAs are registerd with test-file '121-import-test-registrations-OCW.csv'
    Given Intersolve is in MOCK mode
    When executing payment 1 for all PAs
    Then PA #1 succeeds and the other ones fail for various reasons
    And the reason can be found in the PA payment status popup

  Scenario: Unsuccessfully send payment instructions with Financial Service Provider "Intersolve-visa"
    Given Intersolve is in MOCK mode
    When executing a payment for a PA with amount 999 euros
    Then the payment fails because of a BALANCE_TOO_HIGH error

  -- "Intersolve-jumbo-physical"

  Scenario: Send payment instructions to Persons Affected with Financial Service Provider "Intersolve-jumbo-physical"
    Given all Persons Affected have been imported and included
    Given all PAs have correctly filled "addressStreet", "addressHouseNumber", "addressPostalCode", "addressCity"
    When payment instructions are successfully sent (see scenario: Send payment instructions with at least 1 successful transaction)
    Then a successful payment appears in the payment column and the payment history popup
    And the amount of the payment is the multiplied amount (if a "paymentAmountMultiplier" > 1)
    And the Person Affected receives a notification that the Jumbo cards are sent via post (via generic send message feature "./Send_message_to_people_affected.feature")
    And if a "whatsappPhoneNumber" is known it is sent via WhatsApp and otherwise via SMS

  Scenario: Unsuccessfully send payment instructions to a Person Affected with Financial Service Provider "Intersolve-jumbo-physical" with wrong amount
    Given all Persons Affected have been imported and included
    Given the amount of the payment is set to an amount other than 22
    When payment instructions are sent (see scenario: Send payment instructions with at least 1 successful transaction)
    Then a failed payment appears for all PAs
    And the status popup will contain an error message about what is missing
    And the amount of the payment will be automatically set to 22 instead
    And a retry can immediately be done (via 'retry all' or per PA)

  Scenario: Unsuccessfully send payment instructions to a Person Affected with Financial Service Provider "Intersolve-jumbo-physical" with multiplier > 3
    Given all Person Affected has been imported and included
    Given at least 1 PA has a "paymentAmountMultiplier" > 3
    When payment instructions are sent (see scenario: Send payment instructions with at least 1 successful transaction)
    Then a failed payment appears for the PA with the high multiplier
    And the status popup will contain an error message indicating this
    And the amount of the payment will be set to the unmultiplied amount, so that on retry it is not multiplied again (and again)
    And after correcting the the multiplier (in Espo), the payment can be retried
    And for all other PAs a successful payment appears and notifications are sent (see scenario above)

  Scenario: Unsuccessfully send payment instructions to a Person Affected with Financial Service Provider "Intersolve-jumbo-physical" with missing data
    Given all Person Affected has been imported as registered
    Given an obligatory field is missing ("addressStreet", "addressHouseNumber", "addressPostalCode", "addressCity") for at least 1 PA
    When payment instructions are sent (see scenario: Send payment instructions with at least 1 successful transaction)
    Then a failed payment appears for the PA with the missing data
    And the status popup will contain an error message about the first field that is missing (except for "addressHouseNumber" where a more general error message is shown)
    And the amount of the payment will be set to the unmultiplied amount, even with a "paymentAmountMultiplier" > 1, so that on retry it is not multiplied again (and again)
    And after correcting the data, the payment can be retried
    And for all other PAs a successful payment appears and notifications are sent (see scenario above)





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
