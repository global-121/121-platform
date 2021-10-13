@ho-portal
Feature: Navigate program phases

  Background:
    Given a logged-in user with the "run program" role

  Scenario: See current phase of the program
    When the user views a "program" page
    Then the user sees a "phase-navigation-bar" with "six" possible phases of the program in the header
    And sees the "current program phase" of the program highlighted in background-color and text-color
    And sees that future phases are disabled
    And sees that past phases are enabled
    And sees the "move-to-next-phase"-button below the header, unless the "current program phase" is the last phase
    And this button is "disabled" if the user does not have the "run program" role
    And this button is "disabled" if the "selected phase" is not the "active phase"

  Scenario: View past phase
    Given the user views a "program" page
    When the user clicks one of the past phases in the "phase-navigation-bar"
    Then the background-color of the selected phase changes and reflects the "selected phase"
    And the text-color of the previous phase remains different and reflects the "current program phase"
    And sees that the "move-to-next-phase"-button is disabled, reflecting the read-only mode of past phases.
    And sees that the text of the of the "move-to-next-phase"-button changes, reflecting the meaning of the phase-change.
    And sees - depending on which state - that certain program-components in the page will (dis)appear or will be dis/enabled.

  Scenario: Advancing to next phase
    Given user views a "program" page
    Given "selected phase" is equal to "current program phase"
    When user clicks the "move-to-next-phase"-button
    Then highlighting in the "phase-navigation-bar" will move to the next phase, both background- and text-color, reflecting a change in both "current program phase" and "selected phase"
    And sees that the text of the of the "move-to-next-phase"-button changes, reflecting the meaning of the next phase-change.
    And sees - depending on which state - that certain program-components in the page will (dis)appear.

  Scenario: Opening a program for registration ("publishing")
    Given user views a "program" page
    Given the "current program phase" is "Design"
    Given "selected phase" is "Design"
    When user clicks the "Open for registration"-button
    Then the program will advance to the next phase (see scenario: "Advancing to next phase")
    And the program will now appear as a selectable program in the PA-app

  Scenario: Publishing or Unpublishing a program for registration ("publishing")
    Given user views a "program" page
    Given the "current program phase" is "Registration"
    Given "selected phase" is "Registration"
    When user clicks the "Toggle"-button against the "Program Name"
    Then the program will update to the other status
    And the program will now appear as a selectable / will not be available for registration in PA-App based on its published or unpublished status in HO-Portal.
