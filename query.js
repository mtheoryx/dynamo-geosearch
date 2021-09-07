const AWS = require("aws-sdk");
const uuid = require("uuid");
const ddb = new AWS.DynamoDB({
  endpoint: "http://dynamodb-local:8000",
  region: "us-east-2",
});
const ddbGeo = require("dynamodb-geo");
const config = new ddbGeo.GeoDataManagerConfiguration(ddb, "test-table");

config.hashKeyLength = 6;

const capitalsManager = new ddbGeo.GeoDataManager(config);

console.log("Querying an existing table");

capitalsManager
  .queryRadius({
    RadiusInMeter: 100000,
    CenterPoint: {
      latitude: 52.22573,
      longitude: 0.149593,
    },
  })
  .then(function (result) {
    return capitalsManager
      .queryRadius({
        RadiusInMeter: 100000,
        CenterPoint: {
          latitude: 52.22573,
          longitude: 0.149593,
        },
      })
      .then(function (result) {
        console.log(result);
      })
      .catch(function (err) {
        console.log(err);
      });
  })
  .catch(function (err) {
    console.log(err);
  });
