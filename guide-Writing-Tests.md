# Guide: Writing tests

## Key points for writing tests

Keep the following points in mind while writing test cases:

- We should follow a practice to write to tests for all methods except the ones which are private.
- Every method which contains an async call, can be tested by returning a promise that can be spied and stubbed to verify the UI behavior.
- We should aim to write a complementary test for each method written on the file
- Verify class declarations and modifications through methods, boolean variables, string variables, etc.
- Monitor changes within the HTML template(values of attributes, content of buttons) and verify through test cases
- Create "`it ("should....`" scenarios for conditional code as well (e.g. if/else blocks)
- NOTE: It isn't necessary to test all the variables and all method calls, however a highlight of what the method is supposed to accomplish should be reflected within the test cases.
- Use the "`fit`" and "`fdescribe`" to execute only the unit test cases that you are currently working on. Make sure **not** to commit these commands.

- Testing class variables and objects, when they are being defined or constructed
- There are several methods which serve the purpose of defining class wide variables, which we should also test and verify. One of the typical examples of one such method is `ngOnInit`

```ts
it('ngOnInit: should set up variables', () => {
  expect(component.isLoggedIn).toBeDefined(); // check for class variables to be defined
  expect(component.someValye).toBeTruthy(); // check for a variable to be TRUE
  expect(component.someValye).toBeFalsy(); // check for a variable to be FALSE
});
```

The methods written as `toBeTruthy` are called matchers, they help us compare the expected values, their types, whether a method was called, the arguments of the methods and also their existence. There are various methods provided by the testing module. We can find a detailed list of those methods and their usage here: <https://jasmine.github.io/api/3.5/matchers.html>

A short introduction tutorial, to start off writing test cases can be found at: <https://jasmine.github.io/tutorials/your_first_suite>

## Testing method callbacks and changes

- In order to test for methods to have been called, or been called with certain arguments use `spy` and `toHaveBeenCalled`/ `toHaveBeenCalledWith` matchers.

```ts
// Code
public doLogin(event: Event) {
  event.preventDefault();
  // ...rest of the actual method.
}

// Test
it('some_method: should call another fn', () => {
  spyOn(event, "preventDefault"); // Monitor the said method
  component.doLogin(event); // call some_method
  expect(event.preventDefault).toHaveBeenCalled(); // check for the monitored method to have been called
});
```

## Testing conditional statements

- Make separate `it` blocks for different conditions.

```ts
it("Test when xyz === 'some-value'", () => {});
it("Test when xyz !== 'some-value'", () => {});
```

## Testing Async methods (i.e. methods which make an API call)

- Make a Spy for the specific async call which returns a Promise object. For example a method containing a call routine `this.programsService.changePassword` can be spied using following

```ts
let spy = spyOn(component.programsService, 'changePassword').and.returnValue(
  Promise.resolve(true),
);
```

- Based on the changes / executions upon the completion of the async request, we should aim to test the changes and modifications.

```ts
// block to test what happens after the async calls:
spy.calls.mostRecent().returnValue.then(() => {
  // Here goes expectations and changes
});
```

- Make sure the `done()` method is used to account for the async calls and fake async stubs/spies.

```ts
it('XYZ', (done) => {
  // spies and stubs

  spy.calls.mostRecent().returnValue.then(() => {
    // tests
    done(); // to complete the tests
  });
});
```

## Testing HTML elements

- By using the `defaultEl` and the monitoring the changes within the HTML pages. However, the testing here does not bring a lot of productivity in terms of what we get out of it. So, we can choose to discard this aspect of testing.
- HTML elements are tested by matching the `string` values, which is not very intuitive with `i18n` modules in use
