@ho-portal
Feature: Export selected for validation list

  Scenario: Viewing the export options as program-manager
    Given a logged-in "program-manager" user
    When the user views the "registration & validation" page
    Then the user sees an "export list: selected for validation" button per installment
    And this button is only enabled when the "registration & validation" phase is the "active" phase

  Scenario: Export selected for validation list
    When the user clicks the "export list: selected for validation" and confirms the confirm prompt
    Then a csv is downloaded 
    And it shows a list of the connections that are "selected for validation"
    And it shows the "name" and "dob" and "phonenumber" to be able to identify people
    And it shows the dates at which the person reached each status, to be able to assess the trajectory towards "selected for validation"
    And the "export list" button remains enabled, so the action can be repeated infinitely
    And if no "selected for validation" connections then an alert is shown that "no data can be downloaded"

  Scenario: Viewing the export options as project-officer
    Given a logged-in "project-officer" user
    When the user views the "review inclusion" page
    Then the export list buttton is disabled
