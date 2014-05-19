/*global $:false */ //prevent "'$' is not defined."
'use strict';

var canvas=document.getElementById('mainCanvas');
var context=canvas.getContext('2d');

$(canvas)
.mousedown(function(e1) {
    console.log('e1 fired');
    //place a single 'pixel' at point of click
    context.rect(e1.offsetX, e1.offsetY, 1, 1);
    context.stroke();

    //begin continuous line if user wants to drag
    context.beginPath();
    context.lineTo(e1.offsetX, e1.offsetY);
    context.stroke();

    $(window).mousemove(function(e2) {
        console.log('e2 fired');
        // context.rect(e2.offsetX, e2.offsetY,2, 2);
        context.lineTo(e2.offsetX, e2.offsetY);
        context.stroke();
    });
})
.mouseup(function() {
    //stop drawing
    console.log('stop drawing');
    $(window).unbind('mousemove');
});

var clearCanvas = function(){
    // Store the current transformation matrix
    context.save();

    // Use the identity matrix while clearing the canvas
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Restore the transform
    context.restore();
};

$(window).keypress(function(e){
    console.log('keypress', e);
    if(e.keyCode === 99 || e.keyCode === 67){
        //'c' or 'C'
        clearCanvas();
    }
});
