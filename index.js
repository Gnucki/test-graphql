'use strict';

const item = require(`./${process.argv[2]}`); // eslint-disable-line

if (typeof item === 'function') {
  item().catch(error => console.log(error));
}
