# HO-Portal

The front-end for the _Humanitarian Organization_ web portal, where 121-programs can be created and monitored, etc.

## Getting Started

- Install [environment requirements](../README.md)
- Install dependencies (from this folder):
  `npm install`
- Start in development-mode:
  `npm start`

## Configuration

Some specific information need to be configured before use:

- Set the API-endpoint(s) in the [`environment.ts`](./src/environments/environment.ts)-file.

## Dependencies in use

Next to the 'generic' dependencies/libraries/components used by all interfaces, the HO-portal also uses:

- `ngx-datatable`
  A component to render rows and columns of generic data and add basic functionalities like sorting, selecting, filtering, etc.
  - API Documentation: <https://swimlane.gitbook.io/ngx-datatable/api>
