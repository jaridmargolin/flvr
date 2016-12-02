'use strict';

/* -----------------------------------------------------------------------------
 * uncaught
 * ---------------------------------------------------------------------------*/

const throwError = function () {
  // (1) code
  // (2) block
  throw new Error('test');
  // (1) always
  // (2) displays
};

// used in order to ensure stack trace results
setTimeout(() => {
  try {
    throwError()
  } catch (err) {
    throw err;
  }
});
