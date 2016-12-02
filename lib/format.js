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

// lib
const codeFrame = require('./code-frame');


/* -----------------------------------------------------------------------------
 * format
 * ---------------------------------------------------------------------------*/

const format = module.exports = function (err, entries) {
  const parts = [format.msg(err)];

  if (entries.length) {
    parts.push(format.entries(entries))
  }

  return '\n' + parts.join('\n\n');
};

format.msg = function (err) {
  return chalk.red(`${figures.cross} ${err.name}: ${err.message}`);
};

format.entries = function (entries) {
  const frame = codeFrame(entries[0]);
  const trace = format.trace(entries);

  const parts = [];
  if (frame) { parts.push(frame); }
  if (trace) { parts.push(trace); }

  return parts.join('\n\n');
};

format.trace = function (entries=[]) {
  return _.map(entries, (entry, i) => {
    return format.entry(entry, i ? figures.arrowRight : '@');
  }).join('\n');
};

format.entry = function (entry, prefix) {
  return [
    `${prefix} ${format.entryInfo(entry)}`,
    `  ${format.entryDetailed(entry)}`
  ].join('\n');
};

format.entryInfo = function (entry) {
  const fn = _.trim(entry.function);
  const loc = _.compact([path.basename(entry.file), entry.line]).join(':');
  const contents = _.compact([fn, loc]).join(' ');

  return chalk.bold(contents);
};

format.entryDetailed = function (entry) {
  const file = format._substitueModule(entry.file);
  const contents = _.compact([file, entry.line, entry.column]).join(':');

  return chalk.dim(contents);
};


/* -----------------------------------------------------------------------------
 * utils
 * ---------------------------------------------------------------------------*/

format._substitueModule = function (file) {
  return file.replace(/node_modules\/([^\/]+)\/(.*?)/g, '($1)/$2');
};
