var express = require('express');

var app = module.exports = express.createServer();

// Configuration
app.configure( function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

// Routes
app.get('/', function(req, res) {
  res.render('index.jade', { locals : {
    title: 'Hello Jade',
    columns : [
      { stickyNotes : [ { text : "Implement Persistence" }, { text : "Implement Drag&Drop" } ] },
      { stickyNotes : [ { text : "Learn Node.js" } ] },
      { stickyNotes : [] }
    ]
    }
  });
});

app.listen(3000);

