@aw-app
Feature: Get Person Affected Validation Data

  Background:
    Given a logged-in user with "RegistrationPersonalForValidationREAD" permission
    And the user is on the "actions" page
    And the user selects "Scan Person Affected's QR-code" from the main-menu

  Scenario: Successfully get PA-data when online, with PA-data available, via 121-QR-code
    Given there is internet-connectivity
    And the PA-data is available online
    And the PA-data is not available offline
    And a valid 121-QR-code (with a "programId" and "referenceId") is used
    When the QR-code is scanned
    Then a positive feedback message is shown
    And the correct PA-data is loaded
    And the "validate-program"-component is shown

  Scenario: Successfully get PA-data when online, with PA-data available, via connected generic QR-code
    Given there is internet-connectivity
    And the PA-data is available online
    And the PA-data is not available offline
    And a valid "generic QR-code" (outside QR-code connected to an account) is used
    When the QR-code is scanned
    Then a positive feedback message is shown
    And the correct PA-data is loaded
    And the "validate-program"-component is shown

  Scenario: Unsuccessfully get PA-data when online, with PA-data available, via unconnected generic QR-code
    Given there is internet-connectivity
    And the PA-data is not available online
    And the PA-data is not available offline
    And the generic QR-code is not connected to any account in the 121-platform
    When the QR-code is scanned
    Then the message: "QR-code not found. You can try scanning another QR-code." is shown
    And the options to "Scan QR-code" and "Back to main menu" are shown

  Scenario: Unsuccessfully get PA-data when online, with PA-data not available (e.g. because already used for validation, incl. upload)
    Given there is internet-connectivity
    And the PA-data is not available online
    And the PA-data is not available offline
    And either a valid 121-QR-code (with a "programId" and "referenceId") or a valid generic QR-code is used
    When the QR-code is scanned
    Then the message: "QR-code not found. You can try scanning another QR-code." is shown
    And the options to "Scan QR-code" and "Back to main menu" are shown

  Scenario: Successfully get PA-data when offline, with the PA-data available
    Given there is no internet-connectivity
    And the PA-data is available offline
    And either a valid 121-QR-code (with a "programId" and "referenceId") or a valid generic QR-code is used
    When the QR-code is scanned
    Then the correct PA-data is loaded
    And a positive feedback message is shown
    And the "validate-program"-component is shown

  Scenario: Unsuccessfully get PA-data when offline, with the PA-data not available
    Given there is no internet-connectivity
    And the PA-data is not available offline
    And either a valid 121-QR-code (with a "programId" and "referenceId") or a valid generic QR-code is used
    When the QR-code is scanned
    Then a negative feedback message is shown
    Then the message: "QR-code not found. You can try scanning another QR-code." is shown
    And the options to "Scan QR-code" and "Back to main menu" are shown
