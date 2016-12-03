'use strict';

/* -----------------------------------------------------------------------------
 * dependencies
 * ---------------------------------------------------------------------------*/

// core
const fs = require('fs');

// 3rd party
const _ = require('lodash');
const highlightEs = require('highlight-es');
const stripAnsi = require('strip-ansi');
const chalk = require('chalk');
const figures = require('figures');

// lib
const utils = require('./utils');


/* -----------------------------------------------------------------------------
 * codeFrame
 * ---------------------------------------------------------------------------*/

module.exports = function (entry, options={}) {
  _.defaults(options, { context: 2 });

  try {
    return style(fs.readFileSync(entry.file, { encoding: 'utf-8' }), entry, options);
  } catch (e) {
    return null;
  }
};

const style = function (contents, entry, options) {
  return crop(addLineNos(highlight(contents, entry).split('\n'), entry),
    entry.line -1, options.context).join('\n');
};

const highlight = function (contents, entry) {
  const errMarker = '🤘😝🤘';
  const errIndex = utils.indexAt(contents, entry.line, entry.column);
  const errChar = contents[errIndex];

  return highlightEs(markError(contents, errIndex, errMarker))
    .replace(errMarker, chalk.inverse(errChar));
};

const markError = function (str, index, marker) {
  return str.substr(0, index) + marker + str.substr(index +1);
};

const addLineNos = function (lines, entry) {
  const padLength = lines.length.toString().length;

  return _.map(lines, (line, i) => {
    return addLineNo(_.padStart(i + 1, padLength), line, i === entry.line -1);
  });
};

const addLineNo = function (lineNo, line, isErrorLine) {
  return isErrorLine
    ? chalk.bgRed.white(` ${figures.pointer} ${lineNo} `) + `| ${line}`
    : `   ${lineNo} | ${line}`;
};

const crop = function (lines, errIndex, context) {
  const start = _.clamp(errIndex - context, 0, lines.length);
  const end = _.clamp(errIndex + context, 0, lines.length);

  return trim(lines.slice(start, end +1));
};

const trim = function (lines) {
  const firstLine = _.findIndex(lines, isNotEmptyLine);
  const lastLine = _.findLastIndex(lines, isNotEmptyLine);

  return lines.slice(firstLine, lastLine + 1);
};

const isNotEmptyLine = function (line) {
  const cleaned = line.replace(/\s/g, '');
  return cleaned.indexOf('|') !== cleaned.length - 1;
};
