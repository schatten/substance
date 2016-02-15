'use strict';

var each = require('lodash/each');
var Component = require('../../ui/Component');
var TextProperty = require('../../ui/TextPropertyComponent');
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
    // HACK: make sure row col indexes are up2date
    this.props.node.getMatrix();
    tableEl.append(this.renderTableContent());
    return tableEl;
  };

  this.renderTableContent = function() {
    var content = [];
    each(this.props.node.getSections(), function(sec) {
      var secEl = $$(sec.sectionType).key(sec.id);
      each(sec.getRows(), function(row) {
        var rowEl = $$("tr").attr("data-id", row.id);
        each(row.getCells(), function(cell) {
          var cellEl = $$((cell.cellType === 'head') ? 'th' : 'td')
            .attr({
              "data-id": cell.id,
              "data-row": cell.rowIdx,
              "data-col": cell.colIdx,
            });
          if (cell.colspan) {
            cellEl.attr("colspan", cell.colspan);
          }
          if (cell.rowspan) {
            cellEl.attr('rowspan', cell.rowspan);
          }
          cellEl.append($$(TextProperty, {
            path: [ cell.id, "content"]
          }));
          rowEl.append(cellEl);
        }.bind(this));
        secEl.append(rowEl);
      }.bind(this));
      content.push(secEl);
    }.bind(this));
    return content;
  };
};

Component.extend(TableComponent);

module.exports = TableComponent;
