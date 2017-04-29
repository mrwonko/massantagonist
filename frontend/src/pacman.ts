/// <reference path="lodash.d.ts" />

function onLoad() {

	const hb = 1 // half border width
	const ht = 4 // half tile width
	const playerSpeed = 5
	const ghostSpeed = playerSpeed

	const impassable = {
		'#': true,
		'-': true,
	}

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
     #.## ###-#### ##.#     
######.## # #I#  # ##.######
TODO# .   # #P#  #   . #TODO
######.## # #C#  # ##.######
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

		round(): Vec2 {
			return new Vec2(Math.round(this.x), Math.round(this.y))
		}

		floor(): Vec2 {
			return new Vec2(Math.floor(this.x), Math.floor(this.y))
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
		speed: number; // tiles per second

		constructor(pos: Vec2, speed: number) {
			this.pos = pos
			this.speed = speed
			this.dir = zero
			this.wantDir = zero
			this.progress = 0
		}

		_passable(level: Level, dir: Vec2): boolean {
			return !impassable[level.get(this.pos.add(dir))]
		}

		drawPos(): Vec2 {
			return this.pos.add(this.dir.mul(this.progress)).mul(2 * ht)
		}

		update(level: Level, deltaTMS: number) {
			if(this.dir.zero() && !this.wantDir.zero() && this._passable(level, this.wantDir)) {
				this.dir = this.wantDir
				this.wantDir = zero
			}
			if(this.dir.zero()) {
				return
			}
			this.progress += deltaTMS * this.speed / 1000
			while(this.progress >= 1) {
				this.progress -= 1
				this.pos = this.pos.add(this.dir)
				if(!this.wantDir.zero() && this._passable(level, this.wantDir)) {
					// change direction if desired & valid
					this.dir = this.wantDir
					this.wantDir = zero
				} else if(!this._passable(level, this.dir)) {
					// stop moving upon hitting wall
					this.dir = zero
					this.progress = 0
				}
			}
		}
	}

	class Player extends Mover {
		constructor(pos: Vec2) {
			super(pos, playerSpeed)
		}
	}

	class Ghost extends Mover {
		color: string;
		constructor(pos: Vec2, color: string) {
			super(pos, ghostSpeed)
			this.color = color
		}
	}

	class Game {
		level: Level;
		player: Player;
		ghosts: { [name: string]: Ghost; };
		constructor(levelString: string) {
			this.level = new Level(levelString)
			this.ghosts = {}
			for(let pos = new Vec2(0, 0); pos.y < this.level.height(); pos.y++) {
				for(pos.x = 0; pos.x < this.level.width(pos.y); pos.x++) {
					const tile = this.level.get(pos)
					if(tile == 'M') {
						this.player = new Player(new Vec2(pos.x, pos.y)) // copy because I'm naughty and mutate
					} else if(tile == 'I') {
						this.ghosts["inky"] =  new Ghost(new Vec2(pos.x, pos.y), "cyan")
					} else if(tile == 'B') {
						this.ghosts["blinky"] =  new Ghost(new Vec2(pos.x, pos.y), "red")
					} else if(tile == 'P') {
						this.ghosts["pinky"] =  new Ghost(new Vec2(pos.x, pos.y), "pink")
					} else if(tile == 'C') {
						this.ghosts["clyde"] =  new Ghost(new Vec2(pos.x, pos.y), "orange")
					}
				}
			}
		}

		playerMove(dir: string) {
			console.log("move " + dir)
			const wantDir = dirs[dir]
			if(wantDir != null) {
				this.player.wantDir = wantDir
			}
		}

		ghostMove(who: string, dir: string) {
			const ghost = this.ghosts[who]
			if(ghost == null) {
				return
			}
			const wantDir = dirs[dir]
			if(wantDir != null) {
				ghost.wantDir = wantDir
			}
		}
		
		update(deltaTMS: number) {
			const that = this
			this.player.update(this.level, deltaTMS)
			_.forEach(this.ghosts, function(ghost){
				ghost.update(that.level, deltaTMS)
			})
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
		ctx.save()
		ctx.fillStyle = "blue"
		ctx.strokeStyle = "blue"
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
		ctx.restore()
	}

	function drawGhost(ctx: CanvasRenderingContext2D, ghost: Ghost) {
		ctx.save()
		ctx.translate(ghost.drawPos().x, ghost.drawPos().y)
		ctx.fillStyle = ghost.color
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
		//if(dead) {
		//	ctx.stroke()
		//} else {
			ctx.fill()
		//}

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
		ctx.restore()
	}

	const openMouthAngle = Math.PI / 4
	const mouthTimeMS = 1000
	function drawPlayer(ctx: CanvasRenderingContext2D, player: Player, timestamp: number) {
		ctx.save()
		ctx.fillStyle = "yellow"
		ctx.translate(player.drawPos().x, player.drawPos().y)
		const angle = openMouthAngle * Math.abs(1 - 2 * (timestamp / mouthTimeMS - Math.floor(timestamp / mouthTimeMS)))
		ctx.beginPath()
		ctx.arc(0, 0, 7, angle, 2 * Math.PI - angle)
		ctx.lineTo(0, 0)
		ctx.fill()
		ctx.restore()
	}

	function drawGame(ctx: CanvasRenderingContext2D, game: Game, timestamp: number) {
		ctx.save()
		ctx.translate(ht, ht)

		drawLevel(ctx, game.level)
		drawPlayer(ctx, game.player, timestamp)
		_.forEach(game.ghosts, function(ghost) {
			drawGhost(ctx, ghost)
		})

		ctx.restore()
	}

	document.onkeydown = function(ev: KeyboardEvent) {
		if(ev.keyCode == 37) {
			game.playerMove("left")
		} else if(ev.keyCode == 38) {
			game.playerMove("up")
		} else if(ev.keyCode == 39) {
			game.playerMove("right")
		} else if(ev.keyCode == 40) {
			game.playerMove("down")
		}
	}

	const ws = new WebSocket("ws://localhost:8371/berlin/ws")
	ws.addEventListener("message", function(event) {
		console.log("ws message: " + event.data)
		try {
			const message = JSON.parse(event.data)
			if(typeof message == "object") {
				game.ghostMove(message["opponent"], message["direction"])
			}
		} catch(e) {
			console.log(e)
		}
	})

	let lastTime = performance.now()
	function render(timestamp: number) {
		if(ctx == null) {
			return
		}
		const deltaTMS = timestamp - lastTime
		lastTime = timestamp
		game.update(deltaTMS)
		ctx.fillRect(0, 0, canvas.width, canvas.height)
		ctx.save()
		ctx.translate(0.5, 0.5)
		drawGame(ctx, game, timestamp)
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
