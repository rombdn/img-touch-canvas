/*
=================================
img-touch-canvas - v0.1
http://github.com/rombdn/img-touch-canvas

(c) 2013 Romain BEAUDON
This code may be freely distributed under the MIT License
=================================
*/


(function() {
    var root = this; //global object

    var ImgTouchCanvas = function(options) {
        if( !options || !options.canvas || !options.path) {
            throw 'ImgZoom constructor: missing arguments canvas or path';
        }

        this.canvas         = options.canvas;
        this.canvas.width   = this.canvas.clientWidth;
        this.canvas.height  = this.canvas.clientHeight;
        this.context        = this.canvas.getContext('2d');

        this.desktop = options.desktop || false; //non touch events

        this.position = {
            x: 0,
            y: 0
        };
        this.scale = {
            x: 0.5,
            y: 0.5
        };
        this.imgTexture = new Image();
        this.imgTexture.src = options.path;

        this.lastZoomScale = null;
        this.lastX = null;
        this.lastY = null;

        this.mdown = false; //desktop drag

        this.zoomSpeed = options.zoomSpeed || 1;                // lower number will zoom slower
        this.initialFit = options.initialFit || 'fill';         // options are 'fit', 'fill'
        this.onShow = options.onShow;
        this.onZoom = options.onZoom;
        this.maxZoom = options.maxZoom;

        this.init = false;
        this.checkRequestAnimationFrame();
        requestAnimationFrame(this.animate.bind(this));

        this.setEventListeners();
    };


    ImgTouchCanvas.prototype = {
        initialScales: function(){
            return {
                width: this.canvas.clientWidth / this.imgTexture.width,
                height: this.canvas.clientHeight / this.imgTexture.height,
            }
        },

        fill: function(){
            var initial = this.initialScales();
            this.position.x = this.position.y = 0;
            return Math.max(initial.width, initial.height);
        },

        fit: function(){
            var initial = this.initialScales();
            // center image if fitting
            if (initial.width < initial.height){
                this.position.x = 0;
                this.position.y = (this.canvas.clientHeight - this.imgTexture.height * initial.width) / 2;
            }
            else {
                this.position.x = (this.canvas.clientWidth - this.imgTexture.width * initial.height) / 2;
                this.position.y = 0;
            }

            return Math.min(initial.width, initial.height);
        },

        animate: function() {
            //set scale such as image cover all the canvas, or else fit entire image in canvas
            if(!this.init) {
                if(this.imgTexture.width) {
                    var scaleRatio = this[this.initialFit]();

                    this.scale.x = scaleRatio;
                    this.scale.y = scaleRatio;
                    this.initialScale = scaleRatio;
                    this.initialWidth = scaleRatio * this.imgTexture.width;
                    this.initialHeight = scaleRatio * this.imgTexture.height;
                    this.init = true;

                    if (this.onShow){
                        this.onShow(this.initialScale);
                    }
                }
            }

            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

            this.context.drawImage(
                this.imgTexture,
                this.position.x, this.position.y,
                this.scale.x * this.imgTexture.width,
                this.scale.y * this.imgTexture.height);


            requestAnimationFrame(this.animate.bind(this));
        },


        gesturePinchZoom: function(event) {
            var zoom = false;

            if( event.targetTouches.length >= 2 ) {
                var p1 = event.targetTouches[0];
                var p2 = event.targetTouches[1];
                var zoomScale = this.zoomSpeed * Math.sqrt(Math.pow(p2.pageX - p1.pageX, 2) + Math.pow(p2.pageY - p1.pageY, 2)); //euclidian distance

                if( this.lastZoomScale ) {
                    zoom = zoomScale - this.lastZoomScale;
                }

                this.lastZoomScale = zoomScale;
            }

            return zoom;
        },

        doZoom: function(zoom) {
            if(!zoom) return;

            //new scale
            var currentScale = this.scale.x;
            var newScale = this.scale.x + zoom/100;
            this.onZoom(newScale);
            if( newScale < this.initialScale ) return;
            if (this.maxZoom && newScale > this.maxZoom){
                // could just return but then won't stop exactly at maxZoom
                newScale = this.maxZoom;
            }


            //some helpers
            var deltaScale = newScale - currentScale;
            var currentWidth    = (this.imgTexture.width * this.scale.x);
            var currentHeight   = (this.imgTexture.height * this.scale.y);
            var deltaWidth  = this.imgTexture.width*deltaScale;
            var deltaHeight = this.imgTexture.height*deltaScale;


            //by default scale doesnt change position and only add/remove pixel to right and bottom
            //so we must move the image to the left to keep the image centered
            //ex: coefX and coefY = 0.5 when image is centered <=> move image to the left 0.5x pixels added to the right
            var canvasmiddleX = this.canvas.clientWidth / 2;
            var canvasmiddleY = this.canvas.clientHeight / 2;
            var xonmap = (-this.position.x) + canvasmiddleX;
            var yonmap = (-this.position.y) + canvasmiddleY;
            var coefX = -xonmap / (currentWidth);
            var coefY = -yonmap / (currentHeight);
            var newPosX = this.position.x + deltaWidth*coefX;
            var newPosY = this.position.y + deltaHeight*coefY;

            //edges cases
            var newWidth = currentWidth + deltaWidth;
            var newHeight = currentHeight + deltaHeight;

            // if( newWidth < this.canvas.clientWidth ) return; // not needed; we are checking against minimum scale able
            if( newPosX > 0 ) { newPosX = 0; }
            if( newPosX + newWidth < this.canvas.clientWidth ) { newPosX = this.canvas.clientWidth - newWidth;}

            // if( newHeight < this.canvas.clientHeight ) return; // not needed; we are checking against minimum scale able
            if( newPosY > 0 ) { newPosY = 0; }
            if( newPosY + newHeight < this.canvas.clientHeight ) { newPosY = this.canvas.clientHeight - newHeight; }

            // zoom scale callback
            if (this.onZoom){
                this.onZoom(newScale);
            }

            //finally affectations
            this.scale.x    = newScale;
            this.scale.y    = newScale;
            this.position.x = newPosX;
            this.position.y = newPosY;
        },

        doMove: function(relativeX, relativeY) {
            if(this.lastX && this.lastY) {
              var deltaX = relativeX - this.lastX;
              var deltaY = relativeY - this.lastY;
              var currentWidth = (this.imgTexture.width * this.scale.x);
              var currentHeight = (this.imgTexture.height * this.scale.y);

              var clientWidth = this.canvas.clientWidth,
                  clientHeight = this.canvas.clientHeight;

              this.position.x += deltaX;
              this.position.y += deltaY;


              //edge cases
              if (currentWidth >= clientWidth){
                  if( this.position.x > 0 ) {
                    // cannot move left edge of image > container left edge
                    this.position.x = 0;
                  }
                  else if( this.position.x + currentWidth < clientWidth ) {
                    // cannot move right edge of image < container right edge
                    this.position.x = clientWidth - currentWidth;
                  }
              }
              else {
                  if( this.position.x < currentWidth - clientWidth ) {
                    // cannot move left edge of image < container left edge
                    this.position.x = currentWidth - clientWidth;
                  }
                  else if( this.position.x > clientWidth - currentWidth ) {
                    // cannot move right edge of image > container right edge
                    this.position.x = clientWidth - currentWidth;
                  }
              }
              if (currentHeight > clientHeight){
                  if( this.position.y > 0 ) {
                    // cannot move top edge of image < container top edge
                    this.position.y = 0;
                  }
                  else if( this.position.y + currentHeight < clientHeight ) {
                    // cannot move bottom edge of image > container bottom edge
                    this.position.y = clientHeight - currentHeight;
                  }
              }
              else {
                  if( this.position.y < 0 ) {
                    // cannot move top edge of image < container top edge
                    this.position.y = 0;
                  }
                  else if( this.position.y > clientHeight - currentHeight ) {
                    // cannot move bottom edge of image > container bottom edge
                    this.position.y = clientHeight - currentHeight;
                  }
              }
            }

            this.lastX = relativeX;
            this.lastY = relativeY;
        },

        setEventListeners: function() {
            // touch
            this.canvas.addEventListener('touchstart', function(e) {
                this.lastX          = null;
                this.lastY          = null;
                this.lastZoomScale  = null;
            }.bind(this));

            this.canvas.addEventListener('touchmove', function(e) {
                e.preventDefault();

                if(e.targetTouches.length == 2) { //pinch
                    this.doZoom(this.gesturePinchZoom(e));
                }
                else if(e.targetTouches.length == 1) {
                    var relativeX = e.targetTouches[0].pageX - this.canvas.getBoundingClientRect().left;
                    var relativeY = e.targetTouches[0].pageY - this.canvas.getBoundingClientRect().top;
                    this.doMove(relativeX, relativeY);
                }
            }.bind(this));

            if(this.desktop) {
                // keyboard+mouse
                window.addEventListener('keyup', function(e) {
                    if(e.keyCode == 187 || e.keyCode == 61) { //+
                        this.doZoom(5);
                    }
                    else if(e.keyCode == 54) {//-
                        this.doZoom(-5);
                    }
                }.bind(this));

                window.addEventListener('mousedown', function(e) {
                    this.mdown = true;
                    this.lastX = null;
                    this.lastY = null;
                }.bind(this));

                window.addEventListener('mouseup', function(e) {
                    this.mdown = false;
                }.bind(this));

                window.addEventListener('mousemove', function(e) {
                    var relativeX = e.pageX - this.canvas.getBoundingClientRect().left;
                    var relativeY = e.pageY - this.canvas.getBoundingClientRect().top;

                    if(e.target == this.canvas && this.mdown) {
                        this.doMove(relativeX, relativeY);
                    }

                    if(relativeX <= 0 || relativeX >= this.canvas.clientWidth || relativeY <= 0 || relativeY >= this.canvas.clientHeight) {
                        this.mdown = false;
                    }
                }.bind(this));
            }
        },

        checkRequestAnimationFrame: function() {
            var lastTime = 0;
            var vendors = ['ms', 'moz', 'webkit', 'o'];
            for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
                window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
                window.cancelAnimationFrame =
                  window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
            }

            if (!window.requestAnimationFrame) {
                window.requestAnimationFrame = function(callback, element) {
                    var currTime = new Date().getTime();
                    var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                    var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                      timeToCall);
                    lastTime = currTime + timeToCall;
                    return id;
                };
            }

            if (!window.cancelAnimationFrame) {
                window.cancelAnimationFrame = function(id) {
                    clearTimeout(id);
                };
            }
        }
    };

    root.ImgTouchCanvas = ImgTouchCanvas;
}).call(this);