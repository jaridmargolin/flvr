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
const indentString = require('indent-string');

// lib
const codeframe = require('codeframe');


/* -----------------------------------------------------------------------------
 * format
 * ---------------------------------------------------------------------------*/

const format = module.exports = function (err, entries) {
  const parts = [format.msg(err)];

  if (entries.length) {
    parts.push(indentString(format.entries(entries), 4));
  }

  return parts.join('\n\n');
};

format.msg = function (err) {
  return `${figures.cross} ${err.name}: ${format._clean(err.message)}`;
};

format.entries = function (entries) {
  const frame = codeframe.get(entries[0]);
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

format._clean = function (str) {
  return format._substitueModule(format._removeCwd(str));
};

format._removeCwd = function (str) {
  return str.replace(process.cwd() + '/', '');
};

format._substitueModule = function (str) {
  return str.replace(/node_modules\/([^\/]+)\/(.*?)/g, '($1)/$2');
};
