@ho-portal
Feature: Export all People Affected data changes

  Background:
    Given a logged-in user with "RegistrationPersonalEXPORT" permissions

  Scenario: Export all People Affected data changes
    When the user views the "registration" page
    Then the user sees an "Export data changes" button
    When the user clicks the button
    Then a confirmation popup opens with a from and a to date
    When the user fills in from and to date (if not, then no min and max is used) and clicks 'confirm'
    Then an Excel is downloaded
    And it contains all changes to People Affected data for the given program only
    And it contains PA information (PA-id, reference-id, full name)
    And it contains data change details (changed field, old value, new value, reason, user-email of changer, timestamp of change)

