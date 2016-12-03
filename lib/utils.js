'use strict';

/* -----------------------------------------------------------------------------
 * utils
 * ---------------------------------------------------------------------------*/

const utils = module.exports = {

  indexAt: function (str, row, column) {
    row = parseInt(row); column = parseInt(column);

    let i = 0;
    for (var r = 1; r < row; r++) {
      if ((i = str.indexOf('\n', i +1)) === -1) { return -1; }
    }

    const i2 = str.indexOf('\n', i+1);
    const boundary = i2 !== -1 ? i2 : str.length;

    i += column
    return i < boundary ? i : -1;
  }

};
