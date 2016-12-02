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
const codeFrame = require('./code-frame');


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
  return flvr.stack(err, flvr.entriesFromStack(stack || err.stack));
};

flvr.formatSyntaxError = function (err) {
  const lines = err.stack.split('\n');
  const seperatorIndex = lines[0].lastIndexOf(':');

  // no need to display the entire stack 
  return flvr.stack(err, [{
    file: path.relative(process.cwd(), lines[0].substr(0, seperatorIndex)),
    line: lines[0].substr(seperatorIndex +1),
    column: ''
  }]);
};


/* -----------------------------------------------------------------------------
 * format
 * ---------------------------------------------------------------------------*/

flvr.errMsg = function (err) {
  return chalk.red(`${figures.cross} ${err.name}: ${err.message}`);
};

flvr.stack = function (err, entries) {
  const parts = [flvr.errMsg(err)];

  if (entries.length) {
    parts.push(flvr.entries(entries))
  }

  return '\n' + parts.join('\n\n');
};

flvr.entries = function (entries) {
  const loc = flvr.errLoc(entries[0]);
  const frame = codeFrame(entries[0]);
  const trace = flvr.trace(_.tail(entries));

  const parts = [];
  if (loc) { parts.push(loc); }
  if (frame) { parts.push(frame); }
  if (trace) { parts.push(trace); }

  return parts.join('\n\n');
};

flvr.errLoc = function (entry) {
  return flvr.entry(entry, '@');
};

flvr.trace = function (entries=[]) {
  return _.map(entries, (entry) => flvr.entry(entry, figures.arrowRight)).join('\n');
};

flvr.entry = function (entry, prefix) {
  return [
    `${prefix} ${flvr.entryInfo(entry)}`,
    `  ${flvr.entryDetailed(entry)}`
  ].join('\n');
};

flvr.entryInfo = function (entry) {
  const fn = _.trim(entry.function);
  const loc = _.compact([path.basename(entry.file), entry.line]).join(':');
  const contents = _.compact([fn, loc]).join(' ');

  return chalk.bold(contents);
};

flvr.entryDetailed = function (entry) {
  const file = flvr._substitueModule(entry.file);
  const contents = _.compact([file, entry.line, entry.column]).join(':');

  return chalk.dim(contents);
};


/* -----------------------------------------------------------------------------
 * utils
 * ---------------------------------------------------------------------------*/

flvr._substitueModule = function (file) {
  return file.replace(/node_modules\/([^\/]+)\/(.*?)/g, '($1)/$2');
};
