/*
 * Definition of global letiables.
 */
const kurento = require('kurento-client');
const router = require('express').Router();
let idCounter = 0;
let candidatesQueue = {};
let kurentoClient = null;
let presenters = [];

const noPresenterMessage = 'No active presenter. Try again later...';

function nextUniqueId() {
    idCounter++;
    return idCounter.toString();
}

router.get('/', function (req, res) {
    return res.json(presenters);
});

module.exports = {

    router : router,

    kurento : function (wss, argv) {
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

            presenters[sessionId] = {
                id: sessionId,
                pipeline: null,
                webRtcEndpoint: null,
                viewers: []
            };

            console.log("Starting presenter : id  :" + sessionId);

            getKurentoClient(function (error, kurentoClient) {
                if (error) {
                    stop(sessionId);
                    return callback(error);
                }

                if (presenters[sessionId] === null) {
                    stop(sessionId);
                    return callback(noPresenterMessage);
                }

                kurentoClient.create('MediaPipeline', function (error, pipeline) {
                    if (error) {
                        stop(sessionId);
                        return callback(error);
                    }

                    if (presentes[sessionId] === null) {
                        stop(sessionId);
                        return callback(noPresenterMessage);
                    }

                    presenters[sessionId].pipeline = pipeline;
                    pipeline.create('WebRtcEndpoint', function (error, webRtcEndpoint) {
                        if (error) {
                            stop(sessionId);
                            return callback(error);
                        }

                        if (presenters[sessionId] === null) {
                            stop(sessionId);
                            return callback(noPresenterMessage);
                        }

                        presenters[sessionId].webRtcEndpoint = webRtcEndpoint;

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
                                stop(sessionId);
                                return callback(error);
                            }

                            if (presenters === null) {
                                stop(sessionId);
                                return callback(noPresenterMessage);
                            }

                            callback(null, sdpAnswer);
                        });

                        webRtcEndpoint.gatherCandidates(function (error) {
                            if (error) {
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

            if (presenters[0] === null) {
                stop(sessionId);
                return callback(noPresenterMessage);
            }

            presenters[0].pipeline.create('WebRtcEndpoint', function (error, webRtcEndpoint) {
                if (error) {
                    stop(sessionId);
                    return callback(error);
                }
                presenters[0].viewers[sessionId] = {
                    webRtcEndpoint: webRtcEndpoint,
                    ws: ws
                };

                console.log("Starting viewer : id  :" + sessionId);

                if (presenters[0] === null) {
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
                        stop(sessionId);
                        return callback(error);
                    }
                    if (presenters[0] === null) {
                        stop(sessionId);
                        return callback(noPresenterMessage);
                    }

                    presenters[0].webRtcEndpoint.connect(webRtcEndpoint, function (error) {
                        if (error) {
                            stop(sessionId);
                            return callback(error);
                        }
                        if (presenters[0] === null) {
                            stop(sessionId);
                            return callback(noPresenterMessage);
                        }

                        callback(null, sdpAnswer);
                        webRtcEndpoint.gatherCandidates(function (error) {
                            if (error) {
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
            if (presenters[0] !== null && presenters[0].id == sessionId) {
                for (let i in presenters[0].viewers) {
                    let viewer = presenters[0].viewers[i];
                    if (viewer.ws) {
                        viewer.ws.send(JSON.stringify({
                            id: 'stopCommunication'
                        }));
                    }
                }
                presenters[0].pipeline.release();
                presenters[0] = null;
                presenters[0].viewers = [];
            } else if (presenters[0].viewers[sessionId]) {
                presenters[0].viewers[sessionId].webRtcEndpoint.release();
                delete presenters[0].viewers[sessionId];
            }
        }

        function onIceCandidate(sessionId, _candidate) {
            let candidate = kurento.getComplexType('IceCandidate')(_candidate);

            console.log(presenters);
            if (presenters[0] && presenters[0].id === sessionId && presenters[0].webRtcEndpoint) {
                console.info('Sending presenter candidate');
                presenters[0].webRtcEndpoint.addIceCandidate(candidate);
            } else if (presenters[0].viewers[sessionId] && presenters[0].viewers[sessionId].webRtcEndpoint) {
                console.info('Sending viewer candidate');
                presenters[0].viewers[sessionId].webRtcEndpoint.addIceCandidate(candidate);
            } else {
                console.info('Queueing candidate');
                if (!candidatesQueue[sessionId]) {
                    candidatesQueue[sessionId] = [];
                }
                candidatesQueue[sessionId].push(candidate);
            }
        }
    }
};

