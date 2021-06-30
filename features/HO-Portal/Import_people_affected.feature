@ho-portal
Feature: Import people affected

  Background:
    Given a logged-in user with either the "run program" or the "personal data" role
    Given the "selected phase" is "Registration (& Validation)"

  Scenario: Open Import People Affected popup
    When the user clicks the "Import People Affected" button
    Then a popup opens with a radio-button with 2 options
    And the 1st option is 'Import people affected'
    And the 2nd option is 'Import registered people affected'
    And it has a 'Download template' button
    And it shows a "choose file" button
    And it can also be used to drag and drop the file
    And it shows a disabled "OK" button
    And it shows a "Cancel" button
  
  Scenario: Import people Affected > See SECTION 1

  Scenario: Import registered people Affected > See SECTION 2
  
----------------------------------------------------------------------------------------------------
SECTION 1: Import People Affected (to invite)

  Background:
    Given the user has opened the "Import people affected" popup
    And the user has selected the "import people affected" option

  Scenario: Download template for import
    When the user clicks 'Download template' 
    Then a CSV-file is downloaded
    And it contains only a row of column names
    And it contains the columns "phoneNumber", "namePartnerOrganization" and "paymentAmountMultiplier"

  Scenario: Successfully Import People Affected
    Given a valid import CSV file is prepared
    And it has columns "phoneNumber", "namePartnerOrganization" and "paymentAmountMultiplier"
    And it has as delimiter ";" or "," 
    And the "paymentAmountMultiplier" column has only positive integers as values
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
    When the user selects an invalid CSV-file (wrong extension, wrong column names, wrong delimiter, wrong input values, etc.)
    Then the "OK" button becomes enabled
    When the user presses "OK"
    Then a feedback popup appears that "Something went wrong with the export" and it explains possible reasons

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

----------------------------------------------------------------------------------------------------
SECTION 2: Import registered People Affected

  Background:
    Given the user has opened the "Import people affected" popup
    And the user has selected the "import registered people affected" option

  Scenario: Download template for import registrations
    When the user clicks 'Download template' 
    Then a CSV-file is downloaded
    And it contains only a row of column names
    And it contains the generic column names "namePartnerOrganization", "preferredLanguage", "phoneNumber", "fspName"
    And it has program-dependent columns (for NL-LVV: "whatsappPhoneNumber", "nameFirst", "nameLast", "vnumber"

  Scenario: Successfully import registrations via CSV 
    Given a valid import CSV file is prepared based on the template
    And it has generic columns "namePartnerOrganization", "preferredLanguage", "phoneNumber", "fspName"
    And it has program-dependent columns (for NL-LVV: "whatsappPhoneNumber", "nameFirst", "nameLast", "vnumber"
    And it has as delimiter ";" or ","
    And it has "X" rows 
    And the input of each cell is valid 
    When the user clicks 'import'
    Then feedback "Imported X PAs with status registered" is given
    And the PA-table in the HO-portal shows "X" new rows of PAs
    And they have status "Registered" 
    And all other columns are filled as if a real registration was done
    And no SMS is sent to the PA unlike a real registration
    And in the AW-app the validation data for these PAs can be downloaded

  Scenario: Unsuccessfully import test registrations via CSV
    Given an invalid import CSV file (wrong column names, unallowed values, etc.)
    When the user selects this file and clicks 'import'
    Then feedback is given that something went wrong and it gives details on where the error is, mainly if in a generic column
    And there is no input validation on the dynamic columns 
