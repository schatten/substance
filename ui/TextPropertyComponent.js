/* jshint latedef:nofunc */
'use strict';

var platform = require('../util/platform');
var AnnotatedTextComponent = require('./AnnotatedTextComponent');
var Component = require('./Component');
var $$ = Component.$$;

var Coordinate = require('../model/Coordinate');
var PropertySelection = require('../model/PropertySelection');

/**
  Renders a text property. Used internally by different components to render editable text.

  @class
  @component
  @extends ui/AnnotatedTextComponent

  @prop {String[]} path path to a text property
  @prop {String} [tagName] specifies which tag should be used - defaults to `div`

  @example

  ```js
  $$(TextProperty, {
    path: [ 'paragraph-1', 'content']
  })
  ```
*/

function TextPropertyComponent() {
  TextPropertyComponent.super.apply(this, arguments);
}

TextPropertyComponent.Prototype = function() {

  var _super = Object.getPrototypeOf(this);

  this.render = function() {
    var path = this.props.path;

    // var el = $$(this.props.tagName || 'span')
    var el = $$('div')
      .addClass('sc-text-property')
      .attr({
        "data-path": path.join('.'),
        spellCheck: false,
      })
      .css({
        whiteSpace: "pre-wrap"
      });

    // Note: inspired by Slack's editor we render the content twice
    // once with selections as a display, and once for selections and events
    // as an invisible ContentEditable

    var text = this.getText();

    // for displaying we render with all fragments
    var display = $$(TextContent, {
      text: text,
      annotations: this.getAnnotationsAndFragments()
    });
    display
      .addClass('sm-displayed')
      .ref('display')
      .attr('tabindex', -1);
    el.append(display);

    if (this.isEditable()) {
      // for contentEditable without selections
      var editable = $$(TextContent, {
        text: text,
        annotations: this.getAnnotations(),
        editable: true
      });
      editable.addClass('sm-shadowed')
        .attr({ contentEditable: true });
      // Keyboard Events
      editable.on('keydown', this.onKeyDown);
      // OSX specific handling of dead-keys
      if (!platform.isIE) {
        editable.on('compositionstart', this.onCompositionStart);
      }
      // Note: TextEvent in Chrome/Webkit is the easiest for us
      // as it contains the actual inserted string.
      // Though, it is not available in FF and not working properly in IE
      // where we fall back to a ContentEditable backed implementation.
      if (window.TextEvent && !platform.isIE) {
        editable.on('textInput', this.onTextInput);
      } else {
        editable.on('keypress', this.onKeyPress);
      }

      // Mouse Events
      editable.on('mousedown', this.onMouseDown);
      el.append(editable);
    }

    return el;
  };

  this.didMount = function() {
    var surface = this.getSurface();
    if (surface) {
      surface._registerTextProperty(this.props.path, this);
    }
  };

  this.dispose = function() {
    _super.dispose.call(this);
    var surface = this.getSurface();
    if (surface) {
      surface._unregisterTextProperty(this.props.path, this);
    }
  };

  this.getText = function() {
    return this.getDocument().get(this.props.path);
  };

  this.getAnnotations = function() {
    return this.getDocument().getIndex('annotations').get(this.props.path);
  };

  this.getAnnotationsAndFragments = function() {
    var annotations = this.getAnnotations();
    var fragments = this.getSurface()._getFragments(this.props.path);
    if (fragments) {
      annotations = annotations.concat(fragments);
    }
    return annotations;
  };

  this.setFragments = function() {
    this.children[0].extendProps({ annotations: this.getAnnotationsAndFragments() });
  };

  this.getDocument = function() {
    return this.props.doc ||this.context.doc;
  };

  this.getController = function() {
    return this.props.controller || this.context.controller;
  };

  this.getSurface = function() {
    return this.props.surface ||this.context.surface;
  };

  this.isEditable = function() {
    return this.getSurface().isEditable();
  };

  this.isReadonly = function() {
    return this.getSurface().isReadonly();
  };

  this.onKeyDown = function(event) {
    this.getSurface().onKeyDown(event);
  };

  this.onKeyPress = function(event) {
    this.getSurface().onTextInputShim(event);
  };

  this.onTextInput = function(event) {
    this.getSurface().onTextInput(event);
  };

  this.onCompositionStart = function(event) {
    this.getSurface().onCompositionStart(event);
  };

  this.onMouseDown = function() {
    setTimeout(function() {
      var range = window.getSelection().getRangeAt(0);
      var path = this.props.path;
      var pos = this._getCharPos(range.startContainer, range.startOffset);
      var coor = new Coordinate(path, pos);
      var sel = new PropertySelection(coor);
      console.log('TextPropertyComponent.onMouseDown(): sel=', sel);
      this.getSurface().setSelection(sel);
    }.bind(this));
  };

  // DOM selection mapping

  this._getCharPos = function(node, offset) {
    var charPos = offset;
    var parent;
    // Cases:
    // 1. node is a text node and has no previous sibling
    // => parent is either the property or an annotation
    if (node.nodeType === 3) {
      if (offset === -1) {
        charPos = node.length;
      }
      if (!node.previousSibling) {
        parent = node.parentNode;
        if (parent.dataset.hasOwnProperty('offset')) {
          charPos += parseInt(parent.dataset.offset, 10);
        }
      } else {
       node = node.previousSibling;
       charPos += this._getCharPos(node, -1);
      }
    } else if (node.nodeType === 1 && offset === -1) {
      if (node.dataset && node.dataset.length) {
        return parseInt(node.dataset.offset, 10) + parseInt(node.dataset.length, 10);
      }
      // TODO: compute last charPos
      // i.e. ~ startPos + length of el
      console.error('Case is not supported yet.');
    } else {
      console.error('Case is not supported yet.');
    }
    return charPos;
  };

  this._getEditableElement = function() {
    var editable = this.children[1];
    if (editable) {
      return editable.el;
    }
    return null;
  };

  this._getDOMCoordinate = function(el, offset, nodeIdx) {
    var l;
    var idx = 0;
    for (var child = el.firstChild; child; child=child.nextSibling, idx++) {
      if (child.nodeType === 3) {
        l = child.length;
        if (l >= offset) {
          return {
            container: child,
            offset: offset
          };
        } else {
          offset -= l;
        }
      } else if (child.nodeType === 1) {
        if (child.dataset && child.dataset.length) {
          l = parseInt(child.dataset.length, 10);
          if (l>= offset) {
            return this._getDOMCoordinate(child, offset, idx);
          } else {
            offset -= l;
          }
        } else {
          throw new Error('Case is not supported yet.');
          // console.log('')
          // var res = this._getDOMCoordinate(child, offset, idx);
          // if (res) {
          //   return res;
          // }
        }
      }
    }
  };

  this._setDOMCursor = function(offset) {
    var contentEl = this._getEditableElement();
    if (!contentEl) {
      return;
    }
    var coor = this._getDOMCoordinate(contentEl, offset);
    if (!coor) {
      return;
    }
    var wSel = window.getSelection();
    var wRange;
    if (wSel.rangeCount !== 0) {
      wSel.removeAllRanges();
    }
    wRange = window.document.createRange();
    wRange.setStart(coor.container, coor.offset);
    wSel.addRange(wRange);
  };

};

