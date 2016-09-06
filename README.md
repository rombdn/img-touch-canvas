Zoomage.js
================

This library is based on "[rombdn/img-touch-canvas](https://github.com/rombdn/img-touch-canvas)", include updates and bug fix.


Preview
------------

##### Double click on the screen will auto-zoomin/out the image.
![image](https://github.com/Becavalier/Zoomage.js/blob/master/preview/preview-dbclick.gif?raw=true)

##### Zoomin/out the image with two finger gesture.
![image](https://github.com/Becavalier/Zoomage.js/blob/master/preview/preview-zoom.gif?raw=true)

##### Drag the image with one finger touch.
![image](https://github.com/Becavalier/Zoomage.js/blob/master/preview/preview-drag.gif?raw=true)

Instruction
------------

Add touch gestures (pinch zoom and touch drag) to an image (like Google Maps).

Based on a canvas element for smooth rendering.

Plain HTML5 / Vanilla JS, no external libraries needed.


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

                #container canvas {
                    width: 100%;
                    height: 100%;
                } 

            </style>
        </head>
        <body>
            <div id="container">
                <canvas id="canvas"></canvas>
            </div>

            <script src="Zoomage.js"></script>
            <script>

                // Initialize "Zoomage" with a canvas and an image
                var zoomage = new Zoomage({

                    // Basic Settings:
                    // [canvas: DOM] A canvas dom element for displaying
                    canvas: document.getElementById('canvas'),

                    // [path: String] An image's path which you want to be zoomed
                    path: "./scenery_image.jpg",

                    // Advanced Settings:
                    // [dbclickZoomThreshold: Number] Set auto zoom threshold when double click on the image (value 0.1 means the zoom step length is 10% of image's current scale)
                    dbclickZoomThreshold: 0.1，

                    // [onZoom: Function] Callback function called when image is zooming
                    onZoom: function(data) { 
                        console.log("[Zoom Scale] " + data.zoomScale, "\n[Image Width] " + data.imageScale.width, "\n[Image Height] " + data.imageScale.height);
                    }
                });

                // Increase the image size for 10 percent
                zoomage.zoom(0.1);

                // Reduce the image size for 10 percent
                zoomage.zoom(-0.1);

            </script>
        </body>
    </html>
```

Licence
------------
(c) 2016 YHSPY
This code may be freely distributed under the MIT License