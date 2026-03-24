# AGENTS instructions

## Mock Service Overview

This folder contains all code for the mock service of the 121 Platform. This
mock service is used during development of the 121 Platform and for
demonstration purposes. It is a NestJS application with endpoints simulating the
external APIs the 121 Platform is integrated with.

## Exact mocking of third party APIs

The goal of the mock service is to exactly mock the API endpoints of third party APIs.

## No persistence

The Mock Service does not persist any data nor should it ever.

## Mocking happy path responses and error responses

The mock service will respond to specific input by either giving a usual, non-error, response or giving one of a number of different error responses.
