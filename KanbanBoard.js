/* KanbanBoard.js
 * A class representing a Kanban Board
 */
if( !PersonalKanban ) PersonalKanban = {};

PersonalKanban.KanbanBoard = function(user) {
  this.user = user;
  this.columns = {
    'backlog' : new PersonalKanban.BoardColumn('Backlog'),
    'ready' : new PersonalKanban.BoardColumn('Ready'),
    'doing' : new PersonalKanban.BoardColumn('Doing'),
    'done' : new PersonalKanban.BoardColumn('Done')
  };
}

