// Source: https://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/

//Produces: "undefined", "null", "object", "array", "arguments", "error",
// "date", "regexp", "math", "json", "number", "string", or "boolean", "symbol", "set"
export const toTypeHelper = (obj: unknown): string =>
  ({}).toString
    .call(obj)
    .match(/\s([a-zA-Z]+)/)![1]
    .toLowerCase();
