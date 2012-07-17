/* StickyNote.js
 * 
 * Class representing a StickyNote, sometimes called a Post-It Note.
 */

// IFNDEF namespace DEFINE it!
if( !PersonalKanban ) PersonalKanban = {};

PersonalKanban.StickyNote = function (text) {
  this.color = "yellow";
  this.text = text;
}
