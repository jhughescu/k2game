const express = require('express');
const fs = require('fs');
const handlebars = require('handlebars');
const exphbs = require('express-handlebars');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');

const tools = require('./controllers/tools');

const app = express();
const server = http.createServer(app);

require('dotenv').config();

module.exports = { app };
const { initSocket } = require('./controllers/socketController');
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

const databaseController = require('./controllers/databaseController');


app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/models', express.static(path.join(__dirname, 'models')));
app.engine('.hbs', exphbs.engine({
    extname: '.hbs',
    layoutsDir: path.join(__dirname, 'views'),
    partialsDir: path.join(__dirname, 'views/partials'),
    defaultLayout: false
}));
app.set('view engine', '.hbs');
app.get('/views/:templateName', (req, res) => {
    const templateName = req.params.templateName;
    res.sendFile(`${__dirname}/views/${templateName}`);
});
databaseController.dbConnect();
