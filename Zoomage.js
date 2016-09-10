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

(function(root, factory) {

    if(typeof module === "object" && module.exports) {

        module.exports = factory();

    } else {

        root.Zoomage = factory();
        
    }

}(this, function() {


    var Zoomage = function(options) {
        if( !options || !options.canvas || !options.path ) {
            throw 'Zoomage constructor: missing arguments canvas or path';
        }

        this.canvas         = options.canvas;
        this.canvas.width   = this.canvas.clientWidth;
        this.canvas.height  = this.canvas.clientHeight;
        this.context        = this.canvas.getContext('2d');

        // Get callback method
        this.onZoom         = options.onZoom || null;
        this.onZoomEnd      = options.onZoomEnd || null;

        // Whether turn on the switch of gesture rotate
        this.gestureRotate  = options.gestureRotate || false;
        this.rotateThreshold = 5;

        // Save current context
        this.context.save();

        this.isOnTouching     = false;
        this.isFirstTimeLoad    = true;
        this.isImgLoaded    = false;

        this.desktop = options.desktop || false;

        this.lastTouchEndTimestamp = null;
        this.lastTouchEndObject    = null;
        this.dbclickZoomToggle     = true; 
        this.dbclickZoomLength     = 0;
        this.dbclickZoomThreshold  = Math.abs(options.dbclickZoomThreshold) || 0.1;

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
            center: {},
            angle: 0
        };

        this.imgTexture = new Image();
        this.imgTexture.src = options.path;

        this.lastZoomScale = null;
        this.lastTouchRotateAngle = null;
        this.lastX = null;
        this.lastY = null;

        this.deltaRotate = null;

        this.mdown = false; 

        this.init = false;

        this._checkRequestAnimationFrame();
        requestAnimationFrame(this._animate.bind(this));

        this._setEventListeners();
    };

    // Set initialized canvas scale
    Zoomage.prototype = {

        _animate: function() {

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

            if(this.isOnTouching || this.mdown){
                this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            } else {
                if(!this.gestureRotate) {
                    this.context.restore();
                    this.context.save();
                }
            }

            if(this.gestureRotate) {
                this.context.translate(this.rotate.center.pageX, this.rotate.center.pageY);
                this.context.rotate(this.rotate.angle);
                this.context.translate(-this.rotate.center.pageX, -this.rotate.center.pageY);
                this.rotate.angle = 0;
            }
            
            if((this.isOnTouching || this.isFirstTimeLoad || this.mdown) && this.isImgLoaded) {
                this.context.drawImage(
                    this.imgTexture, 
                    this.position.x, this.position.y, 
                    this.scale.x * this.imgTexture.width, 
                    this.scale.y * this.imgTexture.height);
            }

            this.isFirstTimeLoad = false;

            requestAnimationFrame(this._animate.bind(this));
        },

        _gesturePinchZoom: function(event) {
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

        _gestureRotate: function(event) {
            var rotate = false;

            if( event.targetTouches.length >= 2 ) {
                var p1 = event.targetTouches[0];
                var p2 = event.targetTouches[1];

                // TODO
                var rotateAngel = 0;

                if(p1.pageY == p2.pageY && p1.pageX < p2.pageX) {
                    rotateAngel = 0;
                } else if(p1.pageY < p2.pageY && p1.pageX < p2.pageX) {
                    rotateAngel = Math.atan((p2.pageY - p1.pageY) / (p2.pageX - p1.pageX)) * 180 / Math.PI;
                } else if(p1.pageY < p2.pageY && p1.pageX == p2.pageX) {
                    rotateAngel = 90;
                } else if(p1.pageY < p2.pageY && p1.pageX > p2.pageX) {
                    rotateAngel = 180 - Math.atan((p2.pageY - p1.pageY) / (p1.pageX - p2.pageX)) * 180 / Math.PI;
                } else if(p1.pageY == p2.pageY && p1.pageX > p2.pageX) {
                    rotateAngel = 180;
                } else if(p1.pageY > p2.pageY && p1.pageX > p2.pageX) {
                    rotateAngel = 180 - Math.atan((p2.pageY - p1.pageY) / (p1.pageX - p2.pageX)) * 180 / Math.PI;
                } else if(p1.pageY > p2.pageY && p1.pageX == p2.pageX) {
                    rotateAngel = 270;
                } else if(p1.pageY > p2.pageY && p1.pageX < p2.pageX) {
                    rotateAngel = 360 - Math.atan((p1.pageY - p2.pageY) / (p2.pageX - p1.pageX)) * 180 / Math.PI;
                }

            }    

            rotate = {
                o: p1,
                a: rotateAngel
            };

            return rotate;
        },

        _doZoom: function(zoom) {
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

            this.isOnTouching = true;

            if(this._type(this.onZoom) === "function") {
                this.onZoom.call(this, 
                    {
                        zoomScale: newScale, 
                        imageScale: {
                            width: newScale * this.imgTexture.width ,
                            height: newScale * this.imgTexture.height
                        }
                    });
            }

            return true;
        },

        _doMove: function(relativeX, relativeY) {
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

        _doRotate: function(rotateArr) {

            if(this.lastTouchRotateAngle !== null) {
                this.rotate = {
                    angle: (rotateArr.a - this.lastTouchRotateAngle) * Math.PI / 180 * this.rotateThreshold,
                    center: rotateArr.o
                }
            }

            this.lastTouchRotateAngle = rotateArr.a;
        },  

        _zoomInAnim: function() {

            var animTag = null;
            var zoomThreshold = Math.round(this.dbclickZoomLength / 10 * 2);

            if(this.dbclickZoomLength > 0) {
                if(!this._doZoom(zoomThreshold)) {
                    return false;
                    cancelAnimationFrame(animTag);
                }
                this.dbclickZoomLength = this.dbclickZoomLength - zoomThreshold;
                animTag = requestAnimationFrame(this._zoomInAnim.bind(this));
            } else {
                cancelAnimationFrame(animTag);
            }

            return true;
        },

        _zoomOutAnim: function() {

            var animTag = null;
            var zoomThreshold = Math.round(this.dbclickZoomLength / 10 * 2);

            if(this.dbclickZoomLength > 0) {
                if(!this._doZoom(-zoomThreshold)) {
                    return false;
                    cancelAnimationFrame(animTag);
                }
                this.dbclickZoomLength = this.dbclickZoomLength - zoomThreshold;
                animTag = requestAnimationFrame(this._zoomOutAnim.bind(this));
            } else {
                cancelAnimationFrame(animTag);
            }

            return true;
        },

        _setEventListeners: function() {
            // "bind()" is not supported in IE6/7/8
            this.canvas.addEventListener('touchend', function(e) {

                this.isOnTouching = false;
                this.lastTouchRotateAngle = null;

                // This event will be conflicted with the system event "dblclick", so disable it when "desktop" enabled
                if(!this.desktop) {
                    if(this.lastTouchEndTimestamp === null || this.lastTouchEndObject === null) {
                        this.lastTouchEndTimestamp = Math.round(new Date().getTime());
                        this.lastTouchEndObject = e.changedTouches[0];
                    } else {
                        var currentTimestamp = Math.round(new Date().getTime());
                        if(currentTimestamp - this.lastTouchEndTimestamp < 300) {

                            if(Math.abs(this.lastTouchEndObject.pageX - e.changedTouches[0].pageX) < 20 &&
                                Math.abs(this.lastTouchEndObject.pageY - e.changedTouches[0].pageY < 20)) {
                                // Zoom!
                                this.dbclickZoomLength = 100 * this.dbclickZoomThreshold;

                                if(this.dbclickZoomToggle){
                                    if(!this._zoomInAnim()) {
                                        this._zoomOutAnim();
                                    }
                                } else {
                                    if(!this._zoomOutAnim()) {
                                        this._zoomInAnim();
                                    }
                                }

                                this.dbclickZoomToggle = !this.dbclickZoomToggle;
                            }
                        }

                        this.lastTouchEndTimestamp = currentTimestamp;
                        this.lastTouchEndObject = e.changedTouches[0];
                    }
                }

            }.bind(this));

            this.canvas.addEventListener('touchstart', function(e) {

                this.isOnTouching = true;

                this.lastX          = null;
                this.lastY          = null;
                this.lastZoomScale  = null;

            }.bind(this));

            this.canvas.addEventListener('touchmove', function(e) {
                e.preventDefault();
                
                if(e.targetTouches.length == 2) { 

                    this._doZoom(this._gesturePinchZoom(e));

                    if(this.gestureRotate) {
                        this._doRotate(this._gestureRotate(e));
                    }

                } else if(e.targetTouches.length == 1) {

                    var relativeX = e.targetTouches[0].pageX - this.canvas.getBoundingClientRect().left;
                    var relativeY = e.targetTouches[0].pageY - this.canvas.getBoundingClientRect().top;                
                    this._doMove(relativeX, relativeY);
                    
                }
            }.bind(this));

            this.imgTexture.addEventListener('load', function(e){
                this.isImgLoaded = true;
                this.isFirstTimeLoad = true;
            }.bind(this));

            if(this.desktop) {

                window.addEventListener('keyup', function(e) {
                    if(e.keyCode == 187) { 
                        this._doZoom(5);
                    }
                    else if(e.keyCode == 189) {
                        this._doZoom(-5);
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
                        this._doMove(relativeX, relativeY);
                    }

                    if(relativeX <= 0 || relativeX >= this.canvas.clientWidth || relativeY <= 0 || relativeY >= this.canvas.clientHeight) {
                        this.mdown = false;
                    }
                }.bind(this));

                window.addEventListener('dblclick', function(e) {
                    console.log(e);
                    // Zoom!
                    this.dbclickZoomLength = 100 * this.dbclickZoomThreshold;

                    if(this.dbclickZoomToggle){
                        if(!this._zoomInAnim()) {
                            this._zoomOutAnim();
                        }
                    } else {
                        if(!this._zoomOutAnim()) {
                            this._zoomInAnim();
                        }
                    }

                    this.dbclickZoomToggle = !this.dbclickZoomToggle;
                }.bind(this));
            }
        },

        _type: function(obj) {

            var class2type = {},
                toString = class2type.toString;

            class2type["[object Function]"] = "function";

            if (obj == null) {
                return obj + "";
            }

            // Support: Android<4.0, iOS<6 (functionish RegExp)
            return typeof obj === "object" || typeof obj === "function" ?
                class2type[ toString.call( obj ) ] || "object" :
                typeof obj;
        },

        _checkRequestAnimationFrame: function() {
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
        },

        // Public function
        zoom: function(zoom) {

            this.dbclickZoomLength = Math.abs(100 * zoom);

            (zoom > 0 ? this._zoomInAnim() : this._zoomOutAnim());

        }

    };

    return Zoomage;

}));
