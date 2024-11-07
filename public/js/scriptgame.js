document.addEventListener('DOMContentLoaded', function() {
//    return;
    const socket = io('', {
        query: {
            role: 'player'
        }
    });
    socket.on('disconnect', () => {
        gameflow('server connection lost - show warning');
    });
    socket.on('handshakeCheck', (str) => {
        gameflow('please wait, checking connection');
        handshake = str;
        setTimeout(() => {
            checkSession();
        }, 1000);
    });
    const msgWin = $('#msg');
    const msgs = [];

    let handshake = null;
    let session = null;
    let newconnect = false;

    const getStoreID = () => {
        return `${handshake}-id${getIdAdj()}`;
    };
    const gameflowConfirm = (msg) => {
        const ok = confirm(msg);
        if (ok) {
            gameflow(msg);
        }
    };
    const gameflow = (msg) => {
        msgs.push(msg);
        msgWin.html('');
        msgs.forEach(m => {
            msgWin.append(`<p>${m}</p>`);
        });
    };
    const getIdAdj = () => {
        const q = window.location.search;
        let a = '';
        if (q) {
            a = `-${q.replace('?', '').split('&').filter(s => s.includes('fake'))[0].split('=')[1]}`;
        }
        return a;
    };
    const checkSession = () => {
        const gid = getStoreID();
        const lid = localStorage.getItem(gid);
        if (Boolean(lid)) {
            gameflow(`continuing game ${lid}`);
            if (newconnect) {
                gameflow(`You can choose to start a new game (add a confirm dialog)`);
                let reset = false;
//                reset = confirm('would you like to stop this session and create a new one?');
                if (reset) {
                    clearSession();
                }
                newconnect = false;
            }
            socket.emit('restoreGame', {uniqueID: lid}, (sesh) => {
                if (typeof(sesh) === 'object') {
                    session = sesh;
                    gameflow(`game ${lid} restored (check console), game state: ${session.state}`);
                    console.log(session);
                } else {
                    gameflow(`no game found with ID ${lid}`);
                }
            });
        } else {
            gameflow('no game in progress, start new game');
            socket.emit('newGame', sesh => {
                session = sesh;
                gameflow(`starting new game with ID ${session.uniqueID}`);
                localStorage.setItem(gid, session.uniqueID);
                console.log(session);
            });
        }
    };
    const clearSession = () => {
        const sId = getStoreID();
        localStorage.removeItem(sId);
        window.location.reload();
    };
    const updateSession = (p, v) => {
        session[p] = v;
        const hup = {uniqueID: session.uniqueID};
//        const hup = {uniqueID: session.uniqueID.toString()};
        hup[p] = v;
        socket.emit('updateGame', hup, (str) => {
            gameflow(`update complete: ${str}`);
        });
    };
    window.updateSession = updateSession;
    const init = () => {
        gameflow('scipt init');
        newconnect = true;
    };
    init();
});
