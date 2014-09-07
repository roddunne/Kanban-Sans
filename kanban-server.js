var express = require('express'), app = express.createServer();
var MongoStore = require('connect-mongo')(express);

var UserMapper = require('./usermapper-mongodb').UserMapper;
var BoardMapper = require('./boardmapper-mongodb').BoardMapper;

app.configure(function ()
{
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.set('view options', { layout: false });

    app.use(express.bodyParser());
    app.use(express.methodOverride());

    app.use(express.cookieParser());
    app.use(express.session({
        secret : "keyboard cat",
        maxAge : new Date(Date.now() + 3600000), //1 Hour
        store  : new MongoStore({ db: 'test' })
    }));

    app.use(app.router);

    app.use('/public', express.static(__dirname + '/public'));
});

var ObjectID = require('mongodb').ObjectID;

var userMapper = new UserMapper("127.0.0.1", 27017);
var boardMapper = new BoardMapper("127.0.0.1", 27017);

app.post('/rpc', function(req, res) {

    var update = req.body;

    var task = board.getTask( update.taskId );
    task.column.remove( task );

    var newColumn = board.getColumn( update.columnId );
    newColumn.insert( task, update.index );

});

app.post('/save', function(req, res) {
    console.log("Got post "+res.statusCode);

    var updatedState = req.body;
    console.log("Aparently "+updatedState.taskId+
                " is now at position "+updatedState.index+
                " in "+updatedState.column);

    boardMapper.findByEmail( req.session.userDetails.user, function(error, board) {
        var oldColumn = null;
        var newColumn = null;
        var sticky = null;

        for(var i=0; i<board.columns.length; i++) {
            var column = board.columns[i];
            if( column.id == updatedState.column ) {
                newColumn = column;
            }

            for(var j=0; j<column.stickyNotes.length; j++ ) {
                var stickyNote = column.stickyNotes[j];
                if( stickyNote.id == updatedState.taskId ) {
                    oldColumn = column;
                    sticky = stickyNote;
                    break;
                }
            }
        }

        if( updatedState.column == "trash" ) {
            sticky.deletedFrom = oldColumn.id;
            sticky.deletedOn = new Date();

            if( !board.trash ) {
                board.trash = { id : 'trash', name : 'Trash', stickyNotes : [] };
            }
            newColumn = board.trash;
        }

        oldColumn.stickyNotes.splice( oldColumn.stickyNotes.indexOf( sticky ), 1 );
        newColumn.stickyNotes.splice( updatedState.index, 0, sticky );

        boardMapper.update( board, function(error, board) {
            res.json({"result":"success"});
        });
    });
});

app.post('/edit', function(req, res) {
    console.log("POST on /edit "+JSON.stringify(req.body));

    var errorResponse = { result: 'error' };
    var editData = req.body;

    if( authenticationHelper.isAuthenticated(req.session) ) {
        boardMapper.findByEmail( req.session.userDetails.user, function(error, board) {
            if(error) {
                errorResponse.message = error;
                res.json( errorResponse );
            }
            else {
                var kanbanBoard = new KanbanBoard(board);
                console.log( JSON.stringify( kanbanBoard ));

                var task = kanbanBoard.findTask( editData['edit-task-id'] );
                if( task ) {
                    task.text = editData['new-task-text'];
                    boardMapper.update( kanbanBoard.data, function(error, updatedBoard) {
                        if(error) {
                            errorResponse.message = error;
                            res.json( errorResponse );
                        }
                        else {
                            var updatedKanbanBoard = new KanbanBoard(board);
                            res.json({
                                result: 'success',
                                task: updatedKanbanBoard.findTask( editData['edit-task-id'] )
                            });
                        }
                    });
                }
                else {
                    errorResponse.message = 'Task not found';
                    res.json( errorResponse );
                }
            }
        });
    }
    else {
        errorResponse.message = 'Session Required';
        res.json( errorResponse );
    }
});

app.post('/new', function(req, res) {
    console.log("Got post "+res.statusCode);

    var newTask = {
        id : ObjectID(),
        text : req.body ? req.body.taskText : '',
        column : 'backlog'
    };
    console.log("New task with text "+newTask.text);
    boardMapper.findByEmail( req.session.userDetails.user, function(error, board) {
        if( error ) {
            res.render('error.jade', { locals : { errorMessage : error } });
        }
        else {
            for( var i=0; i<board.columns.length; i++) {
                if( newTask.column == board.columns[i].id ) {
                    board.columns[i].stickyNotes.push( newTask );
                    boardMapper.update( board, function(error, board) {
                        res.json({
                            "result" : "success",
                            "task" : newTask
                        });
                    });
                    return;
                }
            }
        }
    });
});


var bcrypt = require('bcrypt');
app.post('/login', function(req, res) {
    console.log("Got post on /login "+res.statusCode);

    var email = req.param('email'),
        password = req.param('password');

    userMapper.findByEmail(email, function(error, dbUser) {
        if(dbUser && bcrypt.compareSync(password, dbUser.passwordHash)) {
            req.session.userDetails = {
                user: dbUser.email,
                loggedIn: true
            };
            res.redirect('/show_board');
        }
        else {
            res.render('login.jade', { locals: {
                authenticationFailed : true,
                email : req.param('email')
            }});
        }});
});

app.get('/show_board', authenticateUser, function(req, res) {
    console.log( req.session );
//    if( req.session.userDetails && req.session.userDetails.loggedIn ) {
        boardMapper.findByEmail( req.session.userDetails.user, function(error, board) {
            if(error) {
                res.redirect('/public/fail.html');
            }
            else {
                res.render('board.jade', { locals: {
                  title: req.session.userDetails.user+"'s Kanban Board",
                  columns: board.columns
                }});
            }
        });
//    }
//    else {
//        res.redirect('/public/login.html');
//    }
});

