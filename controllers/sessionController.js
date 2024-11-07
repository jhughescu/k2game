const fs = require('fs');
const Session = require('../models/session');
const tools = require('./tools');
const { getEventEmitter } = require('./../controllers/eventController');
//const gameController = require('./controllers/gameController');
const eventEmitter = getEventEmitter();

let persistentData = null;
const developData = (d) => {
    // runs processes on the persistentData
    d.activeTeams = d.teams.filter(t => Boolean(t.active));
    return d;
};
const developSession = (s) => {
    // converts & expands the raw session model
    const sn = s.toObject();
    sn.team = persistentData.activeTeams[sn.teamRef];
    return sn;
};
const processData = async () => {
    const type = 1;
    const filePath = `data/gamedata_${type}.json`;
    if (persistentData === null) {
//        console.log('must prep data');
        try {
            let data = await fs.promises.readFile(filePath, 'utf8');
    //        console.log(typeof(data))
            if (typeof(data) === 'string') {
                data = JSON.parse(data);
            }
            persistentData = developData(data);
            return persistentData;
        } catch (error) {
            console.error('Error reading or parsing JSON file:', error);
            throw error;
        }
    } else {
//        console.log('use prepped data');
        return persistentData;
    }
};

const newSession = async (cb) => {
    const sessions = await Session.find();
    const data = await processData();
    const sN = sessions.length + 1;
    const sID = `k2session_${sN}`;
    const s = new Session({
        uniqueID: `1${tools.padNum(sN, 100000)}${1000 + Math.round(Math.random() * 1000)}`,
        name: sID,
        dateID: 0,
        type: 1,
        teamRef: Math.floor(persistentData.activeTeams.length * Math.random()),
        state: 'new'
    });
    s.save();
    cb(developSession(s));
};
const restoreSession = async (sOb, cb) => {
    const session = await Session.findOne(sOb);

//    console.log(`restoreSession`);
//    console.log(sOb);
//    console.log(session);
    const data = await processData();
    if (session) {
        cb(developSession(session));
    } else {
        cb(`session not found`);
    }
};
const updateSession = async (sOb, cb) => {
    const s = await Session.findOne({uniqueID: sOb.uniqueID});
//    const new = Object.assign({}, sOb);
//    delete
    console.log(`updateSession`);
    console.log(sOb);
    console.log(s);
    if (s) {
        Object.entries(sOb).forEach((p, v) => {
            console.log(p, v)
            s[p[0]] = p[1];
        })
        console.log(s);
        s.save();
//        s[sOb]
        if (cb) {
            cb('fart');
        } else {
    //        console.log('no no no');
        }
    }
};
const getSessions = async (sOb, cb) => {
    const s = await Session.find();
    if (cb) {
        cb(s);
    }
};
const deleteSessions = async (sOb, cb) => {
    console.log('deleting');
    Session.deleteMany({})
    .then(result => {
        console.log(`Deleted ${result.deletedCount} sessions.`);
    })
    .catch(error => {
        console.error("Error deleting sessions:", error);
    });
    if (cb) {
        cb();
    }
};

module.exports = {
    newSession,
    restoreSession,
    updateSession,
    deleteSessions,
    getSessions
};
