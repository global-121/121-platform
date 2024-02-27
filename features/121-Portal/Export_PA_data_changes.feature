@portal
Feature: Export all People Affected data changes

  Background:
    Given a logged-in user with "RegistrationPersonalEXPORT" permissions
    Given the user views a page with "PA-table"

  Scenario: Export all People Affected data changes
    When the user clicks the "Export" button
    Then the user sees "Export data changes" as one of the options
    When the user clicks it
    Then a confirmation popup opens with a start-date and an end-date
    When the user fills in start and/or end date (if not, then no min and max is used) and clicks 'confirm'
    Then an Excel is downloaded
    And it contains all FSP and data changes to People Affected data for the given program and within the provided dates (if any)
    And it contains PA information (paId, referenceId)
    And it contains data change details (type, fieldName, newValue, oldValue, reason, changedBy, changedAt)
    And for data changes related to FSP-change the reason shows 'Financial service provider change'
    And if scope is enabled for this program, the resulting Excel only contains data changes for the logged-in user's scope

