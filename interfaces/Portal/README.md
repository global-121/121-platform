# Portal

The front-end for the _Humanitarian Organization_ web portal, where 121-programs can be created and monitored, etc.

## Configuration

Some specific information need to be configured before use:

- Set the API-endpoint(s) in the [`environment.ts`](./src/environments/environment.ts)-file.

## Dependencies in use

Next to the 'generic' dependencies/libraries/components used by all interfaces, the Portal also uses:

- [`@swimlane/ngx-datatable` v20](https://www.npmjs.com/package/@swimlane/ngx-datatable/v/20.1.0)  
  A component to render rows and columns of generic data and add basic functionalities like sorting, selecting, filtering, etc.

  \- Documentation (latest only!): <https://swimlane.gitbook.io/ngx-datatable/>
  \- GitHub Docs: <https://github.com/swimlane/ngx-datatable/tree/20.1.0/docs>

## License

Released under the Apache 2.0 License. See [LICENSE](LICENSE).
