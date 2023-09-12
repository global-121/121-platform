@ho-portal

Background:
    Given user is on Users page

Scenario: View "See users" page
Given user is on Users page
Given Users tab is open
When Details are displayed in table in order (Username, User type, Status, Last activity)
Then under username user emails are displayed
And possible User types are Admin and Regular
And status can be Active
And user clicks on "Username" users are sorted by emails alphabetically
And user clicks on "User type" users are sorted by user types alphabetically
And user clicks on "Status" users are sorted by status alphabetically
And user clicks on "Last activity" users are sorted by earliest date
And above users table on the left side filtering field is displayed
And on the right side on top of user table "Add new user" button is displayed

Scenario: Add New Team member
When User clicks on "Add new user" button
And pup-up is displayed
Then user enter team members email
And Selects User type for team member
Then Clicks on "Add" butto
And Notification with "You've succsessfully added a team member" message is displayed
And user clicks on "X" on popup
And Popup is closed

Scenario: Edit Team members User type
Given There is a team member on the list
When User clicks on Three dot icon on the right side of row where team member is displayed
And Meatball menu is displayed
And User clicks on "Edit user"
Then pop-up is displayed
And user is not able to edit email
And User changes User type of team member
And click "Save" button
Then "You've succsessfully edited User type"
And user clicks on "X" on popup
And Popup is closed

Scenario: Remove team member
Given There is a team member on the list
When User clicks on Three dot icon on the right side of row where team member is displayed
And Meatball menu is displayed
And User clicks on "Remove user"
And warning message is displayed
And user clicks on "Remove"
Then "You've succsessfully removed a team member" message is displayed
And user clicks on "X" on popup
And Popup is closed

Scenario:View roles permissions tab
When User clicks on "Roles and permissions" tab
And User types are displayed
And Under user types nine permission checkboxes are displayed
And permissions in first column are View, Allow to use validation app, View all information people affected
And permissions in second column are Manage people affected, Manage payment, move the program to the next phase
And permissions in third column are Add/delete team member, Open/Close registration, Import/export data
Then Admin user has all the permissions checked
And "Add new role" button is displayed

Scenario: Delete role
When User clicks on "Roles and permissions" tab
And On the right side of User types delete icon is displayed
And user clicks on delete icon
And popup is displayed with notification "Are you sure you want to delete this role?"
Then user clicks on delete button
And "The Role was deleted succsessfully" notification is displayed

Scenario: Change permissions to existing role
When User clicks on "Roles and permissions" tab
And user types are displayed
And checkboxes with permissions are displayed
And user clicks on any sheck box
Then Save button is displayed on the right side of delete icon
And when user clicks on it
Then popup window is displayed
And "The role was edited successfully" notification is displayed