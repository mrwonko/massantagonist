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
    var playerSpeed = 5;
    var ghostSpeed = playerSpeed;
    var impassable = {
        '#': true,
        '-': true
    };
    var levelString = "\n############################\n#............##............#\n#.####.#####.##.####.#####.#\n#o####.#####.##.####.#####o#\n#.####.#####.##.####.#####.#\n#..........................#\n#.####.##.########.##.####.#\n#.####.##.########.##.####.#\n#......##....##....##......#\n######.##### ## #####.######\n     #.##### ## #####.#     \n     #.##    B     ##.#     \n     #.## ###-#### ##.#     \n######.## # #I#  # ##.######\nTODO# .   # #P#  #   . #TODO\n######.## # #C#  # ##.######\n     #.## ######## ##.#     \n     #.##          ##.#     \n     #.## ######## ##.#     \n######.## ######## ##.######\n#............##............#\n#.####.#####.##.#####.####.#\n#.####.#####.##.#####.####.#\n#o..##.......M .......##..o#\n###.##.##.########.##.##.###\n###.##.##.########.##.##.###\n#......##....##....##......#\n#.##########.##.##########.#\n#.##########.##.##########.#\n#..........................#\n############################";
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
        Vec2.prototype.round = function () {
            return new Vec2(Math.round(this.x), Math.round(this.y));
        };
        Vec2.prototype.floor = function () {
            return new Vec2(Math.floor(this.x), Math.floor(this.y));
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
        Mover.prototype._passable = function (level, dir) {
            return !impassable[level.get(this.pos.add(dir))];
        };
        Mover.prototype.drawPos = function () {
            return this.pos.add(this.dir.mul(this.progress)).mul(2 * ht);
        };
        Mover.prototype.update = function (level, deltaTMS) {
            if (this.dir.zero() && !this.wantDir.zero() && this._passable(level, this.wantDir)) {
                this.dir = this.wantDir;
                this.wantDir = zero;
            }
            if (this.dir.zero()) {
                return;
            }
            this.progress += deltaTMS * this.speed / 1000;
            while (this.progress >= 1) {
                this.progress -= 1;
                this.pos = this.pos.add(this.dir);
                if (!this.wantDir.zero() && this._passable(level, this.wantDir)) {
                    // change direction if desired & valid
                    this.dir = this.wantDir;
                    this.wantDir = zero;
                }
                else if (!this._passable(level, this.dir)) {
                    // stop moving upon hitting wall
                    this.dir = zero;
                    this.progress = 0;
                }
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
        function Ghost(pos, color) {
            var _this = _super.call(this, pos, ghostSpeed) || this;
            _this.color = color;
            return _this;
        }
        return Ghost;
    }(Mover));
    var Game = (function () {
        function Game(levelString) {
            this.level = new Level(levelString);
            this.ghosts = {};
            for (var pos = new Vec2(0, 0); pos.y < this.level.height(); pos.y++) {
                for (pos.x = 0; pos.x < this.level.width(pos.y); pos.x++) {
                    var tile = this.level.get(pos);
                    if (tile == 'M') {
                        this.player = new Player(new Vec2(pos.x, pos.y)); // copy because I'm naughty and mutate
                    }
                    else if (tile == 'I') {
                        this.ghosts["inky"] = new Ghost(new Vec2(pos.x, pos.y), "cyan");
                    }
                    else if (tile == 'B') {
                        this.ghosts["blinky"] = new Ghost(new Vec2(pos.x, pos.y), "red");
                    }
                    else if (tile == 'P') {
                        this.ghosts["pinky"] = new Ghost(new Vec2(pos.x, pos.y), "pink");
                    }
                    else if (tile == 'C') {
                        this.ghosts["clyde"] = new Ghost(new Vec2(pos.x, pos.y), "orange");
                    }
                }
            }
        }
        Game.prototype.playerMove = function (dir) {
            console.log("move " + dir);
            var wantDir = dirs[dir];
            if (wantDir != null) {
                this.player.wantDir = wantDir;
            }
        };
        Game.prototype.ghostMove = function (who, dir) {
            var ghost = this.ghosts[who];
            if (ghost == null) {
                return;
            }
            var wantDir = dirs[dir];
            if (wantDir != null) {
                ghost.wantDir = wantDir;
            }
        };
        Game.prototype.update = function (deltaTMS) {
            var that = this;
            this.player.update(this.level, deltaTMS);
            _.forEach(this.ghosts, function (ghost) {
                ghost.update(that.level, deltaTMS);
            });
        };
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
        ctx.save();
        ctx.fillStyle = "blue";
        ctx.strokeStyle = "blue";
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
        ctx.restore();
    }
    function drawGhost(ctx, ghost) {
        ctx.save();
        ctx.translate(ghost.drawPos().x, ghost.drawPos().y);
        ctx.fillStyle = ghost.color;
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
        //if(dead) {
        //	ctx.stroke()
        //} else {
        ctx.fill();
        //}
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
        ctx.restore();
    }
    var openMouthAngle = Math.PI / 4;
    var mouthTimeMS = 1000;
    function drawPlayer(ctx, player, timestamp) {
        ctx.save();
        ctx.fillStyle = "yellow";
        ctx.translate(player.drawPos().x, player.drawPos().y);
        var angle = openMouthAngle * Math.abs(1 - 2 * (timestamp / mouthTimeMS - Math.floor(timestamp / mouthTimeMS)));
        ctx.beginPath();
        ctx.arc(0, 0, 7, angle, 2 * Math.PI - angle);
        ctx.lineTo(0, 0);
        ctx.fill();
        ctx.restore();
    }
    function drawGame(ctx, game, timestamp) {
        ctx.save();
        ctx.translate(ht, ht);
        drawLevel(ctx, game.level);
        drawPlayer(ctx, game.player, timestamp);
        _.forEach(game.ghosts, function (ghost) {
            drawGhost(ctx, ghost);
        });
        ctx.restore();
    }
    document.onkeydown = function (ev) {
        if (ev.keyCode == 37) {
            game.playerMove("left");
        }
        else if (ev.keyCode == 38) {
            game.playerMove("up");
        }
        else if (ev.keyCode == 39) {
            game.playerMove("right");
        }
        else if (ev.keyCode == 40) {
            game.playerMove("down");
        }
    };
    var ws = new WebSocket("ws://localhost:8371/berlin/ws");
    ws.addEventListener("message", function (event) {
        console.log("ws message: " + event.data);
        try {
            var message = JSON.parse(event.data);
            if (typeof message == "object") {
                game.ghostMove(message["opponent"], message["direction"]);
            }
        }
        catch (e) {
            console.log(e);
        }
    });
    var lastTime = performance.now();
    function render(timestamp) {
        if (ctx == null) {
            return;
        }
        var deltaTMS = timestamp - lastTime;
        lastTime = timestamp;
        game.update(deltaTMS);
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(0.5, 0.5);
        drawGame(ctx, game, timestamp);
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
