# HO-Portal

The front-end for the _Humanitarian Organization_ web portal, where 121-programs can be created and monitored, etc.

## Configuration

Some specific information need to be configured before use:

- Set the API-endpoint(s) in the [`environment.ts`](./src/environments/environment.ts)-file.

## Dependencies in use

Next to the 'generic' dependencies/libraries/components used by all interfaces, the HO-portal also uses:

- [`@swimlane/ngx-datatable` v17](https://www.npmjs.com/package/@swimlane/ngx-datatable/v/17.1.0)  
  A component to render rows and columns of generic data and add basic functionalities like sorting, selecting, filtering, etc.

  \- Documentation (latest only!): <https://swimlane.gitbook.io/ngx-datatable/>
  \- GitHub Docs: <https://github.com/swimlane/ngx-datatable/tree/17.1.0/docs>

- [`ngx-popperjs` v9](https://www.npmjs.com/package/ngx-popperjs/v/9.0.7)  
  A component to add explanations to buttons, headers, labels, etc.

  - Documentation: <https://github.com/tonysamperi/ngx-popperjs/tree/9.0.7#ngx-popperjs>
  - `popper.js` Documentation: <https://popper.js.org/docs/v2/>

- [`@swimlane/ngx-charts` v14](https://www.npmjs.com/package/@swimlane/ngx-charts/v/14.0.0)  
  A component to add explanations to buttons, headers, labels, etc.

  - Documentation (latest only!): <https://swimlane.gitbook.io/ngx-charts/>
  - GitHub Docs: <https://github.com/swimlane/ngx-charts/tree/14.0.0/docs>

---

## License

Released under the Apache 2.0 License. See [LICENSE](LICENSE).
