const socketIo = require('socket.io');
const { getEventEmitter } = require('./../controllers/eventController');
//const gameController = require('./../controllers/gameController');
const routeController = require('./../controllers/routeController');
const sessionController = require('./../controllers/sessionController');
//const adminController = require('./../controllers/adminController');
//const presentationController = require('./../controllers/presentationController');
//const downloadController = require('./../controllers/downloadController');
//const logController = require('./../controllers/logController');

const tools = require('./../controllers/tools');

const eventEmitter = getEventEmitter();

const getPlayerHandshake = () => {
    const ph = `cuk2gamev1`;
//    console.log(ph);
    return ph;
};

// Function to initialize socket.io
function initSocket(server) {
    io = socketIo(server);
    // Handle client events
    io.on('connection', async (socket) => {
        let ref = socket.request.headers.referer;
        let src = ref.split('?')[0]
        src = src.split('/').reverse()[0];
        src = `/${src}`;
        const Q = socket.handshake.query;
        let sType = false;
        socket.on('checkSocket', (o, cb) => {
            const sock = `${o.address}-${o.sock}`;
            const ro = {total: showRoomSize(sock)};
            if (cb) {
                cb(ro);
//                console.log(`there is one`);
            } else {
                console.log(`no callback provided`);
            }
        });
        console.log('emitting socketConnect')
        socket.emit('socketConnect', {
            port: process.env.PORT,
            testID: process.env.TEST_ID
        });
        if (Q) {
            if (Boolean(Q.role)) {
                sType = Q.role;
            }
        }

        if (Boolean(sType)) {
            // common methods
            socket.on('getSessions', (sOb, cb) => {
                sessionController.getSessions(sOb, cb);
            });
            // end common
            // game clients
            if (sType === 'player') {
                socket.emit('handshakeCheck', getPlayerHandshake());
                socket.on('disconnect', () => {
//                    console.log('gone');
                });
                socket.on('newGame', (cb) => {
                    sessionController.newSession(cb);
                });
                socket.on('restoreGame', (sOb, cb) => {
                    sessionController.restoreSession(sOb, cb);
                });
                socket.on('updateGame', (sOb, cb) => {
                    sessionController.updateSession(sOb, cb);
                });
            }
            // end game clients
            // admin clients
            if (sType === 'admin') {
                socket.on('deleteSessions', (sOb, cb) => {
                    sessionController.deleteSessions(sOb, cb);
                });
            }
            // end admin clients
        }
    });

//    eventEmitter.on();


};


module.exports = {
    initSocket
};
