@pa-app
Feature: New registration
  Background:
    Given a program has been published

  Scenario: Program with validation
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
    When the PA confirms the chosen "language"
    Then the "contact details"-step is shown
    And the "select program"-step is shown
    When the PA selects a "program" from the list
    Then the "consent question"-step is shown
    When the PA gives "consent"
    Then the "sign-up/sign-in"-step is shown
    When the PA selects "create account" from the list
    Then the "create account"-step is shown
    When the PA completes this step
    Then a new row in the "PA-table" in the HO-portal is created with status "created"
    And the "enroll in a program"-step is shown
    When the PA completes this step (See "Answer_program_questions.feature")
    Then the "select financial service provider"-step is shown
    When the PA completes this step (See "Fill_payment_details.feature")
    Then the "preprinted qr-code"-step is shown
    When the PA completes this step (See "Link-preprinted-QR-code.feature")
    Then the PA receives an SMS confirming registration
    And the PA's status in the PA-table in the HO-portal is updated to "registered"
    And the PA's details are visible in the PA-table in the HO-portal
    And the inclusion score is calculated correctly
    And the "registration summary"-step is shown
    And the "monitoring question"-step is shown
    When the PA completes this step
    Then the "inclusion status"-step is shown
    When the PA is included in the HO-portal
    Then an inclusion-message appears in the PA-app

  Scenario: Offline registration by PA
    Given the PA has an active internet connection
    And the PA opens the PA-App
    When the PA-app loads
    Then the PA-app caches all instance, program, FSP information
    When the PA loses internet connection
    Then the PA-app should cache all answers
    And the PA should be able to continue to registration as usual
    When the PA has an active internet connection again
    Then the PA-app should sync the registration to the back-end

  Scenario: Multiple registrations online by AW (batch mode)
    Given the AW has an active internet connection
    And the AW opens the PA-app
    And the AW enables batch mode
    When the AW finishes a registration
    Then the PA-app gives a choice between 'Save PA' and 'Register another person affected'
    When the button 'Save PA' is clicked
    Then the PA-app registers the PA normally
    When the button 'Register another person affected' is clicked
    Then the registration process is restarted 

  Scenario: Multiple registrations offline by AW (batch mode)
    Given the AW has an active internet connection
    And the AW opens the PA-app
    And the AW enables batch mode
    And the PA-app loses internet connection
    When the AW finishes a registration
    Then the PA-app presents the user with a button 'Register another person affected'
    When the button 'Register another person affected' is clicked
    Then the registration process is restarted 