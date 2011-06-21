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
                    this.handlers[type] = this.handlers[type] || [];
                    this.handlers[type].push(handler);
                    if (type == 'connect' && this.isConnected()) setTimeout(handler, 1);
                },
                
                _dispatch: function() {
                    var args = Array.prototype.slice.call(arguments);
                    var type = args.shift();
                    var handlers = this.handlers[type] || [];
                    handlers.forEach(function(handler) handler.apply(socket, args));
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
