'use strict';

var AnnotatedTextComponent = require('./AnnotatedTextComponent');
var Component = require('./Component');
var $$ = Component.$$;

/**
  Renders a text property. Used internally by different components (e.g. ui/TextPropertyEditor)

  @class
  @component
  @extends ui/Component

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

  this.render = function() {
    // TODO: we want to render the content twice
    // once with selections
    // and once into an invisible representation which is used by the
    // for ContentEditable

    var doc = this.getDocument();
    var path = this.getPath();
    var text = doc.get(path) || "";

    var content1 = this._renderText(text, this.getAnnotations());
    content1.addClass('sm-displayed');
    var content2 = this._renderText(text, this.getAnnotations(true));
    content2.addClass('sm-shadowed')
      .attr({
        contentEditable: true
      });

    var annotations = this.getAnnotations('withFragments');
    var content = this._renderText(text, annotations);

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
    el.append(content1);
    el.append(content2);
    return el;
  };


  this.getAnnotations = function(withoutFragments) {
    var doc = this.getDocument();
    var annotations = doc.getIndex('annotations').get(this.props.path);
    if (withoutFragments) {
      return annotations;
    }
    var fragments = this.getSurface()._getFragments(this.props.path);
    if (fragments) {
      annotations = annotations.concat(fragments);
    }
    return annotations;
  };

  this.getContainer = function() {
    return this.getSurface().getContainer();
  };

  this.getController = function() {
    return this.context.controller;
  };

  this.getDocument = function() {
    return this.context.doc;
  };

  this.getElement = function() {
    return this.$el[0];
  };

  this.getSurface = function() {
    return this.context.surface;
  };
};

AnnotatedTextComponent.extend(TextPropertyComponent);

module.exports = TextPropertyComponent;
