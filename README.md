Zoomage.js
================

Instruction
------------

Add touch gestures (pinch zoom, touch drag and twist rotate) to an image (like Google Maps).

Based on a canvas element for smooth rendering (CSS3 Transform / Canvas).

Plain HTML5 / Vanilla JS, no external libraries needed.

Example: please open "index.html" in your local browser.

This library is based on "[rombdn/img-touch-canvas](https://github.com/rombdn/img-touch-canvas)", include updates and bug fix.


TODO List
------------

* Support `npm install` to use "Zoomage.js" in Commonjs like environment.

* Continually issue fixing.

Preview
------------

##### Double click on the screen will auto-zoomin/out the image.
![image](https://github.com/Becavalier/Zoomage.js/blob/master/images/preview-dbclick.gif?raw=true)

##### Zoomin/out the image with two finger gesture.
![image](https://github.com/Becavalier/Zoomage.js/blob/master/images/preview-zoom.gif?raw=true)

##### Drag the image with one finger touch.
![image](https://github.com/Becavalier/Zoomage.js/blob/master/images/preview-drag.gif?raw=true)

##### Rotate the image with two fingers touch.
![image](https://github.com/Becavalier/Zoomage.js/blob/master/images/preview-rotate.gif?raw=true)


Usage
------------

Define a container in which the image will be able to be resized and moved, then add a canvas element.

A full example shows below, you can use the public api `doZoom` to zoom the image in javascript or manually in console.

```html
    <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <style>

                html, body {
                    margin: 0;
                    padding: 0;
                }

                #container {
                    position: fixed;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.8);  
                    z-index: 10;
                }

            </style>
        </head>
        <body>
            <div id="container">
                <canvas id="canvas"></canvas>
            </div>

            <script src="Zoomage.min.js"></script>
            <script>

                // Initialize "Zoomage" with a canvas and an image
                var zoomage = new Zoomage({

                    // Basic Settings:
                    // [container: DOM] The container DOM for canvas deployment. You must specify a DOM element as a canvas container which will be auto-generate a canvas element in it.
                    container: document.getElementById('container'),


                    // Advanced Settings:
                    // [enableDesktop: Boolean] Support the desktop manipulation, you can control the image with mouse and keyboard, "+ / -" will zoom in / out the image, double click on the image will auto-zoom, also you can move the image with your mouse click down then drug.
                    enableDesktop: true, 

                    // [enableGestureRotate: Boolean] Support rotating the image with finger gesture. You can rotate the image with two fingers twisting on the screen.
                    enableGestureRotate: true,

                    // [dbclickZoomThreshold: Number] Set auto zoom threshold when double click on the image (value 0.1 means the zoom step length is 10% of image's current scale).
                    dbclickZoomThreshold: 0.1,

                    // [maxZoom: Number] The upper limit of zooming scale.
                    maxZoom: 3,

                    // [maxZoom: Number] The lower limit of zooming scale.
                    minZoom: 0.1,


                    // Callback Settings:
                    // [onDrag: Function] Callback function called when image is on draging.
                    onDrag: function(data) {
                        console.log("[Drag Position X] " + data.x, "[Drag Position Y] " + data.y);
                    },

                    // [onZoom: Function] Callback function called when image is on zooming.
                    onZoom: function(data) { 
                        console.log("[Zoom Scale] " + data.zoom, "\n[Image Width] " + data.scale.width, "\n[Image Height] " + data.scale.height);
                    },

                    // [onRotate: Function] Callback function called when image is on rotating.
                    onRotate: function(data) {
                        console.log("[Rotate Degree] " + data.rotate);
                    }
                });

                // Initialize Zoomage.js with an image (You can replcae the image with this method at any other place).
                zoomage.load("./images/scenery_image.jpg");

                // Increase the image size for 10 percent.
                zoomage.zoom(0.1);

                // Reduce the image size for 10 percent.
                zoomage.zoom(-0.1);

            </script>
        </body>
    </html>
```

Licence
------------
(c) 2016 YHSPY
This code may be freely distributed under the MIT License