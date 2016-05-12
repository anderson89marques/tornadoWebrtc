/**
 * Created by anderson on 06/02/16.
 */

var ws = new WebSocket(location.href.replace('http', 'ws').replace('live', 'ws'));
console.log('ws://' + location.host + '/ws');
console.log("^");
console.log(location.href.replace('http', 'ws').replace('live', 'ws'));

var initiator;
var pc;

var app = angular.module("liveApp", []);

//redefini a ferramenta de expressão do angular pôs conflitava com o do tornado :D
app.config(function ($interpolateProvider) {
        $interpolateProvider.startSymbol('{[{').endSymbol('}]}')
    });

app.controller("liveAppCtrl", function($scope, $http){

    $scope.msg = "WebRTC";
    $scope.role = "";
    var role;

    $scope.call = function (papel) {
        $('#btn-call').addClass('btn-active');
        initiator = true;
        role = papel;
        init();
    }

    $scope.receive = function (papel) {
        $('#btn-receive').addClass('btn-active');
        initiator = false;
        role = papel;
        init();
    }

    //Inicializando o processo
    getPrincipal(); //preciso primeiro do papel do usuário para aí sim inicializar o sistema


    function getPrincipal(){
        $http.get("/get-corrent-user")
            .then(function(event){
                console.log(event.data);
                $scope.role = event.data;
                init();
            }, function(){})
    }

    var isRemotePlying = false;
    var isLocalPlaying = false;

    function init() {
        var constraints = {
            audio: $('#audio').prop('checked'),
            video: $('#video').prop('checked')
        };
        console.log($scope.role);
        /*if($scope.role  === "role_teacher"){
            console.log("Aqui professor");
            getUserMedia(constraints, gotStream, fail);
            defineOnMessage(); //se for o professor ele precisar esperar a mensagem de intenção de conexão
            //call()
        }else{
            console.log("Aqui aluno");
            getUserMedia({audio: true, video: true}, gotStream, fail);
            ws.onopen = function(event){
                console.log("ONOPEN");
                sinalizandoIntencaoConexao(); //sinaliza interesse de conectar-se
            }

            receiver();
            //connect();
        }*/

        console.log("isLocalPlaying");
        console.log(isLocalPlaying);
        if (constraints.audio || constraints.video) {
            getUserMedia(constraints, connect, fail);
        } else {
            connect();
        }

    }

    //Flag que informa se ele já está conectado ou não com um peerconnection.

    /*
    Para conectar com vários usuários, quando for o professor ou dono da sala, ele vai ter uma lista de RTCPeerConnection.
    portanto vou ter de refazer o esquema de conexão.
    Para inicio vou separar em duas partes, uma parte de conexão para o aluno e outra para o professor
     */

    pc = new RTCPeerConnection(null, {
        optional: [{
            RtpDataChannels: true
        }]
    });


    function createOffer() {
        log('creating offer...');
        pc.createOffer(function(offer) {
            log('created offer...');
            pc.setLocalDescription(offer, function() {
                log('sending to remote...');
                ws.send(JSON.stringify(offer));
            }, fail);
        }, fail);
    }


    function receiveOffer(offer) {
        log('received offer...');
        pc.setRemoteDescription(new RTCSessionDescription(offer), function() {
            log('creating answer...');
            pc.createAnswer(function(answer) {
                log('created answer...');
                pc.setLocalDescription(answer, function() {
                    log('sent answer');
                    ws.send(JSON.stringify(answer));
                }, fail);
            }, fail);
        }, fail);
    }


    function receiveAnswer(answer) {
        log('received answer');
        pc.setRemoteDescription(new RTCSessionDescription(answer));
    }


    function log() {
        $('#status').text(Array.prototype.join.call(arguments, ' '));
        console.log.apply(console, arguments);
    }


    function logStreaming(streaming) {
        $('#streaming').text(streaming ? '[streaming]' : '[..]');
    }


    function fail() {
        $('#status').text(Array.prototype.join.call(arguments, ' '));
        $('#status').addClass('error');
        console.error.apply(console, arguments);
    }


    jQuery.fn.attachStream = function(stream) {
        this.each(function() {
            this.src = URL.createObjectURL(stream);
            this.play();
        });
    };

    function connect(stream) {

        if (stream && !isLocalPlaying) {
            pc.addStream(stream);
            $('#local').attachStream(stream);
            console.log();
            isLocalPlaying = true;
        }


        pc.onaddstream = function(event) {

            //if(role  !== "role_teacher"){
                console.log('Adicionando Remote Stream...');
                $('#remote').attachStream(event.stream);
                isRemotePlying = true;

            //}
        };
        pc.onicecandidate = function(event) {
            if (event.candidate) {
                ws.send(JSON.stringify(event.candidate));
            }
        };


        ws.onmessage = function (event) {
            var signal = JSON.parse(event.data);

            if(!isRemotePlying){
                if (signal.sdp) {
                    if (initiator) {
                        receiveAnswer(signal);
                    } else {
                        receiveOffer(signal);
                   }
                } else if (signal.candidate) {
                    pc.addIceCandidate(new RTCIceCandidate(signal));
                }
            }
        };

        if (initiator) {
            createOffer();
        } else {
            log('waiting for offer...');
        }
        logStreaming(false);
    }

});