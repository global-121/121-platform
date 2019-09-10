AW-App
======

The front-end of the application an *Aid-Worker* uses to interact with the 121-platform.

## Getting Started
- Install [environment requirements](../README.md)
- Install dependencies (from this folder):
  `npm install`
- Start in development-mode:
  `npm start`
- Run the app and use the camera: 
  `ionic cordova run browser`
- Run the app and use the camera with livereload (NOTE: a browser is automatically opened to port 8000, while in the log you see that you actually need port 8100) 
  `ionic cordova run browser --livereload`

## Configuration
Some specific information need to be configured before use:

- Set the API-endpoint(s) in the [`environment.ts`](./src/environments/environment.ts)-file.


