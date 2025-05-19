# Instructions to follow

## General code guidelines

- Never add comments to the code you generate.
- Never add explanations to the code you generate.
- When creating a function prefer making a pure function without side effects.
- Do not create files with multiple enums in them.
- When a function has 2 or more parameters use a destructured object instead of separate parameters.
- Name things with their full name, do not use abbreviations.

## TypeScript specific guidelines

- Never use the `any` type.

## DTOs for Financial Service Providers

Use the following naming convention for external API DTOs using this format: {Fsp-name}Api{Operation}{Request|Response}{Body|Headers} and filename {fsp-name}-api-{operation}-{request|response}-{body|headers}.dto.ts. Some examples: AirtelApiDisbursementRequestHeaders and airtel-api-disbursement-request-headers.dto.ts, orAirtelApiAuthenticationResponseBody and airtel-api-authentication-response-body.dto.ts. Use the same format for DTO partials.

## URL and Headers objects

Use URL and Header objects for constructing and manipulating URLs and Headers.
