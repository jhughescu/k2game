document.addEventListener('DOMContentLoaded', function () {
    let socket = null;
    let socketIdentifier = null;
    // templateStore maintains copies of each fetched template so they can be retrieved without querying the server
    const templateStore = {};

    // Define the setupObserver function to accept an element ID as an argument
    const setupObserver = (elementId, cb) => {
        // Select the target element based on the provided ID
        const targetNode = document.getElementById(elementId);

        // Ensure the targetNode exists before proceeding
        if (!targetNode) {
            console.error(`Element with ID '${elementId}' not found.`);
            return;
        }
        // Options for the observer (which mutations to observe)
        const config = {
            attributes: true,
            childList: true,
            subtree: true
        };
        // Callback function to execute when mutations are observed
        const callback = function (mutationsList, observer) {
            // Iterate over each mutation
            for (const mutation of mutationsList) {
                // Perform actions based on the type of mutation
                if (mutation.type === 'childList') {
                    //                    console.log('A child node has been added or removed');
                    // Perform actions such as updating the UI, etc.
                    if (cb) {
                        cb();
                    }
                } else if (mutation.type === 'attributes') {
                    //                    console.log('Attributes of the target element have changed');
                    // Perform actions such as updating the UI, etc.
                }
            }
        };
        // Create a new observer instance linked to the callback function
        const observer = new MutationObserver(callback);
        // Start observing the target node for configured mutations
        observer.observe(targetNode, config);
        // Later, you can disconnect the observer when it's no longer needed
        // observer.disconnect();
    };
    const checkDevMode = async () => {
        let dm = false;
//        console.log(`checkDevMode`);
        if (game.hasOwnProperty('isDev')) {
//            console.log(game);
            return game.isDev;
        } else {
            return new Promise((resolve, reject) => {
                socket.on('returnDevMode', (isDev) => {
                    console.log(`the resolver, isDev: ${isDev}`);
                    resolve(isDev);
                });
                socket.emit('checkDevMode');

                // Handle errors
                socket.on('error', (error) => {
                    // Reject the promise with the error message
                    console.warn(`checkDevMode error ${error}`)
                    reject(error);
                });
            });
        }
    }
    const procVal = (v) => {
        // process values into numbers, booleans etc
        const ipMatch = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (ipMatch.test(v)) {
            // do nothing if IP addresses
//            console.log('we have matched an IP', v);
        } else if (!isNaN(parseInt(v))) {
            v = parseInt(v);
        } else if (v === 'true') {
            v = true;
        } else if (v === 'false') {
            v = false;
        }
        return v;
    }
    const toCamelCase = (str) => {
        return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
            return index !== 0 ? word.toLowerCase() : word.toUpperCase();
        }).replace(/\s+/g, '');
    };
    const justNumber = (i) => {
        if (i !== undefined && i !== null) {
//            console.log(`converting ${i}`);
            // returns just the numeric character(s) of a string/number
            const out = parseInt(i.toString().replace(/\D/g, ''));
            return out;
        } else {
            console.log(`no value passed to justNumber`)
        }
    };
    const roundNumber = (n, r) => {
        let m = 1;
        let rr = r === undefined ? 3 : r;
        for (let i = 0; i < rr; i++) {
            m *= 10;
        }
//        console.log(`m is ${m}`);
        return Math.round(n * m) / m;
    };
    const roundAll = (o) => {
        for (let i in o) {
//            console.log(o[i]);
            if (!isNaN(o[i])) {
                o[i] = roundNumber(o[i]);
            }
            if (typeof(o[i]) === 'object') {
                for (let j in o[i]) {
                    if (!isNaN(o[i][j])) {
                        o[i][j] = roundNumber(o[i][j]);
                    }
                }
            }
        }
        return o;
    };
    const emitWithPromise = (theSocket, event, data) => {
        return new Promise((resolve, reject) => {
            theSocket.emit(event, data, (response) => {
                resolve(response);
            });
        });
    };
    const isValidJSON = (j) => {
    //    console.log(j);
        try {
            JSON.parse(j);
            return true;
        } catch (e) {
            return false;
        }
    };
    const padNum = (n) => {
        if (n < 10) {
            return `0${n.toString()}`
        } else {
            return n;
        }
    };
    const getTimestamp = () => {
        const d = new Date();
        const ts = `${d.getFullYear()}${padNum(d.getMonth())}${padNum(d.getDay())}-${padNum(d.getHours())}:${padNum(d.getMinutes())}:${padNum(d.getSeconds())}`;
        return ts;
    };

    const getTemplate = (temp, ob, cb) => {
        // returns a compiled template, but does not render it
        if (templateStore.hasOwnProperty(temp)) {
            // template exists in the store, return that
            const uncompiledTemplate = templateStore[temp];
            if (cb) {
                cb(uncompiledTemplate);
            }
        } else {
            // new template request, fetch from the server
            fetch(`/getTemplate?template=${temp}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(ob)
                })
                .then(response => response.text())
                .then(uncompiledTemplate => {
//                    const template = uncompiledTemplate;
                    templateStore[temp] = uncompiledTemplate;
                    if (cb) {
                        cb(uncompiledTemplate);
                    }
                })
                .catch(error => {
                    console.error('Error fetching or rendering template:', error);
                });
        }
    };
    const getPartials = () => {
        // Client-side code
//        console.log(`getPartials`);
        fetch('/partials')
            .then(response => response.json())
            .then(data => {
                const partials = data.partials;
//                console.log('partials');
//                console.log(partials);
                (async () => {
//                    console.log(`the async`)
                    for (const name in partials) {
                        const part = await Handlebars.compile(partials[name]);
                        Handlebars.registerPartial(name, part);
//                        console.log(part);
//                        console.log(`Handlebars.partials:`);
//                        console.log(JSON.parse(JSON.stringify(Handlebars.partials)));
                    }

                })();

                // Now the partials are registered and ready to use
            })
            .catch(error => {
                console.error('Error fetching partials:', error);
            });

    };

    const renderPartial = (targ, temp, ob, cb) => {
        if (ob === undefined) {
            console.error('Error: Data object is undefined');
            return;
        }
        if (targ.indexOf('#', 0) === 0) {
            targ = targ.replace('#', '');
        }
        console.log(`targ: ${targ}, temp: ${temp}`);
        $(`#${targ}`).css({opacity: 0});
        const part = Handlebars.partials[temp];
        console.log('renderPartial');
        console.log(part);
//        console.log(part(ob));
        if (document.getElementById(targ)) {
                document.getElementById(targ).innerHTML = part(ob);
            } else {
                console.warn(`target HTML not found: ${targ}`);
            }
            if (cb) {
                cb();
            }
            $(`#${targ}`).css({opacity: 1});
    };
    const removeTemplate = (targ, cb) => {
        $(targ).html('');
        if (cb) {
            cb();
        } else {
            console.warn('no callback provided for removeTemplate method');
        }
    };
    const renderTemplate = (targ, temp, ob, cb) => {
        console.log('red');
        if (ob === undefined) {
            console.error('Error: Data object is undefined');
            return;
        }
        if (targ.indexOf('#', 0) === 0) {
            targ = targ.replace('#', '');
        }
        $(`#${targ}`).css({opacity: 0});
        if (templateStore.hasOwnProperty(temp)) {
            // if this template has already been requested we can just serve it from the store
            const compiledTemplate = Handlebars.compile(templateStore[temp]);
            if (document.getElementById(targ)) {
                document.getElementById(targ).innerHTML = compiledTemplate(ob);
            } else {
//                console.warn(`target HTML not found: ${targ}`);
            }
            if (cb) {
                cb();
            }
            $(`#${targ}`).css({opacity: 1});
        } else {
            // If this template is being requested for the first time we will have to fetch it from the server
            fetch(`/getTemplate?template=${temp}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(ob)
                })
                .then(response => response.text())
                .then(uncompiledTemplate => {
                    const template = uncompiledTemplate;
                    templateStore[temp] = uncompiledTemplate;
                    const compiledTemplate = Handlebars.compile(template);
                    if (document.getElementById(targ)) {
                        document.getElementById(targ).innerHTML = compiledTemplate(ob);
                    } else {
//                        console.warn(`target HTML not found: ${targ}`);
                    }
                    if (cb) {
                        cb();
                    }

                    $(`#${targ}`).animate({opacity: 1});
                })
                .catch(error => {
                    console.error('Error fetching or rendering template:', error);
                });
        }
    };

    Handlebars.registerHelper('dynamicPartial', function(partialName, options) {
        // Check if the partialName is defined and is a valid partial
        if (Handlebars.partials[partialName]) {
            // Include the specified partial
            return new Handlebars.SafeString(Handlebars.partials[partialName](this));
        } else {
            // Handle the case where the specified partial is not found
            return new Handlebars.SafeString('Partial not found');
        }
    });
    Handlebars.registerHelper('moreThan', function(a, b, options) {
        if (a > b) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    });

    const copyObjectWithExclusions = (obj, exclusions) => {
        const newObj = {};
        // Copy properties from the original object to the new object,
        // excluding properties specified in the exclusions array
        for (const key in obj) {
            if (!exclusions.includes(key)) {
                newObj[key] = obj[key];
            }
        }
        return newObj;
    };
    const createCopyLinks = () => {
        let uc = $('.copylink');
        uc.off('click').on('click', function() {
            copyToClipboard($(this).attr('id'));
        });
    };
    const copyToClipboard = (elementId) => {
        // Select the text inside the element
        const element = document.getElementById(elementId);
        const range = document.createRange();
        range.selectNode(element);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);

        // Copy the selected text to the clipboard
        document.execCommand('copy');
        alert('copied to clipboard');

        // Deselect the text
        window.getSelection().removeAllRanges();
    };
    const getQueries = (u) => {
        // return an object all query string properties in a given URL
        let qu = {};
        if (u.indexOf('?', 0) > -1) {
            let r = u.split('?')[1];
//            console.log(r);
            // exclude any hash value
            r = r.replace(window.location.hash, '');
            r = r.split('&');
            r.forEach(q => {
                q = q.split('=');
                qu[q[0]] = q[1];
            });
        }
        return qu;
    };
    const sortNumber = (a, b) => {
        if (a > b) {
            return -1;
        } else if (a < b) {
            return 1;
        } else {
            return 0;
        }
    };
    const sortBy = (array, property, inv) => {
        return array.sort((a, b) => {
            if (a[property] < b[property]) {
                return inv ? 1 : -1;
            }
            if (a[property] > b[property]) {
                return inv ? -1 : 1;
            }
            return 0;
        });
    };
    const containsEmail = (s) => {
        const e = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
        return e.test(s);
    };
    const reorderObject = (obj, firstKey) => {
        let reordered = { [firstKey]: obj[firstKey] };
        // Loop through the original object and add the rest of the properties
        for (let key in obj) {
            if (key !== firstKey) {
                reordered[key] = obj[key];
            }
        }
        return reordered;
    };
    // the 'share' methods are for sharing objects defined in other code files
    const socketShare = (sock, id) => {
        socket = sock;
        socketIdentifier = id;
//        console.log('share it out socket');

    };
    const getSocket = (id) => {
        if (id === socketIdentifier) {
            return socket;
        } else {
            return null;
        }
    };
    // NOTE: parials are currently set up each time the system admin connects, so the method call below is safe for now.
    // In case of problems getting partials, check the order of system architecture.


//    getPartials();



    window.procVal = procVal;
    window.justNumber = justNumber;
    window.roundNumber = roundNumber;
    window.roundAll = roundAll;
    window.emitWithPromise = emitWithPromise;
    window.reorderObject = reorderObject;
    window.isValidJSON = isValidJSON;
    window.toCamelCase = toCamelCase;
    window.getTimestamp = getTimestamp;
    window.removeTemplate = removeTemplate;
    window.renderTemplate = renderTemplate;
    window.renderPartial = renderPartial;
    window.getTemplate = getTemplate;
    window.setupObserver = setupObserver;
    window.copyObjectWithExclusions = copyObjectWithExclusions;
    window.copyToClipboard = copyToClipboard;
    window.createCopyLinks = createCopyLinks;
    window.getQueries = getQueries;
    window.getPartials = getPartials;
    window.socketShare = socketShare;
    window.getSocket = getSocket;
    window.checkDevMode = checkDevMode;
    window.sortBy = sortBy;
    window.sortNumber = sortNumber;
});
