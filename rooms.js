var Chat = require('./chat');
//http://ryooo321.blogspot.jp/2011/11/amazon-ec2nodejs-socketio.html
module.exports = function(app) {
	var io = require('socket.io').listen(app);
	
	io.configure(function() {
		io.set('log level', 3);
		io.set('transports', [
		    'websocket'
		    , 'flashsocket'
		    , 'htmlfile'
		    , 'xhr-polling'
		    , 'jsonp-polling'
		    ]);
	});
	var testdate;
	var room = io.of('/room').on('connection', function(socket) {
		var joinedRoom = null;
		socket.on('join', function(data) {
			if (Chat.hasRoom(data.roomName)) {
				joinedRoom = data.roomName;
				socket.join(joinedRoom);
				socket.emit('joined', {
					isSuccess:true, nickName:data.nickName
				});
				
				socket.broadcast.to(joinedRoom).emit('joined', {
					isSuccess: true, nickName: data.nickName
				});
				Chat.joinRoom(joinedRoom, data.nickName);
			} else {
				socket.emit('joined', {isSuccess:false});
			}
		});
		
		socket.on('message', function(data) {			
			if (joinedRoom) {
				socket.broadcast.to(joinedRoom).json.send(data);
			}
		});
				
		socket.on('leave', function(data) {
			if (joinedRoom) {
				Chat.leaveRoom(joinedRoom, data.nickName);
				socket.broadcast.to(joinedRoom).emit('leaved', {nickName:data.nickName});
				socket.leave(joinedRoom);
			}
		});
		
		socket.on('draw', function(data) {			
			if (joinedRoom) {
				socket.emit('line', data);				
				socket.broadcast.to(joinedRoom).emit('line', data);
			}
		});
		
		//イメージ戻る
		socket.on('back', function(data) {
			if (joinedRoom) {
				socket.emit('back', data);				
				socket.broadcast.to(joinedRoom).emit('back', data);
			}
		});
		
		//前の状態を保存する
		socket.on('preDraw', function(data) {
			if (joinedRoom) {
				socket.emit('preDraw');				
				socket.broadcast.to(joinedRoom).emit('preDraw');
			}
		});
		
	});
}