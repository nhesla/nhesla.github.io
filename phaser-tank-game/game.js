function TankGame(){
    ///////////////////////// Game vars ////////////////////////////
    var game_width = 640;
    var game_height = 640;
    var game = new Phaser.Game(game_width, game_height);

    var tank;
    var enemy_count = 0;
    var enemy_spawn_delay = 300;
    let terrainData = [];
    var blockingGroup;
    var terrainGroup;

    var survivalTime = 0;
    var killCount = 0;
    var highScore = parseFloat(localStorage.getItem('tankHighScore')) || 0;

    var hudHealthBar;
    var hudScoreText;
    var hudTimeText;

    var repairKit = null;           // at most one on screen at a time
    var repairKitSpawnDelay = 600;  // frames until first spawn attempt
    ///////////////////////// Game vars ////////////////////////////

    class Projectile {
        constructor(x_coord, y_coord, z_coord, ang) {
            this.x = x_coord;
            this.y = y_coord;
            this.z = z_coord;
            this.angle = ang;
            this.lifespan = 0;
            this.animation = 0;

            this.pellet = game.add.sprite(this.x - (Projectile.sprSize() / 2), this.y - (Projectile.sprSize() / 2), 'Explosion');
            this.pellet.frame = 0;
            game.physics.enable(this.pellet, Phaser.Physics.ARCADE);
        }
        static sprSize() { return 90; }
        static speed() { return 6; }
        static duration() { return 250; }
        static explosion_time() { return 50; }

        move() {
            if (this.animation == 0) {
                this.x += Projectile.speed() * Math.sin(this.angle * (Math.PI / 180));
                this.y -= Projectile.speed() * Math.cos(this.angle * (Math.PI / 180));

                // Only collide with elevated terrain, not ground-level decorations.
                // We check the tile the projectile center is over — if it's elevated
                // AND the projectile is at ground level (z ~= 80), it's hitting a wall.
                if (this.z <= 85 && terrainData) {
                    const TILE_SIZE = 32;
                    const tx = Math.floor(this.x / TILE_SIZE);
                    const ty = Math.floor(this.y / TILE_SIZE);
                    if (terrainData[ty] && terrainData[ty][tx] === 1) {
                        this.animation++;
                    }
                }
            }

            /////////////// damage control /////////////////
            if (this.animation > 0) {
                this.animation++;
                this.pellet.frame = Math.floor(this.animation / (Projectile.explosion_time() / 9));
            }
            for (var j = 0; j <= enemy_count; j++) {
                if (Math.abs(this.x - tank[j].x) < Projectile.sprSize() / 4 &&
                    Math.abs(this.y - tank[j].y) < Projectile.sprSize() / 4 &&
                    Math.abs(this.z - tank[j].z) < 10 &&
                    this.animation == 0 && this.lifespan > 5) {
                    this.animation++;
                    for (var k = 0; k <= enemy_count; k++) {
                        if (Math.abs(this.x - tank[k].x) < Projectile.sprSize() &&
                            Math.abs(this.y - tank[k].y) < Projectile.sprSize() &&
                            tank[k].damage_frames == 0) {
                            if (tank[k] instanceof Player) {
                                tank[k].health--;
                                tank[k].damage_frames++;
                            } else {
                                tank[k].health -= 2;
                                tank[k].damage_frames++;
                            }
                        }
                    }
                }
            }

            ////////////// spinning /////////////////
            if (this.animation == 0)
                this.pellet.angle += 12;
            else
                this.z = 100;

            this.pellet.scale.setTo((this.z / 100), (this.z / 100));
            this.pellet.x = this.x
                - ((Projectile.sprSize() / 2) * (this.z / 100) * Math.cos(this.pellet.angle * (Math.PI / 180)))
                + ((Projectile.sprSize() / 2) * (this.z / 100) * Math.sin(this.pellet.angle * (Math.PI / 180)));
            this.pellet.y = this.y
                - ((Projectile.sprSize() / 2) * (this.z / 100) * Math.sin(this.pellet.angle * (Math.PI / 180)))
                - ((Projectile.sprSize() / 2) * (this.z / 100) * Math.cos(this.pellet.angle * (Math.PI / 180)));

            this.lifespan++;
        }
    }

    class Tank {
        constructor(game, x_coord, y_coord, tank_type) {
            this.x = x_coord;
            this.y = y_coord;
            this.z = 200;
            this.shadow = 80;
            this.health = 5;
            this.speed = 1;
            this.projectile = [];

            this.jump = 0;
            this.liftOffPoint;
            this.drop = 0;
            this.moving = false;
            this.damage_frames = 0;
            this.reload = Tank.reload_time() * (Math.floor(Math.random() * 7) + 1);

            this.ai_destination_x = this.x;
            this.ai_destination_y = this.y;
            this.ai_move_delay = Tank.reload_time() * (Math.floor(Math.random() * 4) + 1);

            var type = '';
            switch (tank_type) {
                case 1: type = 'Tank_2'; break;
                case 2: type = 'Tank_3'; break;
                case 3: type = 'Tank_4'; break;
                default: type = 'Tank_1'; break;
            }
            this.vehicle = game.add.sprite(this.x - (Tank.sprWidth() - Tank.vehicle_center_x()), this.y - (Tank.sprHeight() - Tank.vehicle_center_y()), type);
            this.vehicle.frame = 0;
            game.physics.enable(this.vehicle, Phaser.Physics.ARCADE);
            this.cannon = game.add.sprite(this.x - (Tank.sprWidth() - Tank.cannon_center_x()), this.y - (Tank.sprHeight() - Tank.cannon_center_y()), type);
            this.cannon.frame = 5;
        }

        static sprWidth() { return 74; }
        static sprHeight() { return 77; }
        static vehicle_center_x() { return 39; }
        static vehicle_center_y() { return 40; }
        static cannon_center_x() { return 43; }
        static cannon_center_y() { return 43; }
        static movement_speed() { return 2; }
        static grav() { return 180 / 60; }
        static lift() { return 30; }
        static invincibility() { return 30; }
        static reload_time() { return 30; }

        move() {
            this.controller();

            this.vehicle.frame = Math.min(5 - this.health, 4);
            this.cannon.frame = Math.min(10 - this.health, 9);

            if (this.moving) {
                var x_move = this.x + Tank.movement_speed() * Math.sin(this.vehicle.angle * (Math.PI / 180));
                var y_move = this.y - Tank.movement_speed() * Math.cos(this.vehicle.angle * (Math.PI / 180));

                const TILE_SIZE = 32;
                const currentTileX = Math.floor(this.x / TILE_SIZE);
                const currentTileY = Math.floor(this.y / TILE_SIZE);
                const targetTileX = Math.floor(x_move / TILE_SIZE);
                const targetTileY = Math.floor(y_move / TILE_SIZE);

                const isCurrentElevated = terrainData[currentTileY]?.[currentTileX] === 1;
                const isTargetElevated = terrainData[targetTileY]?.[targetTileX] === 1;

                if (!isCurrentElevated && isTargetElevated && this.jump === 0 && this.z === this.shadow) {
                    x_move = this.x;
                    y_move = this.y;
                }
                if (isCurrentElevated && !isTargetElevated && this.jump === 0 && this.z === this.shadow) {
                    this.drop = 1;
                }

                if (x_move < Tank.sprWidth() * (this.z / 100) / 2) x_move = Tank.sprWidth() * (this.z / 100) / 2;
                if (x_move > game.width - Tank.sprWidth() * (this.z / 100) / 2) x_move = game.width - Tank.sprWidth() * (this.z / 100) / 2;
                if (y_move < Tank.sprHeight() * (this.z / 100) / 2) y_move = Tank.sprHeight() * (this.z / 100) / 2;
                if (y_move > game.height - Tank.sprHeight() * (this.z / 100) / 2) y_move = game.height - Tank.sprHeight() * (this.z / 100) / 2;

                for (var i = 0; i <= enemy_count; i++) {
                    if (!(this === tank[i])) {
                        if (Math.abs(x_move - tank[i].x) < Tank.sprWidth() * (this.z / 100) &&
                            Math.abs(this.y - tank[i].y) < Tank.sprHeight() * (this.z / 100) / 4 * 3 &&
                            Math.abs(this.z - tank[i].z) < 5) {
                            x_move = this.x + Tank.sprWidth() * (this.z / 100)
                                * Math.abs(Math.sin(Phaser.Math.angleBetween(tank[i].x, tank[i].y, this.x, this.y) * (Math.PI / 180)))
                                * Math.sign(this.x - tank[i].x);
                        }
                        if (Math.abs(this.x - tank[i].x) < Tank.sprWidth() * (this.z / 100) / 4 * 3 &&
                            Math.abs(y_move - tank[i].y) < Tank.sprHeight() * (this.z / 100) &&
                            Math.abs(this.z - tank[i].z) < 5) {
                            y_move = this.y - (Tank.sprHeight() * (this.z / 100) - Tank.sprHeight() * (this.z / 100)
                                * Math.abs(Math.cos(Phaser.Math.angleBetween(tank[i].x, tank[i].y, this.x, this.y) * (Math.PI / 180))))
                                * Math.sign(this.y - tank[i].y);
                        }
                    }
                }

                this.x = x_move;
                this.y = y_move;
            }

            this.vehicle.x = this.x - (Tank.vehicle_center_x() * (this.z / 100) * Math.cos(this.vehicle.angle * (Math.PI / 180)))
                                     + (Tank.vehicle_center_y() * (this.z / 100) * Math.sin(this.vehicle.angle * (Math.PI / 180)));
            this.vehicle.y = this.y - (Tank.vehicle_center_y() * (this.z / 100) * Math.sin(this.vehicle.angle * (Math.PI / 180)))
                                     - (Tank.vehicle_center_x() * (this.z / 100) * Math.cos(this.vehicle.angle * (Math.PI / 180)));

            this.cannon.x = this.x - (Tank.cannon_center_x() * (this.z / 100) * Math.cos(this.cannon.angle * (Math.PI / 180)))
                                    + (Tank.cannon_center_y() * (this.z / 100) * Math.sin(this.cannon.angle * (Math.PI / 180)));
            this.cannon.y = this.y - (Tank.cannon_center_y() * (this.z / 100) * Math.sin(this.cannon.angle * (Math.PI / 180)))
                                    - (Tank.cannon_center_x() * (this.z / 100) * Math.cos(this.cannon.angle * (Math.PI / 180)));

            for (var i = 0; i < this.projectile.length; i++) {
                this.projectile[i].move();
                if (this.projectile[i].animation >= Projectile.explosion_time()) {
                    this.projectile[i].pellet.destroy();
                    this.projectile.splice(i, 1);
                    break;
                }
                if (this.projectile[i].lifespan >= Projectile.duration()) {
                    this.projectile[i].pellet.destroy();
                    this.projectile.splice(i, 1);
                    break;
                }
            }

            const tileX = Math.floor(this.x / 32);
            const tileY = Math.floor(this.y / 32);
            const isElevated = terrainData[tileY]?.[tileX] === 1;

            this.shadow = isElevated ? Terrain.terrainHeight() : 80;
            if (this.jump >= 180 || (this.liftOffPoint + Tank.lift() * Math.sin(this.jump * (Math.PI / 180)) <= this.shadow && this.jump > 90)) {
                this.z = this.shadow;
                this.jump = 0;
            }
            for (var i = 0; i <= enemy_count; i++) {
                if (!(this === tank[i])) {
                    if (Math.abs(this.x - tank[i].x) < Tank.sprWidth() * (this.z / 100) &&
                        Math.abs(this.y - tank[i].y) < Tank.sprHeight() * (this.z / 100) &&
                        this.z > tank[i].z && this.z - tank[i].z < Tank.grav() * 3 && this.jump > 90) {
                        this.jump = Tank.grav();
                        this.liftOffPoint = this.shadow;
                        tank[i].health--;
                        tank[i].damage_frames++;
                    }
                }
            }
            if (this.jump > 0) {
                this.z = this.liftOffPoint + Tank.lift() * Math.sin(this.jump * (Math.PI / 180));
                this.jump += Tank.grav();
            } else if (this.z > this.shadow) {
                if (this.z - this.drop > this.shadow) {
                    this.z -= this.drop;
                    if (this.drop < Tank.lift() / 4) this.drop += Tank.lift() / 40;
                } else {
                    this.z = this.shadow;
                    this.drop = 0;
                }
            }
            if (this.z < this.shadow) this.z = this.shadow;

            this.vehicle.scale.setTo((this.z / 100), (this.z / 100));
            this.cannon.scale.setTo((this.z / 100), (this.z / 100));

            if (this.damage_frames > 0) this.damage_frames++;
            if (this.damage_frames > Tank.invincibility()) this.damage_frames = 0;
        }

        selfDestruct() {
            this.vehicle.destroy();
            this.cannon.destroy();
            for (var i = this.projectile.length - 1; i >= 0; i--) {
                this.projectile[i].pellet.destroy();
                this.projectile.splice(i, 1);
            }
        }

        controller() {
            this.cannon.angle = (Phaser.Math.angleBetween(this.x, this.y, tank[0].x, tank[0].y) * (180 / Math.PI) + 90);

            if (this.reload > 0) this.reload--;
            if (this.reload <= 0) {
                this.projectile.push(new Projectile(this.x, this.y, this.z, this.cannon.angle));
                this.reload = Tank.reload_time() * (Math.floor(Math.random() * 7) + 1);
            }

            if (this.ai_move_delay > 0) {
                this.ai_move_delay--;
                if (this.ai_move_delay <= 0) {
                    this.ai_destination_x = Math.floor(Math.random() * (game.width - Tank.sprWidth() * 2)) + Tank.sprWidth();
                    this.ai_destination_y = Math.floor(Math.random() * (game.height - Tank.sprHeight() * 2)) + Tank.sprHeight();
                    this.vehicle.angle = (Phaser.Math.angleBetween(this.x, this.y, this.ai_destination_x, this.ai_destination_y) * (180 / Math.PI) + 90);
                }
                const TILE_SIZE = Terrain.sprSize();
                const isCurrentElevated = terrainData[Math.floor(this.y / TILE_SIZE)]?.[Math.floor(this.x / TILE_SIZE)] === 1;
                const isTargetElevated = terrainData[Math.floor(this.ai_destination_y / TILE_SIZE)]?.[Math.floor(this.ai_destination_x / TILE_SIZE)] === 1;
                if (!isCurrentElevated && isTargetElevated && this.jump === 0 && this.z === this.shadow) {
                    this.jump = Tank.grav();
                    this.liftOffPoint = this.shadow;
                }
            } else {
                this.moving = true;
            }
            if (Math.abs(this.x - this.ai_destination_x) < 3 && Math.abs(this.y - this.ai_destination_y) < 3 && this.ai_move_delay == 0) {
                this.ai_move_delay = Tank.reload_time() * (Math.floor(Math.random() * 4) + 1);
                this.moving = false;
            }
        }
    }

    class Player extends Tank {
        constructor(game, x_coord, y_coord) {
            super(game, x_coord, y_coord, 0);
            this.control_keys = [
                game.input.keyboard.addKey(Phaser.Keyboard.W),
                game.input.keyboard.addKey(Phaser.Keyboard.A),
                game.input.keyboard.addKey(Phaser.Keyboard.S),
                game.input.keyboard.addKey(Phaser.Keyboard.D),
                game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR),
                game.input.keyboard.addKey(Phaser.Keyboard.R)
            ];
            if (this.control_keys[5]) {
                this.control_keys[5].onDown.add(function() {
                    this.health = Math.min(this.health + 1, 5);
                }, this);
            }
            game.input.mouse.capture = true;
        }

        selfDestruct() {
            this.vehicle.destroy();
            this.cannon.destroy();
            for (var i = this.projectile.length - 1; i >= 0; i--) {
                this.projectile[i].pellet.destroy();
                this.projectile.splice(i, 1);
            }
            if (survivalTime > highScore) {
                highScore = survivalTime;
                localStorage.setItem('tankHighScore', highScore.toFixed(1));
            }
            game.time.events.add(Phaser.Timer.SECOND * 3, function() { game.state.start('GameOver'); }, this);
        }

        controller() {
            if (this.control_keys[0].justPressed || this.control_keys[1].justPressed ||
                this.control_keys[2].justPressed || this.control_keys[3].justPressed) {
                if (this.control_keys[0].isDown) this.vehicle.angle = 0;
                else if (this.control_keys[2].isDown) this.vehicle.angle = 180;

                if ((this.control_keys[0].isDown && this.control_keys[1].isDown) ||
                    (this.control_keys[2].isDown && this.control_keys[3].isDown)) this.vehicle.angle -= 45;
                else if ((this.control_keys[2].isDown && this.control_keys[1].isDown) ||
                         (this.control_keys[0].isDown && this.control_keys[3].isDown)) this.vehicle.angle += 45;

                if (this.control_keys[1].isDown && !(this.control_keys[0].isDown || this.control_keys[2].isDown)) this.vehicle.angle = 270;
                else if (this.control_keys[3].isDown && !(this.control_keys[0].isDown || this.control_keys[2].isDown)) this.vehicle.angle = 90;
            }
            this.moving = (this.control_keys[0].isDown || this.control_keys[2].isDown ||
                           this.control_keys[1].isDown || this.control_keys[3].isDown);

            this.cannon.angle = (Phaser.Math.angleBetween(this.x, this.y, game.input.mousePointer.x, game.input.mousePointer.y) * (180 / Math.PI) + 90);

            if (this.reload > 0) this.reload++;
            if (game.input.activePointer.leftButton.isDown && this.reload == 0) {
                this.projectile.push(new Projectile(this.x, this.y, this.z, this.cannon.angle));
                this.reload++;
            }
            if (this.reload >= Tank.reload_time()) this.reload = 0;

            if (this.control_keys[4].isDown && this.jump == 0 && this.z == this.shadow) {
                this.jump += Tank.grav();
                this.liftOffPoint = this.shadow;
            }
        }
    }

    class Terrain {
        static sprSize() { return 128; }
        static terrainHeight() { return 100; }
    }

    ///////////////////////// Title Screen /////////////////////////
    var titleScreen = function(game) {};
    titleScreen.prototype = {
        preload: function() {},
        create: function() {
            var bg = game.add.graphics(0, 0);
            bg.beginFill(0x111111);
            bg.drawRect(0, 0, game_width, game_height);
            bg.endFill();

            var line = game.add.graphics(0, 0);
            line.beginFill(0x00ff00);
            line.drawRect(60, game_height / 2 - 130, game_width - 120, 2);
            line.endFill();

            var title = game.add.text(game_width / 2, game_height / 2 - 90, 'TANK GAME', { font: 'bold 48px Monospace', fill: '#00FF00', align: 'center' });
            title.anchor.set(0.5, 0.5);

            var sub = game.add.text(game_width / 2, game_height / 2 - 50, 'survive as long as you can', { font: '16px Monospace', fill: '#888888', align: 'center' });
            sub.anchor.set(0.5, 0.5);

            var controls = game.add.text(game_width / 2, game_height / 2 + 10,
                'WASD — move        SPACE — jump\nMouse — aim        Click — shoot',
                { font: '14px Monospace', fill: '#555555', align: 'left' });
            controls.anchor.set(0.5, 0.5);

            var hsLabel = highScore > 0 ? 'Best: ' + highScore.toFixed(1) + 's' : 'No record yet';
            var hs = game.add.text(game_width / 2, game_height / 2 + 70, hsLabel, { font: '16px Monospace', fill: '#00aa00', align: 'center' });
            hs.anchor.set(0.5, 0.5);

            var btnBg = game.add.graphics(0, 0);
            btnBg.beginFill(0x00ff00);
            btnBg.drawRoundedRect(game_width / 2 - 90, game_height / 2 + 110, 180, 44, 6);
            btnBg.endFill();
            btnBg.inputEnabled = true;
            btnBg.events.onInputDown.add(this.startGame, this);

            var btnText = game.add.text(game_width / 2, game_height / 2 + 132, 'START', { font: 'bold 20px Monospace', fill: '#111111', align: 'center' });
            btnText.anchor.set(0.5, 0.5);
            btnText.inputEnabled = true;
            btnText.events.onInputDown.add(this.startGame, this);

            // Credits button
            var credBg = game.add.graphics(0, 0);
            credBg.lineStyle(1, 0x00ff00, 0.6);
            credBg.drawRoundedRect(game_width / 2 - 90, game_height / 2 + 164, 180, 34, 6);
            credBg.inputEnabled = true;
            credBg.events.onInputDown.add(function() { game.state.start('Credits'); }, this);

            var credText = game.add.text(game_width / 2, game_height / 2 + 181, 'CREDITS', { font: '15px Monospace', fill: '#00cc00', align: 'center' });
            credText.anchor.set(0.5, 0.5);
            credText.inputEnabled = true;
            credText.events.onInputDown.add(function() { game.state.start('Credits'); }, this);
        },
        startGame: function() {
            survivalTime = 0;
            killCount = 0;
            repairKit = null;
            repairKitSpawnDelay = 600;
            game.state.start('PlayGame');
        }
    };

    ///////////////////////// Terrain helpers /////////////////////////
    function initTerrainData() {
        const UNIT_SIZE = 32;
        const GRID_WIDTH = game_width / UNIT_SIZE;
        const GRID_HEIGHT = game_height / UNIT_SIZE;
        terrainData = [];
        for (let y = 0; y < GRID_HEIGHT; y++) terrainData[y] = new Array(GRID_WIDTH).fill(0);

        let y = 0;
        while (y < GRID_HEIGHT) {
            let x = 0;
            let addedTerrainThisRow = false;
            while (x < GRID_WIDTH) {
                const isStartOfBlock = (x % 4 === 0 && y % 4 === 0);
                if (isStartOfBlock && Math.random() < 0.35) {
                    terrainData[y][x] = 1;
                    addedTerrainThisRow = true;
                    x++;
                } else if ((x % 4 != 0 && terrainData[y][x - 1] === 1) || (y % 4 != 0 && terrainData[y - 1][x] === 1)) {
                    terrainData[y][x] = 1;
                    addedTerrainThisRow = true;
                    x++;
                } else {
                    x += 4;
                }
            }
            if (!addedTerrainThisRow) y += 4;
            else y++;
        }
    }

    function generateTerrain(game) {
        const UNIT_SIZE = 32;
        const GRID_WIDTH = game_width / UNIT_SIZE;
        const GRID_HEIGHT = game_height / UNIT_SIZE;
        terrainGroup = game.add.group();
        terrainGroup.enableBody = true;
        for (let y = 0; y < GRID_HEIGHT; y += 4) {
            for (let x = 0; x < GRID_WIDTH; x += 4) {
                if (terrainData[y][x] === 1) {
                    let mask = 0;
                    if (terrainData[y - 4]?.[x] === 1) mask += 1;
                    if (terrainData[y]?.[x + 4] === 1) mask += 2;
                    if (terrainData[y + 4]?.[x] === 1) mask += 4;
                    if (terrainData[y]?.[x - 4] === 1) mask += 8;
                    const sprite = game.add.sprite(x * UNIT_SIZE, y * UNIT_SIZE, 'Terrain', mask);
                    game.physics.arcade.enable(sprite);
                    sprite.body.immovable = true;
                    sprite.body.setSize(Terrain.sprSize(), Terrain.sprSize());
                    terrainGroup.add(sprite);
                }
            }
        }
    }

    function drawBaseGroundLayer(game) {
        const UNIT_SIZE = 32;
        const GRID_WIDTH = game_width / UNIT_SIZE;
        const GRID_HEIGHT = game_height / UNIT_SIZE;
        var groundGroup = game.add.group();
        for (let y = 0; y < GRID_HEIGHT; y++)
            for (let x = 0; x < GRID_WIDTH; x++)
                groundGroup.add(game.add.sprite(x * UNIT_SIZE, y * UNIT_SIZE, 'Environment', 0));
    }

    function drawGrass(game) {
        const UNIT_SIZE = 32;
        const GRID_WIDTH = terrainData[0].length;
        const GRID_HEIGHT = terrainData.length;
        var grassData = [];
        var grassGroup = game.add.group();
        for (let y = 0; y < GRID_HEIGHT; y++) grassData[y] = new Array(GRID_WIDTH).fill(0);
        for (let y = 0; y < GRID_HEIGHT; y++)
            for (let x = 0; x < GRID_WIDTH; x++)
                if (terrainData[y][x] == 0 && Math.random() < 0.35) grassData[y][x] = 1;
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (grassData[y][x] == 1) {
                    let bitmask = 0;
                    if (grassData[y - 1]?.[x] === 1) bitmask += 1;
                    if (grassData[y]?.[x + 1] === 1) bitmask += 2;
                    if (grassData[y + 1]?.[x] === 1) bitmask += 4;
                    if (grassData[y]?.[x - 1] === 1) bitmask += 8;
                    if (bitmask <= 15) grassGroup.add(game.add.sprite(x * UNIT_SIZE, y * UNIT_SIZE, 'Grass', bitmask));
                }
            }
        }
    }

    function drawBushes(game) {
        const UNIT_SIZE = 32;
        const GRID_WIDTH = terrainData[0].length;
        const GRID_HEIGHT = terrainData.length;
        var bushGroup = game.add.group();
        for (let y = 0; y < GRID_HEIGHT; y++)
            for (let x = 0; x < GRID_WIDTH; x++)
                if (terrainData[y][x] === 0 && Math.random() < 0.05)
                    bushGroup.add(game.add.sprite(x * UNIT_SIZE, y * UNIT_SIZE, 'Environment', (Math.random() < 0.5 ? 0 : 1) + 12));
    }

    // Rocks and trees on the map border only — purely decorative, no collision
    function drawBorderDecoration(game) {
        const UNIT_SIZE = 32;
        const GRID_WIDTH = game_width / UNIT_SIZE;
        const GRID_HEIGHT = game_height / UNIT_SIZE;
        var decoGroup = game.add.group();

        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                // Only place on the outermost 2 tiles
                const onBorder = x <= 1 || y <= 1 || x >= GRID_WIDTH - 2 || y >= GRID_HEIGHT - 2;
                if (!onBorder) continue;

                if (Math.random() < 0.04) {
                    // Rock (single tile, frame 16)
                    decoGroup.add(game.add.sprite(x * UNIT_SIZE, y * UNIT_SIZE, 'Environment', 16));
                } else if (Math.random() < 0.02) {
                    // Bush
                    decoGroup.add(game.add.sprite(x * UNIT_SIZE, y * UNIT_SIZE, 'Environment', 12));
                }
            }
        }
    }

    ///////////////////////// HUD /////////////////////////
    function createHUD(game) {
        var maxHp = 5;
        var segW = 18;
        var segH = 14;
        var segGap = 3;
        var startX = 10;
        var startY = 10;
        var totalW = maxHp * segW + (maxHp - 1) * segGap;

        // Dark backdrop behind health bar
        var backdrop = game.add.graphics(0, 0);
        backdrop.fixedToCamera = true;
        backdrop.beginFill(0x000000, 0.6);
        backdrop.drawRect(startX - 4, startY - 4, totalW + 8, segH + 24);
        backdrop.endFill();

        // HP label
        var hpLabel = game.add.text(startX, startY + segH + 3, 'HP', { font: '10px Monospace', fill: '#00aa00' });
        hpLabel.fixedToCamera = true;

        // Segmented health bar — store segments so we can update them
        hudHealthBar = [];
        for (var i = 0; i < maxHp; i++) {
            var seg = game.add.graphics(0, 0);
            seg.fixedToCamera = true;
            seg._posX = startX + i * (segW + segGap);
            seg._posY = startY;
            seg._segW = segW;
            seg._segH = segH;
            hudHealthBar.push(seg);
        }

        // Dark backdrop behind score / time
        var scoreBackdrop = game.add.graphics(0, 0);
        scoreBackdrop.fixedToCamera = true;
        scoreBackdrop.beginFill(0x000000, 0.6);
        scoreBackdrop.drawRect(game_width - 130, startY - 4, 124, 44);
        scoreBackdrop.endFill();

        hudScoreText = game.add.text(game_width - 10, startY, 'Kills: 0', { font: '14px Monospace', fill: '#00FF00' });
        hudScoreText.anchor.set(1, 0);
        hudScoreText.fixedToCamera = true;

        hudTimeText = game.add.text(game_width - 10, startY + 18, 'Time: 0.0s', { font: '14px Monospace', fill: '#00FF00' });
        hudTimeText.anchor.set(1, 0);
        hudTimeText.fixedToCamera = true;
    }

    function updateHUD() {
        if (!tank || !tank[0] || !hudHealthBar) return;
        var hp = tank[0].health;
        for (var i = 0; i < hudHealthBar.length; i++) {
            var seg = hudHealthBar[i];
            seg.clear();
            // Filled segment = green, empty = dark grey
            seg.beginFill(i < hp ? 0x00ff00 : 0x333333);
            seg.drawRect(seg._posX, seg._posY, seg._segW, seg._segH);
            seg.endFill();
            // Thin border
            seg.lineStyle(1, 0x000000, 0.5);
            seg.drawRect(seg._posX, seg._posY, seg._segW, seg._segH);
        }
        hudScoreText.text = 'Kills: ' + killCount;
        hudTimeText.text  = 'Time: ' + survivalTime.toFixed(1) + 's';
    }

    ///////////////////////// Play state /////////////////////////
    var playGame = function(game) {};
    playGame.prototype = {
        preload: function() {
            game.load.spritesheet('Grass', 'spr_grass.png', 32, 32);
            game.load.spritesheet('Environment', 'spr_environment.png', 32, 32);
            game.load.spritesheet('Terrain', 'spr_terrain.png', Terrain.sprSize(), Terrain.sprSize());
            game.load.spritesheet('Tank_1', 'spr_Tank1.png', Tank.sprWidth(), Tank.sprHeight());
            game.load.spritesheet('Tank_2', 'spr_Tank3.png', Tank.sprWidth(), Tank.sprHeight());
            game.load.spritesheet('Tank_3', 'spr_Tank4.png', Tank.sprWidth(), Tank.sprHeight());
            game.load.spritesheet('Tank_4', 'spr_Tank2.png', Tank.sprWidth(), Tank.sprHeight());
            game.load.spritesheet('Explosion', 'spr_explosion.png', Projectile.sprSize(), Projectile.sprSize());
            game.load.image('repairkit', 'repairkit.png');
        },
        create: function() {
            initTerrainData();
            drawBaseGroundLayer(game);
            generateTerrain(game);
            drawGrass(game);
            drawBushes(game);
            drawBorderDecoration(game);  // decorative only, no collision

            tank = [];
            tank.push(new Player(game, 400, 400));
            tank.push(new Tank(game, 200, 200, Math.floor(Math.random() * 3 + 1)));
            enemy_count++;
            game.world.swap(tank[0].vehicle, tank[enemy_count].vehicle);
            game.world.swap(tank[0].cannon, tank[enemy_count].cannon);

            createHUD(game);

            this._timerEvent = game.time.events.loop(100, function() {
                survivalTime += 0.1;
            }, this);
        },
        update: function() {
            for (var i = enemy_count; i >= 0; i--) {
                tank[i].move();
                if (tank[i].health <= 0) {
                    var wasEnemy = !(tank[i] instanceof Player);
                    tank[i].selfDestruct();
                    tank.splice(i, 1);
                    enemy_count--;
                    if (wasEnemy) killCount++;
                    break;
                }
            }
            enemy_spawn_delay--;
            if (enemy_spawn_delay <= 0) {
                enemy_spawn_delay = 200;

                // Scale enemy health and fire rate with survival time
                // 0-30s: 2hp, normal reload
                // 30-90s: 3hp, 20% faster reload
                // 90s+:   4hp, 40% faster reload
                var newEnemy = new Tank(game,
                    game.rnd.integerInRange(Tank.sprWidth(), game.width - Tank.sprWidth()),
                    game.rnd.integerInRange(Tank.sprHeight(), game.height - Tank.sprHeight()),
                    Math.floor(Math.random() * 3 + 1));
                if (survivalTime < 30) {
                    newEnemy.health = 2;
                } else if (survivalTime < 90) {
                    newEnemy.health = 3;
                    newEnemy.reload = Math.floor(newEnemy.reload * 0.8);
                } else {
                    newEnemy.health = 4;
                    newEnemy.reload = Math.floor(newEnemy.reload * 0.6);
                }
                tank.push(newEnemy);
                enemy_count++;
                game.world.swap(tank[0].vehicle, tank[enemy_count].vehicle);
                game.world.swap(tank[0].cannon, tank[enemy_count].cannon);
            }

            // Repair kit spawn
            repairKitSpawnDelay--;
            if (repairKitSpawnDelay <= 0 && repairKit === null) {
                repairKitSpawnDelay = game.rnd.integerInRange(400, 800);
                var MARGIN = 60;
                var rx = game.rnd.integerInRange(MARGIN, game_width - MARGIN);
                var ry = game.rnd.integerInRange(MARGIN, game_height - MARGIN);
                repairKit = game.add.sprite(rx, ry, 'repairkit');
                repairKit.width = 32;
                repairKit.height = 32;
                repairKit.anchor.set(0.5, 0.5);
            }

            // Repair kit pickup — player only, must be at ground level
            if (repairKit !== null && tank[0]) {
                var player = tank[0];
                if (Math.abs(player.x - repairKit.x) < 28 &&
                    Math.abs(player.y - repairKit.y) < 28 &&
                    player.z <= 85) {
                    player.health = Math.min(player.health + 2, 5);
                    repairKit.destroy();
                    repairKit = null;
                    repairKitSpawnDelay = game.rnd.integerInRange(400, 800);
                }
            }
            updateHUD();
        }
    };

    ///////////////////////// Game Over /////////////////////////
    var gameOver = function(game) {};
    gameOver.prototype = {
        create: function() {
            var bg = game.add.graphics(0, 0);
            bg.beginFill(0x111111, 0.92);
            bg.drawRect(0, 0, game_width, game_height);
            bg.endFill();

            var isNewBest = survivalTime >= highScore && survivalTime > 0;

            var goText = game.add.text(game_width / 2, game_height / 2 - 100, 'GAME OVER', { font: 'bold 36px Monospace', fill: '#ff4444', align: 'center' });
            goText.anchor.set(0.5, 0.5);

            var statsText = game.add.text(game_width / 2, game_height / 2 - 40,
                'Kills: ' + killCount + '    Time: ' + survivalTime.toFixed(1) + 's',
                { font: '18px Monospace', fill: '#00FF00', align: 'center' });
            statsText.anchor.set(0.5, 0.5);

            var hsLabel = isNewBest ? '★ New best: ' + highScore.toFixed(1) + 's' : 'Best: ' + highScore.toFixed(1) + 's';
            var hsText = game.add.text(game_width / 2, game_height / 2, hsLabel, { font: '16px Monospace', fill: isNewBest ? '#ffdd00' : '#888888', align: 'center' });
            hsText.anchor.set(0.5, 0.5);

            var prompt = game.add.text(game_width / 2, game_height / 2 + 60, 'click to play again', { font: '14px Monospace', fill: '#555555', align: 'center' });
            prompt.anchor.set(0.5, 0.5);

            game.input.onDown.add(this.restartGame, this);

            if (repairKit !== null) { repairKit.destroy(); repairKit = null; }
            tank = [];
            enemy_count = 0;
            enemy_spawn_delay = 300;
        },
        restartGame: function() {
            game.state.start('TitleScreen');
        }
    };

    ///////////////////////// Credits /////////////////////////
    var creditsScreen = function(game) {};
    creditsScreen.prototype = {
        create: function() {
            var bg = game.add.graphics(0, 0);
            bg.beginFill(0x111111);
            bg.drawRect(0, 0, game_width, game_height);
            bg.endFill();

            var line = game.add.graphics(0, 0);
            line.beginFill(0x00ff00);
            line.drawRect(60, 66, game_width - 120, 2);
            line.endFill();

            var title = game.add.text(game_width / 2, 44, 'CREDITS', { font: 'bold 28px Monospace', fill: '#00FF00', align: 'center' });
            title.anchor.set(0.5, 0.5);

            var credits = [
                { label: 'Tank sprites',             value: 'sbstevekim.com' },
                { label: 'Environment & terrain',    value: 'OpenGameArt — LPC Lost Garden tiles' },
                { label: 'Explosion sprites',        value: 'gravix on Construct.net' },
                { label: 'Repair kit icon',          value: 'Flaticon — tool-box #4176717' },
            ];

            var labelStyle = { font: '13px Monospace', fill: '#888888' };
            var valueStyle = { font: '13px Monospace', fill: '#cccccc' };

            var startY = 110;
            var rowH   = 52;

            credits.forEach(function(c, i) {
                var y = startY + i * rowH;

                var rowLine = game.add.graphics(0, 0);
                rowLine.lineStyle(1, 0x2a2a2a, 1);
                rowLine.moveTo(60, y - 8);
                rowLine.lineTo(game_width - 60, y - 8);

                var lbl = game.add.text(60, y, c.label, labelStyle);
                var val = game.add.text(60, y + 18, c.value, valueStyle);
            });

            // Back button
            var backBg = game.add.graphics(0, 0);
            backBg.lineStyle(1, 0x00ff00, 0.6);
            backBg.drawRoundedRect(game_width / 2 - 70, game_height - 70, 140, 34, 6);
            backBg.inputEnabled = true;
            backBg.events.onInputDown.add(function() { game.state.start('TitleScreen'); }, this);

            var backText = game.add.text(game_width / 2, game_height - 53, '← BACK', { font: '15px Monospace', fill: '#00cc00', align: 'center' });
            backText.anchor.set(0.5, 0.5);
            backText.inputEnabled = true;
            backText.events.onInputDown.add(function() { game.state.start('TitleScreen'); }, this);
        }
    };

    game.state.add("TitleScreen", titleScreen);
    game.state.add("Credits", creditsScreen);
    game.state.add("PlayGame", playGame);
    game.state.add("GameOver", gameOver);
    game.state.start("TitleScreen");
}