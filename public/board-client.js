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
});

