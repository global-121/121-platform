# Guidelines: Which tests to automate?

This page lists some considerations when deciding which Unit Test and Integration Tests to create for automatically testing newly added or updated functionality. These considerations focus on the 121 Service.

1. Deciding which automated tests to create is more of an art than a science. Hence, these considerations should not be seen as hard rules.

2. Write automated tests that are valuable. In that: the value of an automated test should outweigh the costs of writing and maintaining them.

   1. The idea is that automated tests will catch defects early, as to lower the costs of reporting, finding and fixing these defects, and to mitigate the negative consequences a late defect can have in production.

   2. The costs of writing and maintaining an automated test should be lower than the risk of not having this automated test. The risk being: the chance of defects going undetected times the impact of these defects.

   3. We are not going to take the effort into calculating monetary numbers with the value and costs, as that effort will be too high. Another reason why this is more an art than a science.

3. Unit Tests: provide breadth by covering a wide range of possible responses (both normal and edge cases) in isolation using mocks. These tests are fast and ensure that your function handles responses correctly.

   1. Goal: Focus on how your function behaves when it receives different types of responses from the API. Test on WHAT a method is doing, not HOW it works. You are testing the logic inside your function in a controlled, isolated environment.

   2. Focus: Response handling, business logic, and edge case scenarios.

   3. Benefit: Fast and reliable since you're mocking external dependencies.

4. Integration Test: Provide depth by testing real-world behavior with actual API calls. These tests ensure that your application can successfully integrate and handle real-life conditions, but they should be more selective and focused on core functionality and key error scenarios.

   1. Goal: Verify that your application can actually communicate with the real API and handle its responses correctly in a real environment.

   2. Focus: Actual API calls, request formatting, response structure, and overall interaction with the external service.

   3. Benefit: High confidence that the integration works in real-world conditions, but can be slower and more brittle.

5. There will be some overlap in the scenarios tested by unit and integration tests, but the goals differ.

   1. Unit tests (with mocks) focus on isolated response handling and can cover a wide range of scenarios, including edge cases.

   2. Integration tests focus on real interactions with the API and are typically reserved for key paths and real-world conditions.

   3. The combination of both approaches gives you confidence in both your code's behavior and the real-world integration, while avoiding unnecessary duplication and redundancy.

6. It is not always valuable to write Unit Tests, so take the Testing Pyramid lightly. See [this article about the Test Trophy](https://kentcdodds.com/blog/write-tests) for background information. Situations where Unit Tests can have value: (a) when it makes sense to test a lot of "edge cases" of a function, like "weird input", (b) when functions have internal "business logic" (let's simply say: "ifs", or "several paths").

7. When writing Unit Tests turns out to be a complex undertaking, this is a "code smell". The unit is probably too big or complex. Try to refactor the unit into smaller units, then each unit can be tested easier:

   1. Refactor (relatively) independent blocks of business logic into their own (private) functions: abstract, encapsulate and adhere to the SRP (Single Responsibility Principle).

   2. Refactor independent stand-alone private functions into a separate "Helper" Service. These functions then become public and can be tested in their own unit test file. The Helper Service is typically not exported from the Module, so does not cause added complexity for users of the Module. The functions in the Helper Service should in principle only do something with the input paramters, and return something, and not have any external dependencies. Example: how we refactored functions from the [SafaricomApiService](https://github.com/global-121/121-platform/pull/6303/files#diff-b19ce10e66283039c41abf0f4d990a17d825792f15a546741aba11a24378db24) into the [SafaricomApiHelperService](https://github.com/global-121/121-platform/pull/6303/files#diff-b451f25b01dbbf5ba2a8b68331d821dd316f97f74a5327a10520886d61399e00) with its own [Unit Test file](https://github.com/global-121/121-platform/pull/6303/files#diff-7975aa3b5c938b7854541ee3f3d0ff1d644b40a454ae7784f24a22bd59c28177).

   3. See if any of these stand-alone independent functions are concern more generic functionality that may be valuable to other Modules as well. If so, refactor to a helper service or method with then its own unit test file. Example: how we refactored validating the authentication token into a generic [TokenValidationService](https://github.com/global-121/121-platform/pull/6303/files#diff-267ddfe92a8dbf1799cb4ac6207f09b356caff3201b718c42ca4504005a46f74) with its own [Unit Test file](https://github.com/global-121/121-platform/pull/6303/files#diff-492e8515932f4a33c678b4fd6503b2446be9e966f753a0b032c6804b08806ffd), also refactoring the IntersolveVisaApiService to use it.
