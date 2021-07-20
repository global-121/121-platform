# HO-Portal

The front-end for the _Humanitarian Organization_ web portal, where 121-programs can be created and monitored, etc.

## Configuration

Some specific information need to be configured before use:

- Set the API-endpoint(s) in the [`environment.ts`](./src/environments/environment.ts)-file.

## Dependencies in use

Next to the 'generic' dependencies/libraries/components used by all interfaces, the HO-portal also uses:

- [`ngx-datatable`](https://www.npmjs.com/package/@swimlane/ngx-datatable)  
  A component to render rows and columns of generic data and add basic functionalities like sorting, selecting, filtering, etc.

  \- API Documentation: <https://swimlane.gitbook.io/ngx-datatable/api>

- [`ngx-popper`](https://www.npmjs.com/package/ngx-popper)  
  A component to add explanations to buttons, headers, labels, etc.

  - Documentation: <https://github.com/MrFrankel/ngx-popper/#readme>
  - `popper.js` Documentation: <https://popper.js.org/docs/v1/>

---

## License

Released under the Apache 2.0 License. See [LICENSE](LICENSE).
