var forthwith = (function() {
    var scripts = document.getElementsByTagName('script');
    var scriptName = scripts[scripts.length - 1].src;
    var url = scriptName.replace(/^\w+:/, 'ws:').replace(/forthwith.js$/, 'connection');
    
    var socket = {
        connection: null,
        connectAttempts: 0,
        intentionalDisconnect: false,
        
        opened: function() {
            console.log('open');
            socket.connectAttempts = 0;
            
            socket.connection.onerror = socket.errored;
            socket.connection.onclose = socket.closed;
            socket.connection.onmessage = socket.messaged;
        },
        
        messaged: function(message) {
            var data = JSON.parse(message);
            console.log('message', data);
        },
        
        closed: function() {
            console.log('closed');
            if (!socket.intentionalDisconnect) socket.connect();
        },
        
        errored: function() {
            console.log('error', arguments);
        },
        
        connected: function() {
            return (
                socket.connection &&
                socket.connection.readyState == WebSocket.OPEN
            );
        },
        
        connect: function() {
            socket.intentionalDisconnect = false;
            
            if (!socket.connected()) {
                socket.connection = new WebSocket(url);
                socket.connection.onopen = socket.opened;
                
                var wait = Math.min(10000, 100 * Math.pow(2, socket.connectAttempts++));
                setTimeout(socket.connect, wait);
            }
            
            return socket;
        },
        
        disconnect: function() {
            socket.intentionalDisconnect = true;
            socket.connection.close();
        },
        
        send: function(message) {
            if (!socket.connection) return false;
            return socket.connection.send(JSON.stringify(message));
        }
    };
    
    socket.connect();
    
    return {
        socket: socket
    };
})();
