var canvas = document.getElementById("game-board");
var ctx = canvas.getContext("2d");

var blockSize = 20;
var widthInBlocks = canvas.width / blockSize;
var heightInBlocks = canvas.height / blockSize;

var score = 0;

var drawBorder = function () {
  ctx.fillStyle = "Gray";
  ctx.fillRect(0, 0, canvas.width, blockSize);
  ctx.fillRect(0, canvas.height - blockSize, canvas.width, blockSize);
  ctx.fillRect(0, 0, blockSize, canvas.height);
  ctx.fillRect(canvas.width - blockSize, 0, blockSize, canvas.height);
};

var drawScore = function () {
  ctx.font = "20px Courier";
  ctx.fillStyle = "Black";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("Score: " + score, blockSize, blockSize);
};

var gameOver = function () {
  clearInterval(intervalId);
  ctx.font = "60px Courier";
  ctx.fillStyle = "Black";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
};

var circle = function (x, y, radius, fillCircle) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2, false);
  if (fillCircle) {
    ctx.fill();
  } else {
    ctx.stroke();
  }
};

var Block = function (col, row) {
  this.col = col;
  this.row = row;
};

Block.prototype.drawSquare = function (color) {
  var x = this.col * blockSize;
  var y = this.row * blockSize;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, blockSize, blockSize);
};

Block.prototype.drawCircle = function (color) {
  var centerX = this.col * blockSize + blockSize / 2;
  var centerY = this.row * blockSize + blockSize / 2;
  ctx.fillStyle = color;
  circle(centerX, centerY, blockSize / 2, true);
};

Block.prototype.equal = function (otherBlock) {
  return this.col === otherBlock.col && this.row === otherBlock.row;
};

var Snake = function () {
  this.segments = [
    new Block(7, 5),
    new Block(6, 5),
    new Block(5, 5)
  ];
  this.direction = "right";
  this.nextDirection = "right";
};

Snake.prototype.draw = function () {
  for (var i = 0; i < this.segments.length; i++) {
    this.segments[i].drawSquare("Blue");
  }
};

Snake.prototype.move = function () {
  var head = this.segments[0];
  var newHead;

  this.direction = this.nextDirection;

  if (this.direction === "right") {
    newHead = new Block(head.col + 1, head.row);
  } else if (
