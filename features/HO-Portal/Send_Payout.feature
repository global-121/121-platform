@ho-portal
Feature: Send Payout

  Scenario: Viewing the payment page as project-officer
    Given a logged-in "project-officer" user
    When the user views the "payment" page
    Then the user sees an "start payout now" button
    And this button is only enabled when the "payment" is "open"

  Scenario: Send the payout
    When the user clicks the "start payout now" and confirms the confirm prompt
    Then a "payout confirmation message" is shown
    And the "payment status" for this "payment" is updated to the "closed state"
