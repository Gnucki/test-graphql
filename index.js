'use strict';

if (process.argv[2] === 'client') {
  require('./client'); // eslint-disable-line
} else {
  require('./server'); // eslint-disable-line
}
