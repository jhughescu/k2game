document.addEventListener('DOMContentLoaded', function() {
//    return;
    const socket = io('', {
        query: {
            role: 'admin'
        }
    });
    const bShowSessions = $('#showSessions');
    const bDeleteSessions = $('#deleteSessions');

    const showSessions = () => {
        socket.emit('getSessions', {}, (s) => {
            console.log(`dunne:`);
            console.log(s);
            renderTemplate('insertion', 'admin.sessions', s);
        });
    };
    const deleteSessions = async () => {
        socket.emit('getSessions', {}, (s) => {
            if (s.length === 0) {
                alert('no sessions to delete')
            } else {
                const sure = confirm(`are you sure you want to delete ${s.length} session${s.length > 1 ? 's' : ''}?`);
                if (sure) {
                    socket.emit('deleteSessions', {}, (str) => {
//                        console.log(`dunne:`);
//                        console.log(str);
                    });
                }
            }
        });
    };

    bShowSessions.off('click').on('click', () => {
        showSessions();
    });
    bDeleteSessions.off('click').on('click', () => {
        deleteSessions();
    });
    socket.on('disconnect', () => {
//        gameflow('server connection lost - show warning');
    });
});
