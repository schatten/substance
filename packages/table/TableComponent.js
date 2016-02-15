'use strict';

var Component = require('../../ui/Component');
var $$ = Component.$$;

function TableComponent() {
  Component.apply(this, arguments);
}

TableComponent.Prototype = function() {

  this.render = function() {
    var tableEl = $$('table')
      .addClass("content-node table")
      .attr({
        "data-id": this.props.node.id,
        contentEditable: false
      });
    tableEl.append(this.renderTableContent());
    return tableEl;
  };

  this.renderTableContent = function() {
    var node = this.props.node;
    var cells = node.cells;
    var content = [];
    for(var rowIdx = 0; rowIdx < cells.length; rowIdx++) {
      var row = cells[rowIdx];
      var rowEl = $$("tr");
      for (var colIdx = 0; colIdx < row.length; colIdx++) {
        var cell = row[colIdx];
        // ATTENTION: table model is sparse,
        // i.e. empty cells are just null
        var cellEl = $$('td');
        if (cell) {
          cellEl.append(cell);
        } else {
          cellEl.append(' ');
        }
        rowEl.append(cellEl);
      }
      content.push(rowEl);
    }
    return content;
  };
};

Component.extend(TableComponent);

module.exports = TableComponent;
