# Features

<!-- TOC: -->

- [Features](#features)
  - [All features / scenario's](#all-features--scenarios)
    - [For Aid Workers](#for-aid-workers)
      - [Using 121-Portal](#using-121-portal)
      - [Using AW-App](#using-aw-app)
      - [Using 3rd party systems](#using-3rd-party-systems)
    - [For Person/People Affected](#for-personpeople-affected)
      - [Using PA-App](#using-pa-app)
      - [Using external tools/applications](#using-external-toolsapplications)
    - [For Admin-user](#for-admin-user)
      - [Using Swagger UI](#using-swagger-ui)
    - [Automated processes (121-service)](#automated-processes-121-service)
  - [Reference](#reference)
  - [Tools](#tools)
  - [How to describe features / define scenarios](#how-to-describe-features--define-scenarios)

---

## All features / scenario's

Features of the 121-platform are described in this folder in a standardized way using the [Gherkin-language](https://cucumber.io/docs/gherkin/).

### For Aid Workers

#### Using 121-Portal

- [View dashboard page](121-Portal/View_dashboard_page.feature)
- [Manage team members](121-Portal/Manage_team_members.feature)
- [View and Manage people affected](121-Portal/View_and_Manage_people_affected.feature)
- [View payment history popup](121-Portal/View_payment_history_popup.feature)
- [Edit information of Person Affected](121-Portal/Edit_Info_Person_Affected.feature)
- [Import registrations as registered](121-Portal/Import_as_registered.feature)
- [Import registrations as imported](121-Portal/Import_as_imported.feature)
- [Invite people affected](121-Portal/Invite_people_affected.feature)
- [Delete people affected](121-Portal/Delete_people_affected.feature)
- [Mark as no longer eligible](121-Portal/Mark_as_no_longer_eligible.feature)
- [Import registered people affected](121-Portal/Import_people_affected.feature#L83)
- [Export People Affected](121-Portal/Export_people_affected.feature)
- [Export PA data changes](121-Portal/Export_PA_data_changes.feature)
- [Include people affected](121-Portal/Include_people_affected.feature)
- [Reject or End Inclusion of people affected](121-Portal/Reject_or_End_inclusion_people_affected.feature)
- [Export duplicate People Affected list](121-Portal/Export_duplicate_people_affected_list.feature)
- [Make a new payment](121-Portal/Make_new_payment.feature)
- [View last payment overview](121-Portal/View_last_payment_overview.feature)
- [Export payment details](121-Portal/Export_Payment_Details.feature)
- [Manage payment via import and export](121-Portal/Manage_payment_via_import_and_export.feature)
- [Export unused vouchers](121-Portal/Export_unused_vouchers.feature)
- [Export Intersolve Visa cards](121-Portal/Export_Intersolve_Visa_cards.feature)
- Get voucher balance
- View/Download/Print voucher
- [View PA profile page](121-Portal/View_PA_profile_page.feature)
- [Manage Intersolve Visa card](121-Portal/Manage_Intersolve_Visa_card.feature)
- Generic 121-Portal components/features
  - Login
  - Logout
  - [Change password] (121-Portal/Change_password.feature)
  - [Navigate home and main menu](121-Portal/Navigate_home_and_main_menu.feature)
  - [Navigate program menu](121-Portal/Navigate_program_menu.feature)

#### Using AW-App

- [Download validation data](AW-App/Download_validation_data.feature)
- [Get Person Affected validation data](AW-App/Get_Person_Affected_Validation_Data.feature)
- [Validate Person Affected](AW-App/Validate_Person_Affected.feature)
- [Upload validation data](AW-App/Upload_validation_data.feature)
- Generic AW-App components/features
  - Login
  - Logout
  - Change password

#### Using 3rd party systems

Using Redline WhatsApp Helpdesk

- View iframe with PA details based on phone number

Using application such as EspoCRM to call our API

- Create/import registration: The general 'update PA' flow is automatically tested via [API-test](..\services\121-service\test\registrations\import-registration.test.ts)
- Update PA attribute: The general 'update PA' flow is automatically tested via [API-test](..\services\121-service\test\registrations\update-registration.test.ts)
- Delete PA: The general 'delete PA' flow is automatically tested via [API-test](..\services\121-service\test\registrations\delete-registration.test.ts)
- Update FSP of PA: Not tested yet.

### For Person/People Affected

#### Using PA-App

- [New registration](PA-App/New_registration.feature)
- [Consent question](PA-App/Consent_question.feature)
- [Answer program questions](PA-App/Answer_program_questions.feature)
- [Fill payment details](PA-App/Fill_payment_details.feature)
- Answer monitoring questions
- Generic PA-App components
  - [Verify phone number input](PA-App/Verify_phone_number_input.feature)
  - Changes based on instance-configuration/values

#### Using external tools/applications

- Send a WhatsApp message
  - [Claim digital voucher](Other/Claim_digital_voucher.feature)
  - Claim pending message

### For Admin-user

#### Using Swagger UI

- [Manage user roles](Admin-user/Manage_Roles.feature)
- [Add and Update program custom attribute](Admin-user/Add_And_Update_program_custom_attribute.feature)
- [Update program question](Admin-user/Update_program_question.feature)
- [Update program](Admin-user/Update_program.feature)
- [Export Intersolve vouchers to cancel](Admin-user/Export_vouchers_to_cancel.feature)
- [Sync Intersolve Visa Customer](Admin-user/Sync_Intersolve_Visa_Customer.feature)
- Update Financial Service Provider (not chosen FSP, but entity itself)
- Create/Update/Delete FSP attributes
- Update instance
- Add/update Intersolve instructions image
- Load seed data
- Create new aidworker user and manage assignment to program
- Delete user

### Automated processes (121-service)

- [Send reminder on uncollected vouchers](Automated/Send_reminder_on_uncollected_voucher.feature)

---

## Reference

- The complete definition of the Gherkin syntax: <https://cucumber.io/docs/gherkin/reference/>
- A comprehensive guide on BDD by Automation Panda:
  - [The Gherkin Language](https://automationpanda.com/2017/01/26/bdd-101-the-gherkin-language/)
  - [Gherkin by example](https://automationpanda.com/2017/01/27/bdd-101-gherkin-by-example/)
  - [Writing good Gherkin](https://automationpanda.com/2017/01/30/bdd-101-writing-good-gherkin/)

## Tools

- [BDD Editor](http://www.bddeditor.com/editor): A 'wizard'-like interface to create feature-files in a browser.
- [AssertThat Gherkin editor](https://www.assertthat.com/gherkin_editor): An editor, syntax-highlighting and validator in a browser.
- VSCode-extension: [Cucumber (Gherkin) Full Support](https://marketplace.visualstudio.com/items?itemName=alexkrechik.cucumberautocomplete)

## How to describe features / define scenarios

Features can be added to this folder by:

- Create a `.feature`-file, named after its title with `_` for spaces;
  i.e. `View_all_PA-App_scenarios.feature`
- Add a reference to the list above at the appropriate _actor_.
- Tag the whole feature or each scenario with the components involved.
  i.e: `@pa-app`, `@aw-app`, `@portal`, etc. (all lowercase)
