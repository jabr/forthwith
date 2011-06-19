var {Socket} = require('./socket');

var connections = {};
var mapConnections = function(callback) {
    var keys = Object.keys(connections);
    return keys.map(function(key) callback(connections[key]));
}

function handleMessage(socket, message) {
    var data = JSON.parse(message);
    console.log('message data', data);
}

var start = function(server, path) {
    path = path || '/socket';
    Socket.bind(server, path, function(socket) {
        socket.on('connect', function() {
            console.log('connect', socket.id);
            connections[socket.id] = socket;
        });
        
        socket.on('disconnect', function() {
            console.log('disconnect', socket.id);
            delete connections[socket.id];
        });
        
        socket.on('message', function(message) {
            console.log('message', socket.id, message);
            handleMessage(socket, message);
        });
    });
};

exports.Forthwith = {
    start: start,
    everyone: {
        connections: connections,
        'do': mapConnections
    }
};
