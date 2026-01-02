// opensearchClient.js
const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

let instance = null;



const opensearchClient = new Client({
    node: 'http://localhost:9200',
});

const getOpensearchClient = () => {
    if (!instance) {
        instance = opensearchClient;
    }
    return instance;
};

module.exports = { getOpensearchClient };
