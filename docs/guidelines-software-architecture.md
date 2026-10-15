# Guidelines: Software Architecture (121 Service)

This page contains the guidelines we have for 121 Service (and mock-service) development. The intended audience is anyone who wants to develop for the 121-platform. The current code base does not follow all these guidelines, but the intent is that any new code or refactoring follows these guidelines.

## Domain Abbreviations

**Fsp**: Financial Service Provider  
A Financial Service Provider (Fsp) is an external organization or system integrated with the 121 Platform to facilitate financial transactions, such as payments or voucher distributions, to registrations.

> **Note:** Abbreviations are not used for other domain concepts except those explicitly listed here. All other names should be written in full throughout the codebase.

## Guidelines

### A. NestJS Module Dependency Structure and Hierarchy

1. **Single Responsibility Principle (SRP)**: Each module should have a single responsibility or purpose. This makes your code base more modular and easier to maintain.
2. **Minimal Coupling**: Modules should be loosely coupled to promote re-usability and easier testing. Avoid tight coupling between modules, as it can lead to dependencies that are difficult to manage.
3. **Hierarchical Structure**: Organize modules in a hierarchical manner, with higher-level modules depending on lower-level ones. This helps in maintaining a clear structure and promotes encapsulation.
    1. **Higher-Level Modules**: These modules typically encapsulate broader functionality or business logic. They often depend on lower-level modules to provide specific implementations. Higher-level modules are usually closer to the application's entry point and orchestrate the interaction between different parts of the system.
    2. **Lower-Level Modules**: These modules are more focused on specific tasks or functionalities and provide the building blocks for higher-level modules. They tend to have fewer external dependencies and can be reused across different parts of the application. Lower-level modules often implement generic functionalities, such as database access, logging, or utility functions. They are typically more abstract and independent of the application's specific domain logic.
4. Considerations to determine the hierarchical level of a module:
    1. **Check Dependencies**: Modules with many dependencies are often higher level, as they rely on other modules to provide functionality.
    2. **Abstraction Level**: Consider the level of abstraction the module provides. Lower-level modules tend to offer more generic functionality, while higher-level modules deal with specific application features or business logic.
    3. **Responsibilities**: Modules with broader responsibilities, such as orchestrating interactions between multiple parts of the system or implementing complex business logic, are usually higher level. Modules with narrower responsibilities, such as handling data access or providing utility functions, are typically lower level.
    4. **Application Context**: Analyze where the module fits within the overall architecture of the application. Modules closer to the entry point or responsible for coordinating interactions between different parts of the system are likely higher level.
5. **Aim for Feature Modules**: Group related functionality into feature modules. This makes it easier to reason about the code and promotes re-usability.
6. **Avoid Circular Dependencies**: Circular dependencies can lead to runtime errors and make the codebase difficult to understand. Keep an eye on module dependencies to avoid circular references.

### B. NestJS Module Implementation

