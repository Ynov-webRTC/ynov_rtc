/*
 * (C) Copyright 2014-2015 Kurento (http://kurento.org/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

const ws = new WebSocket('wss://' + location.host + '/kurento');
let webRtcPeer, video, videoShare;

window.onload = function () {
    video = document.getElementById('video');
    videoShare = document.getElementById('videoShare');

    document.getElementById('call').addEventListener('click', function () {
        presenter('webcam', video);
    });
    document.getElementById('share_screen').addEventListener('click', function () {
        presenter('screen', videoShare);
    });
    document.getElementById('viewer').addEventListener('click', function () {
        viewer();
    });
    document.getElementById('terminate').addEventListener('click', function () {
        stop(video);
    });
    document.getElementById('terminateShare').addEventListener('click', function () {
        stop(videoShare);
    });
};

window.onbeforeunload = function () {
    ws.close();
};

ws.onmessage = function (message) {
    let parsedMessage = JSON.parse(message.data);
    console.info('Received message: ' + message.data);

    switch (parsedMessage.id) {
        case 'presenterResponse':
            presenterResponse(parsedMessage);
            break;
        case 'viewerResponse':
            viewerResponse(parsedMessage);
            break;
        case 'stopCommunication':
            dispose();
            break;
        case 'iceCandidate':
            webRtcPeer.addIceCandidate(parsedMessage.candidate);
            break;
        default:
            console.error('Unrecognized message', parsedMessage);
    }
};

function presenterResponse (message) {
    if (message.response !== 'accepted') {
        swal({
            title: 'Erreur!',
            text: 'Impossible de lancer le stream!',
            type: 'error'
        });
        dispose();
    } else {
        webRtcPeer.processAnswer(message.sdpAnswer);
    }
}

function viewerResponse (message) {
    if (message.response !== 'accepted') {
        swal({
            title: 'Erreur!',
            text: 'Aucun streamer sur cette url!',
            type: 'error'
        });
        dispose();
    } else {
        webRtcPeer.processAnswer(message.sdpAnswer);
    }
}

function presenter (source, video) {
    if (!webRtcPeer) {
        showSpinner(video);

        let options = {
            localVideo: video,
            onicecandidate: onIceCandidate,
            sendSource: source
        };

        if (source === 'screen') {
            options.mediaConstraints = {};
        }

        webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options, function (error) {
            if (error) {
                return onError(error);
            }

            this.generateOffer(onOfferPresenter);
        });
    }
}

function onOfferPresenter (error, offerSdp) {
    if (error) {
        return onError(error);
    }

    let message = {
        id: 'presenter',
        sdpOffer: offerSdp,
        sessionId: $('#inputUsername').val()
    };
    sendMessage(message);
}

function viewer () {
    if (!webRtcPeer) {
        showSpinner();

        let options = {
            remoteVideo: video,
            onicecandidate: onIceCandidate
        };

        webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function (error) {
            if (error) {
                return onError(error);
            }

            this.generateOffer(onOfferViewer);
        });
    }
}

function onOfferViewer (error, offerSdp) {
    if (error) {
        return onError(error);
    }

    let message = {
        id: 'viewer',
        sdpOffer: offerSdp,
        sessionId: $('#inputUsername').val(),
        roomId: 'tata'
    };
    sendMessage(message);
}

function onIceCandidate (candidate) {
    console.log('Local candidate' + JSON.stringify(candidate));

    let message = {
        id: 'onIceCandidate',
        sessionId: $('#inputUsername').val(),
        roomId: 'tata',
        candidate: candidate
    };
    sendMessage(message);
}

function stop () {
    if (webRtcPeer) {
        let message = {
            id: 'stop'
        };
        sendMessage(message);
        dispose();
    }
}

function dispose () {
    if (webRtcPeer) {
        webRtcPeer.dispose();
        webRtcPeer = null;
    }
    hideSpinner();
}

function sendMessage (message) {
    let jsonMessage = JSON.stringify(message);
    console.log('Sending message: ' + jsonMessage);
    ws.send(jsonMessage);
}

function showSpinner () {
    video.poster = './public/img/transparent-1px.png';
    videoShare.poster = './public/img/transparent-1px.png';
}

function hideSpinner () {
    video.src = '';
    video.poster = './public/img/transparent-1px.png';
    videoShare.src = '';
    videoShare.poster = './public/img/transparent-1px.png';
}

function onError (error) {
    if (error === 'not-installed') {
        swal({
            title: 'Erreur!',
            html: '<html>Le partage d\'écran ne fonctionne pas sans le plugin que vous pouvez téléchargez ' +
            '<a href=\'https://chrome.google.com/webstore/detail/screen-capturing/ajhifddimkapgcifgcodmmfdlknahffk\'>' +
            'ici</a> !</html>',
            type: 'error'
        });
    }
    console.log('%c' + error, 'background: #222; color: #bada55');
}
