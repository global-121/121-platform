@ho-portal
Feature: Export inclusion list

  Scenario: Viewing the export options as program-manager
    Given a logged-in "program-manager" user
    When the user views the "review inclusion" page
    Then the user sees an "export inclusion list" button
    And this button is only enabled when the "review inclusion" phase is the "active" phase

  Scenario: Export inclusion list
    When the user clicks the "export inclusion list" and confirms the confirm prompt
    Then a CSV-file is downloaded
    And it shows a list of the connections that are "included"
    And it shows the "name" and "dob" to be able to identify people
    And it shows the dates at which the person reached each status, to be able to assess the trajectory towards inclusion
    And the "export inclusion list" button remains enabled, so the action can be repeated infinitely
    And if no "included" connections then an alert is shown that "no data can be downloaded"
  
  Scenario: Export inclusion list with 2000 PAs
    Given there are 2000 PAs in the system (see Admin-user/Import_test_registrations_NL.feature)
    And they are included (see e.g. HO-Portal/Include_people_affected_Run_Program_role.feature)
    When the user clicks the "export inclusion list" and confirms the confirm prompt
    Then a CSV-file is downloaded as in the scenario above quickly and without problem 

  Scenario: Viewing the export options as project-officer
    Given a logged-in "project-officer" user
    When the user views the "review inclusion" page
    Then the export list button is disabled
