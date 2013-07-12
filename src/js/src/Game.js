var debugShape = new createjs.Shape();

var Game = (function (createjs) {
	// Private Members
	var canvas,
		stage,
		ship,
		asteroids,
		background,
		touches,
		shootSchedule,
		fpsLabel,
		levelController,
		fieldIsClear,
		currentLevel;

	var gameLoop = function(event) {
		var delta = event.delta / 1000;

		ship.updatePositions(delta);
		_.each(asteroids, function(asteroid) {
			asteroid.updatePosition(delta);
		});
		shootIfScheduled();
		debugShape.visible = ship.checkCollisons(asteroids);
		ship.checkBulletCollisions(asteroids);
		// console.log('loop');
		stage.update();
		if (asteroids.length < 1 && !fieldIsClear) {
			fieldIsClear = true;
			setTimeout(nextLevel, 2000);
		}
		if (createjs.Ticker.getTicks() % 30 === 0) {
			fpsLabel.text = createjs.Ticker.getMeasuredFPS() + ', ' + asteroids.length + ', ' + ship.bullets.length;
		}
	};

	var nextLevel = function() {
		levelController.initLevel(++currentLevel);
		fieldIsClear = false;
	};

	var pointerDown = function(event) {
		if (event.pointerType == 'mouse') {
			if (event.button === 0) {
				ship.shoot();
			} else if (event.button === 2) {
				ship.accelerating = true;
			}
		} else if (event.pointerType == 'touch') {
			touches.push(event);
			if (touches.length == 2) {
				scheduleShot(createjs.Ticker.getTicks() + 3);
			} else if (touches.length > 2) {
				ship.accelerating = true;
			} else {
				if (event.pointerId == touches[0].pointerId) {
					ship.setRotationPoint(event.pageX, event.pageY);
				}
			}
		}
		event.preventDefault();
	};

	var pointerUp = function(event) {
		if (event.pointerType == 'mouse') {
			if (event.button == 2) {
				ship.accelerating = false;
			}
		} else if (event.pointerType == 'touch') {
			_.each(touches, function(touch) {
				if (touch.pointerId == event.pointerId) {
					touches.splice(touches.indexOf(touch), 1);
					return;
				}
			});
			if (touches.length < 3) {
				ship.accelerating = false;
			}
		}
		event.preventDefault();
		// console.log(touches.length);
	};

	var pointerMove = function(event) {
		if (event.pointerType == 'mouse') {
			ship.setRotationPoint(event.pageX, event.pageY);
		} else if (event.pointerType == 'touch') {
			if (event.pointerId == touches[0].pointerId) {
				// follow the first finger that you put down
				ship.setRotationPoint(event.pageX, event.pageY);
			}
		}
		event.preventDefault();
	};

	var scheduleShot = function(tick) {
		shootSchedule.push(tick);
	};

	var shootIfScheduled = function() {
		var tick = createjs.Ticker.getTicks();
		_.each(shootSchedule, function(shotTick) {
			if (shotTick <= tick && touches.length < 3) {
				ship.shoot();
			}
		});
		shootSchedule = _.filter(shootSchedule, function(shotTick) {
			return shotTick > tick;
		});
	};

	// Public Exports
	var Game = {
		Resources: {},
		init: function() {

			touches = [];
			shootSchedule = [];

			canvas = document.getElementById('canvas');
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			canvas.addEventListener('pointerdown', pointerDown);
			canvas.addEventListener('pointerup', pointerUp);
			canvas.addEventListener('pointermove', pointerMove);
			canvas.addEventListener('contextmenu', function(e) { e.preventDefault(); });

			stage = new createjs.Stage(canvas);
			background = new Background(stage);
			ship = new Ship(canvas.width / 2, canvas.height / 2, stage);

			asteroids = [];
			// asteroids[0] = new Asteroid(300, 300, Asteroid.LARGE, stage);

			fieldIsClear = false;
			currentLevel = 1;

			levelController = new LevelController(ship, stage);
			levelController.initLevel(currentLevel);

			stage.addChild(debugShape);
			debugShape.graphics
				.beginFill('#f00')
				.drawRect(0, 0, 32, 32)
				.endFill();

			fpsLabel = new createjs.Text('FPS', '20px Arial', '#fff');
			stage.addChild(fpsLabel);


			createjs.Ticker.setFPS(60);
			createjs.Ticker.useRAF = false;
			createjs.Ticker.addEventListener('tick', gameLoop);
		},
		addAsteroid: function(x, y, state) {
			var a = new Asteroid(x, y, state || Asteroid.LARGE, stage);
			asteroids.push(a);
		},
		removeAsteroid: function(asteroid) {
			var i = _.indexOf(asteroids, asteroid);
			asteroids.splice(i, 1);
			stage.removeChild(asteroid);
			asteroid = null;
		},
		cacheShape: function(shape, radius, scale) {
			if (scale === undefined) {
				scale = 1;
			}
			var diameter = radius * 2;
			shape.cache(-radius, -radius, diameter, diameter, scale);
		},
		bitmapFromCache: function(shape, radius) {
			var bm = new createjs.Bitmap(shape.cacheCanvas.cloneNode());
			bm.x = shape.x - radius;
			bm.y = shape.y - radius;
			bm.rotation = shape.rotation;
			return bm;
		},
		localToLocalVertices: function(shape, target) {
			var output = shape.vertices.slice(0);
			for (var i = 0; i < output.length; i++) {
				var pt = shape.localToLocal(output[i][0], output[i][1], target);
				output[i] = output[i].slice(0);
				output[i][0] = pt.x;
				output[i][1] = pt.y;
			}
			return output;
		},
		localToGlobalVertices: function(shape) {
			var output = shape.vertices.slice(0);
			for (var i = 0; i < output.length; i++) {
				var pt = shape.localToGlobal(output[i][0], output[i][1]);
				output[i] = output[i].slice(0);
				output[i][0] = pt.x;
				output[i][1] = pt.y;
			}
			return output;
		},
		scaleVertices: function(shape, factor) {
			var output = shape.vertices.slice(0);
			for (var i = 0; i < output.length; i++) {
				output[i] = output[i].slice(0);
				output[i][0] *= factor;
				output[i][1] *= factor;
			}
			return output;
		}
	};
	return Game;
})(createjs);