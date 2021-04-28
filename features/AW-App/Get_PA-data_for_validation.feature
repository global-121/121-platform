@aw-app
Feature: Get PA-data for validation

  Background:
    Given a logged-in "field-validation" user
    Given the user is on the "actions" page
    Given the user selects "Scan PA's QR-code" from the main-menu

  Scenario: Get PA-data when online, with PA-data available
    Given there is internet-connectivity
    Given the PA-data is available online
    Given the PA-data is not available offline
    Given a valid 121-QR-code (with a "programId" and "referenceId") is scanned
    When the scan is complete
    Then the correct PA-data is loaded
    And a positive feedback message is shown
    And the "validate-program"-component is shown

  Scenario: Get PA-data when online, with PA-data available, via generic QR-code, connected to an account
    Given there is internet-connectivity
    Given the PA-data is available online
    Given the PA-data is not available offline
    Given the generic QR-code is connected to an account
    Given a generic QR-code (with a minimum length value) is scanned
    When the scan is complete
    Then the corresponding referenceId is requested from the server
    And the PA-data is requested with that referenceId
    And the correct PA-data is loaded
    And a positive feedback message is shown
    And the "validate-program"-component is shown

  Scenario: Get PA-data when online, via generic QR-code, not connected to an account
    Given there is internet-connectivity
    Given the PA-data is not available online
    Given the PA-data is not available offline
    Given the generic QR-code is not connected to an account
    Given a generic QR-code (with a minimum length value) is scanned
    When the scan is complete
    Then the message: "QR-code not found. You can try scanning another QR-code." is shown

  Scenario: Get PA-data when online, with PA-data not available
    Given there is internet-connectivity
    Given the PA-data is not available online
    Given the PA-data is not available offline
    Given a valid 121-QR-code (with a "programId" and "referenceId") is scanned
    When the scan is complete
    Then the message: "QR-code not found. You can try scanning another QR-code." is shown


  Scenario: Get PA-data when offline, with the PA-data available
    Given there is no internet-connectivity
    Given the PA-data is available offline
    Given a valid 121-QR-code (with a "programId" and "referenceId") is scanned
    When the scan is complete
    Then the correct PA-data is loaded
    And a positive feedback message is shown
    And the "validate-program"-component is shown

  Scenario: Get PA-data when offline, with the PA-data not available
    Given there is no internet-connectivity
    Given the PA-data is not available offline
    Given a valid 121-QR-code (with a "programId" and "referenceId") is scanned
    When the scan is complete
    Then a negative feedback message is shown
    Then the message: "QR-code not found. You can try scanning another QR-code." is shown
