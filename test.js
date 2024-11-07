// app.js

const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const fs = require('fs');

// Initialize the app
const app = express();
const PORT = process.env.PORT || 3000;


app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/models', express.static(path.join(__dirname, 'models')));

// Configure express-handlebars with layout and partials directories
app.engine('.hbs', exphbs.engine({
    extname: '.hbs',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials'),
    defaultLayout: 'main' // Ensures main layout is used by default
}));
app.set('view engine', '.hbs');

const basePath = path.join(__dirname, '', 'public');

const getTemplate = (req, res) => {
    const temp = req.query.template;
    const o = req.body; // Use req.body to access the JSON data object
    const templateContent = fs.readFileSync(`views/${temp}.hbs`, 'utf8');
    //    const compiledTemplate = handlebars.compile(templateContent);
    //    const html = compiledTemplate(o);
    res.send(templateContent);
};

app.post('/getTemplate', (req, res) => {
    getTemplate(req, res);
});


app.get('/', (req, res) => {
    res.sendFile(path.join(basePath, 'admin.html'));
});
// Route to render the 'home' view using the 'main' layout
app.get('/test', (req, res) => {
    res.render('home', {
        layout: 'main',
        title: 'Welcome',
        message: 'This is a test page with partials!'
    });
});

app.get('/alt', (req, res) => {
    res.render('home', {
        layout: 'admin',
        title: 'Alternative Layout',
        message: 'This uses an alternative layout!'
    });
});


// Debug route to display registered partials
app.get('/debug-partials', (req, res) => {
    const registeredPartials = Object.keys(require('handlebars').partials);
    res.json({
        registeredPartials
    });
});

// Check that partials are loading correctly
app.get('/check-partials-dir', (req, res) => {
    const partialsPath = path.join(__dirname, 'views', 'partials');
    const files = fs.readdirSync(partialsPath);
    res.json({
        partialsPath,
        files
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`Check registered partials at http://localhost:${PORT}/debug-partials`);
    console.log(`Check partials directory contents at http://localhost:${PORT}/check-partials-dir`);
});
