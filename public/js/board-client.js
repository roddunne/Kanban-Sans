$(document).ready(function(){
    var internalSort = false;

    $( ".sortable" ).sortable({
        revert : true,
		connectWith: ".sortable, #trash",
		containment: "window",
		receive: function(event, ui) {
			var updatedState = {
				taskId : ui.item.prop("id"),
				column : $(this).parents(".column").prop("id"),
				index : ui.item.index()
			};

			$.ajax({
			  type: 'POST',
			  url: '/save',
			  data: updatedState,
//			  success: success,
			  dataType: 'json'
			 });
		},
		update: function(event, ui) {
			internalSort = !ui.sender;
		},
		stop: function(event, ui) {
			if(internalSort) {
				internalSort = false;
			}
		}

    });
    $( "ul, li" ).disableSelection();

	$( "#dialog-form" ).dialog({
		autoOpen: false,
		height: 300,
		width: 350,
		modal: true,
		buttons: {
			"Add task": function() {
				$.ajax({
					type: 'POST',
					url: '/new',
					data: { taskText: $( "#new-task-text" ).val() },
					dataType: 'json',
					success: function(data) {
//						$( "#backlog ul" ).append(
//							'<li id="sticky-'+data._id+'">'+data.text+'</li>');
                        $( "#backlog ul" ).append(
                            '<li id="'+data.task.id+'">'+data.task.text+'</li>');
						$( "#dialog-form" ).dialog( "close" );
					}
				});
			},
			Cancel: function() {
				$( this ).dialog( "close" );
			}
		},
		close: function() {
			$( "#new-task-text" ).val("");
		}
	});

	$( "#create-task" )
		.button()
		.click(function() {
			$( "#dialog-form" ).dialog( "open" );
		});

    $( "#trash" ).droppable({
        accept: ".sortable li",
        drop: function(event, ui) {
            var updatedState = {
                taskId : ui.draggable.prop('id'),
                column : 'trash',
                index : 0
            };
            $.ajax({
                type: 'POST',
                url: '/save',
                data: updatedState,
                success: function() {
                    ui.draggable.remove();
                },
                dataType: 'json',
                error: function() {
                    alert( "Error: Changes could not saved!" );
                }
            });
        }
    });

     $( ".sortable li" ).dblclick(function() {
        $( "#dialog-form form" ).append( '<input type="hidden" name="edit-task-id"' +
            ' id="edit-task-id" value="' + $(this).attr('id') + '"/>');
        $( "#new-task-text" ).val( $(this).text() );

        var targetLi = $(this);

        // save the old buttons
        var oldButtons = $( "#dialog-form" ).dialog( "option", "buttons" );
        var oldTitle = $( "#dialog-form" ).dialog( "option", "title");

        // change the buttons to something a bit more 'edit' appropriate
        $( "#dialog-form" ).dialog( "option", "buttons", [{
            text: "Save",
            click: function() {
                 $.ajax({
                    type: 'POST',
                    url: '/edit',
                    data: {
                        'edit-task-id': $("#edit-task-id").val(),
                        'new-task-text': $("#new-task-text").val()
                    },
                    dataType: 'json',
                    success: function(data) {
//                        alert( JSON.stringify(data) );
//                        targetLi.css( "border", "2px solid red" );
                        targetLi.text( data.task.text );
//                        $( "#"+data.task.id ).text( data.task.text );
                        $( "#dialog-form" ).dialog( "close" );
                    }
                });
            }},{
            text: "Cancel",
            click: function() {
                $(this).dialog( "close" );
            }
        }]);

        $( "#dialog-form" ).dialog("option", "title", "Edit Task");

        // regardless of how the dialog is closed restore it to a "Create Task"
        // dialog
        $( "#dialog-form" ).bind( "dialogclose", function(event, ui) {
            $( "new-task-text" ).val("");
            $( "#edit-task-id" ).remove();
            $(this).dialog( "option", "title", oldTitle );
            $(this).dialog( "option", "buttons", oldButtons );
            $(this).bind( "dialogclose", function() {
                $( "#new-task-text" ).val("");
            });
        });

        $( "#dialog-form" ).dialog( "open" );
    });

});

