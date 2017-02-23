/*
 * Definition of global letiables.
 */
const kurento = require('kurento-client');
let idCounter = 0;
let candidatesQueue = {};
let kurentoClient = null;
let presenter = [];

const noPresenterMessage = 'No active presenter. Try again later...';

function nextUniqueId() {
    idCounter++;
    return idCounter.toString();
}

module.exports = function (wss, argv) {
    wss.on('connection', function (ws) {
        let sessionId = nextUniqueId();
        console.log('Connection received with sessionId ' + sessionId);

        ws.on('error', function (error) {
            console.log('Connection ' + sessionId + ' error ' + error);
            stop(sessionId);
        });

        ws.on('close', function () {
            console.log('Connection ' + sessionId + ' closed');
            stop(sessionId);
        });

        ws.on('message', function (_message) {
            let message = JSON.parse(_message);
            console.log('Connection ' + sessionId + ' received message ', message);

            switch (message.id) {
                case 'presenter':
                    startPresenter(sessionId, ws, message.sdpOffer, function (error, sdpAnswer) {
                        if (error) {
                            return ws.send(JSON.stringify({
                                id: 'presenterResponse',
                                response: 'rejected',
                                message: error
                            }));
                        }
                        ws.send(JSON.stringify({
                            id: 'presenterResponse',
                            response: 'accepted',
                            sdpAnswer: sdpAnswer
                        }));
                    });
                    break;

                case 'viewer':
                    startViewer(sessionId, ws, message.sdpOffer, function (error, sdpAnswer) {
                        if (error) {
                            return ws.send(JSON.stringify({
                                id: 'viewerResponse',
                                response: 'rejected',
                                message: error
                            }));
                        }

                        ws.send(JSON.stringify({
                            id: 'viewerResponse',
                            response: 'accepted',
                            sdpAnswer: sdpAnswer
                        }));
                    });
                    break;

                case 'stop':
                    stop(sessionId);
                    break;

                case 'onIceCandidate':
                    onIceCandidate(sessionId, message.candidate);
                    break;

                default:
                    ws.send(JSON.stringify({
                        id: 'error',
                        message: 'Invalid message ' + message
                    }));
                    break;
            }
        });
    });

    // Recover kurentoClient for the first time.
    function getKurentoClient(callback) {
        if (kurentoClient !== null) {
            return callback(null, kurentoClient);
        }

        kurento(argv.ws_uri, function (error, _kurentoClient) {
            if (error) {
                console.log('Could not find media server at address ' + argv.ws_uri);
                return callback('Could not find media server at address' + argv.ws_uri +
                    '. Exiting with error ' + error);
            }

            kurentoClient = _kurentoClient;
            callback(null, kurentoClient);
        });
    }

    function startPresenter(sessionId, ws, sdpOffer, callback) {
        console.log(presenter);
        clearCandidatesQueue(sessionId);

        if (presenter !== null) {
            stop(sessionId);
            return callback('Another user is currently acting as presenter. Try again later ...');
        }

        presenter.push({
            id: sessionId,
            pipeline: null,
            webRtcEndpoint: null,
            viewers: []
        });

        console.log("Starting presenter : id  :" + sessionId);

        getKurentoClient(function (error, kurentoClient) {
            if (error) {
                console.log("1");
                stop(sessionId);
                return callback(error);
            }

            if (presenter[0] === null) {
                console.log("2");
                stop(sessionId);
                return callback(noPresenterMessage);
            }

            kurentoClient.create('MediaPipeline', function (error, pipeline) {
                if (error) {
                    console.log("3");
                    stop(sessionId);
                    return callback(error);
                }

                if (presenter[0] === null) {
                    console.log("4");
                    stop(sessionId);
                    return callback(noPresenterMessage);
                }

                presenter[0].pipeline = pipeline;
                pipeline.create('WebRtcEndpoint', function (error, webRtcEndpoint) {
                    if (error) {
                        console.log("5");
                        stop(sessionId);
                        return callback(error);
                    }

                    if (presenter[0] === null) {
                        console.log("6");
                        stop(sessionId);
                        return callback(noPresenterMessage);
                    }

                    presenter[0].webRtcEndpoint = webRtcEndpoint;

                    if (candidatesQueue[sessionId]) {
                        while (candidatesQueue[sessionId].length) {
                            let candidate = candidatesQueue[sessionId].shift();
                            webRtcEndpoint.addIceCandidate(candidate);
                        }
                    }

                    webRtcEndpoint.on('OnIceCandidate', function (event) {
                        let candidate = kurento.getComplexType('IceCandidate')(event.candidate);
                        ws.send(JSON.stringify({
                            id: 'iceCandidate',
                            candidate: candidate
                        }));
                    });

                    webRtcEndpoint.processOffer(sdpOffer, function (error, sdpAnswer) {
                        if (error) {
                            console.log("7");
                            stop(sessionId);
                            return callback(error);
                        }

                        if (presenter === null) {
                            stop(sessionId);
                            return callback(noPresenterMessage);
                        }

                        callback(null, sdpAnswer);
                    });

                    webRtcEndpoint.gatherCandidates(function (error) {
                        if (error) {
                            console.log("8");
                            stop(sessionId);
                            return callback(error);
                        }
                    });
                });
            });
        });
    }

    function startViewer(sessionId, ws, sdpOffer, callback) {
        clearCandidatesQueue(sessionId);

        if (presenter[0] === null) {
            console.log("9");
            stop(sessionId);
            return callback(noPresenterMessage);
        }

        presenter[0].pipeline.create('WebRtcEndpoint', function (error, webRtcEndpoint) {
            if (error) {
                console.log("10");
                stop(sessionId);
                return callback(error);
            }
            presenter[0].viewers[sessionId] = {
                webRtcEndpoint: webRtcEndpoint,
                ws: ws
            };

            console.log("Starting viewer : id  :" + sessionId);

            if (presenter[0] === null) {
                console.log("11");
                stop(sessionId);
                return callback(noPresenterMessage);
            }

            if (candidatesQueue[sessionId]) {
                while (candidatesQueue[sessionId].length) {
                    let candidate = candidatesQueue[sessionId].shift();
                    webRtcEndpoint.addIceCandidate(candidate);
                }
            }

            webRtcEndpoint.on('OnIceCandidate', function (event) {
                let candidate = kurento.getComplexType('IceCandidate')(event.candidate);
                ws.send(JSON.stringify({
                    id: 'iceCandidate',
                    candidate: candidate
                }));
            });

            webRtcEndpoint.processOffer(sdpOffer, function (error, sdpAnswer) {
                if (error) {
                    console.log("12");
                    stop(sessionId);
                    return callback(error);
                }
                if (presenter[0] === null) {
                    stop(sessionId);
                    return callback(noPresenterMessage);
                }

                presenter[0].webRtcEndpoint.connect(webRtcEndpoint, function (error) {
                    if (error) {
                        console.log("13");
                        stop(sessionId);
                        return callback(error);
                    }
                    if (presenter[0] === null) {
                        console.log("14");
                        stop(sessionId);
                        return callback(noPresenterMessage);
                    }

                    callback(null, sdpAnswer);
                    webRtcEndpoint.gatherCandidates(function (error) {
                        if (error) {
                            console.log("15");
                            stop(sessionId);
                            return callback(error);
                        }
                    });
                });
            });
        });
    }

    function clearCandidatesQueue(sessionId) {
        if (candidatesQueue[sessionId]) {
            delete candidatesQueue[sessionId];
        }
    }

    function stop(sessionId) {
        if (presenter[0] !== null && presenter[0].id == sessionId) {
            for (let i in presenter[0].viewers) {
                let viewer = presenter[0].viewers[i];
                if (viewer.ws) {
                    viewer.ws.send(JSON.stringify({
                        id: 'stopCommunication'
                    }));
                }
            }
            presenter[0].pipeline.release();
            presenter[0] = null;
            presenter[0].viewers = [];
        } else if (presenter[0].viewers[sessionId]) {
            presenter[0].viewers[sessionId].webRtcEndpoint.release();
            delete presenter[0].viewers[sessionId];
        }
    }

    function onIceCandidate(sessionId, _candidate) {
        let candidate = kurento.getComplexType('IceCandidate')(_candidate);

        if (presenter[0] && presenter[0].id === sessionId && presenter[0].webRtcEndpoint) {
            console.info('Sending presenter candidate');
            presenter.webRtcEndpoint.addIceCandidate(candidate);
        } else if (presenter[0].viewers[sessionId] && presenter[0].viewers[sessionId].webRtcEndpoint) {
            console.info('Sending viewer candidate');
            presenter[0].viewers[sessionId].webRtcEndpoint.addIceCandidate(candidate);
        } else {
            console.info('Queueing candidate');
            if (!candidatesQueue[sessionId]) {
                candidatesQueue[sessionId] = [];
            }
            candidatesQueue[sessionId].push(candidate);
        }
    }
};

