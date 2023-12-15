@portal
Feature: Export all People Affected data changes

  Background:
    Given a logged-in user with "RegistrationPersonalEXPORT" permissions

  Scenario: Export all People Affected data changes
    When the user views the "registration" page
    Then the user sees an "Export data changes" button
    When the user clicks the button
    Then a confirmation popup opens with a start date and an end date
    When the user fills in start and/or end date (if not, then no min and max is used) and clicks 'confirm'
    Then an Excel is downloaded
    And it contains all changes to People Affected data for the given program and within the provided dates (if any)
    And it contains PA information (paId, referenceId, fullName)
    And it contains data change details (fieldName, oldValue, newValue, reason, changedBy, changedAt)
    And if scope is enabled for this program, the resulting Excel only contains data changes for the logged-in user's scope

