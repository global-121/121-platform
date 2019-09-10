Interfaces on the 121-platform
==============================

- [PA-App](./PA-App/)  
  (Native-)app used by *People Affected* to interact with the 121-platform.  

  Primary target(s): Mobile/Smartphone (Android)

- [HO-Portal](./HO-Portal/)  
  Web-app used by the *Humanitarian Organization* to manage their programs, aid-workers, communication, etc.  

  Primary target(s): Laptop/desktop

## Development

### Environment Requirements
The tools to run or build all interfaces:

- [Git](https://git-scm.com/)

- (Optional) [NVM - Node Version Manager](http://nvm.sh/)  
  To install the required version of Node.js and to prevent conflicts between projects or components using other versions of Node.js.  
  After installing NVM run:

      nvm install && nvm install-latest-npm

- (When not using NVM) [Node.js](https://nodejs.org/) **v10+ LTS**  
  With NPM **v6.9+**

### Specific requirements
Every interface or app will have their own requirements defined in their README file.

### Backend / API
Every interface or app will refer to their specific services of APIs.

See the [/services/](../services/)-directory in this repository.
