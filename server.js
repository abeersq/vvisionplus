const application = require('express')();
const server = require('http').createServer(application)
const io = require('socket.io')(server);
const PORT = process.env.PORT || 3000

// end to end encrypt
//const crypto = require('crypto');
const encrypt = require('socket.io-encrypt')


// php
//var validator = spawn('php', ['validator.php']);
// defining a route that recieves all *.php requests, and runs them through the execPHP class.
/*application.use('*.php',function(request,response,next) {
	execPHP.parseFile(request.originalUrl,function(phpResult) {
		response.write(phpResult);
		response.end();
	});
});*/

// SQlite
const sqlite3 = require('sqlite3').verbose();
// open database in memory
let db = new sqlite3.Database('mydatabase.db', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('SQlite database Connected.');
});


application.get('/', (req, res) => {
   res.sendFile(__dirname + '/client.html');
});

server.listen(PORT, () => {
   console.log('Server is running on port: ' + PORT);
});


io.use(encrypt('secret'));

io.on('connection', (socket) => {


  socket.on('disconnect', () => {
       console.log(socket.username + ' Disconnected');
   });

   socket.on('add user', (usr) => {
         socket.username = usr;

         db.serialize(function() {
           console.log('checking if user exists');
           var checkIfUserExists = "select count(*) from messages where username = '" + socket.username +"'";
           db.get(checkIfUserExists, function(err, row) {
             if (err) {
               console.error('error looking up if user exists', err);
               return;
             }else if (row['count(*)'] !== 0) {
               console.log('1');
             } else {
               console.log('0');

           }
         });


       });

     });
    //recive the message
   socket.on('new message', (msg) => {
     // encode the message base64
     let encodedmsg =  Buffer.from(msg).toString('base64');
     db.serialize(function() {
        //Store the messages data into sqlite3
      console.log('inserting message to database');
      var insertMessageStr = "INSERT INTO messages (username, content, posted) VALUES ('" + socket.username + "','" + encodedmsg + "'," + Date.now() + ");"
      console.log(insertMessageStr)
      db.run(insertMessageStr);
  });

        // decode the message base64
     let decodedmsg = Buffer.from(encodedmsg, 'base64').toString('ascii');
          // resend the message to client
       io.emit('send message', {message: decodedmsg, user: socket.username});




   });



});
