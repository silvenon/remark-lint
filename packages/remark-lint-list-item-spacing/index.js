/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module list-item-spacing
 * @fileoverview
 *   Warn when list looseness is incorrect, such as being tight
 *   when it should be loose, and vice versa.
 *
 *   According to the [markdown-style-guide](http://www.cirosantilli.com/markdown-style-guide/),
 *   if one or more list-items in a list spans more than one line,
 *   the list is required to have blank lines between each item.
 *   And otherwise, there should not be blank lines between items.
 *
 *   By default, all items must be “loose” (a blank line must be between
 *   them) if one or more items are multiline (span more than one line).
 *   Otherwise, the list must be tight (no blank line must be between
 *   items).
 *
 *   If you pass `{checkBlanks: true}`, all items must be “loose” if one or
 *   more items contain blank lines.  Otherwise, the list must be tight.
 *
 * @example {"name": "valid.md"}
 *
 *   A tight list:
 *
 *   -   item 1
 *   -   item 2
 *   -   item 3
 *
 *   A loose list:
 *
 *   -   Wrapped
 *       item
 *
 *   -   item 2
 *
 *   -   item 3
 *
 * @example {"name": "invalid.md", "label": "input"}
 *
 *   A tight list:
 *
 *   -   Wrapped
 *       item
 *   -   item 2
 *   -   item 3
 *
 *   A loose list:
 *
 *   -   item 1
 *
 *   -   item 2
 *
 *   -   item 3
 *
 * @example {"name": "invalid.md", "label": "output"}
 *
 *   4:9-5:1: Missing new line after list item
 *   5:11-6:1: Missing new line after list item
 *   11:1-12:1: Extraneous new line after list item
 *   13:1-14:1: Extraneous new line after list item
 *
 * @example {"name": "valid.md", "setting": {"checkBlanks": true}}
 *
 *   A tight list:
 *
 *   -   item 1
 *       - item 1.A
 *   -   item 2
 *       > Blockquote
 *   -   item 3
 *       ```js
 *       code()
 *       ```
 *
 *   A loose list:
 *
 *   -   item 1
 *
 *       - item 1.A
 *
 *   -   item 2
 *
 *       > Blockquote
 *
 *   -   item 3
 *
 *       ```js
 *       code()
 *       ```
 *
 * @example {"name": "invalid.md", "setting": {"checkBlanks": true}, "label": "input"}
 *
 *   A tight list:
 *
 *   -   item 1
 *
 *       - item 1.A
 *   -   item 2
 *
 *       > Blockquote
 *   -   item 3
 *
 *       ```js
 *       code()
 *       ```
 *
 *   A loose list:
 *
 *   -   item 1
 *       - item 1.A
 *
 *   -   item 2
 *       > Blockquote
 *
 *   -   item 3
 *       ```js
 *       code()
 *       ```
 *
 * @example {"name": "invalid.md", "setting": {"checkBlanks": true}, "label": "output"}
 *
 *   5:15-6:1: Missing new line after list item
 *   8:17-9:1: Missing new line after list item
 *   19:1-20:1: Extraneous new line after list item
 *   22:1-23:1: Extraneous new line after list item
 */

'use strict';

var rule = require('unified-lint-rule');
var visit = require('unist-util-visit');
var position = require('unist-util-position');
var generated = require('unist-util-generated');

module.exports = rule('remark-lint:list-item-spacing', listItemSpacing);

var start = position.start;
var end = position.end;

function listItemSpacing(ast, file, preferred) {
  var blanks = Boolean(
    preferred &&
    typeof preferred === 'object' &&
    preferred.checkBlanks
  );

  visit(ast, 'list', visitor);

  function visitor(node) {
    var items = node.children;
    var isTightList = true;
    var indent = start(node).column;
    var type;

    if (generated(node)) {
      return;
    }

    items.forEach(infer);

    type = isTightList ? 'tight' : 'loose';

    items.forEach(warn);

    function infer(item) {
      var fn = blanks ? inferBlankLine : inferMultiline;

      if (fn(item)) {
        isTightList = false;
      }
    }

    function inferBlankLine(item) {
      var children = item.children;
      var length = children.length;
      var index = 0;
      var child = children[index];
      var next;

      while (++index < length) {
        next = children[index];

        /* All children in `listItem`s are block. */
        if ((start(next).line - end(child).line) > 1) {
          return true;
        }

        child = next;
      }

      return false;
    }

    function inferMultiline(item) {
      var content = item.children;
      var head = content[0];
      var tail = content[content.length - 1];
      return (end(tail).line - start(head).line) > 0;
    }

    function warn(item, index) {
      var next = items[index + 1];
      var isTight = end(item).column > indent;

      /* Ignore last. */
      if (!next) {
        return;
      }

      /* Check if the list item's state does (not)
       * match the list's state. */
      if (isTight !== isTightList) {
        if (type === 'loose') {
          file.message('Missing new line after list item', {
            start: end(item),
            end: start(next)
          });
        } else {
          file.message('Extraneous new line after list item', {
            start: end(item),
            end: start(next)
          });
        }
      }
    }
  }
}
