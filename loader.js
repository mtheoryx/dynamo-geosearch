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

const createTableInput = ddbGeo.GeoTableUtil.getCreateTableRequest(config);

console.log("Creating table with schema:");
console.dir(createTableInput, { depth: null });

// Create the table
ddb
  .createTable(createTableInput)
  .promise()
  .then(function () {
    return ddb
      .waitFor("tableExists", { TableName: config.tableName })
      .promise();
  })
  // Load sample data in batches
  .then(function () {
    console.log("Loading sample data from capitals.json");
    const data = require("./capitals.json");
    const putPointInputs = data.map(function (capital) {
      return {
        RangeKeyValue: { S: uuid.v4() }, // Use this to ensure uniqueness of the hash/range pairs.
        GeoPoint: {
          latitude: capital.latitude,
          longitude: capital.longitude,
        },
        PutItemInput: {
          Item: {
            country: { S: capital.country },
            capital: { S: capital.capital },
          },
        },
      };
    });

    const BATCH_SIZE = 25;
    const WAIT_BETWEEN_BATCHES_MS = 1000;
    var currentBatch = 1;

    function resumeWriting() {
      if (putPointInputs.length === 0) {
        return Promise.resolve();
      }
      const thisBatch = [];
      for (
        var i = 0, itemToAdd = null;
        i < BATCH_SIZE && (itemToAdd = putPointInputs.shift());
        i++
      ) {
        thisBatch.push(itemToAdd);
      }
      console.log(
        "Writing batch " +
          currentBatch++ +
          "/" +
          Math.ceil(data.length / BATCH_SIZE)
      );
      return capitalsManager
        .batchWritePoints(thisBatch)
        .promise()
        .then(function () {
          return new Promise(function (resolve) {
            setInterval(resolve, WAIT_BETWEEN_BATCHES_MS);
          });
        })
        .then(function () {
          return resumeWriting();
        });
    }

    return resumeWriting().catch(function (error) {
      console.warn(error);
    });
  })
  .catch(console.warn)
  .then(function () {
    process.exit(0);
  });
