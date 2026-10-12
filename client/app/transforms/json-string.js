// An object sent to the API as a JSON string. The API snake_cases the keys of request parameters, which
// would rename the keys inside the object; a string passes through untouched. The API sends it back as an object.
export default class JsonStringTransform {
  serialize(value) {
    return JSON.stringify(value ?? {});
  }

  deserialize(value) {
    if (typeof value === 'string') return JSON.parse(value);
    return value ?? {};
  }

  static create() {
    return new this();
  }
}
