@portal
Feature: Navigate program phases

  Background:
    Given a logged-in user

  Scenario: See current phase of the program
    When the user views a "program" page
    Then the user sees a "phase-navigation-bar" with "five" possible phases of the program in the header
    And sees the "selected phase" highlighted when navigating to the progra page ths coresponds to the "current program phase"
    And sees that future phases are disabled
    And sees that past phases are enabled
    And the "move-to-next-phase" button is not visible if the user does not have the "ProgramPhaseUPDATE" permission
    And it is visible if the user has the "ProgramPhaseUPDATE" permission
    And it is enabled unless the "current program phase" is the last phase

  Scenario: View past phase
    Given the user views a "program" page
    When the user clicks one of the past phases in the "phase-navigation-bar"
    Then the color of the selected phase changes and reflects the "selected phase"
    And sees that the "move-to-next-phase"-button is disabled, reflecting the read-only mode of past phases.
    And sees that the text of the of the "move-to-next-phase"-button changes, reflecting the meaning of the phase-change.
    And sees - depending on which state - that certain program-components in the page will (dis)appear or will be dis/enabled.

  Scenario: Advancing to next phase
    Given user views a "program" page
    Given "selected phase" is equal to "current program phase"
    When user clicks the "move-to-next-phase"-button
    Then highlighting in the "phase-navigation-bar" will move to the next phase reflecting a change in both "current program phase" and "selected phase"
    And sees that the text of the of the "move-to-next-phase"-button changes, reflecting the meaning of the next phase-change.
    And sees - depending on which state - that certain program-components in the page will (dis)appear.

  Scenario: Opening a program for registration ("publishing")
    Given user views a "program" page
    Given the "current program phase" is "Design"
    Given "selected phase" is "Design"
    When user clicks the "Open for registration"-button
    Then the program will advance to the next phase (see scenario: "Advancing to next phase")
    And the program will now appear as a selectable program in the PA-app

  Scenario: Open/Close a program for registration ("publishing"/"un-publishing")
    Given user views a "program" page
    Given the "current program phase" is "Registration"
    Given "selected phase" is "Registration"
    When user clicks the "Toggle"-button against the "Program Name"
    Then the program will update to the other status
    And the program will now appear as a selectable / will not be available for registration in PA-App based on its published or unpublished status in HO-Portal.
