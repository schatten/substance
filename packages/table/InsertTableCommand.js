'use strict';

var SurfaceCommand = require('../../ui/SurfaceCommand');
var Table = require('./Table');
var insertNode = require('../../model/transform/insertNode');

function InsertTableCommand() {
  InsertTableCommand.super.apply(this, arguments);
}

InsertTableCommand.Prototype = function() {

  this.getCommandState = function() {
    var sel = this.getSelection();
    var newState = {
      disabled: true,
      active: false
    };
    if (sel && !sel.isNull() && sel.isPropertySelection()) {
      newState.disabled = false;
    }
    return newState;
  };

  this.execute = function() {
    var state = this.getCommandState();

    if (state.disabled) return;

    var surface = this.getSurface();
    surface.transaction(function(tx, args) {
      var table = Table.create(tx, {
        header: true,
        rows: 5,
        cols: 10
      });
      args.node = table;
      insertNode(tx, args);
      return args;
    });
  };

};

SurfaceCommand.extend(InsertTableCommand);

InsertTableCommand.static.name = 'insertTable';

module.exports = InsertTableCommand;