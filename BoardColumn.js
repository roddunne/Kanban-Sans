/* BoardColumn.js
 *
 * A class which represents a column on a Kanban Board
 */

if( !PersonalKanban ) PersonalKanban = {};

PersonalKanban.BoardColumn = function(name) {
  this.name = name;
  this.stickyNotes = [];
}

