@send-whatsapp-message
Feature: Claim digital vouchers

  Background:
    Given a program with "Intersolve" FSP
    And a PA has chosen FSP "Intersolve-voucher-whatsapp"
    And a payment has been made to this PA
    And the PA has received the initial WhatsApp-message

  Scenario: Send 'yes' reply to initial WhatsApp-message when uncollected vouchers available
    When the PA replies 'yes' to initial WhatsApp-message
    Then a WhatsApp-message is sent to the PA
    And it includes the voucher image
    And it includes an accompanying explanation text
    And it includes a second image which explains how to use the voucher in the store
    And it includes additional images for older uncollected vouchers, but only of the 2 payments prior to the current one
    And all sent vouchers are marked as 'claimed' in the database, and cannot be sent again in the future
    And the status of the transaction in the PA-table updates to 'success' if not already the case
    And the transaction in the PA-table now shows that the voucher is sent (through a cash-icon) and at which date

  Scenario: Send 'yes' reply when no uncollected vouchers available
    When the PA replies 'yes' to initial WhatsApp-message (or sends 'yes' at any moment)
    Then a WhatsApp-message is sent to the PA
    And it mentions that this is an automated response and to contact the help-desk

  Scenario: Send anything else besides 'yes'
    When the PA sends anything else then 'yes'
    Then the same scenarios as above are followed, as it does not matter what text is exactly sent

  Scenario: PA does not send anything to initial WhatsApp-message
    When the PA does not send anything
    Then a reminder is send out the next day at noon
    And the same scenarios as above are followed
    And a PA without WhatsApp should not get a reminder
    And a PA should not be reminded more than 3 times

  Scenario: PA claims digital voucher with other programs that have more payments
    Given there is another program that has 3+ more payments
    Given the PA is only ever included into the one program
    When the PA replies 'yes' to initial WhatsApp-message
    Then the PA receives all vouchers for their program that were not already sent up to 3 payments back irrespective of how many payments any other programs have
    And this basically means that the counting of 'sending maximum 3 latest vouchers' is done per program, not overallF

TODO: Follow-up message goes wrong because of 63016 faulty template error
// NOTE: use 16005550003 as test number to get a '63016: faulty template' error from twilio-mock-service
// Also extend this test scenario to 'claim message' (in new file)
