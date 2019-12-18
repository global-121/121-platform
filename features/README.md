Features
========

<!-- TOC: -->
- [All features / scenario's](#all-features--scenarios)
  - [For Humanitarian Organization (HO)](#for-humanitarian-organization-ho)
  - [For Person/People Affected (PA)](#for-personpeople-affected-pa)
  - [For Aid-Worker (AW)](#for-aid-worker-aw)
- [Reference](#reference)
- [Tools](#tools)
- [How to describe features / define scenarios](#how-to-describe-features--define-scenarios)

---

Features of the 121-platform are described in this folder in a standardizes way using the [Gherkin-language](https://cucumber.io/docs/gherkin/).

They are grouped by their (most important) actor.

---

## All features / scenario's

### For Humanitarian Organization (HO)
1. [View funds overview](View_funds_overview.feature)


### For Person/People Affected (PA)


### For Aid-Worker (AW)


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

