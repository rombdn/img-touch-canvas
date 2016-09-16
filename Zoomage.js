/*
=================================
img-touch-canvas - v0.1
http://github.com/rombdn/img-touch-canvas

Zoomage.js - v1.0.0 (Latest)
https://github.com/Becavalier/Zoomage.js

(c) 2013 Romain BEAUDON
This code may be freely distributed under the MIT License

(c) 2016 YHSPY
This code may be freely distributed under the MIT License
=================================
*/

(function(root, factory) {

    if (typeof module === "object" && module.exports) {

        module.exports = factory();

    } else {

        root.Zoomage = factory();
        
    }

}(this, function() {

    var Zoomage = function(options) {
        if (!options || !options.container) {
            throw '[Zoomage.js Error] Zoomage constructor: missing arguments [container].';
        }

        // Set container and canvas
        this.container            = options.container; 
        this.canvas               = document.createElement("canvas");

        // Append the canvas
        this.container.appendChild(this.canvas);
        
        // Get canvas context
        this.context               = this.canvas.getContext('2d');

        // Get callback method
        this.onZoom                = options.onZoom || null;
        this.onRotate              = options.onRotate || null;
        this.onDrag                = options.onDrag || null;

        // Save current context
        this.context.save();

        // Get settings
        this.dbclickZoomThreshold  = Math.abs(options.dbclickZoomThreshold) || 0.1;

        this.maxZoom               = Math.abs(options.maxZoom) || 2;
        this.minZoom               = Math.abs(options.minZoom) || 0.2;

        // Whether turn on the switcher of gesture rotate
        this.enableGestureRotate   = options.enableGestureRotate || false;
        // Whether support this feature on desktop version
        this.enableDesktop         = options.enableDesktop || false;

        // Default settings
        this.imgTexture            = new Image();

        // Global flag
        this.isImgLoaded           = false;

        this.isFirstTimeLoad       = true;

        this.lastZoomScale         = null;

        this.lastX                 = null;
        this.lastY                 = null;

        this.zoomD                 = 1;

        this.mdown                 = false; 

        this.lastTouchEndTimestamp = null;
        this.lastTouchEndObject    = null;

        this.animateHandle         = null;

        this.dbclickZoomToggle     = true; 

        // Setting "requestforanimate"
        this._checkRequestAnimationFrame();
        
        // Set listeners
        if (this.enableGestureRotate) {

            if ('transform' in document.body.style) {
                this.prefixedTransform = 'transform';
            }else if ('webkitTransform' in document.body.style) {
                this.prefixedTransform = 'webkitTransform';
            }

            this._setEventListeners_Transform();
            requestAnimationFrame(this._animate_Transform.bind(this));

        } else {

            // Adjust the canvas element scale
            this.canvas.style.width   = "100%";
            this.canvas.style.height  = "100%";

            // Adjust the scale of canvas drawing surface
            this.canvas.width         = this.canvas.clientWidth;
            this.canvas.height        = this.canvas.clientHeight;

            this._setEventListeners_Canvas();
            requestAnimationFrame(this._animate_Canvas.bind(this));

        }
    };

    // Set initialized canvas scale
    Zoomage.prototype = {

        _animate_Transform: function() {

            // Zoom scale restriction
            if (this.zoomD > this.maxZoom) {
                this.zoomD = this.maxZoom;
            } else if (this.zoomD < this.minZoom) {
                this.zoomD = this.minZoom;
            }

            if (this.isImgLoaded)
                this.canvas.style[this.prefixedTransform] = 'translate(' + this.moveXD + 'px,' + this.moveYD + 'px) translateZ(0) scale(' + this.zoomD + ') rotate(' + this.rotate.angle + 'deg)';
            
            if (this.isFirstTimeLoad && this.isImgLoaded) {
                this.context.drawImage(
                    this.imgTexture, 
                    this.position.x, this.position.y, 
                    this.scale.x * this.imgTexture.width, 
                    this.scale.y * this.imgTexture.height);

                this.isFirstTimeLoad = false;
            }

            requestAnimationFrame(this._animate_Transform.bind(this));
        },

        _animate_Canvas: function() {

            if (this.imgTexture.src === null) {
                return;
            }

            if (this.isOnTouching || this.mdown) {
                this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            } else {
                this.context.restore();
                this.context.save();
            }
            
            if ((this.isOnTouching || this.isFirstTimeLoad || this.mdown) && this.isImgLoaded) {
                this.context.drawImage(
                    this.imgTexture, 
                    this.position.x, this.position.y, 
                    this.scale.x * this.imgTexture.width, 
                    this.scale.y * this.imgTexture.height);

                this.isFirstTimeLoad = false;
            }
            
            requestAnimationFrame(this._animate_Canvas.bind(this));
        },

        _gesturePinchZoom: function(touches) {
            var zoom = false;

            if (touches.length >= 2) {
                var p1 = touches[0],
                    p2 = touches[1];

                var zoomScale = Math.sqrt(Math.pow(p2.pageX - p1.pageX, 2) + Math.pow(p2.pageY - p1.pageY, 2)); 

                if (this.lastZoomScale) {
                    zoom = zoomScale - this.lastZoomScale;
                }

                this.lastZoomScale = zoomScale;
            }    

            return zoom;
        },

        _enableGestureRotate: function(touches) {
            var rotate = false;

            if (touches.length >= 2) {
                var p1 = touches[0],
                    p2 = touches[1];

                var x = p2.pageX - p1.pageX,
                    y = p2.pageY - p1.pageY;

                // TO FIX (If you continuously rotating more than 180 degree, here will cause a bug)
                var rotateAngel = (Math.atan2(y, x) * 180 / Math.PI) < 0 ? 180 + (Math.atan2(y, x) * 180 / Math.PI)  : (Math.atan2(y, x) * 180 / Math.PI);
            }  

            rotate = {
                o: p1,
                a: rotateAngel
            };

            return rotate;
        },

        _doZoom: function(zoom) {
            if (!zoom) return;

            // Get new scale
            var currentScale   = this.scale.x;
                newScale       = this.scale.x + zoom;
            
            // Get increasing width and height
            var deltaScale     = newScale - currentScale,
                deltaWidth     = this.imgTexture.width * deltaScale,
                deltaHeight    = this.imgTexture.height * deltaScale;

            var newPosX        = this.position.x - deltaWidth / 2,
                newPosY        = this.position.y - deltaHeight / 2;

            // Zoom restriction
            if (newScale > this.maxZoom || newScale < this.minZoom) {
                return false;
            }

            // Adjust scale and position
            this.scale.x       = newScale;
            this.scale.y       = newScale;
            this.position.x    = newPosX;
            this.position.y    = newPosY;

            this.isOnTouching  = true;

            this.zoomD         = newScale;

            this._runCallback("onZoom");

            return true;
        },

        _doMove: function(relativeX, relativeY) {
            if (this.lastX && this.lastY) {

                var deltaX = relativeX - this.lastX,
                    deltaY = relativeY - this.lastY;

                var currentWidth = (this.imgTexture.width * this.scale.x),
                    currentHeight = (this.imgTexture.height * this.scale.y);

                this.position.x += deltaX;
                this.position.y += deltaY;
            }

            this.lastX = relativeX;
            this.lastY = relativeY;
        },

        _doRotate: function(rotateArr) {

            if (this.lastTouchRotateAngle !== null) {
                this.rotate.angle = this.rotate.angle + 1.5 * (rotateArr.a - this.lastTouchRotateAngle);
                this.rotate.center = rotateArr.o;
            }

            this.lastTouchRotateAngle = rotateArr.a;

            this._runCallback("onRotate");
        },  

        _zoomInAnim_Canvas: function() {

            var zoomThreshold = this.dbclickZoomLength / 10 * 2;

            if (this.dbclickZoomLength > 0.01) {
                if (!this._doZoom(zoomThreshold)) {
                    return false;
                    cancelAnimationFrame(t);
                }
                this.dbclickZoomLength = this.dbclickZoomLength - zoomThreshold;
                this.animateHandle = requestAnimationFrame(this._zoomInAnim_Canvas.bind(this));
            } else {
                cancelAnimationFrame(this.animateHandle);
            }

            return true;
        },

        _zoomOutAnim_Canvas: function() {

            var zoomThreshold = this.dbclickZoomLength / 10 * 2;

            if (this.dbclickZoomLength > 0.01) {
                if (!this._doZoom(-zoomThreshold)) {
                    return false;
                    cancelAnimationFrame(t);
                }
                this.dbclickZoomLength = this.dbclickZoomLength - zoomThreshold;
                this.animateHandle = requestAnimationFrame(this._zoomOutAnim_Canvas.bind(this));
            } else {
                cancelAnimationFrame(this.animateHandle);
            }

            return true;
        },

        _zoomInAnim_Transform: function() {

            var zoomThreshold = this.dbclickZoomLength / 10 * 2;

            if (this.dbclickZoomLength > 0.01) {
                this.zoomD += zoomThreshold;
                this.dbclickZoomLength = this.dbclickZoomLength - zoomThreshold;
                this.animateHandle = requestAnimationFrame(this._zoomInAnim_Transform.bind(this));
            } else {
                cancelAnimationFrame(this.animateHandle);
            }

            return true;
        },

        _zoomOutAnim_Transform: function() {

            var zoomThreshold = this.dbclickZoomLength / 10 * 2;

            if (this.dbclickZoomLength > 0.01) {
                this.zoomD -= zoomThreshold;
                this.dbclickZoomLength = this.dbclickZoomLength - zoomThreshold;
                this.animateHandle = requestAnimationFrame(this._zoomOutAnim_Transform.bind(this));
            } else {
                cancelAnimationFrame(this.animateHandle);
            }

            return true;
        },

        _gestureDbClick: function(e, callback) {

            var touch = e.changedTouches[0];

            if (this.lastTouchEndTimestamp === null || this.lastTouchEndObject === null) {

                this.lastTouchEndTimestamp = Math.round(new Date().getTime());
                this.lastTouchEndObject = touch;

            } else {

                var currentTimestamp = Math.round(new Date().getTime());
                if (currentTimestamp - this.lastTouchEndTimestamp < 300) {

                    if (Math.abs(this.lastTouchEndObject.pageX - touch.pageX) < 20 &&
                        Math.abs(this.lastTouchEndObject.pageY - touch.pageY < 20)) {

                        callback && callback();
                    }
                }

                this.lastTouchEndTimestamp = currentTimestamp;
                this.lastTouchEndObject = touch;
            }
        },

        _runCallback: function(flag, arg) {
            switch(flag) {
                case "onDrag":
                if (this._type(this.onDrag) === "function") {
                    this.onDrag.call(this, { 
                        x: this.lastX.toFixed(3),
                        y: this.lastY.toFixed(3)
                    });
                }
                break;

                case "onRotate":
                if (this._type(this.onRotate) === "function") {
                    this.onRotate.call(this, { 
                        rotate: this.rotate.angle.toFixed(3)
                    });
                }
                break;

                case "onZoom":
                if (this._type(this.onZoom) === "function") {
                    this.onZoom.call(this, {
                        zoom: this.zoomD.toFixed(3), 
                        scale: {
                            width: (this.zoomD * this.imgTexture.width).toFixed(3) ,
                            height: (this.zoomD * this.imgTexture.height).toFixed(3)
                        }
                    });
                }
                break;
            }
        },

        _setEventListeners_Transform: function() {

            this.container.addEventListener('touchend', function(e) {

                this.lastZoomScale         = null;

                this.lastTouchRotateAngle  = null;

                // This event will be conflicted with the system event "dblclick", so disable it when "enableDesktop" enabled
                if (!this.enableDesktop) {

                    this._gestureDbClick(e, function() {
                        
                        this.dbclickZoomLength = this.dbclickZoomThreshold;

                        if (this.dbclickZoomToggle) {
                            if (!this._zoomInAnim_Transform()) {
                                this._zoomOutAnim_Transform();
                            }
                        } else {
                            if (!this._zoomOutAnim_Transform()) {
                                this._zoomInAnim_Transform();
                            }
                        }

                        this.dbclickZoomToggle = !this.dbclickZoomToggle;

                    }.bind(this));
                }
                
            }.bind(this));

            this.container.addEventListener('touchstart', function(e) {

                this.lastX = null;
                this.lastY = null;
                
            }.bind(this));

            this.container.addEventListener('touchmove', function(e) {

                e.preventDefault();

                // Use e.touches instead of e.targetTouches
                if (e.touches.length == 2) { 

                    // Zoom 
                    this.zoomD = this.zoomD + this._gesturePinchZoom(e.touches) / 100;

                    // Callback [onZoom]
                    this._runCallback("onZoom");

                    // Rotate
                    this._doRotate(this._enableGestureRotate(e.touches));

                } else if (e.touches.length == 1) {

                    // Just drug
                    if (this.lastX !== null && this.lastY !== null) {
                        this.moveXD += (e.touches[0].pageX - this.lastX);
                        this.moveYD += (e.touches[0].pageY - this.lastY);
                    }

                    this.lastX = e.touches[0].pageX;
                    this.lastY = e.touches[0].pageY;

                    this._runCallback("onDrag");
                }

            }.bind(this));

            this.imgTexture.addEventListener('load', function(e) {

                this.moveXD               = 0;
                this.moveYD               = 0;
                this.zoomD                = 1;

                this.lastTouchRotateAngle = null;

                this.rotate               = {
                    center: {},
                    angle: 0
                };

                // Initail scale
                this.canvas.width   = this.imgTexture.width;
                this.canvas.height  = this.imgTexture.height;

                this.canvas.setAttribute("width", this.imgTexture.width + "px");
                this.canvas.setAttribute("height", this.imgTexture.height + "px");

                if (this.imgTexture.width > this.imgTexture.height) {
                    if (this.canvas.parentNode.clientWidth < this.imgTexture.width) {
                        this.zoomD  = this.canvas.parentNode.clientWidth / this.imgTexture.width;

                        this.moveYD = (this.canvas.parentNode.clientHeight - this.zoomD * this.imgTexture.height) / 2 - (this.imgTexture.height * (1 - this.zoomD) / 2);
                        this.moveXD = -this.imgTexture.width * (1 - this.zoomD) / 2; 
                    } else {
                        this.moveXD = (this.canvas.parentNode.clientWidth - this.imgTexture.width) / 2;
                        this.moveYD = (this.canvas.parentNode.clientHeight - this.imgTexture.height) / 2;
                    }
                } else {
                    if (this.canvas.parentNode.clientWidth < this.imgTexture.width) {
                        this.zoomD  = this.canvas.parentNode.clientHeight / this.imgTexture.height;

                        this.moveXD = (this.canvas.parentNode.clientWidth - this.zoomD * this.imgTexture.width) / 2 - (this.imgTexture.width * (1 - this.zoomD) / 2);
                        this.moveYD = -this.imgTexture.height * (1 - this.zoomD) / 2; 

                    } else {
                        this.moveXD = (this.canvas.parentNode.clientWidth - this.imgTexture.width) / 2;
                        this.moveYD = (this.canvas.parentNode.clientHeight - this.imgTexture.height) / 2;
                    }
                }
                
                this.isImgLoaded = true;

            }.bind(this));
            
            // If support desktop ?
            if (this.enableDesktop) {

                window.addEventListener('keyup', function(e) {
                    if (e.keyCode == 187) { 
                        this.zoomD += 0.1;
                    }
                    else if (e.keyCode == 189) {
                        this.zoomD -= 0.1;
                    }

                    if(e.keyCode == 187 || e.keyCode == 189) {
                        this._runCallback("onZoom");
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

                    if (this.mdown) {
                        if (this.lastX !== null && this.lastY !== null) {
                            this.moveXD += (e.pageX - this.lastX);
                            this.moveYD += (e.pageY - this.lastY);
                        }

                        this.lastX = e.pageX;
                        this.lastY = e.pageY;

                        this._runCallback("onDrag");
                    }

                }.bind(this));

                window.addEventListener('dblclick', function(e) {
                        
                    this.dbclickZoomLength = this.dbclickZoomThreshold;

                    if (this.dbclickZoomToggle) {
                        if (!this._zoomInAnim_Transform()) {
                            this._zoomOutAnim_Transform();
                        } 
                    } else {
                        if (!this._zoomOutAnim_Transform()) {
                            this._zoomInAnim_Transform();
                        }
                    }

                    this.dbclickZoomToggle = !this.dbclickZoomToggle;

                }.bind(this));
            }
        },

        _setEventListeners_Canvas: function() {

            // "bind()" is not supported in IE6/7/8
            this.canvas.addEventListener('touchend', function(e) {

                this.isOnTouching  = false;

                this.lastZoomScale = null;

                // This event will be conflicted with the system event "dblclick", so disable it when "enableDesktop" enabled
                if (!this.enableDesktop) {
                    
                    this._gestureDbClick(e, function() {
                        // Zoom!
                        this.dbclickZoomLength = this.dbclickZoomThreshold;

                        if (this.dbclickZoomToggle) {
                            if (!this._zoomInAnim_Canvas()) {
                                this._zoomOutAnim_Canvas();
                            }
                        } else {
                            if (!this._zoomOutAnim_Canvas()) {
                                this._zoomInAnim_Canvas();
                            }
                        }

                        this.dbclickZoomToggle = !this.dbclickZoomToggle;
                    }.bind(this));
                }

            }.bind(this));

            this.canvas.addEventListener('touchstart', function(e) {

                this.isOnTouching   = true;

                this.lastX          = null;
                this.lastY          = null;

            }.bind(this));

            this.canvas.addEventListener('touchmove', function(e) {
                e.preventDefault();
                
                if (e.targetTouches.length == 2) { 

                    this._doZoom(this._gesturePinchZoom(e.targetTouches) / 100);

                } else if (e.targetTouches.length == 1) {

                    var relativeX = e.targetTouches[0].pageX - this.canvas.getBoundingClientRect().left,
                        relativeY = e.targetTouches[0].pageY - this.canvas.getBoundingClientRect().top; 

                    this._doMove(relativeX, relativeY);

                    this._runCallback("onDrag");
                    
                }
            }.bind(this));

            this.imgTexture.addEventListener('load', function(e) {

                this.isOnTouching          = false;

                this.lastTouchEndTimestamp = null;
                this.lastTouchEndObject    = null;

                this.dbclickZoomLength     = 0;


                if (this.imgTexture.width && this.imgTexture.height) {
                    var scaleRatio = 1;

                    if (this.imgTexture.width > this.imgTexture.height) {
                        if (this.canvas.clientWidth < this.imgTexture.width) {
                            scaleRatio = this.canvas.clientWidth / this.imgTexture.width;
                            this.position.y = (this.canvas.clientHeight - scaleRatio * this.imgTexture.height) / 2;
                        } else {
                            this.position.x = (this.canvas.clientWidth - this.imgTexture.width) / 2;
                            this.position.y = (this.canvas.clientHeight - this.imgTexture.height) / 2;
                        }
                    } else {
                        if (this.canvas.clientWidth < this.imgTexture.width) {
                            scaleRatio = this.canvas.clientHeight / this.imgTexture.height;
                            this.position.x = (this.canvas.clientWidth - scaleRatio * this.imgTexture.width) / 2;
                        } else {
                            this.position.x = (this.canvas.clientWidth - this.imgTexture.width) / 2;
                            this.position.y = (this.canvas.clientHeight - this.imgTexture.height) / 2;
                        }
                    }

                    this.scale.x = scaleRatio;
                    this.scale.y = scaleRatio;
                }

                this.isImgLoaded = true;


            }.bind(this));

            if (this.enableDesktop) {

                window.addEventListener('keyup', function(e) {
                    if (e.keyCode == 187) { 
                        this._doZoom(0.05);
                    }
                    else if (e.keyCode == 189) {
                        this._doZoom(-0.05);
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
                    var relativeX = e.pageX - this.canvas.getBoundingClientRect().left,
                        relativeY = e.pageY - this.canvas.getBoundingClientRect().top;

                    if (e.target == this.canvas && this.mdown) {
                        this._doMove(relativeX, relativeY);
                    }

                    if (relativeX <= 0 || relativeX >= this.canvas.clientWidth || relativeY <= 0 || relativeY >= this.canvas.clientHeight) {
                        this.mdown = false;
                    }

                    this._runCallback("onDrag");
                }.bind(this));

                window.addEventListener('dblclick', function(e) {
                    // Zoom!
                    this.dbclickZoomLength = this.dbclickZoomThreshold;

                    if (this.dbclickZoomToggle) {
                        if (!this._zoomInAnim_Canvas()) {
                            this._zoomOutAnim_Canvas();
                        }
                    } else {
                        if (!this._zoomOutAnim_Canvas()) {
                            this._zoomInAnim_Canvas();
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
                window.cancelAnimationFrame  = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
            }

            if (!window.requestAnimationFrame) {
                window.requestAnimationFrame = function(callback, element) {
                    var currTime   = new Date().getTime();
                    var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                    var id         = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
                    lastTime       = currTime + timeToCall;
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

            this.dbclickZoomLength = Math.abs(zoom);

            if (this.enableGestureRotate) {

                (zoom > 0 ? this._zoomInAnim_Transform() : this._zoomOutAnim_Transform());

            } else {

                (zoom > 0 ? this._zoomInAnim_Canvas() : this._zoomOutAnim_Canvas());

            }
        },

        load: function(path) {

            // Clear screen
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Reset flags
            this.position = {
                x: 0,
                y: 0
            };

            this.scale = {
                x: 1,
                y: 1
            };

            this.isImgLoaded           = false;

            this.isFirstTimeLoad       = true;

            this.lastZoomScale         = null;

            this.lastX                 = null;
            this.lastY                 = null;

            this.mdown                 = false; 

            this.lastTouchEndTimestamp = null;
            this.lastTouchEndObject    = null;

            // Replace image path
            this.imgTexture.src = path;
        }

    };

    return Zoomage;

}));
