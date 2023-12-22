  @portal

  Background:
    Given the user has the "AidWorkerProgramREAD" permission

  Scenario: View "Team Members"
    When user is on Team Members page
    Then details are displayed in table in order (Name, Role, Status, Scope - if enabled -, Last login)
    And possible Roles can be configured per program
    And status can be Active
    And last login is displayed in format (dd/mm/yyyy) or empty
    And each row has a 3 dot icon on the right side
    And when user clicks on a sortable column users are sorted alphabetically or numerically
    And on the right side on top of user table "Add team member" button is displayed

  Scenario: Add New Team member
    Given the user has the "AidWorkerProgramUPDATE" permission
    When User clicks on "Add team member" button
    Then a pop-up is displayed
    When the user enters team members email
    And Selects Role for team member by clicking on check boxes
    And - if Scope is enabled - fills in the Scope
    Then Clicks on "Add" butto
    And Notification with "You've succsessfully added a team member" message is displayed
    And user clicks on "X" on popup
    And Popup is closed

  Scenario: No permission to add New Team member
    Given the user does not have the "AidWorkerProgramUPDATE" permission
    When user is on Team Members page
    Then the user sees a disabled "Add new user" menu option they cannot click

  Scenario: Edit Team members
    Given There is a team member on the list
    Given the user has the "AidWorkerProgramUPDATE" permission
    When User clicks on Three dot icon on the right side of row where team member is displayed
    And Meatball menu is displayed
    And User clicks on "Edit"
    Then pop-up is displayed
    And user is not able to edit email
    And User changes Role of team member by clicking on checkboxes
    And - if Scope is enabled - user updates the Scope
    And clicks "Save" button
    Then "You've succsessfully edited the role(s) of this user"
    And user clicks on "X" on popup
    And Popup is closed

  Scenario: Remove team member
    Given There is a team member on the list
    Given the user has the "AidWorkerProgramUPDATE" permission
    When User clicks on Three dot icon on the right side of row where team member is displayed
    And Meatball menu is displayed
    And User clicks on "Remove user"
    And warning message is displayed
    And user clicks on "Remove"
    Then "You've succsessfully removed this team member" message is displayed
    And user clicks on "X" on popup
    And Popup is closed

  Scenario: No permission to edit and remove team member
    Given the user does not have the "AidWorkerProgramUPDATE" permission
    When There is a team member in the list
    Then the user sees a disabled 3 dot icon on the right side of the row they cannot click

  Scenario: View error messages
    Given user clicks on Add user button
    And popup window is displayed
    When user that has already been added
    Then error message "This user is already a team member." is displayed
    And when email is changed to valid open
    And user does not assign at least one role
    Then error message "Please assign at least one role." is displayed
