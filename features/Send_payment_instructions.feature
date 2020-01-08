@ho-portal
Feature: Send payment instructions

  Scenario: Show total amount successfully
    Given a logged-in "program-manager" user
    Given the user views the page "program-details"
    When the user clicks the button "start payout now"
    Given the pop-up "Are you sure?" is shown
    Then the pop-up shows the total amount to pay out
    And the pop-up contains the total amount to pay out
    And the button "OK" is shown
    And the button "Cancel" is shown

  Scenario: Send payment instructions successfully
    Given a logged-in "program-manager" user
    Given the user views the page "program-details"
    Given the user clicks the button "start payout now"
    Given the pop-up "Are you sure?" is shown
    When the user clicks the button "OK"
    Then the payment instructions list is sent to the Financial Service Provider
    And the message "Payout successful" is shown

  Scenario: Send payment instructions with changed transfer value successfully
    Given a logged-in "program-manager" user
    Given the user views the page "program-details"
    Given the user changes the Transfer value to "20"
    Given the user clicks the button "start payout now"
    Given the pop-up "Are you sure?" is shown
    When the user clicks the button "OK"
    Then the payment instructions list is sent to the Financial Service Provider
    And the payment instructions contain the transfer value "20"
    And the message "Payout successful" is shown

  Scenario: Cancel send payment instructions successfully
    Given a logged-in "program-manager" user
    Given the user views the page "program-details"
    Given the user clicks the button "start payout now"
    Given the pop-up "Are you sure?" is shown
    When the user clicks the button "Cancel"
    Then the pop-up is closed

  Scenario: Financial Service Provider not available
    Given the "financial-service-provider" is unavailable
    Given a logged-in "program-manager" user
    Given the user views the page "program-details"
    Given the user clicks the button "start payout now"
    Given the pop-up "Are you sure?" is shown
    When the user clicks the button "OK"
    Then an error-message "Connection to Financial Service Provider is unavailable" is shown