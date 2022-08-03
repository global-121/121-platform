@ho-portal
Feature: Export payment data

  Scenario: Viewing the export options
    Given a logged-in user with "RegistrationPersonalEXPORT", "PaymentREAD" and "PaymentTransactionREAD" permissions
    When the user views the "payment" page
    Then the user sees an "Export payment data" component
    And the dropdown contains a list of all payments, with number, "open" or "closed" and date

  Scenario: Export payment report before payment
    Given a logged-in user with "RegistrationPersonalEXPORT", "PaymentREAD" and "PaymentTransactionREAD" permissions
    Given the payment has not taken place
    When the user selects the first "open" payment from the dropdown-list
    Then the "export report" button is enabled
    When the user clicks the "export report" button
    Then an Excel-file is downloaded
    And it shows a list of the registrations that are "included"
    And it shows the "name" and other program-attributes to be able to identify people
    And it shows the dates at which the person reached each status, to be able to assess the trajectory towards inclusion
    And it shows all program questions which have "included" as "export" attribute
    And it shows all program custom attributes which have "included" as "export" attribute
    And it does not show any deprecated attributes
    And the "export inclusion list" button remains enabled, so the action can be repeated infinitely
    And if no "included" registrations then an alert is shown that "no data can be downloaded"

  Scenario: Export payment report after payment
    Given a logged-in user with "RegistrationPersonalEXPORT", "PaymentREAD" and "PaymentTransactionREAD" permissions
    Given the payment has taken place
    When the user selects a "closed" payment from the dropdown-list
    Then the "export report" button is enabled
    When the user clicks the "export report" button
    Then an Excel-file is dowloaded
    And it shows a list of the registrations that are "included"
    And "transaction" information where the "amount" is the multiplication of the PA's "paymentAmountMultiplier" and the supplied "transfer value"
    And the "payment-number"
    And the known "phonenumber"
    And it shows all program custom attributes which have "payment" as "export" attribute

  Scenario: Export payment instructions
    Given the program is configured with an FSP with csv option
    Given a logged-in user with "RegistrationPersonalEXPORT", "PaymentREAD" and "PaymentTransactionREAD" permissions
    Given the payment has taken place
    When the user selects a "closed" payment from the dropdown-list
    Then the "export payment instructions" button is enabled
    When the user clicks the "export payment instructions" button
    Then an Excel-file is dowloaded
    And it shows a list of the registrations that were "included" for this payment
    And "transaction" information where the "amount" is the multiplication of the PA's "paymentAmountMultiplier" and the supplied "transfer value"
    And all data as programmed for this FSP

  Scenario: Viewing the export options without permission
    Given a logged-in user without "RegistrationPersonalEXPORT", "PaymentREAD" and "PaymentTransactionREAD" permissions
    When the user views the "payment" page
    Then the "Export payment data" component is not visible