1. Every Module has a single and clearly defined responsibility.
2. All database interactions are in Repositories.
3. A NestJS Module only uses Repositories that belong to their own and Modules lower in the NestJS Module Hierarchy.
4. Functions do not accept or return Entities.
5. Enums: each enum in own file. 1 file = 1 enum.
6. Consider adding suffix `OrThrow` to each method where you deliberately throw an error. See [Function Signatures](#c-function-signatures) below too.
7. Put static function that are used in multiple places in the code in separate 'utils' module. Reference: <https://stackoverflow.com/a/40547841>
8. When a service is needed from another module:
    1. Import the full module under 'modules', not just the service under 'providers'
    2. The above also applies for repositories
    3. This way there is no need to import entities in other modules
9. When there are multiple files of one type (`service.ts`/`entity.ts`/`dto.ts`/etc) in a module folder, put them in a subfolder, respectively called `services`/`entities`/`dtos`/etc. If there are is just one file of a type, this is not necessary, but still allowed.

### C. Function signatures

1. Consider adding `OrThrow` as the suffix of a function name when a function can throw an 'expected' error. For example, when a Get function should always return an Entity, and it throws an error in case nothing was found in the database, then name the function like `getSomethingOrThrow()`. You don't always need to do this. Don't use other suffixes like `OrFail`.
2. Functions that only return data from the 121 Platform itself, start with "get", not with "find". For example, a function in a Custom Repository that gets data from the database, is named like getXByY(). For example, if a function gets data from an external system, it can be named like retrieveZ().
3. TBD if/how we consistently name functions that save, store, and create things, like Entities. Some research is needed if we want to make a conceptual difference between creating Entities vs. "other things", if that results in different naming conventions for Services, Custom Repositories etc., and if/how we want to align with TypeORM naming conventions.
4. Use interfaces for complex input of public functions in exported services (=shared between modules).
    1. Use a "Params" suffix.
    2. In case the interface contains complex type properties of itself, then define these in-line, unless they are re-used across multiple interfaces. e.g. ContactInformation. If the partial is also used on its own, then add the "Params" suffix.
    3. Name the file according to the name of the interface: contact-information-params.interface.ts
    4. Use /interfaces folder.
    5. If there are many interfaces, consider dividing them logically into sub-folders.
    6. See [function signature example here](https://github.com/global-121/121-platform/blob/5c85df8ccb845e1b76e7bc6b04e57afbda53d952/services/121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.service.ts#L68). Note: do not add an "input." definition for the object.
    7. All attributes of an interface are defined as "readonly" => see AI for pros and cons.
5. Use interfaces for complex return interfaces of public functions in exported services (=shared between modules).
    1. Use "Result" suffix.
    2. Name the file according to the name of the interface: contact-information-result.interface.ts
    3. Use /interfaces folder.
    4. If there are many interfaces, consider dividing them logically into sub-folders.
    5. All attributes of an interface are defined as "readonly" => see AI for pros and cons.
6. For "module internal" methods and private methods:
    1. For 1 or 2 input params, define them in-line
    2. For 3+ params, define them in-line as destructered object. See [function signature example here](https://github.com/global-121/121-platform/blob/5c85df8ccb845e1b76e7bc6b04e57afbda53d952/services/121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.api.service.ts#L151
). Note: do not add an "input." definition for the object.
    3. Use common sense, sometimes for 2 params an object already makes sense, because that makes naming the parameters explicit for the caller.

### D. Ordering functions in a class (Clean Code)

1. Functions should be organized in a "step-down" approach, where high-level, more abstract functions appear first, followed by lower-level details. This allows the reader to grasp the overall purpose of the code before diving into its implementation specifics.

   - **Top-Level Functions:** Should focus on the "what" (i.e., the high-level functionality or business logic).
   - **Lower-Level Functions:** Should focus on the "how" (i.e., details of implementation or helper methods).

   By placing higher-level methods at the top, a reader can understand the module's behavior at a glance, without immediately having to dig into the details.

2. Martin suggests that functions should appear in the order they are called. This means that if function `A` calls function `B`, function `A` should appear before function `B` in the source file. This makes reading the code more intuitive because it flows naturally from the high-level concept (function `A`) down to the supporting details (function `B`).

3. Functions that are closely related should be placed close to each other. This helps reduce the need to scroll or jump around the file, making the code easier to follow. The idea is to minimize the cognitive load on the reader by keeping related operations together.

4. Private or helper functions should be placed near the public functions they support. This proximity reinforces their role as implementation details and keeps them in context with the public interface they assist.

5. Code should be structured in a way that prevents the reader from having to jump back and forth between distant parts of the file. Functions that belong together logically should be grouped together physically, which also ties into the principle of keeping related functions close.

### E. 121 Service API Request and Response Bodies

1. Use classes as required by NestJS. Suffix class name with "Dto".
2. In case the DTO contains complex type properties of itself, then these have be defined as separate class, not in-line, because otherwise you cannot annotate them with Swagger decorators. If the class is also used stand-alone, then put it in a separate file and give it the "Dto" suffix.
3. Use /dtos folder.
4. Every DTO and Partial DTO goes into its own file. Name the file according to the name of the DTO.
5. If there are many DTOs, consider dividing them logically into sub-folders.
6. Input DTOs: start with verb to indicate the related action it is used in, unless the DTO is used in multiple actions, then omit the verb. Example: CreateAddressDto would be used to create an address, UpdateAddressDto to update it. If the DTOs are identical, it will be 1 DTO called AddressDto.
7. Output DTOs:
    1. For sending data in an API response: suffix with "Response".
    2. Leave the prefix verb in Response DTO: only when used for that single action. If used in multiple actions, then omit the verb. E.g. if we have CreateUserDto and UpdateUserDto and they both return the same User data, then it will be UserResponseDto. If they have different return data, then they would be CreateUserResponseDto and UpdateUserResponseDto.
8. All attributes of a DTO are defined as "readonly" => see AI for pros and cons.
9. Both for request DTOs and response DTOs: use appropriate decorators.

### F. Request and Response Bodies when using 3rd party APIs (e.g. Intersolve API)

1. Use interfaces.
2. Name the interfaces like we name DTOs for our 121 Service API. Including the Dto suffix.
3. Use the following naming convention for external API DTOs using this format: `{Fsp-name}Api{Operation}{Request|Response}{Body|Headers}` and filename `{fsp-name}-api-{operation}-{request|response}-{body|headers}.dto.ts`. Some examples: `AirtelApiDisbursementRequestHeaders` and `airtel-api-disbursement-request-headers.dto.ts`, or`AirtelApiAuthenticationResponseBody` and `airtel-api-authentication-response-body.dto.ts`. Use the same format for DTO partials.
4. Put all DTOs for one 3rd party API into its own sub folder under the /dtos folder. For example: `/dtos/safaricom-api/`
5. Do not share (partial) DTOs for communication with a 3rd party API and for the 121 Service API, for clear separation of concerns.

### G. Use URL and Header objects for constructing and manipulating URLs and Headers

1. Does not apply when framework-specific tooling exists, like [Angular HTTPClient](https://angular.dev/guide/http).
2. When constructing URLs, URL parameters or Headers for use with [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) use the available interfaces/objects for them: [URL](https://developer.mozilla.org/en-US/docs/Web/API/URL) and [Headers](https://developer.mozilla.org/en-US/docs/Web/API/Headers).
3. When calling fetch: pass the URL object instance.
4. When calling fetch: set the Headers object instance as the value for the `headers` property of the option object.

### H. API Design

1. Organize API around entities and not use cases
2. Apply proper HTTP methods:
    1. GET/POST/DELETE/PUT/PATCH
    2. Don't use POST for GET to be able to pass payload/body
3. Apply proper status codes in response:
    1. Document all specifically relevant status codes per endpoint
4. A 404 Not Found response is used on a GET call to a resource endpoint (e.g. /api/activities/3) that does not exist.
5. A 200 OK response with an empty array as body is used on a GET call to a collections endpoint with no resources under it (e.g. /api/activities when there are no activities available).
6. Naming:
    1. Don't use verbs, only nouns; there can be exceptions, for example for tasks that go beyond simple manipulation of a resource, like retrying or approving a payment. In that case use /retry or /approve at the end.
    2. Use plural/singular per best practice
    3. Use IDs in names as per this table
    4. Limit to 2 levels in naming ("/noun/id/noun/id") > figure out how this works in practice
7. Limit response to 2 levels deep (so relation of a relation is still OK)
8. Use same endpoint with query-parameter for response format options (e.g. export vs json for PA-table)

### I. Naming

1. Name things with their full name, do not use abbreviations. Let your IDE auto-complete names, so no RSI because of long names.
2. Class names are plural for Modules, Controllers and Services. For example: ProgramsModule, ProgramsService, ProgramsController. Reflected in the file names as well. For example: programs.module.ts, programs.service.ts, programs.controller.ts.
3. Class names are singular for Entities and Repositories. For example: ProgramEntity, with file name: program.entity.ts. And: FinancialServiceProviderRepository, with file name: fsp.repository.ts.
4. Base folder names of a Module are plural. For example: src/programs/
5. Do not include Enum suffix for Enums, so e.g. DefaultUserRole, not DefaultUserRoleEnum.

### J. Data Model and Entities

1. Use 3NF: 3rd Normal Form. Reference: <https://en.wikipedia.org/wiki/Third_normal_form>
2. An Entity is defined in and "belongs to" a NestJS Module.
3. Only this NestJS Module and NestJS Modules that depend on this NestJS Module use (import) the Entity class. In other words: Entity dependency follows (/is same as) NestJS Module dependency.
4. All data access is done via (Custom) Repositories, which also is defined in and belongs to this NestJS Module.
5. Data access functionality is encapsulated in Custom Repositories, so that no TypeORM-specific code lives outside of these. Exception: simple TypeORM clauses related to .find and .count functions can be used in Services code. See [count example here](https://github.com/global-121/121-platform/pull/5860#discussion_r1818511100).
6. An Entity can only be created, updated and deleted within this NestJS Module.
7. When getting data of Entities with related Entities: the functionality goes in the repository of the "base" Entity. For example, when retrieving Program data with all of its Registrations, there would be a function in the ProgramsRepository. But when only retrieving all Registrations of a Program (so without Program data itself), there would be a function in the RegistrationsRepository. Reason: this is a "weird" consequence of using 3NF together with NestJS Module Hierarchy: in the database the FK goes into the "lower" table.
8. Create fewer more generic functions that are called from many places in Custom Repositories over creating many specific functions that are called only from one place. Refactor if needed. There is no hard rule to this, it is more art than science. But we do not want to end up with Custom Repositories that have dozens of "get" functions with very specific function signatures that each are called only from one place.
9. Properties in entities and DTOs should
    1. not use `JSON` as their TS type
    2. include `| null` as part of their TS type when they are `nullable: true`
10. In Entity definition: if a column must contain a value, then do not add the "nullable: true" property (I have seen this in various places)
11. Entities: for FK object properties, use the full name of the foreign entity. For example, IntersolveVisaCustomer.intersolveVisaParentWallet and not IntersolveVisaCustomer.parentWallet.

### K. Exceptions

You can use [exceptions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling#exception_handling_statements) in the 121 Platform for control flow. In the backend (121 service) they can also be used to hook into NestJS which translates them into standards compliant HTTP exceptions. To do this you should use the NestJS-builtin [HTTPException](https://docs.nestjs.com/exception-filters#built-in-http-exceptions). You may also use one of its baseclasses but we generally stick to the base `HTTPException`.

The first argument you pass to `HTTPException` should be a string describing the error. Currently in the codebase we also sometimes pass in an array of error strings and even objects. You should only do that if you have a very good reason _not_ to just pass a single string.

### L. Testing

#### Unit testing

We test on WHAT a method is doing, not HOW it works. We test the different logic branches and their expected results, rather than asserting that all expected functions within a method have been called. This keeps WHAT a method does intact, while keeping flexibility in HOW it does it. This flexibility makes it easier to refactor a method's implementation without having to rewrite its tests.

##### Example
A method that calculates the price of an order, applying a discount above a threshold.

```typescript
function calculateOrderPrice(amount: number): number {
  const discount = getDiscount(amount);
  return amount - discount;
}

function getDiscount(amount: number): number {
  return amount > 100 ? amount * 0.1 : 0;
}
```

##### ❌ Testing HOW
This test breaks as soon as `calculateOrderPrice` is refactored to compute the discount differently.

```typescript
it('should call getDiscount', () => {
  // Arrange
  const getDiscountSpy = jest.spyOn(orderUtils, 'getDiscount');

  // Act
  calculateOrderPrice(150);

  // Assert
  expect(getDiscountSpy).toHaveBeenCalledWith(150);
});
```

##### ✅ Testing WHAT
This test covers the logic branch "price above the discount threshold" and only cares about the result.

```typescript
it('should apply a discount when amount is above the threshold', () => {
  // Act
  const price = calculateOrderPrice(150);

  // Assert
  expect(price).toBe(135);
});
```

##### ⚠️ Exception
`toHaveBeenCalled`/`toHaveBeenCalledWith` is valid when the call itself _is_ the WHAT, i.e. when a method's purpose is to trigger a side effect on a dependency:

```typescript
function handleFailedPayment(registration: Registration): void {
  const message = buildFailedPaymentMessage(registration);
  notificationService.send(registration.phoneNumber, message);
}
```

```typescript
it('should notify the registration when a payment fails', () => {
  // Arrange
  const sendSpy = jest.spyOn(notificationService, 'send');
  const registration = { phoneNumber: '+31600000000' } as Registration;

  // Act
  handleFailedPayment(registration);

  // Assert
  expect(sendSpy).toHaveBeenCalledWith(
    '+31600000000',
    expect.stringContaining('payment failed'),
  );
});
```
##### Note
We only test public methods. Public methods are the class's actual contract with the rest of the codebase, while private methods are implementation details that can be refactored freely as long as the public behavior stays the same. If the logic of a private method is considered critical and should be tested, consider moving it to a public helper function, or splitting it out into its own class/service.

#### Arrange, Act, Assert blocks

Each test should have clearly defined Arrange, Act, Assert steps. These should be delimited by single line comments like the examples below. This should make it more clear what is being tested vs what is setup for the test. It should also make it less natural to have a test assert something and then take another action + assert step.

Examples

```typescript
it('should add', () => {
  // Arrange
  const number1 = 1;
  const number2 = 2;

  // Act
  const sum = add(number1, number2);

  // Assert
  expect(sum).toEqual(3);
});
```

When there's no arrange work: skip that comment.

It can also make sense to combine the Act and Assert:

```typescript
it('should not throw when dividing by 0', () => {
  // Arrange
  const dividend = 1;
  const divisor = 0;

  // Act & Assert
  expect(() => {
    divide(dividend, divisor);
  }).not.toThrow();
});
```

#### Test description naming

1. Do not use function or method names in `describe` or `it` strings. There is no automated check to update test descriptions when functions are renamed, so they silently go stale.
2. Describe the **behavior or scenario**, not which function is called.

##### ❌ Coupling to function names

```ts
describe('getEnabledFsps', () => {
  it('getEnabledFsps returns all FSPs when none are disabled', async () => {
    const result = await service.getEnabledFsps();
    expect(result).toHaveLength(Object.values(FSP_SETTINGS).length);
  });
});
```
##### ✅ Describing behavior

```ts
describe('Listing enabled FSPs', () => {
  it('should return all FSPs when none are disabled', async () => {
    const result = await service.getEnabledFsps();
    expect(result).toHaveLength(Object.values(FSP_SETTINGS).length);
  });
});
```

#### Snapshot Testing

1. Use snapshots only when explicit assertions are impractical (e.g. long error messages), default to not using them.
2. If using a snapshot, then inline snapshots (`.toMatchInlineSnapshot()` or `toThrowErrorMatchingInlineSnapshot()`) are preferred, as the result is far less hidden. Obviously, there is a limit too how large an inline snapshot should get. But if it's too large for an inline-snapshot, it's very probably also too large for a snapshot at all.  
3. When deciding to use a snapshot, weigh the trade-off between the effort of building a precise assertion for the data structure, and the value of having the object constructed dynamically.
4. Keep snapshots small and focused; avoid large, hard-to-review snapshots by asserting only what matters. For example, if an array contains repeated objects, snapshot just one representative item instead of the whole array, and add a separate length assertion if the total number of items is relevant.
5. Make snapshots deterministic, masking dynamic values (e.g. `.toMatchSnapshot({ created: expect.any(String) })`).  
6. When a snapshot fails, review the diff—don’t just re-record.  
