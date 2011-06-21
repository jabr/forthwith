var forthwith = (function() {
    var scripts = document.getElementsByTagName('script');
    var scriptName = scripts[scripts.length - 1].src;
    var url = scriptName.replace(/^\w+:/, 'ws:').replace(/forthwith.js$/, 'connection');
    
    var exported = {
        message: null,
        connected: null
    };
    
    var data = {};
    var local = exported.local = {};
    var remote = exported.remote = {};
    
    var declare = exported.declare = function(name) {
        remote[name] = function() {
            socket.send({
                c: name,
                a: Array.prototype.slice.call(arguments)
            });
        };
    }
    
    var socket = {
        connection: null,
        connectAttempts: 0,
        intentionalDisconnect: false,
        
        update: function(name) {
            var value = data[name];
            var message = {s: name, v: value};
            if (typeof value == 'function') message = {d: name};
            socket.send(message);
        },
        
        opened: function() {
            socket.connectAttempts = 0;
            
            socket.connection.onerror = socket.errored;
            socket.connection.onclose = socket.closed;
            socket.connection.onmessage = socket.messaged;
            
            Object.keys(data).map(socket.update);
            
            if (exported.connected) {
                exported.connected.apply(local);
                exported.export();
            }
        },
        
        messaged: function(message) {
            var data = JSON.parse(message.data);
            
            if (data.s) {
                remote[data.s] = data.v;
                return;
            }
            
            if (data.d) {
                declare(data.d);
                return;
            }
            
            if (data.c) {
                var f = local[data.c] || function() {};
                f.apply(local, data.a || []);
                return;
            }
            
            if (exported.message) exported.message(data);
        },
        
        closed: function() {
            if (!socket.intentionalDisconnect) socket.connect();
        },
        
        errored: function() {
            console && console.log && console.log('error', arguments);
        },
        
        connected: function() {
            return (
                socket.connection &&
                socket.connection.readyState == WebSocket.OPEN
            );
        },
        
        connecting: function() {
            return (
                socket.connection &&
                socket.connection.readyState == WebSocket.CONNECTING
            );
        },
        
        connect: function() {
            socket.intentionalDisconnect = false;
            
            if (!socket.connected()) {
                var wait = 100;
                if (!socket.connecting()) {
                    socket.connection = new WebSocket(url);
                    socket.connection.onopen = socket.opened;
                
                    wait = Math.min(10000, 100 * Math.pow(2, socket.connectAttempts++));
                }
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
    
    exported.connect = socket.connect;
    exported.send = socket.send;
    
    function export(name) {
        var original = local[name];
        Object.defineProperty(local, name, {
            get: function() { return data[name]; },
            set: function(value) {
                data[name] = value;
                socket.update(name);
                return value;
            }
        });
        local[name] = original;
    }
    
    exported.export = function() {
        var properties = Array.prototype.slice.call(arguments);
        if (properties.length == 0) properties = Object.keys(local);
        properties.filter(function(property) {
            return !(property in data);
        }).forEach(export);
    };
    
    return exported;
})();
