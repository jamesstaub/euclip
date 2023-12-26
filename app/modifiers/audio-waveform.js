import { modifier } from 'ember-modifier';

export default modifier(
  (canvas, [buffer], { color = '#333' }) => {
    drawBuffer(canvas, buffer, color);

    const onMouseMove = (e) => moveCursor(e, canvas, buffer, color);

    canvas.addEventListener('mousemove', onMouseMove);

    return () => canvas.removeEventListener('mousemove', onMouseMove);
  },
  { eager: false }
);

function drawBuffer(canvas, buffer, color) {
  var ctx = canvas.getContext('2d');
  var width = canvas.width;
  var height = canvas.height;
  if (color) {
    ctx.fillStyle = color;
  }

  var data = buffer.getChannelData(0);
  var step = Math.ceil(data.length / width);
  var amp = height / 2;
  for (var i = 0; i < width; i++) {
    var min = 1.0;
    var max = -1.0;
    for (var j = 0; j < step; j++) {
      var datum = data[i * step + j];
      if (datum < min) min = datum;
      if (datum > max) max = datum;
    }
    ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
  }
}

// draw a thin verticle line that moves from left to right across the canvas
// taking up the full height of the canvas
function drawCursor(canvas, x) {
  var ctx = canvas.getContext('2d');
  var height = canvas.height;
  ctx.fillStyle = '#333';
  ctx.fillRect(x, 0, 1, height);
}

// bind a mousemove event to the canvas that will move the cursor
// by clearing it and redrawing it on each event
// pass the mouse x position to drawCursor function
function moveCursor(e, canvas, buffer, color) {
  var ctx = canvas.getContext('2d');
  const { width, height } = canvas.getClientRects()[0];
  ctx.clearRect(0, 0, width, height);
  const canvasWidth = canvas.width;
  const offsetX = e.offsetX * (canvasWidth / width);
  drawBuffer(canvas, buffer, color);
  drawCursor(canvas, offsetX);
}
