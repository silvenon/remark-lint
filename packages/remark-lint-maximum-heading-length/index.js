/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module maximum-heading-length
 * @fileoverview
 *   Warn when headings are too long.
 *
 *   Options: `number`, default: `60`.
 *
 *   Ignores Markdown syntax, only checks the plain text content.
 *
 * @example {"name": "ok.md"}
 *
 *   # Alpha bravo charlie delta echo foxtrot golf hotel
 *
 *   # ![Alpha bravo charlie delta echo foxtrot golf hotel](http://example.com/nato.png)
 *
 * @example {"name": "not-ok.md", "setting": 40, "label": "input"}
 *
 *   # Alpha bravo charlie delta echo foxtrot golf hotel
 *
 * @example {"name": "not-ok.md", "setting": 40, "label": "output"}
 *
 *   1:1-1:52: Use headings shorter than `40`
 */

'use strict'

var rule = require('unified-lint-rule')
var visit = require('unist-util-visit')
var generated = require('unist-util-generated')
var toString = require('mdast-util-to-string')

module.exports = rule(
  'remark-lint:maximum-heading-length',
  maximumHeadingLength
)

function maximumHeadingLength(tree, file, option) {
  var preferred = typeof option === 'number' && !isNaN(option) ? option : 60

  visit(tree, 'heading', visitor)

  function visitor(node) {
    if (!generated(node) && toString(node).length > preferred) {
      file.message('Use headings shorter than `' + preferred + '`', node)
    }
  }
}
