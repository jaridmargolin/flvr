'use strict';

/* -----------------------------------------------------------------------------
 * dependencies
 * ---------------------------------------------------------------------------*/

// core
const fs = require('fs');

// 3rd party
const _ = require('lodash');
const cardinal = require('cardinal');
const stripAnsi = require('strip-ansi');
const chalk = require('chalk');


/* -----------------------------------------------------------------------------
 * codeFrame
 * ---------------------------------------------------------------------------*/

module.exports = function (entry, options={}) {
  const contents = getContents(entry.file);
  const props = {
    errorIndex: entry.line - 1,
    errorColumn: entry.column
  };

  return contents
    ? style(contents, props, options)
    : contents;
};

const getContents = function (file) {
  try {
    return cardinal.highlightFileSync(file, { linenos: true });
  } catch (e) {
    return getFile(file);
  }
};

const getFile = function (file) {
  try {
    return '';
  } catch (e) {
    return null;
  }
};

const style = function (contents, props, options) {
  const context = _.isUndefined(options.context) ? 2 : options.context;
  const lines = contents.split('\n');
  const start = _.clamp(props.errorIndex - context, 0, lines.length);
  const end = _.clamp(props.errorIndex + context, 0, lines.length);

  lines[props.errorIndex] = highlight(lines[props.errorIndex], props.errorColumn);

  return trimEnds(lines.slice(start, end +1)).join('\n');
};

const highlight = function (str, column) {
  return str.replace(/^(.+:)?/, (num) => chalk.bgRed.white(stripAnsi(num)));
};

const trimEnds = function (lines) {
  const firstLine = _.findIndex(lines, isNotEmptyLine);
  const lastLine = _.findLastIndex(lines, isNotEmptyLine);

  return lines.slice(firstLine, lastLine + 1);
};

const isNotEmptyLine = function (line) {
  const cleaned = line.replace(/\s/g, '');
  return cleaned.indexOf(':') !== cleaned.length - 1;
};
