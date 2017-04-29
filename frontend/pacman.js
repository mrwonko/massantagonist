/// <reference path="lodash.d.ts" />
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
function onLoad() {
    var hb = 1; // half border width
    var ht = 4; // half tile width
    var playerSpeed = 500;
    var ghostSpeed = playerSpeed;
    var levelString = "\n############################\n#............##............#\n#.####.#####.##.####.#####.#\n#o####.#####.##.####.#####o#\n#.####.#####.##.####.#####.#\n#..........................#\n#.####.##.########.##.####.#\n#.####.##.########.##.####.#\n#......##....##....##......#\n######.##### ## #####.######\n     #.##### ## #####.#     \n     #.##    B     ##.#     \n     #.## ###--### ##.#     \n######.## #I P C # ##.######\n      .   #  R   #   .      \n######.## #      # ##.######\n     #.## ######## ##.#     \n     #.##          ##.#     \n     #.## ######## ##.#     \n######.## ######## ##.######\n#............##............#\n#.####.#####.##.#####.####.#\n#.####.#####.##.#####.####.#\n#o..##.......M .......##..o#\n###.##.##.########.##.##.###\n###.##.##.########.##.##.###\n#......##....##....##......#\n#.##########.##.##########.#\n#.##########.##.##########.#\n#..........................#\n############################";
    var Level = (function () {
        function Level(levelString) {
            this._data = _.chain(levelString).
                split("\n").
                filter(function (s) {
                return s.length > 0;
            }).value();
        }
        Level.prototype.get = function (pos) {
            if (pos.y < 0 || pos.y >= this.height()) {
                return ' ';
            }
            if (pos.x < 0 || pos.x >= this.width(pos.y)) {
                return ' ';
            }
            return this._data[pos.y][pos.x];
        };
        Level.prototype.height = function () {
            return this._data.length;
        };
        Level.prototype.width = function (y) {
            return this._data[y].length;
        };
        return Level;
    }());
    var Vec2 = (function () {
        function Vec2(x, y) {
            this.x = x;
            this.y = y;
        }
        Vec2.prototype.zero = function () {
            return this.x == 0 && this.y == 0;
        };
        Vec2.prototype.add = function (rhs) {
            return new Vec2(this.x + rhs.x, this.y + rhs.y);
        };
        Vec2.prototype.neg = function () {
            return new Vec2(-this.x, -this.y);
        };
        Vec2.prototype.mul = function (factor) {
            return new Vec2(this.x * factor, this.y * factor);
        };
        return Vec2;
    }());
    var zero = new Vec2(0, 0);
    var left = new Vec2(-1, 0);
    var right = new Vec2(1, 0);
    var up = new Vec2(0, -1);
    var down = new Vec2(0, 1);
    var dirs = {
        "left": left,
        "right": right,
        "up": up,
        "down": down
    };
    var Mover = (function () {
        function Mover(pos, speed) {
            this.pos = pos;
            this.speed = speed;
            this.dir = zero;
            this.wantDir = zero;
            this.progress = 0;
        }
        Mover.prototype._tryChangeDir = function (level) {
        };
        Mover.prototype.update = function (level, deltaT) {
            if (this.dir.zero() && !this.wantDir.zero()) {
                this.dir = this.wantDir;
            }
            if (this.dir.zero()) {
                return;
            }
        };
        return Mover;
    }());
    var Player = (function (_super) {
        __extends(Player, _super);
        function Player(pos) {
            return _super.call(this, pos, playerSpeed) || this;
        }
        return Player;
    }(Mover));
    var Ghost = (function (_super) {
        __extends(Ghost, _super);
        function Ghost(pos) {
            return _super.call(this, pos, ghostSpeed) || this;
        }
        return Ghost;
    }(Mover));
    var Game = (function () {
        function Game(levelString) {
            this.level = new Level(levelString);
            for (var y = 0; y < this.level.height(); y++) {
                for (var x = 0; x < this.level.width(y); x++) {
                }
            }
        }
        return Game;
    }());
    var game = new Game(levelString);
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    function drawTile(ctx, tile, left, right, top, bottom) {
        if (tile == '#') {
            ctx.strokeRect(-ht, -ht, 2 * ht, 2 * ht);
            // TODO: nice maze (depends on all 8 neighbours though)
        }
    }
    function drawLevel(ctx, level) {
        var pos = new Vec2(0, 0);
        for (; pos.y < level.height(); pos.y++) {
            for (pos.x = 0; pos.x < level.width(pos.y); pos.x++) {
                ctx.save();
                var trans = pos.mul(2 * ht);
                ctx.translate(trans.x, trans.y);
                drawTile(ctx, level.get(pos), level.get(pos.add(left)), level.get(pos.add(right)), level.get(pos.add(up)), level.get(pos.add(down)));
                ctx.restore();
            }
        }
    }
    function drawGhost(ctx, dead) {
        // body
        ctx.beginPath();
        ctx.moveTo(-7, 7);
        ctx.lineTo(-7, -1);
        ctx.quadraticCurveTo(-7, -7, 0, -7);
        ctx.quadraticCurveTo(7, -7, 7, -1);
        ctx.lineTo(7, 7);
        ctx.lineTo(5, 5);
        ctx.lineTo(3, 7);
        ctx.lineTo(1, 7);
        ctx.lineTo(1, 5);
        ctx.lineTo(-1, 5);
        ctx.lineTo(-1, 7);
        ctx.lineTo(-3, 7);
        ctx.lineTo(-5, 5);
        ctx.lineTo(-7, 7);
        if (dead) {
            ctx.stroke();
        }
        else {
            ctx.fill();
        }
        for (var i = -1; i < 2; i += 2) {
            ctx.save();
            ctx.translate(i * 3, -4);
            ctx.scale(1, 1.5);
            // eyes
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(0, 0, 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.restore();
        }
    }
    var openMouthAngle = Math.PI / 4;
    var mouthTimeMS = 1000;
    function drawPlayer(ctx, timestamp) {
        var angle = openMouthAngle * Math.abs(1 - 2 * (timestamp / mouthTimeMS - Math.floor(timestamp / mouthTimeMS)));
        ctx.beginPath();
        ctx.arc(0, 0, 7, angle, 2 * Math.PI - angle);
        ctx.lineTo(0, 0);
        ctx.fill();
    }
    function render(timestamp) {
        if (ctx == null) {
            return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(0.5, 0.5);
        ctx.translate(10, 10);
        drawGhost(ctx, false);
        ctx.translate(20, 0);
        drawGhost(ctx, true);
        ctx.translate(20, 0);
        drawPlayer(ctx, timestamp);
        ctx.translate(-40, 20);
        drawLevel(ctx, game.level);
        ctx.restore();
        requestAnimationFrame(render);
    }
    function onResize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        requestAnimationFrame(render);
    }
    onResize();
    window.addEventListener("resize", onResize, false);
}
