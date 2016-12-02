'use strict';

/* -----------------------------------------------------------------------------
 * dependencies
 * ---------------------------------------------------------------------------*/

// core
const path = require('path');

// 3rd party
const _ = require('lodash');
const chalk = require('chalk');
const figures = require('figures');
const StackUtils = require('stack-utils');

// lib
const format = require('./format');


/* -----------------------------------------------------------------------------
 * configure
 * ---------------------------------------------------------------------------*/

const stackUtils = new StackUtils({
  cwd: process.cwd(),
  internals: StackUtils.nodeInternals()
});


/* -----------------------------------------------------------------------------
 * flvr
 * ---------------------------------------------------------------------------*/


const flvr = module.exports = function () {
  Error.prepareStackTrace = flvr.prepareStackTrace;

  const logError = function (err) {
    if (err instanceof SyntaxError) {
      err = flvr.formatSyntaxError(err);
    }

    console.error(err);
  }

  process.on('unhandledRejection', logError);
  process.on('uncaughtException', (err) => {
    logError(err);
    process.exit(0);
  });
}

flvr.prepareStackTrace = function (err, frames) {
  const rawStack = frames.map((frame) => `    at ${frame.toString()}`).join('\n');

  if (err instanceof SyntaxError) {
    err._rawFrames = frames;
  }

  return flvr.style(err, rawStack);
};

flvr.entriesFromStack = function (stack) {
  return _.chain(stackUtils.clean(stack).split('\n'))
    .map((entry) => _.mapValues(stackUtils.parseLine(entry), _.trim))
    .reject((entry) => _.isNull(entry) || _.isEmpty(entry) || _.isUndefined(entry))
    .value();
};

flvr.style = function (err, stack) {
  return format(err, flvr.entriesFromStack(stack || err.stack));
};

flvr.formatSyntaxError = function (err) {
  const lines = err.stack.split('\n');
  const seperatorIndex = lines[0].lastIndexOf(':');

  // no need to display the entire stack 
  return format(err, [{
    file: path.relative(process.cwd(), lines[0].substr(0, seperatorIndex)),
    line: lines[0].substr(seperatorIndex +1),
    column: ''
  }]);
};
