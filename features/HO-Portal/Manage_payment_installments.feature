@ho-portal
Feature: Manage payment installments

  Background:
    Given a logged-in "project-officer" user
    Given the user views the page "program-details"


  Scenario: View payment installments of a program
    Given a number of "X" installments in the program
    Given the installment frequency is "month"
    When the user scrolls to the "payout" section
    Then a list of "X" installments is shown
    And each installment is either "closed" or "open"
    And "closed" installments have a date in the past or today
    And "open" installments have a date 1 "month" after the previous one
    And if the 1st installment is "open" it has the date of today
    And each installment has a payment-amount field
    And "closed" installments show the actual amount in a disabled field
    And "open" installments show the suggested amount, which can be changed
    And each installment has a payout-button
    And this button is enabled only for the 1st upcoming "open" installment
    And this button is disabled also in case of 0 included people

  Scenario: Show total amount
    When the user clicks the button "start payout now"
    Then the pop-up "Are you sure?" is shown
    And the pop-up shows the total amount to pay out
    And the button "OK" is shown
    And the button "Cancel" is shown

  Scenario: Send payment instructions
    Given the installment frequency is "month"
    Given the user clicks the button "start payout now"
    Given the pop-up "Are you sure?" is shown
    When the user clicks the button "OK"
    Then the payment instructions list is sent to the Financial Service Provider
    And the message "Payout successful" is shown
    And the processed installment has changed to "closed" with the date of today and has disabled buttons
    And the next installment now has a date 1 "month" from today and has enabled fields
    And after page refresh the "manage people affected" component has updated values for "payment" columns

  Scenario: Send payment instructions with changed transfer value
    Given the user changes the Transfer value to "20"
    Given the user clicks the button "start payout now"
    Given the pop-up "Are you sure?" is shown
    When the user clicks the button "OK"
    Then the payment instructions list is sent to the Financial Service Provider
    And the payment instructions contain the transfer value "20"
    And the message "Payout successful" is shown

  Scenario: Cancel send payment instructions
    Given the user clicks the button "start payout now"
    Given the pop-up "Are you sure?" is shown
    When the user clicks the button "Cancel"
    Then the pop-up is closed

  Scenario: Financial Service Provider not available
    Given the "financial-service-provider" is unavailable
    Given the user clicks the button "start payout now"
    Given the pop-up "Are you sure?" is shown
    When the user clicks the button "OK"
    Then the message "Payout unsuccessful. Are there enough funds?" is shown

  Scenario: Not enough funds available
    Given available funds "X"
    Given total amount needed "Y"
    Given "Y" is smaller than "X"
    Given the user clicks the button "start payout now"
    Given the pop-up "Are you sure?" is shown
    When the user clicks the button "OK"
    Then the message "Payout unsuccessful. Are there enough funds?" is shown


