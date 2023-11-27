@portal
Feature: Export Intersolve Visa cards

  Background:
    Given a logged-in user with "FspDebitCardEXPORT" permission
    Given a program with FSP 'Intersolve Visa debit card'
    Given the user is on the "payment" page

  Scenario: Exporting cards
    When the user views the "payment" page
    Then the user sees an "Export debit card usage" button
    When the user clicks the button
    Then a confirmation popup opens with description
    And it includes a "last done on" timestamp if available
    When the user confirms
    Then an Excel is downloaded
    And it contains all past and current debit cards for the given program only
    And it contains columns: paId, referenceId, registrationStatus, cardNumber, issuedDate, lastUsedDate, balance, cardStatus

