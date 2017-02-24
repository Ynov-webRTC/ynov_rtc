/*
 * Definition of global letiables.
 */
const kurento = require('kurento-client');
const router = require('express').Router();
const _ = require('lodash');
let candidatesQueue = {};
let kurentoClient = null;
let presenters = [];

const noPresenterMessage = 'No active presenter. Try again later...';

router.get('/getRooms', function (req, res) {
    let ps = [];

    for (let p in presenters){
        console.log(p);
        if (presenters.hasOwnProperty(p)) {
            console.log(presenters[p]);
            ps.push({
                id: presenters[p].id,
                viewersCount: presenters[p].viewers.length
            });
        }
    }

    return res.json(ps);
});

module.exports = {

    router : router,

    kurento : function (wss, argv) {
        wss.on('connection', function (ws) {
            ws.on('error', function (error) {
                console.log('Connection ' + sessionId + ' error ' + error);
                stop(sessionId);
            });

            ws.on('close', function (_message) {
                let message = JSON.parse(_message);
                console.log('Connection ' + message.sessionId + ' closed');
                stop(message.sessionId);
            });

            ws.on('message', function (_message) {
                let message = JSON.parse(_message);
                console.log('Connection ' + message.sessionId + ' received message ', message);

                switch (message.id) {
                    case 'presenter':
                        startPresenter(message.sessionId, ws, message.sdpOffer, function (error, sdpAnswer) {
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
                        startViewer(message.sessionId, ws, message.sdpOffer, message.roomId, function (error, sdpAnswer) {
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
                        stop(message.sessionId);
                        break;

                    case 'onIceCandidate':
                        onIceCandidate(message.sessionId, message.roomId, message.candidate);
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

                    if (presenters[sessionId] === null) {
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

        function startViewer(sessionId, ws, sdpOffer, roomId, callback) {
            // clearCandidatesQueue(sessionId);

            if (presenters[roomId] === null) {
                stop(sessionId);
                return callback(noPresenterMessage);
            }

            presenters[roomId].pipeline.create('WebRtcEndpoint', function (error, webRtcEndpoint) {
                if (error) {
                    stop(sessionId);
                    return callback(error);
                }
                presenters[roomId].viewers[sessionId] = {
                    webRtcEndpoint: webRtcEndpoint,
                    ws: ws
                };

                console.log("Starting viewer : id  :" + sessionId);

                if (presenters[roomId] === null) {
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
                    if (presenters[roomId] === null) {
                        stop(sessionId);
                        return callback(noPresenterMessage);
                    }

                    presenters[roomId].webRtcEndpoint.connect(webRtcEndpoint, function (error) {
                        if (error) {
                            stop(sessionId);
                            return callback(error);
                        }
                        if (presenters[roomId] === null) {
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

        function stop(sessionId, roomId) {
            console.log(presenters);
            if (presenters[roomId] !== null && presenters[roomId].id == sessionId) {
                for (let i in presenters[roomId].viewers) {
                    let viewer = presenters[roomId].viewers[i];
                    if (viewer.ws) {
                        viewer.ws.send(JSON.stringify({
                            id: 'stopCommunication'
                        }));
                    }
                }
                presenters[roomId].pipeline.release();
                presenters[roomId] = null;
                presenters[roomId].viewers = [];
            } else if (presenters[roomId].viewers[sessionId]) {
                presenters[roomId].viewers[sessionId].webRtcEndpoint.release();
                delete presenters[roomId].viewers[sessionId];
            }
        }

        function onIceCandidate(sessionId, roomId, _candidate) {
            let candidate = kurento.getComplexType('IceCandidate')(_candidate);

            if (presenters[roomId] && presenters[roomId].id === sessionId && presenters[roomId].webRtcEndpoint) {
                console.info('Sending presenter candidate');
                presenters[roomId].webRtcEndpoint.addIceCandidate(candidate);
            } else if (presenters[roomId].viewers[sessionId] && presenters[roomId].viewers[sessionId].webRtcEndpoint) {
                console.info('Sending viewer candidate');
                presenters[roomId].viewers[sessionId].webRtcEndpoint.addIceCandidate(candidate);
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

