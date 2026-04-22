const swaggerUi = require('swagger-ui-express');
const path = require('path');
const YAML = require('yamljs');

// Load the OpenAPI specification synchronously
const openAPIPath = path.join(__dirname, 'openapi.yaml');
const swaggerDocument = YAML.load(openAPIPath);

module.exports = {
  swaggerUi,
  swaggerDocument,
};
