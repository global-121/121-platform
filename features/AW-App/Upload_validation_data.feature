@aw-app
Feature: Upload validation data

  Background:
    Given a logged-in user with "RegistrationPersonalUPDATE" permission
    Given the user is on the "actions" page

  Scenario: Validated data to upload available
    Given validated data for at least "1" PA is available
    When the user sees the "main menu"
    Then a label with value "1" is shown in the "upload validation data"-option

  Scenario: No validated data to upload available
    Given no validated data is available
    When the user sees the "main menu"
    Then the "Upload validation data" option is disabled
    And no label with value is shown in the the "upload validation data"-option

  Scenario: Validated data to upload available, but no internet connection
    Given validated data for at least "1" PA is available
    And there is no internet connectivity
    When the user sees the "main menu"
    Then a label with value "1" is shown in the "upload validation data"-option
    And the "Upload validation data" option is disabled
    And an "OFFLINE" marker is shown in the header

  Scenario: Upload validation data
    Given there is internet connectivity
    Given validated data for at least "1" PA is available
    Given the "main menu" is shown
    When the user presses "upload validation data"
    Then a message is showing that "Validation data is being uploaded"
    When it finishes
    Then a positive feedback message is shown
    And the "main menu" component is shown
    And the "upload validation data" component is now disabled
    And it has no numbered label attached anymore
    And the status of the PA in the HO-portal is updated to "Validated"
    And the inclusion score is recalculated
    And - if configured for the program - the "paymentAmountMultiplier" is recalculated based on formula 

  Scenario: Upload validation data unsuccessfully

  Scenario: Upload validation data with changed answers that would lead to a different inclusion score
