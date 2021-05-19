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

  Scenario: Send payment instructions with at least 1 successful transaction
    Given this is not the last payment for the program
    And the user clicks the button "start payout now"
    And the pop-up "Are you sure?" is shown
    When the user clicks the button "OK"
    Then the payment instructions list is sent to the Financial Service Provider
    And the payment instructions for each PA contain the transfer value "20" times the PA's "paymentAmountMultiplier"
    And the message "Payout successful for X PA's and failed for Y (if Y>0) PA's" is shown
    And it shows an "OK" button
    When the users presses "OK" 
    Then the page refreshes
    And the "new payment" component now shows the number of the next payment
    And the "export payment data" component now shows that the payment is "closed"
    And the "export payment data" component now has the next payment enabled
    And the "PA-table" now has the payment column filled for every PA
    And for successfull transactions it shows a datetime, which can be clickable depending on the program
    And for failed transactions it shows 'Failed', which can be clickable depending on the program
    And a new empty payment column for the next payment is visible 
    And - for successfull transactions - the PA receives (notification about) voucher/cash depending on the FSP

  Scenario: Send payment instructions with 0 successful transactions
    Given payment instructions are sent to the Financial Service Provider
    Then the message "Payout failed for all PA's" is shown
    And the payment is not processed and/or "closed"
    And the payment column contains 'Failed' for all PAs, which can be clickable depending on the program

  Scenario: Send payment instructions for 1000 PAs
    Given there are 1000 PAs in the system (to import: see Admin-user/Import_test_registrations_NL.feature)
    And they are included (see e.g. HO-Portal/Include_people_affected_Run_Program_role.feature)
    When the user clicks the "start payout now" button and confirms the confirm prompt
    Then a loading spinner starts which can take a long time (very rough estimation: 0.5 seconds per PA)
    When it is finished
    Then the regular popup with "Payout successful for X PA's and failed for Y (if Y>0) PA's" is shown

  Scenarios related to (potentially) multiple registrations on one phone-number
    See for now: https://github.com/global-121/121-platform/wiki/Test-scenarios