 function Point(event, target) {
	this.x = event.pageX - $(target).position().left;
	this.y = event.pageY - $(target).position().top;
}    
//チャット
$(document).ready(function () {      
	var room = io.connect('/room');
    var chatWindow = $('#chatWindow');
    var messageBox = $('#message');
    var myName = $('#myName').text();
    var attendants = $('#attendants');
    
    function showMessage(msg) {
      chatWindow.append($('<p>').text(msg));
      chatWindow.scrollTop(chatWindow.height());
    };
    
    room.on('connect', function() {
      room.emit('join', {roomName: $('#roomName').text()
      , nickName:myName});
    });
    
    room.on('joined', function(data) {
      if (data.isSuccess) {
        showMessage(data.nickName + '様入場しました');
        attendants.append($('<li>')
          .attr('id', 'attendant-'+data.nickName)
          .text(data.nickName));
      }
      
    });
    $('form').submit(function(e) {
      e.preventDefault();
      var msg = messageBox.val();
      if ($.trim(msg) !== '') {
        showMessage(myName + ' : ' + msg);
        room.json.send({nickName:myName, msg:msg});
        messageBox.val('');
      }
    });
    
    room.on('message', function(data) {
      showMessage(data.nickName + ' : ' + data.msg);
    });
    
    $('#leave').click(function(e) {
      room.emit('leave', {nickName:myName});
      location.href='/enter';
    });
    
    room.on('leaved', function(data) {
      showMessage(data.nickName + '様退場しました。');
      $('#attendant-'+data.nickName).remove();
    });
    
});

//絵
$(document).ready(function () {    
	var room = io.connect('/room');
	var canvas = document.getElementById('canvas');
	var context = canvas.getContext('2d');
	
	var width = 5;
	var color = '#000000';
	var oldColor = '#000000';
	var isDown = false;
	var newPoint, oldPoint;
	var picArray = [];
	var preImg = new Image();
	
	canvas.onmousedown = function(event) {
		room.emit('preDraw');
		isDown = true;
		oldPoint = new Point(event, this);
	};
	
	canvas.onmouseup = function() {
		isDown = false;
	};
	
	canvas.onmousemove = function(event) {
		if (isDown) {
			newPoint = new Point(event, this);		
			room.emit('draw', {
				width: width,
				color: color,
				x1: oldPoint.x,
				y1: oldPoint.y,
				x2: newPoint.x,
				y2: newPoint.y
			});
			
			oldPoint = newPoint;
		}
	};
	
	room.on('preDraw', function() {
		//前の状態を保存する
		var img = $("#canvas")[0].toDataURL();
		picArray.push(img);
		//前の状態を保存する　下の　TODO：1000　参照
		preImg.src = img;
	});
	  
	room.on('line', function(data) {
		context.lineWidth = data.width;	
		context.strokeStyle = data.color;
		context.beginPath();
		context.lineCap = "round";
		context.moveTo(data.x1, data.y1);
		context.lineTo(data.x2, data.y2);	
		context.stroke();
	});
	
	$('#colorpicker').farbtastic(function (data) {
		color = data;
	});
	
	$('#slider').slider({
		max: 50, min: 1,
		value: 5,
		change: function(event, ui) {
			width = ui.value;
			if (ui.value/10 > 4) {
				$('#canvas').css('cursor', 'url(/images/cursor3.gif) 16 16, auto');			
			} else if (ui.value/10 > 3) {
				$('#canvas').css('cursor', 'url(/images/cursor3.gif) 16 16, auto');
			} else if (ui.value/10 > 4) {
				$('#canvas').css('cursor', 'url(/images/cursor2.gif) 16 16, auto');
			} else if (ui.value/10 > 1) {
				$('#canvas').css('cursor', 'url(/images/cursor1.gif) 16 16, auto');
			} else {
				$('#canvas').css('cursor', 'url(/images/cursor0.gif) 16 16, auto');
			}			
		}
	});
	$('#icon li a img').click(function() {
		$('#icon li a img').css('border', '1px solid #C4CFFF');
		$(this).css('border', '2px solid #C4CFFF');
		if ($(this).attr('id') == 'eraser') {
			oldColor = color;
			color = '#FFFFFF';
		} else {
			color = oldColor;
		}
		return false;
	});  
	
	//canvasをクリア
    $("#clear").click(function(e){
    	if(confirm("カンバスを消去します。よろしいでしょうか？")){
    		context.beginPath();//新しいパスを生成
    		context.clearRect(0, 0, $("#canvas").width(), $("#canvas").height());
    	}
    });

    //localStorageに画像データを保存
    $("#save").click(function(e){
    	if(confirm("データを保存しますか？")){
    		var img = $("#canvas")[0].toDataURL();//canvasの内容をPNG形式で取得
    		localStorage.img = img;
    	}
    });

    //localStorageの画像データを削除
    $("#detele").click(function(e){
    	if(confirm("データを削除しますか？")){
    		delete localStorage.img;
    	}
    });
    
    //画像が保存されていたらcanvasに描画する
    if(localStorage.img){
    	var img = new Image();
    	img.onload = function(){
    		context.drawImage(img,0,0);
    	}    	
    	img.src = localStorage.img;    	
    }
    
    //戻る    
    $("#back").click(function(e) {
    	if (picArray.length != 0) {
    		room.emit('back', {src : picArray[picArray.length-2]});
    		picArray.pop(picArray.length);
    	}
    });
    
    room.on('back', function(data) {
    	if (data.src != '') {
    		//TODO：1000　なんか。。。2段階前のものを入れなかったらできない
    		//$('#image1').attr('src', picArray[picArray.length-1]);
    		//イメージ表示はできるんだがなぜ。。Canvasは。。。？？？
    		context.clearRect(0, 0, $("#canvas").width(), $("#canvas").height());
    		preImg.src = data.src;
    		context.drawImage(preImg,0,0);
    		
    	}
	});
});