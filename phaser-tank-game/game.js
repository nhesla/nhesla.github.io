function TankGame(){
    ///////////////////////// Game vars ////////////////////////////
    var game_width = 640;
    var game_height = 640;
    var game = new Phaser.Game(game_width,game_height);
    
    var terrain;
    var tank;
    var enemy_count = 0;
    var enemy_spawn_delay = 300;
    let terrainData = [];

    ///////////////////////// Game vars ////////////////////////////
    
    class Projectile{
        constructor(x_coord, y_coord, z_coord, ang){
            this.x = x_coord;
            this.y = y_coord;
            this.z = z_coord;
            this.angle = ang;
            
            this.lifespan = 0;  //how long the projectile will last before it is automatically deleted
            this.animation = 0; // 1-9explosion animation
            
            this.pellet = game.add.sprite(this.x-(Projectile.sprSize()/2),this.y-(Projectile.sprSize()/2),'Explosion');
            this.pellet.frame = 0;
            game.physics.enable(this.pellet, Phaser.Physics.ARCADE);
        }
        static sprSize(){return 90;}
        static speed(){return 6;}
        static duration(){return 250;}
        static explosion_time(){return 50;}
        
        move(){
            if(this.animation == 0){
                this.x += Projectile.speed() * Math.sin(this.angle * (Math.PI / 180));
                this.y -= Projectile.speed() * Math.cos(this.angle * (Math.PI / 180));
            }
            /////collision with other objects
            /*game.physics.arcade.collide(this.pellet, blockingGroup, () => {
                this.animation++;
            }, null, this);/**/

            /////////////// damage control /////////////////
            if(this.animation > 0){
                this.animation ++;
                this.pellet.frame = Math.floor(this.animation / (Projectile.explosion_time()/9));
            }
            for(var j = 0; j <= enemy_count; j++){
                if(Math.abs(this.x - tank[j].x) < Projectile.sprSize()/4 && Math.abs(this.y - tank[j].y)
                    < Projectile.sprSize()/4 && Math.abs(this.z - tank[j].z) < 10 && this.animation == 0 && this.lifespan > 5){
                    this.animation ++;
                    for(var k = 0; k <= enemy_count; k++){
                        if(Math.abs(this.x - tank[k].x) < Projectile.sprSize() && Math.abs(this.y - tank[k].y) < Projectile.sprSize() && tank[k].damage_frames == 0){
                            if(tank[k] instanceof Player){
                                tank[k].health --;
                                tank[k].damage_frames ++;
                                console.log("Hit a Player tank");
                            }
                            else{
                                tank[k].health -= 2;
                                tank[k].damage_frames ++;
                                console.log("Hit an Enemy tank");
                            }
                        }
                    }
                }
            }
            ////////////// spinning /////////////////
            if(this.animation == 0)
                this.pellet.angle += 12;
            else
                this.z = 100;
            this.pellet.scale.setTo((this.z/100), (this.z/100));
            this.pellet.x = this.x 
                    - ((Projectile.sprSize()/2) * (this.z/100) * Math.cos(this.pellet.angle * (Math.PI / 180)))
                    + ((Projectile.sprSize()/2) * (this.z/100) * Math.sin(this.pellet.angle * (Math.PI / 180)));
            this.pellet.y = this.y 
                    - ((Projectile.sprSize()/2) * (this.z/100) * Math.sin(this.pellet.angle * (Math.PI / 180))) 
                    - ((Projectile.sprSize()/2) * (this.z/100) * Math.cos(this.pellet.angle * (Math.PI / 180)));
            
            ///////////// lifespan /////////////////////
            this.lifespan++;
        }
    }
    class Tank{
        constructor(game, x_coord, y_coord, tank_type){
            this.x = x_coord;       //player x coordinate
            this.y = y_coord;       //player y coordinate
            this.z = 200;           //player z coordinate (used in jumping and ridges), modifies the scale of the sprites
            this.shadow = 80;       //marker of ground level
            this.health = 5;        //tracks damage done to tank
            this.speed = 1;
            this.projectile = [];   //tracks the tank's projectiles
            
            this.jump = 0;                  //0-180 value to plug into cos to find scale modifier, tracking "height" of jump
            this.liftOffPoint;              //starting height of jump
            this.drop = 0;                  //starting speed of drop
            this.moving = false;            //determines when the tank is driving
            this.damage_frames = 0;         //0-? value to give invincibility frames, count by 1 each update
            this.reload = Tank.reload_time()*(Math.floor(Math.random()*7)+1);              
                                            //0-? value to give delay between shooting projectiles
            
            this.ai_destination_x = this.x;          //used for ai movement
            this.ai_destination_y = this.y;
            this.ai_move_delay = Tank.reload_time()*(Math.floor(Math.random()*4)+1);
            
            var type = '';
            switch(tank_type){
                case 1: 
                    type = 'Tank_2';
                    break;
                case 2:
                    type = 'Tank_3';
                    break;
                case 3:
                    type = 'Tank_4';
                    break;
                default:
                    type = 'Tank_1'
                    break;
            }
            this.vehicle = game.add.sprite(this.x-(Tank.sprWidth()-Tank.vehicle_center_x()),this.y-(Tank.sprHeight()-Tank.vehicle_center_y()),type);
            this.vehicle.frame = 0;
            game.physics.enable(this.vehicle, Phaser.Physics.ARCADE);
            this.cannon = game.add.sprite(this.x-(Tank.sprWidth()-Tank.cannon_center_x()),this.y-(Tank.sprHeight()-Tank.cannon_center_y()),type);
            this.cannon.frame = 5;
        }
        
        static sprWidth(){return 74;}
        static sprHeight(){return 77;}
        static sprRows(){return 2;}          //tank spritesheet count
        static sprColumns(){return 5;}

        static vehicle_center_x(){return 39;}     //center coordinates of vehicle
        static vehicle_center_y(){return 40;}
        static cannon_center_x(){return 43;}      //center coordinates of cannon
        static cannon_center_y(){return 43;}

        static movement_speed(){return 2;}    //movement speed of the tank
        static grav(){return 180/60;}          //speed at which jump goes through it's cycle
        static lift(){return 30;}             //z modifier of the jump
        static invincibility(){return 30;}      //number of invincibility frames
        static reload_time(){return 30;}        //number of "frames" delay between shots
        
        move(){
            this.controller();
            
            /////////////// sprite /////////////////
            this.vehicle.frame = Math.min(5 - this.health,4);
            this.cannon.frame = Math.min(10 - this.health,9);
            
            /////////////// moving /////////////////
            if(this.moving){
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
                    // On ground, trying to move onto elevated tile without jumping: block
                    x_move = this.x;
                    y_move = this.y;
                }
                
                if (isCurrentElevated && !isTargetElevated && this.jump === 0 && this.z === this.shadow) {
                    this.drop = 1; // Start falling
                }

                ////// collide with map bounds ////
                if(x_move < Tank.sprWidth()*(this.z/100)/2)
                    x_move = Tank.sprWidth()*(this.z/100)/2;
                if(x_move > game.width-Tank.sprWidth()*(this.z/100)/2)
                    x_move = game.width-Tank.sprWidth()*(this.z/100)/2;
                
                if(y_move < Tank.sprHeight()*(this.z/100)/2)
                    y_move = Tank.sprHeight()*(this.z/100)/2;
                if(y_move > game.height-Tank.sprHeight()*(this.z/100)/2)
                    y_move = game.height-Tank.sprHeight()*(this.z/100)/2;
                
                /////// collide with terrain ////
                /*determine whether player is running into a wall or something*/
                //game.physics.arcade.collide(this.vehicle, terrainGroup);
                
                //////collide with other tanks ////
                for(var i = 0; i <= enemy_count; i++){
                    if(!(this === tank[i])){
                        if(Math.abs(x_move - tank[i].x) < Tank.sprWidth()*(this.z/100) && Math.abs(this.y - tank[i].y) < Tank.sprHeight()*(this.z/100)/4*3 && Math.abs(this.z - tank[i].z) < 5){
                            
                            x_move = this.x + Tank.sprWidth()*(this.z/100)
                                * Math.abs(Math.sin(Phaser.Math.angleBetween(tank[i].x,tank[i].y,this.x,this.y) 
                                * (Math.PI / 180)))*Math.sign(this.x-tank[i].x);
                        }
                        if(Math.abs(this.x - tank[i].x) < Tank.sprWidth()*(this.z/100)/4*3 && Math.abs(y_move - tank[i].y) < Tank.sprHeight()*(this.z/100) && Math.abs(this.z - tank[i].z) < 5){
                            
                            y_move = this.y - (Tank.sprHeight()*(this.z/100) - Tank.sprHeight()*(this.z/100) 
                                * Math.abs(Math.cos(Phaser.Math.angleBetween(tank[i].x,tank[i].y,this.x,this.y) 
                                * (Math.PI / 180))))*Math.sign(this.y-tank[i].y);
                        }
                    }
                }
                
                this.x = x_move;
                this.y = y_move;
            }
            
            /////////////// vehicle rotation /////////////////
            this.vehicle.x = this.x - (Tank.vehicle_center_x() * (this.z/100) * Math.cos(this.vehicle.angle * (Math.PI / 180)))
                                    + (Tank.vehicle_center_y() * (this.z/100) * Math.sin(this.vehicle.angle * (Math.PI / 180)));
            this.vehicle.y = this.y - (Tank.vehicle_center_y() * (this.z/100) * Math.sin(this.vehicle.angle * (Math.PI / 180))) 
                                    - (Tank.vehicle_center_x() * (this.z/100) * Math.cos(this.vehicle.angle * (Math.PI / 180)));

            /////////////// cannon rotation /////////////////
            this.cannon.x = this.x - (Tank.cannon_center_x() * (this.z/100) * Math.cos(this.cannon.angle * (Math.PI / 180)))
                                   + (Tank.cannon_center_y() * (this.z/100) * Math.sin(this.cannon.angle * (Math.PI / 180)));
            this.cannon.y = this.y - (Tank.cannon_center_y() * (this.z/100) * Math.sin(this.cannon.angle * (Math.PI / 180)))
                                   - (Tank.cannon_center_x() * (this.z/100) * Math.cos(this.cannon.angle * (Math.PI / 180)));
            
            /////////////// projectile tracking /////////////////
            for(var i = 0; i < this.projectile.length; i++)
            {
                this.projectile[i].move();
                
                if(this.projectile[i].animation >= Projectile.explosion_time()){
                    this.projectile[i].pellet.destroy();
                    this.projectile.splice(i,1);
                    break;
                }
                if(this.projectile[i].lifespan >= Projectile.duration())
                {
                    this.projectile[i].pellet.destroy();
                    this.projectile.splice(i,1);
                    break;
                }
            }
            
            /////////////// elevation control /////////////////
            const tileX = Math.floor(this.x / 32);
            const tileY = Math.floor(this.y / 32);
            const isElevated = terrainData[tileY]?.[tileX] === 1;
            
            this.shadow = isElevated ? Terrain.terrainHeight() : 80;
            if (this.jump >= 180 || (this.liftOffPoint + Tank.lift() * Math.sin(this.jump * (Math.PI / 180)) <= this.shadow && this.jump > 90)) {
                this.z = this.shadow;
                this.jump = 0;
            }
            for(var i = 0; i <= enemy_count; i++){//bounce on other tanks? maybe?
                if(!(this === tank[i])){
                    if(Math.abs(this.x - tank[i].x) < Tank.sprWidth()*(this.z/100) && Math.abs(this.y - tank[i].y) < Tank.sprHeight()*(this.z/100) && this.z > tank[i].z && this.z - tank[i].z < Tank.grav()*3 && this.jump > 90){ 
                        this.jump = Tank.grav();
                        this.liftOffPoint = this.shadow;
                        tank[i].health --;
                        tank[i].damage_frames ++;
                    }
                }
            }
            if(this.jump > 0){
                this.z = this.liftOffPoint + Tank.lift() * Math.sin(this.jump * (Math.PI / 180));
                this.jump += Tank.grav();
            }
            else if(this.z > this.shadow){
                if(this.z - this.drop > this.shadow){
                    this.z -= this.drop;
                    if(this.drop < Tank.lift()/4)
                        this.drop += Tank.lift()/40;
                }
                else{
                    this.z = this.shadow;
                    this.drop = 0;
                }
            }
            // Clamp z to never be less than shadow (ground level)
            if (this.z < this.shadow) {
                this.z = this.shadow;
            }

            this.vehicle.scale.setTo((this.z/100), (this.z/100));
            this.cannon.scale.setTo((this.z/100), (this.z/100));

            /////////// damage_frames ////////////////
            if(this.damage_frames > 0){
                this.damage_frames ++;
            }
            if(this.damage_frames > Tank.invincibility()){
                this.damage_frames = 0;
            }
        }
        selfDestruct(){
            this.vehicle.destroy();
            this.cannon.destroy();
            for(var i = this.projectile.length-1; i >= 0; i--){
                this.projectile[i].pellet.destroy();
                this.projectile.splice(i,1);
            }
        }
        controller(){
            ///////////////////////// cannon aim ////////////////////////////
            this.cannon.angle = (Phaser.Math.angleBetween(this.x, this.y, tank[0].x, tank[0].y) * (180 / Math.PI) +90);
            
            ///////////////////////// shooting control ////////////////////////////
            if(this.reload > 0){
                this.reload --;
            }
            if(this.reload <= 0){
                this.projectile.push(new Projectile(this.x,this.y,this.z,this.cannon.angle));
                
                this.reload = Tank.reload_time()*(Math.floor(Math.random()*7)+1);
            }
            
            ///////////////////////// movement control ////////////////////////////
            if(this.ai_move_delay > 0){
                this.ai_move_delay --;
                if(this.ai_move_delay <= 0){
                    this.ai_destination_x = Math.floor(Math.random()*(game.width-Tank.sprWidth()*2))+Tank.sprWidth();
                    this.ai_destination_y = Math.floor(Math.random()*(game.height-Tank.sprHeight()*2))+Tank.sprHeight();
                    this.vehicle.angle = (Phaser.Math.angleBetween(this.x, this.y, this.ai_destination_x, this.ai_destination_y) * (180 / Math.PI) +90);
                }
                // Attempt to jump if moving onto elevated terrain from low ground
                const TILE_SIZE = Terrain.sprSize();
                const currentTileX = Math.floor(this.x / TILE_SIZE);
                const currentTileY = Math.floor(this.y / TILE_SIZE);
                const targetTileX = Math.floor(this.ai_destination_x / TILE_SIZE);
                const targetTileY = Math.floor(this.ai_destination_y / TILE_SIZE);

                const isCurrentElevated = terrainData[currentTileY]?.[currentTileX] === 1;
                const isTargetElevated = terrainData[targetTileY]?.[targetTileX] === 1;

                if (!isCurrentElevated && isTargetElevated && this.jump === 0 && this.z === this.shadow) {
                    this.jump = Tank.grav();
                    this.liftOffPoint = this.shadow;
                }
            }
            else{
                this.moving = true;
            }
            if(Math.abs(this.x - this.ai_destination_x) < 3 && Math.abs(this.y - this.ai_destination_y) < 3 && this.ai_move_delay == 0){
                this.ai_move_delay = Tank.reload_time()*(Math.floor(Math.random()*4)+1);
                this.moving = false;
            }
            
        }
    }
    class Player extends Tank{
        constructor(game, x_coord, y_coord){
            super(game, x_coord, y_coord, 0);
            //this.speed = 2;

            this.control_keys = [game.input.keyboard.addKey(Phaser.Keyboard.W),
                            game.input.keyboard.addKey(Phaser.Keyboard.A),
                            game.input.keyboard.addKey(Phaser.Keyboard.S),
                            game.input.keyboard.addKey(Phaser.Keyboard.D),
                            game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR),
                            game.input.keyboard.addKey(Phaser.Keyboard.R)];
            
            if(this.control_keys[5]){
		this.control_keys[5].onDown.add(function(){ //cheats
                	this.health = Math.min(this.health+1,5);
                	console.log("R was pressed! CHEATER\nHealth: " + this.health);
            	},this);
	    }
            game.input.mouse.capture = true;
        }
        selfDestruct(){
            this.vehicle.destroy();
            this.cannon.destroy();
            for(var i = this.projectile.length-1; i >= 0; i--){
                this.projectile[i].pellet.destroy();
                this.projectile.splice(i,1);
            }
            game.time.events.add(Phaser.Timer.SECOND * 3, function(){game.state.start('GameOver');}, this);
        }
        controller(){
            ///////////////////////////////////////////////////////////////////////
            /////////////////////// Player controlls /////////////////////////////
            
            
            /////////////// directional movement controlls /////////////////
            if(this.control_keys[0].justPressed || this.control_keys[1].justPressed || this.control_keys[2].justPressed || this.control_keys[3].justPressed){
                if(this.control_keys[0].isDown){
                    this.vehicle.angle = 0;
                }
                else if(this.control_keys[2].isDown){
                    this.vehicle.angle = 180;
                }

                if((this.control_keys[0].isDown && this.control_keys[1].isDown) || (this.control_keys[2].isDown && this.control_keys[3].isDown)){
                    this.vehicle.angle -= 45;
                }
                else if((this.control_keys[2].isDown && this.control_keys[1].isDown) || (this.control_keys[0].isDown && this.control_keys[3].isDown)){
                    this.vehicle.angle += 45;
                }

                if(this.control_keys[1].isDown && !(this.control_keys[0].isDown || this.control_keys[2].isDown)){
                    this.vehicle.angle = 270;
                }
                else if(this.control_keys[3].isDown && !(this.control_keys[0].isDown || this.control_keys[2].isDown)){
                    this.vehicle.angle = 90;
                }
            }
            if(this.control_keys[0].isDown || this.control_keys[2].isDown || this.control_keys[1].isDown || this.control_keys[3].isDown){
                this.moving = true;
            }
            else{
                this.moving = false;
            }

            /////////////// cannon / mouse control /////////////////
            this.cannon.angle = (Phaser.Math.angleBetween(this.x, this.y, game.input.mousePointer.x, game.input.mousePointer.y) * (180 / Math.PI) +90);

            /////////////// shooting control ////////////////////
            if(this.reload > 0){
                this.reload ++;
            }
            if(game.input.activePointer.leftButton.isDown && this.reload == 0)
            {
                this.projectile.push(new Projectile(this.x,this.y,this.z,this.cannon.angle));
                this.reload ++;
            }
            if(this.reload >= Tank.reload_time())
            {
                this.reload = 0;
            }
               
            /////////////// jump control /////////////////
            if(this.control_keys[4].isDown && this.jump == 0 && this.z == this.shadow){
                this.jump += Tank.grav();
                this.liftOffPoint = this.shadow;
            }
            /////////////////////// Player controlls /////////////////////////////
            /////////////////////////////////////////////////////////////////////
        }
    }
    class Terrain {
        static sprSize() { return 128; }
        static terrainHeight() { return 100; }
    }

    
    var titleScreen = function(game){}
        titleScreen.prototype = {
        preload: function(){
            
            game.load.image('startBtn', 'play_button.png');
        },
        
        create: function() {
            style = {
                font: '32px Monospace',
                fill: '#00FF00',
                align: 'center'
            }
            
            var text = game.add.text(game.width/2, game.height/2-100, "Tank Game", style);
            text.anchor.set(0.5,0.5);
            var startButton = game.add.button(game.width/2, game.height/2+100, 'startBtn', this.startGame, this);
            startButton.anchor.set(0.5,0.5);
        },
        
        startGame: function(){
            score = 0;
            game.state.start('PlayGame');
        }
    }
    function initTerrainData(game) {
        const UNIT_SIZE = 32;
        const GRID_WIDTH = game_width / UNIT_SIZE;
        const GRID_HEIGHT = game_height / UNIT_SIZE;

        terrainData = [];

        // Initialize terrain grid to all 0s
        for (let y = 0; y < GRID_HEIGHT; y++) {
            terrainData[y] = new Array(GRID_WIDTH).fill(0);
        }

        let y = 0;
        while (y < GRID_HEIGHT) {
            let x = 0;
            let addedTerrainThisRow = false;

            while (x < GRID_WIDTH) {
                const isStartOfBlock = (x % 4 === 0 && y % 4 === 0);

                // Place new terrain block
                if (isStartOfBlock && Math.random() < 0.35) {
                    terrainData[y][x] = 1;
                    addedTerrainThisRow = true;
                    x++;
                }
                // Expand terrain from left or top neighbor
                else if (
                    (x % 4 != 0 && terrainData[y][x - 1] === 1) || 
                    (y % 4 != 0 && terrainData[y - 1][x] === 1)
                ) {
                    terrainData[y][x] = 1;
                    addedTerrainThisRow = true;
                    x++;
                }
                // Skip ahead
                else {
                    x += 4;
                }
            }

            // If no terrain placed in this row, jump ahead
            if (!addedTerrainThisRow) {
                y += 4;
            } else {
                y++;
            }
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
                    // Calculate bitmask from neighbors at block-size offsets
                    let mask = 0;
                    if (terrainData[y - 4]?.[x] === 1) mask += 1;
                    if (terrainData[y]?.[x + 4] === 1) mask += 2;
                    if (terrainData[y + 4]?.[x] === 1) mask += 4;
                    if (terrainData[y]?.[x - 4] === 1) mask += 8;

                    //const sprite = game.add.sprite(x * Terrain.sprSize(), y * Terrain.sprSize(), 'Terrain', mask);
                    const sprite = game.add.sprite(x * UNIT_SIZE, y * UNIT_SIZE, 'Terrain', mask);
                    
                    game.physics.arcade.enable(sprite);
                    sprite.body.immovable = true;
                    sprite.body.x = sprite.x;
                    sprite.body.y = sprite.y;
                    sprite.body.setSize(Terrain.sprSize(), Terrain.sprSize());
                    //sprite.z = 100;
                    terrainGroup.add(sprite);
                }
            }
        }
    }
    function drawBaseGroundLayer(game) {
        const UNIT_SIZE = 32;

        const GRID_WIDTH = game_width / UNIT_SIZE;
        const GRID_HEIGHT = game_height / UNIT_SIZE;

        groundGroup = game.add.group();

        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const groundTile = game.add.sprite(x * UNIT_SIZE, y * UNIT_SIZE, 'Environment', 0);
                groundGroup.add(groundTile);
            }
        }
    }
    function drawGrass(game) {
        const UNIT_SIZE = 32;
        const GRID_WIDTH = terrainData[0].length;
        const GRID_HEIGHT = terrainData.length;
        grassData = [];

        grassGroup = game.add.group();

        // Initialize grass grid to all 0s
        for (let y = 0; y < GRID_HEIGHT; y++) {
            grassData[y] = new Array(GRID_WIDTH).fill(0);
        }
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (terrainData[y][x] == 0 && Math.random() < .35) // Only place grass on ground
                    grassData[y][x] = 1;
                
            }
        }
         for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                let bitmask = 0;
                if (grassData[y][x] == 1){
                    // Check neighbors — only add bit if neighbor is also ground
                    if (grassData[y - 1]?.[x] === 1) bitmask += 1; // Top
                    if (grassData[y]?.[x + 1] === 1) bitmask += 2; // Right
                    if (grassData[y + 1]?.[x] === 1) bitmask += 4; // Bottom
                    if (grassData[y]?.[x - 1] === 1) bitmask += 8; // Left

                    if (bitmask <= 15) {
                        const grass = game.add.sprite(x * UNIT_SIZE, y * UNIT_SIZE, 'Grass', bitmask);
                        grassGroup.add(grass);
                    }
                }
                
            }
         }
    }
    function drawBushes(game) {
        const UNIT_SIZE = 32;
        const GRID_WIDTH = terrainData[0].length;
        const GRID_HEIGHT = terrainData.length;

        bushGroup = game.add.group();

        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                // Only place bushes on ground-level tiles
                if (terrainData[y][x] === 0 && Math.random() < 0.05) {
                    const frame = Math.random() < 0.5 ? 0 : 1; // Randomly choose B0 or B1
                    const bush = game.add.sprite(x * UNIT_SIZE, y * UNIT_SIZE, 'Environment', frame + 12);
                    bushGroup.add(bush);
                }
            }
        }
    }
    function drawRocksAndTrees(game) {
        const UNIT_SIZE = 32;
        const GRID_WIDTH = terrainData[0].length;
        const GRID_HEIGHT = terrainData.length;

        blockingGroup = game.add.group();      // Collision-enabled objects
        overdrawGroup = game.add.group();      // Top tiles to render after tanks

        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {

                // --- Rock 1 (1×2, both parts collidable) ---
                if (Math.random() < 0.015 && y + 1 < GRID_HEIGHT) {
                    const top = game.add.sprite(x * UNIT_SIZE, y * UNIT_SIZE, 'Environment', 4);
                    const bottom = game.add.sprite(x * UNIT_SIZE, (y + 1) * UNIT_SIZE, 'Environment', 10);

                    game.physics.arcade.enable(top);
                    game.physics.arcade.enable(bottom);
                    top.body.immovable = true;
                    bottom.body.immovable = true;

                    blockingGroup.add(top);
                    blockingGroup.add(bottom);
                }

                // --- Rock 2 (1×2, only bottom collidable) ---
                else if (Math.random() < 0.01 && y + 1 < GRID_HEIGHT) {
                    const bottom = game.add.sprite(x * UNIT_SIZE, (y + 1) * UNIT_SIZE, 'Environment', 11);
                    const top = game.add.sprite(x * UNIT_SIZE, y * UNIT_SIZE, 'Environment', 5);

                    game.physics.arcade.enable(bottom);
                    bottom.body.immovable = true;

                    blockingGroup.add(bottom);
                    overdrawGroup.add(top); // purely visual
                }

                // --- Rock 3 (1×1, single tile, collidable) ---
                else if (Math.random() < 0.0075) {
                    const rock = game.add.sprite(x * UNIT_SIZE, y * UNIT_SIZE, 'Environment', 16);
                    game.physics.arcade.enable(rock);
                    rock.body.immovable = true;
                    blockingGroup.add(rock);
                }

                // --- Tree (2×3), only on ground ---
                else if (
                    Math.random() < 0.01 &&
                    x + 1 < GRID_WIDTH &&
                    y + 2 < GRID_HEIGHT &&
                    terrainData[y][x] === 0 &&
                    terrainData[y][x + 1] === 0 &&
                    terrainData[y + 1][x] === 0 &&
                    terrainData[y + 1][x + 1] === 0 &&
                    terrainData[y + 2][x] === 0 &&
                    terrainData[y + 2][x + 1] === 0
                ) {
                    // Bottom 2×2 (collision): 8, 9, 14, 15
                    const frames = [8, 9, 14, 15];
                    const dx = [0, 1, 0, 1];
                    const dy = [1, 1, 2, 2];

                    for (let i = 0; i < 4; i++) {
                        const tile = game.add.sprite(
                            (x + dx[i]) * UNIT_SIZE,
                            (y + dy[i]) * UNIT_SIZE,
                            'Environment',
                            frames[i]
                        );
                        game.physics.arcade.enable(tile);
                        tile.body.immovable = true;
                        blockingGroup.add(tile);
                    }

                    // Top 2×1 (visual only): 2, 3
                    const topLeft = game.add.sprite(x * UNIT_SIZE, y * UNIT_SIZE, 'Environment', 2);
                    const topRight = game.add.sprite((x + 1) * UNIT_SIZE, y * UNIT_SIZE, 'Environment', 3);
                    overdrawGroup.add(topLeft);
                    overdrawGroup.add(topRight);
                }
            }
        }
    }

    var playGame = function(game) {}
        playGame.prototype = {
            preload: function(){
                game.load.spritesheet('Grass', 'spr_grass.png', 32, 32);
                game.load.spritesheet('Environment', 'spr_environment.png', 32, 32);
                game.load.spritesheet('Terrain','spr_terrain.png',Terrain.sprSize(),Terrain.sprSize());
                game.load.spritesheet('Tank_1','spr_Tank1.png',Tank.sprWidth(),Tank.sprHeight());
                game.load.spritesheet('Tank_2','spr_Tank3.png',Tank.sprWidth(),Tank.sprHeight());
                game.load.spritesheet('Tank_3','spr_Tank4.png',Tank.sprWidth(),Tank.sprHeight());
                game.load.spritesheet('Tank_4','spr_Tank2.png',Tank.sprWidth(),Tank.sprHeight());
                game.load.spritesheet('Explosion','spr_explosion.png',Projectile.sprSize(),Projectile.sprSize());
            },
            create: function() {

                initTerrainData();              //set up terrainData
                drawBaseGroundLayer(game);      // draw ground
                generateTerrain(game);          // draw terrain
                drawGrass(game);                // draw grass on ground level
                drawBushes(game);               // Decorative
                //drawRocksAndTrees(game);        // Blocking decorations & overdraw
                
                tank = [];
                tank.push(new Player(game, 400, 400));
                tank.push(new Tank(game, 200, 200, Math.floor(Math.random()*3+1)));
                enemy_count++;
                game.world.swap(tank[0].vehicle, tank[enemy_count].vehicle);
                game.world.swap(tank[0].cannon, tank[enemy_count].cannon);

                // NOTE: In update(), overdrawGroup should render AFTER tanks
            },
            update: function() {
                for(var i = enemy_count; i >= 0; i--){
                    tank[i].move();
                    if(tank[i].health <= 0){
                        tank[i].selfDestruct();
                        tank.splice(i,1);
                        enemy_count --;
                        break;
                    }
                    
                }
                enemy_spawn_delay --;
                if(enemy_spawn_delay <= 0){
                    enemy_spawn_delay = 200;
                    tank.push(new Tank(game, game.rnd.integerInRange(Tank.sprWidth(), game.width-Tank.sprWidth()), 
                                        game.rnd.integerInRange(Tank.sprHeight(), game.height-Tank.sprHeight()), Math.floor(Math.random()*3+1)));
                    enemy_count ++;
                    game.world.swap(tank[0].vehicle, tank[enemy_count].vehicle);
                    game.world.swap(tank[0].cannon, tank[enemy_count].cannon);
                }
                
                //tank.forEach(t => game.debug.body(t.vehicle));
                //terrainGroup.forEachAlive(tile => game.debug.body(tile));
                //game.world.bringToTop(overdrawGroup);
            }
            
        }
    
    var gameOver = function(game) {}
        gameOver.prototype = {
            create: function(){
                var GOtext = game.add.text(game.width/2, game.height/2, "Game Over\n\nTap to restart", style);
                GOtext.anchor.set(0.5,0.5);
                game.input.onDown.add(this.restartGame, this);
                
                tank = [];
                enemy_count = 0;
                enemy_spawn_delay = 300;
            },
            
            restartGame: function(){
                game.state.start('TitleScreen');
            }
            
        }
    
    game.state.add("TitleScreen", titleScreen);    
    game.state.add("PlayGame", playGame);
    game.state.add("GameOver", gameOver);
    game.state.start("TitleScreen");
}