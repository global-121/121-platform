@pa-app
Feature: New registration

  Scenario: Program with validation
    Given a program has been published
    Given the program has "validation" enabled
    Given the program has at least 1 "program question" defined
    Given the program has at least 1 "Financial Service Provider" defined
    Given that "FSP" has at least 1 "FSP question" defined
    Given the "instance" has "contact details" defined
    Given the "instance" has a "monitoring question" defined
    When the PA opens the PA-App
    Then the "select language"-step is shown
    When the PA selects a "language" from the list
    Then interface text changes into the chosen language
    And the "contact details"-step is shown
    And the "select program"-step is shown
    When the PA selects a "program" from the list
    Then the "consent question"-step is shown
    When the PA completes this step
    Then the "sign-up/sign-in"-step is shown
    When the PA selects "create account" from the list
    Then the "create identity"-step is shown
    When the PA completes this step
    Then an account is created in the "PA-Accounts-service"
    And a unique "referenceId" is generated and stored in the "PA-Accounts-service"
    And the "enroll in a program"-step is shown
    When the PA completes this step (See "Answer_program_questions.feature")
    Then the PA's answers are (temporarily) stored in the "121-service"
    And the PA's status in the "121-service" is set to "created"
    And the "select financial service provider"-step is shown
    When the PA completes this step (See "Fill_payment_details.feature")
    Then the PA's answers are stored in the "121-service"
    And the "preprinted qr-code"-step is shown
    When the PA completes this step (See "Link-preprinted-QR-code.feature")
    Then the PA's provided QR-code is stored in the "121-service"
    And the "registration summary"-step is shown
    And the "monitoring question"-step is shown
    When the PA completes this step
    Then the "inclusion status"-step is shown
    And the PA's status in the "121-service" is set to "registered"

