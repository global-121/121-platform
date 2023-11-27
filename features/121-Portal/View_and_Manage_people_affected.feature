@portal
Feature: View and manage people affected (generic features)

  Background:
    Given a logged-in user with "RegistrationREAD" permission
    Given a chosen "program"

  Scenario: View People Affected table
    When the user views a page with the "PA table"
    Then a table with all PAs of that program is shown
    And depending on the "selected phase" only current people affected with given "PA statuses" are shown (see Scenario: Filter rows of PA-table by People Affected status)
    And for each person the "Select" column is empty
    And for each person a "PA identifier" is shown and this is an auto-increment number per registration starting from 1 per program
    And it has a clickable "i" button in front of it, which opens a popup
    And depending on the "selected phase" other columns are shown (see detailed scenarios below)
    And above the table a list of "bulk actions" is shown
    And next to it an "apply action" button is shown and it is "disabled"
    And above the table a free text "filter field" and a dropdown for "status filter" are shown

  Scenario: View columns of table WITHOUT access to personal data
    When the user views the PA-table
    Then the users sees the columns mentioned in the previous scenario
    And for each person a "status" is shown
    And all above columns are fixed when scrolling horizontally
    And "transfer value" column is shown
    And "inclusion score" column is shown (if "validation" is configured for the program)
    And "financial service provider" column is shown
    And "payment history" is shown (in "payment" page only)

  Scenario: View payment history column and popup
  >> See View_payment_history_popup.feature

  Scenario: View columns of table WITH access to personal data
    Given the logged-in user also has "RegistrationPersonalREAD" permission
    When the user views the PA-table
    Then the user sees all columns available in previous scenario
    And the "i" button in front of the "PA identifier"
    And for each person the columns that make up the "name" are shown
    And for each person a "phone number" is shown
    And all above columns are fixed when scrolling horizontally
    And "custom attribute" columns are shown if configured to be showing for that phase
    And "program questions" are shown if configured to be showing for that phase
    And "fsp questions" are shown if configured to be showing for that phase

  Scenario: Edit boolean custom attributes in PA table
    Given the logged-in user also has "RegistrationAttributeUPDATE" permission
    When the user clicks one of the "custom attribute" columns with type 'boolean'
    Then the clicked "custom attribute" is updated
    And a popup with 'update successful' appears

  Scenario: Filter rows of PA-table by People Affected status
    Given the table with all "people affected" relevant to the selected program phase is shown
    When the user clicks on the "status" button above the table
    Then a dropdown with all the possible statuses appears
    And only the statuses relevant to the current phase are selected
    - "registration": imported, invited, created, registered, selected for validation, no longer eligible, registered while no longer eligible
    - "inclusion": registered, selected for validation, validated, rejected, inclusion ended
    - "payment": included
    When the user makes a different selection of statuses
    And the user clicks on "apply"
    Then the table immediately updates to show only rows that match the status selection
    When the user clicks on "cancel"
    Then the table keeps the row that matched the previous status selection

  --- Filter PA-table START ---

  Scenario: Filter rows of PA-table by one filterable column
    Given the table with all "people affected" relevant to the selected program phase is shown
    When the user clicks on the "select column" filter dropdown above the table
    Then a dropdown with all the filterable columns appears
    And the dropdown contains a search bar to search the columns to filter
    When the user makes a selection
    Then a text field appears on the right of the dropdown
    And if its a "numeric" field then only numeric characters are allowed, otherwise all is allowed
    When the user writes the value of the filter
    Then the "apply filter" button is enabled
    When the user clicks on "apply filter" or presses the "enter" button on the keyboard
    Then the value is used on the selected column to filter the table
    And a text showing the number of "fitered recipients" appears below the dropdown
    And a chip showing the selected column and the filter value appears next to it on the right
    And on the right side of the page the "clear all filters" button appears
    And the dropdown is reset to an empty selection
    And the search bar and the "apply filter" button disappear

  Scenario: Filter rows of PA-table by multiple filterable columns
    Given the table has been filtered for one column already
    When the user selects another column and applies the filter
    Then the already filtered table is additionally filtered by this second filter
    And the "filtered recipients" count updates according to the two filters applied
    And a second chip showing column and value appears next to the previous one
    And the filter row above is reset again

  Scenario: Remove one column filter from the PA-table
    Given there is at least one column filter applied to the table
    When the user clicks on the "x" inside one of the applied filter chips
    Then the filter is removed from the table
    And the chip disappears
    And if there is still one column filter applied, the "filtered recipients" count is updated

  Scenario: Remove all column filters from the PA-table
    Given there is at least one column filter applied to the table
    When the user clicks "x" on the last chip remaining or clicks on "clear all filters"
    Then all filters are removed from the table
    And all chips disappear
    And the "filtered recipient" count disappears

  --- Filter PA-table END ---

  Scenario: Show People Affected of all phases
    Given the table with all "people affected" relevant to the selected program phase is shown
    And the user has opened the "status" dropdown filter
    And an option to select "all" is on top of the list
    And the option is not checked
    When the user selects "all"
    Then all the statuses are selected
    When the user clicks on "apply"
    Then the table will now show all "people affected", also those from other phases
    And - if done while the filter text field contains text - then the filtered text keeps being applied
    When the user deselect "all"
    Then the table will not show any "people affected"

  Scenario: View available actions
    When the user opens up the "choose action" dropdown
    Then a list appears with available "bulk actions"
    And it is dependent on permissions of the currently logged-in "user"
    And it is dependent on "selected phase" of the program
  - registration: invite / mark as no longer eligible / select for validation / send message / delete PA
  - inclusion: include / reject / send message / delete PA
  - payment: include / reject / end inclusion / pause / send message / do payment

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
    And there are no visible checkboxes in the table
    And the user selects the "selet-all" checkbox
    Then a popup with the message "no people are eligible" is shown
    And the dropdown is reset to the default "choose action" option

  Scenario: Sort people enrolled in a program by property(score, creation-date, update-date)
    When the user clicks a column-header
    Then the rows show in "ascending or descending" order

  Scenario: Select a row
    Given a "bulk action" is selected
    And "row checkboxes" have appeared for eligible rows
    And all "row checkboxes" are unchecked
    When the "user" clicks on the checkbox
    Then the 'Apply action' button becomes enabled

  Scenario: Select all rows given no row selection
    Given a "bulk action" is selected
    And the "header checkbox" has appeared
    And the "header checkbox" is unchecked
    When the "user" checks the "header checkbox"
    Then all "row checkboxes" are selected and the "header checkbox" is selected

  Scenario: Deselect all rows given full selection
    Given current "full" selection
    When unchecking "header checkbox"
    Then all "row checkboxes" are unchecked

  Scenario: Select all rows given partial selection
    Given 1 "row checkbox" is selected
    When user checks "header checkbox"
    Then all "row checkboxes" are checked

  Scenario: Apply action without message-option
    Given a "bulk action" is selected
    And 0 or more rows are selected
    And there is no custom-SMS option for this action
    When "user" clicks "apply action"
    Then a popup appears which lists which "bulk action" will be applied to "how many" people affected
    And it has a "confirm" button and a "cancel" button

  Scenario: Apply action with message-option
    Given a "bulk action" is selected
    And 0 or more rows are selected
    And there is a custom-SMS option for this action
    When "user" clicks "apply action"
    Then a popup appears which lists which "bulk action" will be applied to "how many" people affected
    And it has a checkbox that allows to choose whether to send a Custom SMS with this action
    And it is checked by default or not based on the action
    - default yes for: invite, reject, end inclusion, send message
    - default no for: include
    - SMS not an option for: select for validation, mark as no longer eligible, delete PA
    And - if checked by default or manually - it shows a templated message if one is present otherwise it shows a free text field to enter the message
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

  Scenario: View and Filter PA-table with 100000 PAs
    Given there are 100000 PAs in the system
    When the user clicks through the PA-table
    Then this goes quickly and without problem
    When the user uses the text or status filter functions
    Then the PA-table updates to only filtered rows quickly and without problem

  Scenario: View Message History
>> This is tested with Cypress. See message-history.cy.ts
