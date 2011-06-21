var forthwith = (function() {
    var scripts = document.getElementsByTagName('script');
    var scriptName = scripts[scripts.length - 1].src;
    var url = scriptName.replace(/^\w+:/, 'ws:').replace(/forthwith.js$/, 'connection');
    
    var interface = {message: null};
    
    var data = {};
    var local = interface.local = {};
    var remote = interface.remote = {};
    
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
            
            Object.keys(data).map(function(name) {
                var value = data[name];
                var message = {s: name, v: value};
                if (typeof value == 'function') message = {d: name};
                socket.send(message);
            });
        },
        
        messaged: function(message) {
            var d = JSON.parse(message.data);
            console.log('message', d);
            
            if (d.s) {
                remote[d.s] = d.v;
                return;
            }
            
            if (d.d) {
                remote.declare(d.d);
                return;
            }
            
            if (d.c) {
                var f = local[d.c] || function() {};
                f.apply(local, d.a || []);
                return;
            }
            
            if (interface.message) interface.message(d);
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
    
    interface.remote.declare = function(name) {
        remote[name] = function() {
            socket.send({
                c: name,
                a: Array.prototype.slice.call(arguments)
            });
        };
    };
    
    interface.local.share = function(name) {
        var original = local[name];
        Object.defineProperty(local, name, {
            get: function() { return data[name]; },
            set: function(value) {
                var m = {s: name, v: value};
                if (typeof value == 'function') {
                    m = {d: name};
                }
                socket.send(m);
                return data[name] = value;
            }
        });
        local[name] = original;
    };
    
    socket.connect();
    
    return interface;
})();
