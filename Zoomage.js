/*
=================================
img-touch-canvas - v0.1
http://github.com/rombdn/img-touch-canvas

Zoomage.js - v0.1 (Latest)
https://github.com/Becavalier/Zoomage.js

(c) 2013 Romain BEAUDON
This code may be freely distributed under the MIT License

(c) 2016 YHSPY
This code may be freely distributed under the MIT License
=================================
*/

(function() {
    var root = this; 

    var Zoomage = function(options) {
        if( !options || !options.canvas || !options.path ) {
            throw 'Zoomage constructor: missing arguments canvas or path';
        }

        this.canvas         = options.canvas;
        this.canvas.width   = this.canvas.clientWidth;
        this.canvas.height  = this.canvas.clientHeight;
        this.context        = this.canvas.getContext('2d');
        // Save current context
        this.context.save();

        this.isTouching = false;
        this.isFirstTime = true;
        this.isImgLoaded = false;

        this.desktop = options.desktop || false;

        this.lastTouchEndTimestamp = null;
        this.lastTouchEndObject    = null;
        this.dbclickZoomToggle     = true; 
        this.dbclickZoomLength     = 0;
        this.dbclickZoomThreshold  = options.dbclickZoomThreshold || 20;

        // Default settings
        this.position = {
            x: 0,
            y: 0
        };
        this.scale = {
            x: 0.5,
            y: 0.5
        };
        this.rotate = {
            position: {
                x: 0,
                y: 0
            },
            degree: 0
        };

        this.imgTexture = new Image();
        this.imgTexture.src = options.path;

        this.lastZoomScale = null;
        this.lastX = null;
        this.lastY = null;

        this.deltaRotate = null;

        this.mdown = false; 

        this.init = false;
        this.checkRequestAnimationFrame();
        requestAnimationFrame(this.animate.bind(this));

        this.setEventListeners();
    };

    // Set initialized canvas scale
    Zoomage.prototype = {
        animate: function() {

            if(!this.init) {
                if(this.imgTexture.width && this.imgTexture.height) {
                    var scaleRatio = 1;

                    if(this.imgTexture.width > this.imgTexture.height) {
                        if(this.canvas.clientWidth < this.imgTexture.width) {
                            scaleRatio = this.canvas.clientWidth / this.imgTexture.width;
                            this.position.y = (this.canvas.clientHeight - scaleRatio * this.imgTexture.height) / 2;
                        } else {
                            this.position.x = (this.canvas.clientWidth - this.imgTexture.width) / 2;
                            this.position.y = (this.canvas.clientHeight - this.imgTexture.height) / 2;
                        }
                    } else {
                        if(this.canvas.clientWidth < this.imgTexture.width) {
                            scaleRatio = this.canvas.clientHeight / this.imgTexture.height;
                            this.position.x = (this.canvas.clientWidth - scaleRatio * this.imgTexture.width) / 2;
                        } else {
                            this.position.x = (this.canvas.clientWidth - this.imgTexture.width) / 2;
                            this.position.y = (this.canvas.clientHeight - this.imgTexture.height) / 2;
                        }
                    }

                    this.scale.x = scaleRatio;
                    this.scale.y = scaleRatio;
                    this.init = true;
                }
            }

            if(this.isTouching){
                this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            } else {
                this.context.restore();
                this.context.save();
            }

            if((this.isTouching || this.isFirstTime) && this.isImgLoaded) {
                this.context.drawImage(
                    this.imgTexture, 
                    this.position.x, this.position.y, 
                    this.scale.x * this.imgTexture.width, 
                    this.scale.y * this.imgTexture.height);
            }

            this.isFirstTime = false;

            requestAnimationFrame(this.animate.bind(this));
        },

        gesturePinchZoom: function(event) {
            var zoom = false;

            if( event.targetTouches.length >= 2 ) {
                var p1 = event.targetTouches[0];
                var p2 = event.targetTouches[1];
                var zoomScale = Math.sqrt(Math.pow(p2.pageX - p1.pageX, 2) + Math.pow(p2.pageY - p1.pageY, 2)); 

                if( this.lastZoomScale ) {
                    zoom = zoomScale - this.lastZoomScale;
                }

                this.lastZoomScale = zoomScale;
            }    

            return zoom;
        },

        gestureRotate: function(event) {
            var rotate = false;

            if( event.targetTouches.length >= 2 ) {
                var p1 = event.targetTouches[0];
                var p2 = event.targetTouches[1];

                // TODO
            }    

            return rotate;
        },

        doZoom: function(zoom) {
            if(!zoom) return;

            // Get new scale
            var currentScale = this.scale.x;
            var newScale = this.scale.x + zoom / 100;

            // Get increasing width and height
            var deltaScale     = newScale - currentScale;
            var deltaWidth     = this.imgTexture.width * deltaScale;
            var deltaHeight    = this.imgTexture.height * deltaScale;
            var newPosX        = this.position.x - deltaWidth / 2;
            var newPosY        = this.position.y - deltaHeight / 2;

            // Restriction
            if(newScale * this.imgTexture.width > 2.2 * this.canvas.width || newScale * this.imgTexture.height > 2.2 * this.canvas.height ||
                newScale * this.imgTexture.width < 0.2 * this.canvas.width || newScale * this.imgTexture.height < 0.2 * this.canvas.height) {
                return false;
            }

            // Adjust scale and position
            this.scale.x    = newScale;
            this.scale.y    = newScale;
            this.position.x = newPosX;
            this.position.y = newPosY;

            this.isTouching = true;

            return true;
        },

        doMove: function(relativeX, relativeY) {
            if(this.lastX && this.lastY) {
              var deltaX = relativeX - this.lastX;
              var deltaY = relativeY - this.lastY;
              var currentWidth = (this.imgTexture.width * this.scale.x);
              var currentHeight = (this.imgTexture.height * this.scale.y);

              this.position.x += deltaX;
              this.position.y += deltaY;
            }

            this.lastX = relativeX;
            this.lastY = relativeY;
        },

        doRotate: function(rotate) {
            // TODO
        },  

        zoomInAnim: function() {

            var animTag = null;

            if(this.dbclickZoomLength > 0) {
                var r = this.doZoom(2);
                if(!r) {
                    return false;
                    cancelAnimationFrame(animTag);
                }
                this.dbclickZoomLength = this.dbclickZoomLength - 2;
                animTag = requestAnimationFrame(this.zoomInAnim.bind(this));
            } else {
                cancelAnimationFrame(animTag);
            }

            return true;
        },

        zoomOutAnim: function() {

            var animTag = null;

            if(this.dbclickZoomLength > 0) {
                var r = this.doZoom(-2);
                if(!r) {
                    return false;
                    cancelAnimationFrame(animTag);
                }
                this.dbclickZoomLength = this.dbclickZoomLength - 2;
                animTag = requestAnimationFrame(this.zoomOutAnim.bind(this));
            } else {
                cancelAnimationFrame(animTag);
            }

            return true;
        },

        setEventListeners: function() {
            // "bind()" is not supported in IE6/7/8
            this.canvas.addEventListener('touchend', function(e) {

                this.isTouching = false;

                if(this.lastTouchEndTimestamp === null || this.lastTouchEndObject === null) {
                    this.lastTouchEndTimestamp = Math.round(new Date().getTime());
                    this.lastTouchEndObject = e.changedTouches[0];
                } else {
                    var currentTimestamp = Math.round(new Date().getTime());
                    if(currentTimestamp - this.lastTouchEndTimestamp < 300) {

                        if(Math.abs(this.lastTouchEndObject.pageX - e.changedTouches[0].pageX) < 20 &&
                            Math.abs(this.lastTouchEndObject.pageY - e.changedTouches[0].pageY < 20)) {
                            // Zoom!
                            this.dbclickZoomLength = this.dbclickZoomThreshold;

                            if(this.dbclickZoomToggle){
                                var r = this.zoomInAnim();
                                if(!r) {
                                    this.zoomOutAnim();
                                }
                            } else {
                                var r = this.zoomOutAnim();
                                if(!r) {
                                    this.zoomInAnim();
                                }
                            }

                            this.dbclickZoomToggle = !this.dbclickZoomToggle;
                        }
                    }

                    this.lastTouchEndTimestamp = currentTimestamp;
                    this.lastTouchEndObject = e.changedTouches[0];
                }

            }.bind(this));

            this.canvas.addEventListener('touchstart', function(e) {

                this.isTouching = true;

                this.lastX          = null;
                this.lastY          = null;
                this.lastZoomScale  = null;

            }.bind(this));

            this.canvas.addEventListener('touchmove', function(e) {
                e.preventDefault();
                
                if(e.targetTouches.length == 2) { 
                    this.doZoom(this.gesturePinchZoom(e));
                } else if(e.targetTouches.length == 1) {
                    var relativeX = e.targetTouches[0].pageX - this.canvas.getBoundingClientRect().left;
                    var relativeY = e.targetTouches[0].pageY - this.canvas.getBoundingClientRect().top;                
                    this.doMove(relativeX, relativeY);
                }
            }.bind(this));

            this.imgTexture.addEventListener('load', function(e){
                this.isImgLoaded = true;
                this.isFirstTime = true;
            }.bind(this));

            if(this.desktop) {

                window.addEventListener('keyup', function(e) {
                    if(e.keyCode == 187 || e.keyCode == 61) { 
                        this.doZoom(5);
                    }
                    else if(e.keyCode == 54) {
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

    root.Zoomage = Zoomage;
}).call(this);
