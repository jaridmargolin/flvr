'use strict'

/* -----------------------------------------------------------------------------
 * dependencies
 * -------------------------------------------------------------------------- */

// core
const path = require('path')

// 3rd party
const _ = require('lodash')
const chalk = require('chalk')
const chain = require('stack-chain')
const loadPlugins = require('load-plugins')
const internals = require('stack-utils').nodeInternals()

// lib
const format = require('./format')

/* -----------------------------------------------------------------------------
 * flvr
 * -------------------------------------------------------------------------- */

const flvr = module.exports = function () {
  chain.format._backup()
  flvr.formatOriginal = chain.format._previous

  chain.format.replace(flvr.format)
  chain.filter.attach(flvr.filter)

  _.each(loadPlugins(`flvr-filter-*`, { strip: 'flvr-filter' }), (plugin) => {
    chain.filter.attach(plugin)
  })

  process.on('unhandledRejection', flvr.log)
  process.on('uncaughtException', (err) => {
    flvr.log(err)
    process.exit(0)
  })
}

flvr.format = function (err, frames) {
  // SyntaxError's are decorated with additional information after
  // `prepareStackTrace` and as a result we need to "format" them just
  // prior to loggin
  return err instanceof SyntaxError
    ? flvr.formatOriginal(err, frames)
    : flvr.formatError(err, frames)
}

flvr.filter = function (_err, frames) {
  return _.filter(frames, (frame) => {
    return !_.some(internals, (internal) => internal.test(frame.toString()))
  })
}

flvr.log = function (err) {
  const isSyntaxErr = err instanceof SyntaxError
  const stack = isSyntaxErr ? flvr.formatSyntaxError(err) : err.stack
  const msg = format.msg(err)

  console.log()
  console.error(stack.replace(msg, chalk.red(msg)))
}

/* -----------------------------------------------------------------------------
 * style
 * -------------------------------------------------------------------------- */

flvr.formatError = function (err, frames) {
  return format(err, _.map(frames, (frame) => {
    return {
      file: path.relative(process.cwd(), frame.getFileName()),
      function: frame.getFunctionName(),
      line: frame.getLineNumber(),
      column: frame.getColumnNumber()
    }
  }))
}

flvr.formatSyntaxError = function (err) {
  const lines = err.stack.split('\n')
  const seperatorIndex = lines[0].lastIndexOf(':')

  // no need to display the entire stack
  return format(err, [{
    file: path.relative(process.cwd(), lines[0].substr(0, seperatorIndex)),
    line: lines[0].substr(seperatorIndex + 1),
    column: lines[2].indexOf('^') + 1
  }])
}
