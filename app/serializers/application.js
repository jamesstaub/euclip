import JSONAPISerializer from "@ember-data/serializer/json-api";

export default class ApplicationSerializer extends JSONAPISerializer {
  modelNameFromPayloadKey(key) {
    if (key === "creator") {
      return "user";
    }
    return key;
  }
}
