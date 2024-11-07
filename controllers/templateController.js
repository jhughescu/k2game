const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

const exphbs = require('express-handlebars');
const hbsInstance = exphbs.create({
    extname: '.hbs',
    layoutsDir: path.join(__dirname, '../views'),
    partialsDir: path.join(__dirname, '../views/partials'),
    defaultLayout: false
});

const templateStore = {};
let partialStore = {};

const listFiles = (directoryPath, fileType = null) => {
    return new Promise((resolve, reject) => {
        fs.readdir(directoryPath, (err, files) => {
            if (err) {
                reject(err);
                return;
            }
            // Filter files based on file type if provided
            if (fileType) {
                files = files.filter(file => path.extname(file) === `.${fileType}`);
            }
            resolve(files);
        });
    });
};
// Register the partials with `hbsInstance` rather than `handlebars`
const setupPartials = () => {
    console.log('setupPartials')
    const dir = path.join(__dirname, '..', 'views', 'partials');
    fs.readdir(dir, (err, files) => {
        if (err) return console.error('Error reading partials:', err);

        files.forEach(file => {
            const partialName = path.parse(file).name;
            const partialPath = path.join(dir, file);
            const template = fs.readFileSync(partialPath, 'utf8');
            hbsInstance.handlebars.registerPartial(partialName, template);
            console.log(`Registered partial: ${partialName} at ${partialPath}`);
        });
    });
};
const getPartialsNO = async () => {
    console.log(`getPartials`);
    try {
        const dir = path.join(__dirname, '..', 'views', 'partials');
        const files = await listFiles(dir, 'hbs');
        let pList = {};
        if (Object.keys(partialStore).length === 0) {

            for (const file of files) {
                const id = file.split('.')[0];
                const pp = path.join(dir, file);
                const template = fs.readFileSync(pp, 'utf8');
                pList[id] = template;
//                console.log(` - ${id}`);
            }
//            console.log(`${files.length} partial${files.length > 1 ? 's' : ''} registered (getPartials yes)`);
            partialStore = pList;
        } else {
            pList = partialStore;
//            console.log('just use the stored partials');
        }
        return pList;
    } catch (err) {
        console.error('Error listing files:', err);
        throw err; // Re-throw the error for proper handling
    }
};
const getTemplate = (req, res) => {
    const temp = req.query.template;
    const o = req.body; // Use req.body to access the JSON data object
    const templateContent = fs.readFileSync(`views/${temp}.hbs`, 'utf8');
//    const compiledTemplate = handlebars.compile(templateContent);
//    const html = compiledTemplate(o);
    res.send(templateContent);
};
const getTemplateV1 = (req, res) => {
    const temp = req.query.template;
    const o = req.body; // Use req.body to access the JSON data object
    const templateContent = fs.readFileSync(`views/${temp}.hbs`, 'utf8');
    const compiledTemplate = handlebars.compile(templateContent);
    const html = compiledTemplate(o);
    res.send(html);
};


setupPartials();
//module.exports = { getTemplate, setupPartials, getPartials };
module.exports = { getTemplate, setupPartials };
