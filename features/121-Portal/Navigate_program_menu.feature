@portal
Feature: Navigate program menu

  Background:
    Given a logged-in user

  Scenario: See dashboard page
    Given the user views a "program" page that is not the "Dashboard" page
    When the user clicks the "Dashboard" menu option
    Then the user sees the "Dashboard" page

  Scenario: See team page
    Given the user views a "program" page that is not the "Team" page
    Given the user has the "AidWorkerProgramREAD" permission
    When the user clicks the "Team" menu option
    Then the user sees the "Team" page

  Scenario: No permission to see team page
    Given the user does not have the "AidWorkerProgramREAD" permission
    When the user views a "program" page that is not the "Team" page
    Then the user sees a disabled "Team" menu option they cannot click

  Scenario: See current phase of the program
    When the user views a "program" page
    Then the user sees a "phase-navigation-bar" with "five" possible phases of the program in the header
    And sees the "selected phase" highlighted
    And sees that future phases are disabled
    And sees that past phases are enabled

  Scenario: View past phase
    Given the user views a "program" page
    When the user clicks one of the past phases in the "phase-navigation-bar"
    Then the color of the selected phase changes and reflects the "selected phase"
    And sees that the "move-to-next-phase"-button is disabled, reflecting the read-only mode of past phases.
    And sees - depending on which state - that certain program-components in the page will (dis)appear or will be dis/enabled.

  Scenario: Option to advance to next phase
    Given the user has the "ProgramPhaseUPDATE" permission
    Given the "current program phase" is the "selected phase"
    When the user views a "program" page
    Then the "move-to-next-phase" button is shown
    And the "move-to-next-phase" button is enabled

  Scenario: Option to advance to next phase not available
    Given the user does not have the "ProgramPhaseUPDATE" permission
    When the user views a "program" page
    Then the "move-to-next-phase" button is not shown

  Scenario: Advancing to next phase
    Given the user has the "ProgramPhaseUPDATE" permission
    Given user views a "program" page
    Given "selected phase" is equal to "current program phase"
    When user clicks the "move-to-next-phase"-button
    Then the program page corresponding to the new "program phase" is shown as the "selected phase"
    And sees - depending on which state - that certain program-components in the page will (dis)appear.

  Scenario: Opening a program for registration ("publishing")
    Given user views a "program" page
    Given the "current program phase" is "Design"
    Given "selected phase" is "Design"
    When user clicks the "Open for registration"-button
    Then the program will advance to the next phase (see scenario: "Advancing to next phase")

  Scenario: Open/Close a program for registration ("publishing"/"un-publishing")
    Given user views a "program" page
    Given the "current program phase" is "Registration"
    Given "selected phase" is "Registration"
    When user clicks the "Allow new registrations"-toggle button
    Then the program will update to the "published/unpublished" state
