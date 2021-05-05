@ho-portal
Feature: Import people affected

  Background:
    Given a logged-in user with either the "run program" or the "personal data" role
    Given the "selected phase" is "Registration (& Validation)"

  Scenario: Open Import People Affected popup
    When the user clicks the "Import People Afected" button
    Then a popup opens to select a CSV file
    And it describes the required format of the file with a "phoneNumber" column and a "namePartnerOrganization" column
    And it shows a "choose file" button
    And it can also be used to drag and drop the file
    And it shows a disabled "OK" button
    And it shows a "Cancel" button

  Scenario: Successfully Import People Affected
    Given a valid import CSV file is prepared
    And it has columns "phoneNumber" and "namePartnerOrganization"
    And it has as delimiter ";" or "," 
    When the user selects the CSV-file, through 'choose file' or 'drag and drop' 
    Then the "OK" button becomes enabled
    When the user presses "OK"
    Then a loading spinner appears
    When it is finished
    Then a feedback popup appears
    And it shows the number of successfully imported "phoneNumbers"
    And it shows the number of "phoneNumbers" that were already present in the system
    And it shows the number of invalid "phoneNumbers"
    And it shows an "OK" button
    When the users presses "OK" 
    The popup disappears
    And the page refreshes
    And the PA-table now shows new rows equal to the number of successfully imported "phoneNumbers"
    And they have status "Imported"
    And the Imported date is filled in
    And the name of the "partner organization" is filled in

  Scenario: Unsuccessfully import invalid CSV file
    When the user selects an invalid CSV-file (wrong extension, wrong column names, wrong delimiter, etc.)
    Then the "OK" button becomes enabled
    When the user presses "OK"
    Then a feedback popup appears that "Something went wrong with the export."

  Scenario: Person Affected registers with imported phone number
    Given a "phoneNumber" is successfully imported
    And there has been no registration with this "phoneNumber" yet (from after the import)
    When a new Person Affected starts registrations with this "phoneNumber" (see PA-app/New_registration.feature)
    Then a new row with status "Created" is shown in the PA-table in HO-portal
    and the row with status "Imported" is also still shown, because without the phone-number the system cannot know yet they belong together
    When the Person Affected finishes registrations with using the known "phoneNumber"
    Then the two rows are merged into one row with status "Registered"
    And the "partner organization" is visible
    And the "imported date" is visible
    And the "created digital ID" date is visible
    And the "completed vulnerability assessment" date is visible
    And the "inclusion score" is visible

  Scenario: Person Affected registers with unknown phone number
    Normal registration (see PA-app/New_registration.feature)

  Scenario: Person Affected registers with phone number that was imported initally, but already has a connected registration
    Normal registration (see PA-app/New_registration.feature)

  Scenario: Person Affected registers with phone number that was not imported, but is already in the system
    Normal registration (see PA-app/New_registration.feature)
