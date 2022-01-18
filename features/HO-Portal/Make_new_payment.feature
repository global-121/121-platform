@ho-portal
Feature: Make a new payment

  Background:
    Given a logged-in user with the "run program" role
    And the user views the "payment" page

  Scenario: No PA included
    Given a new payment is possible on the program
    When the number of "PA included" is "0"
    Then the "start payout now" button is disabled

  Scenario: Show total amount
    Given a new payment is possible on the program
    And the number of "PA included" is more then "0"
    And the "Transfer Value" is filled in with the program's default value
    When the user clicks the button "start payout now"
    Then the pop-up "Are you sure?" is shown
    And the pop-up shows the number of PAs to pay out to
    And it shows the total amount to pay out
    And this total amount reflects that some PAs may receive more than the supplied "Transfer Value" because of a "paymentAmountMultiplier" greater than 1

  Scenario: Send payment instructions with changed transfer value
    Given the user changes the Transfer value to "20"
    And the user clicks the button "start payout now"
    And the pop-up "Are you sure?" is shown
    When the user clicks the button "OK"
    Then the payment instructions list is sent to the Financial Service Provider
    And the payment instructions for each PA contain the transfer value "20" times the PA's "paymentAmountMultiplier"
    And the message is shown according to the success of the transactions

  Scenario: Send payment instructions for small amount of PAs with at least 1 successful transaction
    Given this is not the last payment for the program
    And the user clicks the button "start payout now"
    And the pop-up "Are you sure?" is shown
    When the user clicks the button "OK"
    Then the payment instructions list is sent to the Financial Service Provider
    And the payment instructions for each PA contain the transfer value times the PA's "paymentAmountMultiplier"
    And the message "Payout request successfully sent to X PAs" is shown
    And it shows an "OK" button
    When the users presses "OK"
    Then the page refreshes
    And the "payout" button  is now disabled
    And it mentions that a payout is in progress
    And it shows a refresh icon
    When the user clicks the refresh icon (and the payment has indeed finished)
    Then the payout-in-progress message is gone
    And the "payout" button for the next payment is enabled again
    And the "new payment" component now shows the number of the next payment
    And the "export payment data" component now shows that the payment is "closed"
    And the "export payment data" component now has the next payment enabled
    And the "PA-table" now has the payment column filled for every PA
    And for successful transactions it shows a date+time and the transaction amount
    And it is clickable for programs with voucher-support (Intersolve)
    And for failed transactions it shows 'Failed' and the transaction amount, and it is clickable
    And for waiting transactions it shows 'Waiting' and the transaction amount, and it is clickable
    And a new empty payment column for the next payment is visible
    And - for successful transactions - the PA receives (notification about) voucher/cash depending on the FSP
    And the 'Export people affected' in the 'Registration' phase now contains 4 new columns for the new payment: status, amount, date and 'voucher-claimed-date'

  Scenario: Send payment instructions with small amount of PAs with 0 successful transactions
    When payment instructions are sent to the Financial Service Provider and have finished processing
    Then the payment is not "closed"
    And the "export payment" dropdown does not update accordingly
    And the "payment" column contains 'Failed' for all PAs, which can be clickable depending on the program
    And the same payment can be retried for all included PAs using the "payout" button

  Scenario: Send payment instructions for 5000 PAs
    Given there are 5000 PAs in the system (to import: see Admin-user/Import_test_registrations_NL.feature)
    And they are included (see e.g. HO-Portal/Include_people_affected_Run_Program_role.feature)
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
    Then the payment-column will start showing more and more PA's with status waiting
    When the user clicks the refresh icon again
    Then the payment-column will upgrade more and more PA's from 'waiting' to 'success' or 'error'
    When the user clicks the refresh icon again (given the payment has finished)
    Then the payout-in-progress message is gone
    And the "payout" button for the next payment is enabled again
    And the payment-column may still contain PA's on 'waiting', as the status-callbacks go on longer then the request-loop
    When the user refreshes the page again
    Then eventually all 'waiting' PAs have upgraded to 'success' or 'error' (unless some status callback fails for some reason)

  Scenario: retry payment for 1 PA
    Given the payment has failed for a PA
    When the user clicks the failed-popup for this PA
    Then a popup appears with an error message
    And it shows a retry-button for this PA
    And it shows a retry-button for all PAs
    When the user clicks the retry-button for 1 PA
    Then a normal payment scenario is started for this 1 PA only (see other scenario)
    When the user clicks the retry-button for all PAs
    Then a normal payment scenario is started for all failed PAs of this payment only (see other scenario)
    And it does not include 'waiting' transactions

  Scenario: Send payment instructions to a Person Affected with Financial Service Provider "Intersolve"
    Given the Person Affected has chosen the option "receive voucher via whatsApp"
    When payment instructions are successfully sent (see scenario: Send payment instructions with at least 1 successful transaction)
    Then the Person Affected receives a whatsApp message
    And it mentions the amount of the voucher
    And it explains the Person Affected to reply 'yes' to receive the voucher
    When the Person Affected replies 'yes' (or anything else)
    Then the Person Affected receives a voucher image
    And it is accompanied by text that explains what is sent
    And a separate "explanation" image is sent that explains how to use the voucher in the store
    And a separate voucher image is sent for any old uncollected vouchers or for any other registrations on the same "whatsappPhoneNumber"

      """
------------------------------------------------------------------------------------------------------------------------------------

See the 'Send payments instructions diagram' at './wiki/Send-payment-instructions' for more info, oriented at Financial Service Provider: Intersolve.

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
