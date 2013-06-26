/* Author: YOUR NAME HERE
*/

$(document).ready(function() {   

  var socket = io.connect();
  $("#sender").click(function(){
     $.get("/ajax/trial",function(data,status){
       console.log("Data: " + data + "\nStatus: " + status);
     });
  });
  $('#sender').bind('click', function() {
   //socket.emit('message', 'Message Sent on ' + new Date());     
    console.log("clicked");
    //alert("clicked");

  });

  socket.on('server_message', function(data){
    /*$.get('/ajax/trial', function(err, data) {
	    if(err) alert('err: ' + err);
	    else alert('sent: ' + data);
       });
    });*/
     $('#receiver').append('<li>' + data + '</li>');  
  });

});
