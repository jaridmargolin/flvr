'use strict';

/* -----------------------------------------------------------------------------
 * dependencies
 * ---------------------------------------------------------------------------*/

// core
const spawn = require('child_process').spawn;
const path = require('path');
const util = require('util');

// 3rd party
const _ = require('lodash');
const assert = require('chai').assert;
const stripAnsi = require('strip-ansi');

// lib
const flvr = require('../lib/flvr.js');


/* -----------------------------------------------------------------------------
 * reusable
 * ---------------------------------------------------------------------------*/

const parseOutput = function (output, filePath) {
  const lines = stripAnsi(util.format(output)).split('\n');

  return {
    msg: lines[1],
    frame: lines.slice(3, 8),
    loc: lines.slice(9, 11),
    trace: lines.slice(11)
  }
};


/* -----------------------------------------------------------------------------
 * test
 * ---------------------------------------------------------------------------*/

describe('flvr', function () {

  before(function () {
    flvr();
  });

  it('Should format error', function (done) {
    const throwError = function () {
      // (1) code
      // (2) block
      throw new Error('test');
      // (1) always
      // (2) displays
    };

    const assertOutput = function (output) {
      const parsed = parseOutput(output);

      assert.isTrue(parsed.msg.includes(`Error: test`));
      assert.isTrue(_.every(parsed.frame, (line) => line.match(/^.+:/)));
      assert.isTrue(parsed.loc[0].includes(`@ throwError index.js:`));
      assert.isTrue(parsed.loc[1].includes(`test/index.js:`));
      assert.isTrue(parsed.trace[0].includes(`Timeout.err index.js:`));
      assert.isTrue(parsed.trace[1].includes(`test/index.js:`));
    };

    // used in order to ensure stack trace results
    setTimeout(() => {
      try {
        throwError();
      }
      catch (err) {
        assertOutput(err);
      }
      
      done();
    });
  });

  it('Should format uncaughtException and exit', function (done) {
    const proc = spawn('node', [
      '--require',
      './lib/index.js',
      'test/fixtures/uncaught.js'
    ]);

    const assertOutput = function (output) {
      const parsed = parseOutput(output);

      assert.isTrue(parsed.msg.includes(`Error: test`));
      assert.isTrue(_.every(parsed.frame, (line) => line.match(/^.+:/)));
      assert.isTrue(parsed.loc[0].includes(`@ throwError uncaught.js:`));
      assert.isTrue(parsed.loc[1].includes(`test/fixtures/uncaught.js:`));
      assert.isTrue(parsed.trace[0].includes(`Timeout.err uncaught.js:`));
      assert.isTrue(parsed.trace[1].includes(`test/fixtures/uncaught.js:`));
    };

    let output = '';
    proc.stderr.on('data', (data) => output += data.toString());

    proc.on('exit', function () {
      assertOutput(output);
      done();
    });
  });

  it('Should format syntax error and exit', function (done) {
    const proc = spawn('node', [
      '--require',
      './lib/index.js',
      'test/fixtures/syntax.js'
    ]);

    const assertOutput = function (output) {
      const parsed = parseOutput(output);

      assert.isTrue(parsed.msg.includes(`SyntaxError: Unexpected token ;`));
      assert.isTrue(parsed.loc[0].includes(`@ syntax.js:`));
      assert.isTrue(parsed.loc[1].includes(`test/fixtures/syntax.js:`));
      assert.isTrue(_.every(parsed.frame, (line) => line.match(/^.+:/)));
    };

    let output = '';
    proc.stderr.on('data', (data) => output += data.toString());

    proc.on('exit', function () {
      assertOutput(output);
      done();
    });
  });

});
