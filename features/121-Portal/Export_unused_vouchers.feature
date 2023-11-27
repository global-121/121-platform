@portal
Feature: Export unused vouchers

  Background:
    Given a selected program with "Intersolve" FSP
    Given a logged-in user with "RegistrationPersonalEXPORT" permissions

  Scenario: Exporting unused vouchers
    When the user views the "payment" page
    Then the user sees an "Export list of unused vouchers" button
    When the user clicks the button
    Then a confirmation popup opens with description
    And it includes a "last done on" timestamp if available
    When the user confirms
    Then an Excel is downloaded
    And it contains all currently unused vouchers for the given program only
    And it contains columns: payment, issueDate, whatsappPhoneNumber, phoneNumber, lastExternalUpdate, name

