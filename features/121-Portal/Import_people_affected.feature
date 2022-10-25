@ho-portal
Feature: Import people affected

  Background:
    Given a logged-in user with the "RegistrationCREATE" and "RegistrationImportTemplateREAD" permissions
    Given the "selected phase" is "Registration (& Validation)"

  Scenario: Download template for import
    Given the user clicks the "Import People Affected" button
    When the user clicks the "Download template CSV-file" button
    Then a CSV-file is downloaded
    And it contains 1 row of column names
    And it contains the column "phoneNumber"
    And the dynamic "programCustomAttributes" of that program

    When the program is not configured with a paymentAmountMultiplierFormula
    Then it contains the column "paymentAmountMultiplier" after the column "phoneNumber"

  Scenario: Successfully Import People Affected
    Given a valid import CSV file is prepared
    And it has columns "phoneNumber", and "paymentAmountMultiplier"
    And the dynamic "programCustomAttributes" of that program
    And it has as delimiter ";" or ","
    And the "paymentAmountMultiplier" column has only positive integers as values
    Given the user clicks the "Import People Affected" button
    When the user selects the CSV-file, through 'choose file' or 'drag and drop'
    Then the "OK" button becomes enabled

    When the user clicks "OK" to confirm the import
    Then a loading spinner appears

    When it is finished
    Then a feedback popup appears
    And it shows the number of successfully imported "phoneNumbers"
    And it shows the number of "phoneNumbers" that were already present in the system
    And it shows the number of invalid "phoneNumbers"
    And it shows an "OK" button
    And it mentions that a CSV is automatically downloaded with the import-result per row.
    And a download window for this CSV is appearing
    And the CSV contains the following columns "phoneNumber", "paymentAmountMultiplier", a column per custom attribute in the program, "importStatus", "registrationStatus"

    When the users clicks "OK" on the popup
    Then the popup disappears
    And the page refreshes
    And the PA-table now shows new rows equal to the number of successfully imported "phoneNumbers"
    And they have status "Imported"
    And the Imported date is filled in

  Scenario: Unsuccessfully import invalid CSV file
    Given the user clicks the "Import People Affected" button
    When the user selects an invalid CSV-file (wrong extension, wrong column names, wrong delimiter, wrong input values, etc.)
    Then the "OK" button becomes enabled
    When the user clicks "OK" to confirm the import
    Then a feedback popup appears that "Something went wrong with the export" and it explains possible reasons

  Scenario: Person Affected registers with imported phone number
    Given a "phoneNumber" is successfully imported
    And there has been no registration with this "phoneNumber" yet (from after the import)
    And a note was created
    When a new Person Affected starts registrations with this "phoneNumber" (see PA-app/New_registration.feature)
    Then a new row with status "Created" is shown in the PA-table in HO-portal
    and the row with status "Imported" is also still shown, because without the phone-number the system cannot know yet they belong together
    When the Person Affected finishes registrations with using the known "phoneNumber"
    Then the two rows are merged into one row with status "Registered"
    And the "programCustomAttributes" are visible
    And the "imported date" is visible
    And the "created digital ID" date is visible
    And the "completed vulnerability assessment" date is visible
    And the "inclusion score" is visible
    And the "note" is visible

  Scenario: Person Affected registers with unknown phone number
      """
      Normal registration (see PA-app/New_registration.feature)
      """

  Scenario: Person Affected registers with phone number that was imported initially, but already has a connected registration
      """
      Normal registration (see PA-app/New_registration.feature)
      """

  Scenario: Person Affected registers with phone number that was not imported, but is already in the system
      """
      Normal registration (see PA-app/New_registration.feature)
      """