app.get('/trash', function(req, res) {
    var errorResponse = { result : 'error' };
    if( req.session.userDetails && req.session.userDetails.loggedIn ) {
        boardMapper.findByEmail( req.session.userDetails.user, function(error, board) {
            if(error) {
                errorResponse.message = error;
                res.json(errorResponse);
            }
            else {
                console.log("/trash "+JSON.stringify((board.trash) ? board.trash.stickyNotes : []));
                res.json({
                    result: 'success',
                    trashData: (board.trash) ? board.trash.stickyNotes : []
                });
            }
        });
    }
    else {
        errorResponse.message = 'Session Required';
        res.json(errorResponse);
    }
});

var authenticationHelper = {
    isAuthenticated: function(session) {
        return (session.userDetails && session.userDetails.loggedIn);
    }
};

function authenticateUser(req, res, next) {
    var session = req.session;
    if(session.userDetails && session.userDetails.loggedIn) {
        next();
    }
    else {
        res.redirect('/public/login.html');
    }
}

app.post('/restore', function(req, res) {
    console.log("POST /restore FENTRY");

    var errorResponse = { result: 'error' };
    var restoreData = req.body;

    // make sure we have a session and the user is authenticated
    if( authenticationHelper.isAuthenticated(req.session) ) {
        boardMapper.findByEmail( req.session.userDetails.user, function(error, board) {
            if(error) {
                errorResponse.message = error;
                res.json(errorResponse);
            }
            else {
                var trash = (board.trash) ? board.trash.stickyNotes : [];

                console.log( "need to restore task #"+restoreData.taskId );
                var targetIndex = -1;
                for( var i=0; i<trash.length; i++) {
                    var trashItem = trash[i];

                    if( trashItem.id == restoreData.taskId ) {
                        targetIndex = i;
                        break;
                    }
                }
                console.log( "targetIndex is "+targetIndex );
                var restoreMe = trash[targetIndex];
                var restoreToColumn = restoreMe.deletedFrom;
                console.log( "restoreToColumn "+restoreToColumn );
                for(var i=0; i<board.columns.length; i++) {
                    var column = board.columns[i];
                    if( column.id == restoreToColumn ) {
                        column.stickyNotes.push( restoreMe );
                        delete restoreMe.deletedFrom;
                        delete restoreMe.deletedOn;
                        break;
                    }
                }
                trash.splice(targetIndex, 1);

                boardMapper.update(board, function( error, updatedBoard ) {
                    if(error) {
                        errorResponse.message = error;
                        res.json(errorResponse);
                    }
                    else {
                        console.log( "Restoring "+JSON.stringify(restoreMe)+" to "+restoreToColumn );
                        res.json({
                            result: 'success',
                            restoreTo: restoreToColumn,
                            task: restoreMe
                        });
                    }
                });

            }
        });
    }
    else {
        // this is an RPC call so we don't redirect to the login page we just
        // return a JSON error object
        errorResponse.message = 'Session Required';
        res.json(errorResponse);
    }
});

app.post('/signup', function(req, res) {
    console.log("Got post on /signup "+res.statusCode);

    console.log("Regestering "+req.param('email')+" logging in using "+req.param('password'));
    userMapper.save({
        "email" : req.param('email'),
        "passwordHash" : bcrypt.hashSync(req.param('password'), bcrypt.genSaltSync(10))
        }, function( error, users) {
            if(error) {
                res.render('error.jade', { locals : { errorMessage : error }});
            }
            else {
                var board = {
                    user : req.param('email'),
                    columns: [{
                        name: 'Backlog',
                        id: 'backlog',
                        stickyNotes: [
                            { id: ObjectID(), text: 'Implement Authentication' },
                            { id: ObjectID(), text: 'Implement Domain Model Persistence' }
                        ]}, {
                        name: 'Ready',
                        id: 'ready',
                        stickyNotes: [
                            { id: ObjectID(), text: 'Style the UI' }
                        ]}, {
                        name: 'Doing',
                        id: 'doing',
                        stickyNotes: [
                            { id: ObjectID(), text: 'Implement Dummy UI' }
                        ]}, {
                        name: 'Done',
                        id: 'done',
                        stickyNotes: [
                            { id: ObjectID(), text: 'Implement basic Node.js webserver' }
                        ]}
                    ]
                };
                boardMapper.save( board, function(error, board) {
                    if(error) {
                        res.render('error.jade', { locals : { errorMessage : error }});
                    }
                    else {
                        req.session.userDetails = {
                            user: users.email,
                            loggedIn: true
                        };
                        res.redirect('/show_board');
                    }
                });
            }
        });
});

app.listen(1337);

KanbanBoard = function(jsonObj) {
    console.log( "constructor called" );
    this.data = jsonObj;

    this.tasks = {};
    for( var c=0; c<jsonObj.columns.length; c++) {
        var column = jsonObj.columns[c];
        for( var t=0; t<column.stickyNotes.length; t++) {
            var task = column.stickyNotes[t];
            this.tasks[ task.id ] = task;
            console.log( "tasks["+task.id+"] = "+this.tasks[task.id] );
        }
    }
}
KanbanBoard.prototype.findTask = function(taskId) {
    console.log( taskId + " = " +JSON.stringify( this.tasks[ taskId ] ));
    return this.tasks[ taskId ];
}

