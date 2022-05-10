@pa-app
Feature: New registration
  Background:
    Given a program has been published

  Scenario: Online self registration
    Given the PA-app is not in batch-mode
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
    Then a new row in the "PA-table" in the 121-portal is created with status "created"
    And the "enroll in a program"-step is shown
    When the PA completes this step (See "Answer_program_questions.feature")
    Then the "select financial service provider"-step is shown
    When the PA completes this step (See "Fill_payment_details.feature")
    And the PA's status in the PA-table in the 121-portal is updated to "registered"
    And the PA's details are visible in the PA-table in the 121-portal
    And the inclusion score is calculated correctly
    And the "registration summary"-step is shown
    And the "monitoring question"-step is shown
    When the PA completes this step
    Then the "inclusion status"-step is shown
    When the PA is included in the 121-portal
    Then an inclusion-message appears in the PA-app

  Scenario: Offline self registration
    Given the PA has an active internet connection
    Given the PA-app is not in batch-mode
    When the PA opens the PA-App
    Then the PA-app immediately caches all instance, program, FSP information

    When the PA loses internet connection at any moment after that
    Then the PA-app caches all answers
    And the PA can continue the registration as usual
    And at the end of registration - if not back online yet - a popup appears explaining to get online to finish the registration.

    When the PA has an active internet connection again
    Then the PA-app syncs the registration to the back-end
    And the PA details are visible in the PA-table in the 121-portal
    And the listening for inclusion-status is enabled again

  Scenario: Switch to multiple registrations mode
    Given the Aidworker has opened the PA-app
    When the Aidworker clicks on the second tab with the 'people' icon
    Then a popup opens with a 'Multiple registrations mode'
    And it is set to false

    When the Aidworker sets the toggle to true and closes the popup
    Then a 'Multiple registrations' title appears on the top left
    And a toast is shown to wait some time for the app to be downloaded

  Scenario: Online multiple registrations by AidWorker
    Given the Aidworker has an active internet connection
    Given the PA-app is in batch-mode
    When the Aidworker finishes a registration
    Then the registration is uploaded automatically and not added to the queue
    And the PA-app gives a button to 'Add another person affected'
    And the PA details are visible in the PA-table in the 121-portal

    When the button 'Add another person affected' is clicked
    Then the registration process is restarted

  Scenario: Offline multiple registrations by AidWorker
    Given the Aidworker has an active internet connection
    Given the PA-app is in batch mode
    Given the PA-app is opened with internet connection
    Given the PA-app loses internet connection afterwards
    When the AW finishes a registration
    Then a button 'Save this Person Affected' appears

    When the Aidworker clicks the button
    Then the information is saved
    And the counter in 'X registrations' in the top right increments with 1
    And a button 'Add another person affected' appears

    When the Aidworker clicks the button
    Then the registration process is restarted

    When the PA-app regains internet connection
    Then the queue is automatically uploaded
    And a popup appears that mentions that X PA's are being uploaded
    And the popup automatically closes when finished
    And the counter in 'X registrations' in the top right decreases to 0
    And the PA details are visible in the PA-table in the 121-portal

  Scenario: Open multiple registrations side menu
    Given the PA-app is in batch-mode
    When the Aidworker clicks on the 'X registrations' button
    Then a registrations batch tab opens on the left
    And it mentions your are offline if you are offline
    And it explains that registrations are stored inside your browser and automatically uploaded when online