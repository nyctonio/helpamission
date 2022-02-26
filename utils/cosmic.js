const Cosmic = require('cosmicjs');

const cosmicAPI = Cosmic();
const bucket = cosmicAPI.bucket({
    slug: 'help-a-mission-testing',
    read_key: 'iLUwMEZ896KQ3sGZ6pQUuen09AkhFng3KzhCLIhvRgMfPcNqdA'
});

module.exports = bucket;