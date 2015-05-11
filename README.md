ImgTouchCanvas
================

Add touch gestures (pinch zoom and touch drag) to an image (like Google Maps).

Based on a canvas element for smooth rendering.

Plain HTML5 / vanilla JS, no external libraries needed.

Tested in Chrome 28, Firefox 21, Android Browser 4.2.2 and Firefox for Android 18


Usage
------------

**See a live example here : http://www.rombdn.com/img-touch-canvas/demo**

Define a container in which the image will be able to be resized and moved, then add a canvas element.

The image will be scaled to cover all the container so if you want the image to be showed at its original size by default 
then set the container size to match the image original size (see example).

    <html>
    <body>
        <div> <!-- set desired position and size to that div -->
            <canvas id="mycanvas" style="width: 100%; height: 100%"></canvas>
        </div>

        <script src="img-touch-canvas.js"></script>
        <script>
            var gesturableImg = new ImgTouchCanvas({
                canvas: document.getElementById('mycanvas'),
                path: "your image url"
            });
        </script>
    </body>
    </html>


Options
------------
When you initialize `new ImgTouchCanvas()` you can pass in the following options:

```
zoomSpeed       Speed of zoom when pinching / zooming (default 1, lower number is slower).
initialFit      Initial display. 'fill' to fill canvas (default), 'fit' to fit image centered in canvas.
onShow          Callback for initial display, returns image scale.
onZoom          Callback for during zoom, returns image scale.
maxZoom         Maximium zoom possible (default null), e.g. 2.0 for max 200%.
```



Licence
------------
(c) 2013 Romain BEAUDON
This code may be freely distributed under the MIT License