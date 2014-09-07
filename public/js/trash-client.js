$(document).ready(function(){

    $( "#trash-label" ).click(function() {
        $.ajax({
            type: 'GET',
            url: '/trash',
            dataType: 'json',
            success: function(data) {
                var trashData = data.trashData;
                for( var i=0; i<trashData.length; i++ ) {
                    // make a closure so that the onclick function can have
                    // access to the loop data
                    (function() {
                        var trashItem = trashData[i];

                        $( "#trash-table tbody" ).append(
                            $('<tr>' +
                                '<td>' + trashItem.text + '</td>' +
                                '<td>' + trashItem.deletedFrom + '</td>' +
                                '<td>' + trashItem.deletedOn + '</td>' +
                            '</tr>').append(
                                $("<td></td>").append(
                                    $( "<button>Restore</button>" ).click(function() {
                                        var tableRow = $(this).parents( "tr" );
                                        $.ajax({
                                            type: 'POST',
                                            url: '/restore',
                                            data: { taskId : trashItem.id }, // this will be the correct ID because of the enclosing closure
                                            success: function(data) {
                                                tableRow.remove();
                                                $( "#"+data.restoreTo+" ul" ).append(
                                                    '<li id="'+data.task.id+'">'+data.task.text+'</li>');
                                            }
                                        });
                                    })
                                )
                            )
                        );
                    })(); // call the anonymous function
                }
                $( "#dialog-trash" ).dialog( "open" );
            }
        });
    });

    $( "#dialog-trash" ).dialog({
        autoOpen: false,
        height: 300,
        width: 350,
        modal: true,
        buttons: {
            "Done" : function() {
                $( this ).dialog( "close" );
            }
        },
        close: function() {
            $( "#trash-table tbody" ).empty();
        }
    });

});