Component.extend(TextPropertyComponent);

function TextContent() {
  TextContent.super.apply(this, arguments);
}

TextContent.Prototype = function() {

  var _super = Object.getPrototypeOf(this);

  this.render = function() {
    var el = this._renderContent()
      .css({
        whiteSpace: "pre-wrap"
      });
    el.append($$('br'));
    return el;
  };

  this._renderFragment = function(fragment) {
    var node = fragment.node;
    var id = node.id;
    if (node.type === 'cursor') {
      return $$('span').addClass('se-cursor');
    } else if (node.type === 'selection-fragment') {
      return $$('span').addClass('se-selection-fragment');
    }
    var el = _super._renderFragment.call(this, fragment);
    if (this.props.editable) {
      if (node.constructor.static.isInline) {
        el.attr({
          'contentEditable': false,
          'data-inline':'1',
          'data-length': 1
        });
      }
      el.attr('data-offset', fragment.pos);
    }
    // adding refs here, enables preservative rerendering
    // TODO: while this solves problems with rerendering inline nodes
    // with external content, it decreases the overall performance too much.
    // We should optimize the component first before we can enable this.
    if (this.context.config && this.context.config.preservativeTextPropertyRendering) {
      el.ref(id + "@" + fragment.counter);
    }
    return el;
  };

  this._finishFragment = function(fragment, context, parentContext) {
    if (this.props.editable) {
      context.attr('data-length', fragment.length);
    }
    parentContext.append(context);
  };

};

AnnotatedTextComponent.extend(TextContent);

module.exports = TextPropertyComponent;
