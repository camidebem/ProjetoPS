const swaggerAutogen = require('swagger-autogen')();

const outputFile = './swagger_output.json';
const routeFiles = ['./app/controllers/*.js'];

swaggerAutogen(outputFile, routeFiles);
