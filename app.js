/*
app.js

Created On: 7/12/2020
Last Updated On: 7/12/2020
Description: Entry point for "The Apple Cart" web app, Store Inventory Management System
*/

/*
Dependencies
*/

const express = require('express')
const exphbs = require('express-handlebars')
const mysql = require('mysql')

/*
Create Express Server
*/

const app = express()

/*
Configure Express Server
*/

app.engine('hbs', exphbs(
    {
        defaultLayout: 'main',
        extname: '.hbs'
    }
))
app.set('view engine', 'hbs')

app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: false}))

/*
Environment Configuration
*/
var config = require('./config')

if (process.env.NODE_ENV == 'development') {
    HEROKU_CREDENTIALS = config.HEROKU_CREDENTIALS,
    process.env.PORT = 8080
} else if (process.env.NODE_ENV == 'production') {
    HEROKU_CREDENTIALS = process.env.CLEARDB_DATABASE_URL
}
/*
Database Setup and Configuration
*/

const connection = mysql.createConnection(HEROKU_CREDENTIALS)
handleDisconnect(connection)

/*
Routing
*/

app.get('/', function(req, res) {

    // Simple query to make sure the database is connected.
    var data = 'ClearDB Connected. Users are: '
    connection.query('SELECT * FROM `users`', function(error, results, fields){
        if (error) {
            data = 'ClearDB is down!'
            res.render('home', {data: data})
        } else {
        results.forEach(element => {
            data += element.first_name + ' '
        });
        res.render('home', {data: data})    
    }
    })
    
})

/*
Listener
*/

app.listen(process.env.PORT)

/*
Error Handling
*/

function handleDisconnect(client) {
    client.on('error', function (error) {
      if (!error.fatal) return;
      if (error.code !== 'PROTOCOL_CONNECTION_LOST') throw err;
  
      console.error('> Re-connecting lost MySQL connection: ' + error.stack);
  
      // NOTE: This assignment is to a variable from an outer scope; this is extremely important
      // If this said `client =` it wouldn't do what you want. The assignment here is implicitly changed
      // to `global.mysqlClient =` in node.
      mysqlClient = mysql.createConnection(client.config);
      handleDisconnect(mysqlClient);
      mysqlClient.connect();
    });
  };