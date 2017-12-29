const wrapper = require('../../wrapper.js');

module.exports = new wrapper(/^group\s(.+)$/ig, group);

const rekt = require('./rekt');

function group(event, matchedStr) {
    rekt.test(event, matchedStr);
}