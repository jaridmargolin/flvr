'use strict'

/* -----------------------------------------------------------------------------
 * runtime syntax error
 * -------------------------------------------------------------------------- */

const cached = Error.prepareStackTrace
Error.prepareStackTrace = () => null
Error.prepareStackTrace = cached

require('./syntax')
