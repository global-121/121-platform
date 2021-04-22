@ho-portal
Feature: Make a new payment

  Background:
    Given a logged-in "project-officer" user
    Given the user views the "payment" page

  Scenario: No PA included
    Given a new payment is possible on the program
    When the number of "PA included" is "0"
    Then the "start payout now" button is disabled

  Scenario: Show total amount
    Given a new payment is possible on the program
    Given the number of "PA included" is more then "0"
    Given the "Transfer Value" is filled in with the program's default value
    When the user clicks the button "start payout now"
    Then the pop-up "Are you sure?" is shown
    And the pop-up shows the total amount to pay out

  Scenario: Send payment instructions with changed transfer value
    Given the user changes the Transfer value to "20"
    Given the user clicks the button "start payout now"
    Given the pop-up "Are you sure?" is shown
    When the user clicks the button "OK"
    Then the payment instructions list is sent to the Financial Service Provider
    And the payment instructions contain the transfer value "20"
    And the message is shown according to the success of the transactions

  Scenario: Send payment instructions with at least 1 successful transaction
    Given the user clicks the button "start payout now"
    Given the pop-up "Are you sure?" is shown
    When the user clicks the button "OK"
    Then the payment instructions list is sent to the Financial Service Provider
    And the message "Payout successful for X PA's and failed for Y (if Y>0) PA's" is shown

  Scenario: Send payment instructions with 0 successful transactions
    Given payment instructions are sent to the Financial Service Provider
    Then the message "Payout failed for all PA's" is shown
    And the payment is not processed and/or "closed"

  Scenario: Financial Service Provider not available
    Given the "financial-service-provider" is unavailable
    Given the user clicks the button "start payout now"
    Given the pop-up "Are you sure?" is shown
    When the user clicks the button "OK"
    Then a generic message "Something went wrong." is shown
