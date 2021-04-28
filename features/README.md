# Features

<!-- TOC: -->

- [All features / scenario's](#all-features--scenarios)
  - [For Humanitarian Organization (HO-Portal)](#for-humanitarian-organization-ho-portal)
  - [For Person/People Affected (PA-App)](#for-personpeople-affected-pa-app)
  - [For Aid-Worker (AW-App)](#for-aid-worker-aw-app)
  - [For Admin-user (Swagger UI)](#for-admin-user-swagger-ui)
- [Reference](#reference)
- [Tools](#tools)
- [How to describe features / define scenarios](#how-to-describe-features--define-scenarios)

---

## All features / scenario's

Features of the 121-platform are described in this folder in a standardizes way using the [Gherkin-language](https://cucumber.io/docs/gherkin/).

### For Humanitarian Organization (HO-Portal)

- [Navigate home and main menu](HO-Portal/Navigate_home_and_main_menu.feature)
- [Navigate program phases](HO-Portal/Navigate_program_phases.feature)
- [View metrics overview](HO-Portal/View_metrics_overview.feature)
- [Manage aidworkers](HO-Portal/Manage_aidworkers.feature)
- [Manage people affected](HO-Portal/Manage_people_affected.feature)
- [Select people for validation](HO-Portal/Select_people_for_validation.feature)
- [Export selected for validation list](HO-Portal/Export_selected_for_validation_list.feature)
- [Include people affected (Project Officer)](HO-Portal/Include_people_affected_PO.feature)
- [Include people affected (Program Manager)](HO-Portal/Include_people_affected_PM.feature)
- [Reject people affected](HO-Portal/Reject_people_affected.feature)
- [Export inclusion list](HO-Portal/Export_Inclusion_List.feature)
- [Make a new payment](HO-Portal/Make_new_payment.feature)
- [Export payment details](HO-Portal/Export_Payment_Details.feature)

### For Person/People Affected (PA-App)

- [Listen to text in conversation-view](PA-App/Listen_to_text_in_conversation-view.feature)
- [Create Identity](PA-App/Create_Identity.feature)
- [Use existing Digital ID](PA-App/Use_existing_Digital_ID.feature)
- [Verify password input](PA-App/Verify_password_input.feature)
- [Answer program questions](PA-App/Answer_program_questions.feature)
- [Fill payment details](PA-App/Fill_payment_details.feature)
- [Verify phone number input](PA-App/Verify_phone_number_input.feature)
- [Link preprinted QR-code](PA-App/Link-preprinted-QR-code.feature)

### For Aid-Worker (AW-App)

- [Upload validation data](AW-App/Upload_validation_data.feature)
- [Download validation data](AW-App/Download_validation_data.feature)
- [Get PA-data for validation](AW-App/Get_PA-data_for_validation.feature)

### For Admin-user (Swagger UI)

- [Update phone-numbers of Person Affected](Admin-user/Update_phone_numbers.feature)
- [Update Financial Service Provider of Person Affected](Admin-user/Update_financial_service_provicder.feature)

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
