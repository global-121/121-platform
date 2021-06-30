# Features

<!-- TOC: -->

- [All features / scenario's](#all-features--scenarios)
  - [For Humanitarian Organization](#for-humanitarian-organization)
  - [For Person/People Affected](#for-personpeople-affected)
  - [For Aid-Worker](#for-aid-worker)
  - [For Admin-user](#for-admin-user)
- [Reference](#reference)
- [Tools](#tools)
- [How to describe features / define scenarios](#how-to-describe-features--define-scenarios)

---

## All features / scenario's

Features of the 121-platform are described in this folder in a standardizes way using the [Gherkin-language](https://cucumber.io/docs/gherkin/).

### For Humanitarian Organization

#### Using HO-Portal

- [View metrics overview](HO-Portal/View_metrics_overview.feature)
- [Manage aidworkers](HO-Portal/Manage_aidworkers.feature)
- [Manage people affected](HO-Portal/Manage_people_affected.feature)
- [Edit information of Person Affected](HO-Portal/Edit_Info_Person_Affected.feature)
- [Import people affected](HO-Portal/Import_people_affected.feature)
- [Invite people affected](HO-Portal/Invite_people_affected.feature)
- [Mark as no longer eligible](HO-Portal/Mark_as_no_longer_eligible.feature)
- [Select people for validation](HO-Portal/Select_people_for_validation.feature)
- [Export People Affected list](HO-Portal/Export_PA_list.feature)
- [Export selected for validation list](HO-Portal/Export_selected_for_validation_list.feature)
- [Include people affected (`Run Program` role)](HO-Portal/Include_people_affected_Run_Program_role.feature)
- [Include people affected (`Personal Data` role)](HO-Portal/Include_people_affected_Personal_Data_role.feature)
- [Reject or End Inclusion of people affected](HO-Portal/Reject_or_End_inclusion_people_affected.feature)
- [Export inclusion list](HO-Portal/Export_Inclusion_List.feature)
- [Export duplicate phone-numbers list](HO-Portal/Export_duplicate_phone-numbers_List.feature)
- [Make a new payment](HO-Portal/Make_new_payment.feature)  
- [Export payment details](HO-Portal/Export_Payment_Details.feature)
- Export all unused vouchers
- Retry individual/all payment(s)
- Get voucher balance
- View/Download/Print voucher

#### Generic HO-Portal components/features

- Login
- Logout
- Change password
- [Navigate home and main menu](HO-Portal/Navigate_home_and_main_menu.feature)
- [Navigate program phases](HO-Portal/Navigate_program_phases.feature)

#### Automated processes (121-service)

- Send reminder on uncollected vouchers
  - With 2000+ PAs in system

### For Person/People Affected

#### Using external tools/applications

- Send a WhatsApp message to collect voucher
  - Send 'yes' reply via WhatsApp when asked / uncollected voucher available
  - Send 'yes' reply via WhatsApp when no uncollected voucher available

#### Using PA-App

- [New registration](PA-App/New_registration.feature)
- [Use existing Account](PA-App/Use_existing_Account.feature)
- [Consent question](PA-App/Consent_question.feature)
- [Answer program questions](PA-App/Answer_program_questions.feature)
- [Fill payment details](PA-App/Fill_payment_details.feature)
- [Link preprinted QR-code](PA-App/Link-preprinted-QR-code.feature)
- Answer monitoring questions

#### Generic PA-App components

- [Listen to text in conversation-view](PA-App/Listen_to_text_in_conversation-view.feature)
- [Verify password input](PA-App/Verify_password_input.feature)
- [Verify phone number input](PA-App/Verify_phone_number_input.feature)
- Changes based on instance-configuration/values

### For Aid-Worker

#### Using AW-App

- [Download validation data](AW-App/Download_validation_data.feature)
- [Get Person Affected validation data](AW-App/Get_Person_Affected_Validation_Data.feature)
- [Validate Person Affected](AW-App/Validate_Person_Affected.feature)
- [Upload validation data](AW-App/Upload_validation_data.feature)

#### Generic AW-App components/features

- Login
- Logout
- Change password

### For Admin-user

#### Using Swagger UI

- [Update phone-numbers of Person Affected](Admin-user/Update_phone_numbers.feature)
- [Update Financial Service Provider of Person Affected](Admin-user/Update_financial_service_provider.feature)
- [Import Test registrations NLRC](Admin-user/Import_test_registrations_NL.feature)

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
  i.e: `@pa-app`, `@aw-app`, `@ho-portal`, etc. (all lowercase)
