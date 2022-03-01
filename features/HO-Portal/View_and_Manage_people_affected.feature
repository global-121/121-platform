@ho-portal
Feature: View and manage people affected (generic features)

  Background:
    Given a logged-in user with "RegistrationREAD" permission

  Scenario: View people affected connected to a program
    When the user views a page with the "manage people affected" component
    Then a table with all "people connected to a program" is shown
    And for each person the "Select" column is empty
    And for each person a "PA identifier" is shown
    And it has a clickable "i" button in front of it, which opens a popup
    And depending on which "page" other columns are shown (see detailed scenarios below)
    And above the table a list of "bulk actions" is shown
    And next to it an "apply action" button is shown and it is "disabled"
    And above the table a free text "filter field" is shown
  
  Scenario: View columns of table WITHOUT access to personal data
    When the user views the PA-table
    Then the users sees the columns mentioned in the previous scenario
    And for each person a "status" is shown
    And all above columns are fixed when scrolling horizontally
    And depending on which "page" several "status change date" columns are shown
    And "transfer value" column is shown
    And "inclusion score" column is shown (if "validation" is configured for the program)
    And "financial service provider" column is shown (in "reviewInclusion" and "payment" pages only)
    And "payment columns" are shown (in "payment" page only)

  Scenario: View columns of table WITH access to personal data
    Given the logged-in user also has "RegistrationPersonalREAD" permission
    When the user views the PA-table
    Then the user sees all columns available in previous scenario
    And the "i" button in front of the "PA identifier" contains a "note icon" if a note is saved for that PA 
    And for each person a "name" is shown
    And for each person a "phone number" is shown
    And all above columns are fixed when scrolling horizontally
    And "custom attribute" columns are shown
    And some other hard-coded columns such as "vnumber" and "whatsappPhoneNumber" are shown if available
  
  Scenario: Edit boolean custom attributes in PA table
    Given the logged-in user also has "RegistrationAttributeUPDATE" permission
    Given the logged-in user is viewing the PA-table
    When the user clicks one of the "custom attribute" columns with type 'boolean'
    Then the clicked "custom attribute" is updated
    And the updated value is reflected in the PA-table

  Scenario: Filter rows of PA-table
    Given the table with all "people connected to a program" is shown
    When the user enters any free text "abc" in the "filter field"
    Then the table immediately updates to show only rows where at least one case of "abc" is found as substring in any of the columns
    When the user removes the text again or presses the "X" close option
    Then the table shows all rows again

  Scenario: View available actions
    When the user opens up the "choose action" dropdown
    Then a list appears with available "bulk actions"
    And this is dependent on the currently logged-in "user" and "active phase" of the program

  Scenario: Select "bulk action" while rows eligible
    Given at least 1 person is eligible for the "bulk action"
    When the user selects a "bulk action"
    Then the dropdown now shows the name of the "bulk action" instead of "choose action"
    And the "apply action" button is "enabled"
    And a "row checkbox" appears in the "select" column for eligible rows
    And a "header checkbox" appears in the "select" column

  Scenario: Select "bulk action" while no rows eligible
    Given no people are eligible for the "bulk action"
    When the user selects a "bulk action" from the dropdown
    Then a popup with the message "no people are eligible" is shown
    And the dropdown is reset to the default "choose action" option

  Scenario: Sort people enrolled in a program by property(score, creation-date, update-date)
    Given a table with all "people connected to a program" is shown
    When the user clicks a column-header
    Then the rows show in "ascending, descending or initial" order

  Scenario: Select a row
    Given a "bulk action" is selected
    And "row checkboxes" have appeared for eligible rows
    And all "row checkboxes" are unchecked
    When the "user" clicks on the checkbox
    Then the row styling reflects selection by turning "blue"
    And the footer shows an updated number of selected people

  Scenario: Select all rows given no row selection
    Given a "bulk action" is selected
    And the "header checkbox" has appeared
    And the "header checkbox" is unchecked
    When the "user" checks the "header checkbox"
    Then all "row checkboxes" are selected and the "header checkbox" is selected
    When the "user" un-checks the "header checkbox"
    Then all "row checkboxes" are selected and the "header checkbox" is selected

  Scenario: Deselect all rows given full selection
    Given current "full" selection
    When unchecking "header checkbox"
    Then all "row checkboxes" are unchecked

  Scenario: Select all rows given partial selection
    Given current "partial" selection
    When user checks "header checkbox"
    Then all "row checkboxes" are checked

  Scenario: Unselect row given full selection
    Given current "full" selection
    When user un-checks single "row checkbox"
    Then the "header checkbox" also un-checks

  Scenario: Select row given (N-1) selection
    Given currently all eligible rows except 1 are selected
    When user checks last eligible row through "row checkbox"
    Then "header checkbox" also automatically checks

  Scenario: Apply action without SMS-option
    Given a "bulk action" is selected
    And 0 or more rows are selected
    And there is no custom-SMS option for this action
    When "user" clicks "apply action"
    Then a popup appears which lists which "bulk action" will be applied to "how many" people affected
    And it has a "confirm" button and a "cancel" button

  Scenario: Apply action with SMS-option
    Given a "bulk action" is selected
    And 0 or more rows are selected
    And there is a custom-SMS option for this action
    When "user" clicks "apply action"
    Then a popup appears which lists which "bulk action" will be applied to "how many" people affected
    And it has a checkbox that allows to choose whether to send a Custom SMS with this action
    And it is checked by default or not based on the action
    And - if checked by default or manually- it shows a free text field to enter the message
    And it shows a character counter
    And it has a "confirm" button, which is disabled if checkbox is checked AND the entered text is below 20 characters
    And it has a "cancel" button

  Scenario: Confirm apply action
    Given the confirm popup has appeared
    When "user" clicks confirm
    Then the popup disappears
    And the "changed data" is reflected in the table
    And the "action" dropdown is reset
    And the "apply action" is "disabled" again
    And all "row checkboxes" and "header checkbox" disappear
    And - if the action has an SMS-action and it is used - an SMS is sent to the PA

  Scenario: View and Filter PA-table with 2000 PAs
    Given there are 2000 PAs in the system (see Admin-user/Import_test_registrations_NL.feature)
    When the user scrolls through the PA-table
    Then this goes quickly and without problem
    When the user uses the filter function
    Then the PA-table updates to only filtered rows quickly and without problem
