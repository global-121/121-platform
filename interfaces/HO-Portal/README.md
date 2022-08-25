# HO-Portal

The front-end for the _Humanitarian Organization_ web portal, where 121-programs can be created and monitored, etc.

## Configuration

Some specific information need to be configured before use:

- Set the API-endpoint(s) in the [`environment.ts`](./src/environments/environment.ts)-file.

## Dependencies in use

Next to the 'generic' dependencies/libraries/components used by all interfaces, the HO-portal also uses:

- [`@swimlane/ngx-datatable` v19](https://www.npmjs.com/package/@swimlane/ngx-datatable/v/19.0.0)  
  A component to render rows and columns of generic data and add basic functionalities like sorting, selecting, filtering, etc.

  \- Documentation (latest only!): <https://swimlane.gitbook.io/ngx-datatable/>
  \- GitHub Docs: <https://github.com/swimlane/ngx-datatable/tree/19.0.0/docs>

- [`ngx-popperjs` v11](https://www.npmjs.com/package/ngx-popperjs/v/11.0.0)  
  A component to add explanations to buttons, headers, labels, etc.

  - Documentation: <https://github.com/tonysamperi/ngx-popperjs/tree/11.0.0#ngx-popperjs>
  - `popper.js` Documentation: <https://popper.js.org/docs/v2/>

- [`@swimlane/ngx-charts` v17](https://www.npmjs.com/package/@swimlane/ngx-charts/v/17.0.1)  
  A component to add explanations to buttons, headers, labels, etc.

  - Documentation (latest only!): <https://swimlane.gitbook.io/ngx-charts/>
  - GitHub Docs: <https://github.com/swimlane/ngx-charts/tree/17.0.1/docs>

---

## License

Released under the Apache 2.0 License. See [LICENSE](LICENSE).
