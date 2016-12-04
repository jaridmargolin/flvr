'use strict';

/* -----------------------------------------------------------------------------
 * dependencies
 * ---------------------------------------------------------------------------*/

// core
const path = require('path');

// 3rd party
const _ = require('lodash');
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

  process.on('unhandledRejection', flvr.log);
  process.on('uncaughtException', (err) => {
    flvr.log(err);
    process.exit(0);
  });
}

flvr.prepareStackTrace = function (err, frames) {
  const rawStack = frames.map((frame) => `    at ${frame.toString()}`).join('\n');

  // SyntaxError's are decorated with additional information after
  // `prepareStackTrace` and as a result we need to "format" them just
  // prior to loggin
  return err instanceof SyntaxError
    ? rawStack
    : flvr.styleError(err, rawStack);
};

flvr.log = function (err) {
  console.error(err instanceof SyntaxError
    ? flvr.styleSyntaxError(err)
    : err.stack);
};


/* -----------------------------------------------------------------------------
 * style
 * ---------------------------------------------------------------------------*/

flvr.styleError = function (err, stack) {
  const entries = _.chain(stackUtils.clean(stack || err.stack).split('\n'))
    .map((entry) => _.mapValues(stackUtils.parseLine(entry), _.trim))
    .reject((entry) => _.isNull(entry) || _.isEmpty(entry) || _.isUndefined(entry))
    .value();

  return format(err, entries);
};

flvr.styleSyntaxError = function (err) {
  const lines = err.stack.split('\n');
  const seperatorIndex = lines[0].lastIndexOf(':');

  // no need to display the entire stack 
  return format(err, [{
    file: path.relative(process.cwd(), lines[0].substr(0, seperatorIndex)),
    line: lines[0].substr(seperatorIndex +1),
    column: lines[2].indexOf('^') +1
  }]);
};
