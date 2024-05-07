@portal
Feature: Import registrations with status registered

  Background:
    Given a logged-in user with the "RegistrationCREATE" and "RegistrationImportTemplateREAD" permissions
    Given the "selected phase" is "registrationValidation"
    Given the user clicks the "Import registrations" button

  Scenario: Download template for import registrations
    When the user clicks the "Download template CSV-file" button
    Then a CSV-file is downloaded
    And it contains 1 row of column names
    And it contains the generic column names "phoneNumber", "preferredLanguage", "fspName", "paymentAmountMultiplier"
    And it has dynamic "programCustomAttributes" of that program
    And it has the dynamic columns for programQuestions of that program

    When the program is not configured with a paymentAmountMultiplierFormula
    Then it contains the column "paymentAmountMultiplier" after the "fspQuestions"

    When the program has scope enabled
    Then it contains the column scope

  Scenario: Successfully import registrations via CSV
    Given a valid import CSV file is prepared based on the template
    Given - if program and user have a scope - the file only contains records within the scope of the user
    And it has generic columns "preferredLanguage", "phoneNumber", "fspName"
    And it has the dynamic columns for programQuestions of that program
    And it has the dynamic "programCustomAttributes" of that program
    And it has as delimiter ";" or ","
    And it has "X" rows
    And the input of each cell is valid
    When the user clicks "OK" to confirm the import
    Then it shows the number "X" of successfully imported registrations
    And the PA-table in the Portal shows "X" new rows of PAs
    And they have status "Registered"
    And all other columns are filled as if a real registration was done
    And - if configured for the program - the "paymentAmountMultiplier" is calculated based on formula
    And no SMS is sent to the PA

  Scenario: Unsuccessfully import registrations via CSV
    Given an invalid import CSV file because of
    - wrong file format/extension
    - wrong column names
    - disallowed values
    - registrations outside the scope of the user
    - empty phonenumber while the program disallows that
    - duplicate referenceIds in import-file
    - referenceId already exists
    - etc.
    When the user selects this file and clicks "OK" to confirm the import
    Then feedback is given that something went wrong and it gives details on where the error is, mainly if in a generic column
    And there is no input validation on the dynamic columns
