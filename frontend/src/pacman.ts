/// <reference path="lodash.d.ts" />

function onLoad() {

	const hb = 1 // half border width
	const ht = 4 // half tile width
	const playerSpeed = 500
	const ghostSpeed = playerSpeed

	const levelString = `
############################
#............##............#
#.####.#####.##.####.#####.#
#o####.#####.##.####.#####o#
#.####.#####.##.####.#####.#
#..........................#
#.####.##.########.##.####.#
#.####.##.########.##.####.#
#......##....##....##......#
######.##### ## #####.######
     #.##### ## #####.#     
     #.##    B     ##.#     
     #.## ###--### ##.#     
######.## #I P C # ##.######
      .   #  R   #   .      
######.## #      # ##.######
     #.## ######## ##.#     
     #.##          ##.#     
     #.## ######## ##.#     
######.## ######## ##.######
#............##............#
#.####.#####.##.#####.####.#
#.####.#####.##.#####.####.#
#o..##.......M .......##..o#
###.##.##.########.##.##.###
###.##.##.########.##.##.###
#......##....##....##......#
#.##########.##.##########.#
#.##########.##.##########.#
#..........................#
############################`

	class Level{
		_data: string[];

		constructor(levelString: string) {
			this._data = _.chain(levelString).
				split("\n").
				filter(function (s: string): boolean {
					return s.length > 0
				}).value()
		}

		get(pos: Vec2): string {
			if (pos.y < 0 || pos.y >= this.height()) {
				return ' '
			}
			if (pos.x < 0 || pos.x >= this.width(pos.y)) {
				return ' '
			}
			return this._data[pos.y][pos.x]
		}

		height(): number {
			return this._data.length
		}

		width(y: number): number {
			return this._data[y].length
		}
	}
	
	class Vec2 {
		x: number;
		y: number;

		constructor(x: number, y: number) {
			this.x = x
			this.y = y
		}

		zero(): boolean {
			return this.x == 0 && this.y == 0
		}

		add(rhs: Vec2): Vec2 {
			return new Vec2(this.x + rhs.x, this.y + rhs.y)
		}

		neg(): Vec2 {
			return new Vec2(-this.x, -this.y)
		}

		mul(factor: number): Vec2 {
			return new Vec2(this.x * factor, this.y * factor)
		}
	}

	const zero = new Vec2(0, 0)
	const left = new Vec2(-1, 0)
	const right = new Vec2(1, 0)
	const up = new Vec2(0, -1)
	const down = new Vec2(0, 1)
	const dirs = {
		"left": left,
		"right": right,
		"up": up,
		"down": down,
	}

	class Mover {
		pos: Vec2;
		dir: Vec2;
		wantDir: Vec2;
		progress: number; // 0-1
		speed: number; // ms per tile

		constructor(pos: Vec2, speed: number) {
			this.pos = pos
			this.speed = speed
			this.dir = zero
			this.wantDir = zero
			this.progress = 0
		}

		_tryChangeDir(level: Level) {

		}

		update(level: Level, deltaT: number) {
			if(this.dir.zero() && !this.wantDir.zero()) {
				this.dir = this.wantDir
			}
			if(this.dir.zero()) {
				return
			}
		}
	}

	class Player extends Mover {
		constructor(pos: Vec2) {
			super(pos, playerSpeed)
		}
	}

	class Ghost extends Mover {
		constructor(pos: Vec2) {
			super(pos, ghostSpeed)
		}
	}

	class Game {
		level: Level;
		constructor(levelString: string) {
			this.level = new Level(levelString)
			for (let y = 0; y < this.level.height(); y++) {
				for (let x = 0; x < this.level.width(y); x++) {

				}
			}
		}
	}

	const game = new Game(levelString)

	const canvas = document.getElementById("canvas") as HTMLCanvasElement
	const ctx = canvas.getContext("2d")

	function drawTile(ctx: CanvasRenderingContext2D, tile: string, left: string, right: string, top: string, bottom: string) {
		if(tile == '#') {
			ctx.strokeRect(-ht, -ht, 2*ht, 2*ht)
			// TODO: nice maze (depends on all 8 neighbours though)
		}
	}

	function drawLevel(ctx: CanvasRenderingContext2D, level: Level) {
		const pos = new Vec2(0, 0)
		for(; pos.y < level.height(); pos.y++) {
			for(pos.x = 0; pos.x < level.width(pos.y); pos.x++) {
				ctx.save()
				const trans = pos.mul(2 * ht)
				ctx.translate(trans.x, trans.y)
				drawTile(ctx, level.get(pos), level.get(pos.add(left)), level.get(pos.add(right)), level.get(pos.add(up)), level.get(pos.add(down)))
				ctx.restore()
			}
		}
	}

	function drawGhost(ctx: CanvasRenderingContext2D, dead: boolean) {
		// body
		ctx.beginPath()
		ctx.moveTo(-7, 7)
		ctx.lineTo(-7, -1)
		ctx.quadraticCurveTo(-7, -7, 0, -7)
		ctx.quadraticCurveTo(7, -7, 7, -1)
		ctx.lineTo(7, 7)
		ctx.lineTo(5, 5)
		ctx.lineTo(3, 7)
		ctx.lineTo(1, 7)
		ctx.lineTo(1, 5)
		ctx.lineTo(-1, 5)
		ctx.lineTo(-1, 7)
		ctx.lineTo(-3, 7)
		ctx.lineTo(-5, 5)
		ctx.lineTo(-7, 7)
		if(dead) {
			ctx.stroke()
		} else {
			ctx.fill()
		}

		for(let i = -1; i < 2; i += 2) {
			ctx.save()
			ctx.translate(i * 3, -4)
			ctx.scale(1, 1.5)
			// eyes
			ctx.fillStyle = 'white'
			ctx.beginPath()
			ctx.arc(0, 0, 2, 0, 2 * Math.PI)
			ctx.fill()
			ctx.restore()
		}
	}

	const openMouthAngle = Math.PI / 4
	const mouthTimeMS = 1000
	function drawPlayer(ctx: CanvasRenderingContext2D, timestamp: number) {
		const angle = openMouthAngle * Math.abs(1 - 2 * (timestamp / mouthTimeMS - Math.floor(timestamp / mouthTimeMS)))
		ctx.beginPath()
		ctx.arc(0, 0, 7, angle, 2 * Math.PI - angle)
		ctx.lineTo(0, 0)
		ctx.fill()
	}

	function render(timestamp: number) {
		if(ctx == null) {
			return
		}
		ctx.clearRect(0, 0, canvas.width, canvas.height)
		ctx.save()
		ctx.translate(0.5, 0.5)
		ctx.translate(10, 10)
		drawGhost(ctx, false)
		ctx.translate(20, 0)
		drawGhost(ctx, true)
		ctx.translate(20, 0)
		drawPlayer(ctx, timestamp)
		ctx.translate(-40, 20)
		drawLevel(ctx, game.level)
		ctx.restore()
		requestAnimationFrame(render)
	}

	function onResize() {
		canvas.width = window.innerWidth
		canvas.height = window.innerHeight
		requestAnimationFrame(render)
	}
	onResize()
	window.addEventListener("resize", onResize, false)
}
