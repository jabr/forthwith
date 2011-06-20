var {WebSocket, WebSocketServlet} = org.eclipse.jetty.websocket;

var {setTimeout} = require('ringo/scheduler');
var {core} = require('./core');

function createSocketServer(newConnectionHandler) {
    return new WebSocketServlet({
        doWebSocketConnect: function(request, protocol) {
            var socket = {
                connection: null,
                handlers: {},
                
                get id() {
                    return this.connection.toString();
                },
                
                isConnected: function() {
                    return this.connection && this.connection.isOpen();
                },
                
                disconnect: function() {
                    if (!this.isConnected()) return false;
                    return this.connection.disconnect();
                },
                
                send: function(message) {
                    return this.sendRaw(JSON.stringify(message));
                },
                
                sendRaw: function(message) {
                    if (!this.isConnected()) return false;
                    return this.connection.sendMessage(message);
                },
                
                on: function(type, handler) {
                    this.handlers[type] = handler;
                    if (type == 'connect' && this.isConnected()) setTimeout(handler, 0);
                },
                
                _dispatch: function() {
                    var args = Array.prototype.slice.call(arguments);
                    console.log('dispatch 1', args, typeof args, Object.keys(args));
                    var type = args.shift();
                    console.log('dispatch 2', type, args, typeof args, Object.keys(args));
                    var handler = this.handlers[type] || function() {};
                    handler.apply(this, args);
                }
            };
            
            newConnectionHandler(socket, request, protocol);
            
            return new JavaAdapter(WebSocket, WebSocket.OnTextMessage, {
                onOpen: function(connection) {
                    socket.connection = connection;
                    socket._dispatch('connect');
                },
                
                onMessage: function(message) {
                    var d = JSON.parse(message);
                    console.log('raw message', message, d, typeof d, Object.keys(d));
                    socket._dispatch('message', d);
                },
                
                onClose: function(code, message) {
                    socket._dispatch('disconnect', code, message);
                    socket.connection = null;
                }
            });
        }
    });
}

exports.Socket = {
    bindToContext: function(context, handler) {
        var clientDirectory = core.path(core.fileName, '../client');
        context.serveStatic(clientDirectory);
        context.addServlet('/connection', createSocketServer(handler));
    },
    
    bind: function(server, path, handler) {
        return this.bindToContext(server.getContext(path), handler);
    }
};
