var SurfaceTool = require('../../ui/SurfaceTool');

function InsertTableTool() {
  InsertTableTool.super.apply(this, arguments);
}

InsertTableTool.Prototype = function() {
};

SurfaceTool.extend(InsertTableTool);

InsertTableTool.static.name = 'insertTable';
InsertTableTool.static.command = 'insertTable';

module.exports = InsertTableTool;
