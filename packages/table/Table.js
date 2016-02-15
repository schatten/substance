'use strict';

var isArray = require('lodash/isArray');
var cloneDeep = require('lodash/cloneDeep');
var oo = require('../../util/oo');
var BlockNode = require('../../model/BlockNode');
var uuid = require('../../util/uuid');

function Table() {
  Table.super.apply(this, arguments);
}

Table.Prototype = function () {

  this.getSize = function(dimension) {
    var nrows = this.cells.length;
    var ncols = 0;
    if (nrows > 0) {
      ncols = this.cells[0].length;
    }
    if ( dimension === 'row' ) {
      return nrows;
    } else if ( dimension === 'col' ) {
      return ncols;
    } else {
      return [nrows, ncols];
    }
  };

};

oo.inherit(Table, BlockNode);

Table.static.name = "table";

Table.static.defineSchema({
  "cells": { type: ["array", "array", "string"], 'default': [] }
});

Table.create = function(tx, options) {
  var tableData = {
    id: uuid('table'),
    type: 'table',
    cells: []
  };
  if (isArray(options.vals)) {
    tableData.cells = cloneDeep(options.vals);
  } else {
    var nrows = options.rows || 5;
    var ncols = options.cols || 10;
    for(var row = 0; row < nrows; row++) {
      tableData.cells.push(new Array(ncols));
    }
  }
  return tx.create(tableData);
};

Table.getIdForCoordinate = function(row, col) {
  var chars = [];
  while (col > 0) {
    chars.unshift(String.fromCharCode(65 + (col-1)%26));
    col = Math.floor((col-1)/26);
  }
  if (row > 0) {
    return chars.join('') + row;
  } else {
    return chars.join('');
  }
};

module.exports = Table;
