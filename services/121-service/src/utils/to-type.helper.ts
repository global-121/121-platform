// Source: https://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/

export const toTypeHelper = (obj: unknown) =>
  ({}).toString
    .call(obj)
    .match(/\s([a-zA-Z]+)/)![1]
    .toLowerCase() as
    | 'arguments'
    | 'array'
    | 'boolean'
    | 'date'
    | 'error'
    | 'json'
    | 'math'
    | 'null'
    | 'number'
    | 'object'
    | 'regexp'
    | 'set'
    | 'string'
    | 'symbol'
    | 'undefined';
