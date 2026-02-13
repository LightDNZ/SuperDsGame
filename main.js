class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  preload() {
    this.load.image("background", "assets/background/background.png");
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.image(w / 2, h / 2, "background")
      .setDisplaySize(w, h)
      .setDepth(-1);

    this.add.text(w / 2, h / 2 - 150, "SUPER DS", {
      fontSize: "80px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    const playBtn = this.add.rectangle(w / 2, h / 2, 300, 70, 0x2c5aa0)
      .setInteractive({ useHandCursor: true });

    this.add.text(w / 2, h / 2, "JOGAR", {
      fontSize: "32px",
      color: "#ffffff"
    }).setOrigin(0.5);

    playBtn.on("pointerover", () => playBtn.setFillStyle(0x3a6bb0));
    playBtn.on("pointerout", () => playBtn.setFillStyle(0x2c5aa0));

    playBtn.on("pointerdown", () => {

      this.cameras.main.fadeOut(500, 0, 0, 0);

      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("GameScene", { level: 1, lives: 3 });
      });

    });

    // Botão Sair
    const exitBtn = this.add.rectangle(w / 2, h / 2 + 100, 300, 70, 0xaa2c2c)
      .setInteractive({ useHandCursor: true });

    this.add.text(w / 2, h / 2 + 100, "SAIR", {
      fontSize: "32px",
      color: "#ffffff"
    }).setOrigin(0.5);

    exitBtn.on("pointerover", () => exitBtn.setFillStyle(0xcc3a3a));
    exitBtn.on("pointerout", () => exitBtn.setFillStyle(0xaa2c2c));

    exitBtn.on("pointerdown", () => {
      window.close(); 
    });
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  preload() {
    preload.call(this);
  }

  create(data) {

    this.add.text(-1000, -1000, "preload", {
      fontFamily: "PixelOperator8"
    });    
    this.cameras.main.fadeIn(500, 0, 0, 0);
  
    create.call(this, data);
  }
  
  update(time, delta) {
    update.call(this, time, delta);
  }
}


// ================= CONFIG =================
const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: "#1b1b1b",
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 900 },
      debug: false
    }
  },
  scene: [MenuScene, GameScene]
};

new Phaser.Game(config);


let cursors;
let player;
const TILE_SIZE = 48;

// Config de cada fase: plataformas [centerX, yOffset, w, h] (centerY = groundY + yOffset)
const LEVELS = [
  {
    platforms: [
      [1150, -12, 180, 24],
      [1450, -96, 180, 24],
      [1150, -200, 180, 24]
    ],
    collectible: { x: 1150, yOffset: -308 }
  },
  {
    spawnRight: true,

    platforms: [
      [480, -60, 120, 24],
      // [700, -120, 120, 24],
      [580, -180, 120, 24],
      [280, -280, 120, 24],
      [550, -340, 160, 24],

      [1250, -40, 20, 20],
      [1320, -40, 20, 20],
      [1390, -40, 20, 20],
      [1460, -40, 20, 20],
      [1530, -40, 20, 20],
      [1600, -40, 20, 20],


    ],

    collectible: { x: 320, yOffset: -320 },
    goal: { x: 800, yOffset: -400 }
  }

];


// ================= STATES =================
const PlayerState = {
  IDLE: "IDLE",
  RUN: "RUN",
  RUN_TURN: "RUN_TURN",
  RUN_TO_IDLE: "RUN_TO_IDLE",
  JUMP: "JUMP",
  FALL: "FALL",
  FALL_LOOP: "FALL_LOOP",
  DEATH: "DEATH"
};

// ================= PRELOAD =================
function preload() {
  const anims = [
    "male_hero-idle",
    "male_hero-run",
    "male_hero-run_turn",
    "male_hero-run_to_idle",
    "male_hero-jump",
    "male_hero-fall",
    "male_hero-fall_loop",
    "male_hero-death"
  ];

  anims.forEach(a => {
    this.load.spritesheet(a, `assets/male_hero/${a}.png`, {
      frameWidth: 128,
      frameHeight: 128
    });
  });

  this.load.image("grass", "assets/tileset/grass.png");
  this.load.image("dirt", "assets/tileset/dirt.png");
  this.load.image("background", "assets/background/background.png");
  this.load.spritesheet("spikes", "assets/items/spikes.png", { frameWidth: 68, frameHeight: 10 });
  this.load.spritesheet("coin", "assets/items/Coin.png", { frameWidth: 10, frameHeight: 10 });
  this.load.spritesheet("flag", "assets/items/Flag.png", { frameWidth: 48, frameHeight: 48 });
  this.load.spritesheet("slime_idle", "assets/slime/idle.png", {
    frameWidth: 80,
    frameHeight: 80
  });
  this.load.spritesheet("slime_attack", "assets/slime/attack.png", {
    frameWidth: 80,
    frameHeight: 80
  });

}

// ================= POPUP VITÓRIA =================
function showVictoryPopup(scene, currentLevel) {
  const w = config.width;
  const h = config.height;
  const depth = 2000;
  const hasNextLevel = LEVELS[currentLevel]; // existe fase N+1?

  const overlay = scene.add.rectangle(w / 2, h / 2, w * 2, h * 2, 0x000000, 0.75)
    .setDepth(depth)
    .setScrollFactor(0);

  const title = scene.add.text(w / 2, h / 2 - 80, "VITÓRIA!", {
    fontSize: 72,
    color: "#ffd700",
    fontStyle: "bold"
  }).setOrigin(0.5).setDepth(depth + 1).setScrollFactor(0);

  const subtitle = scene.add.text(w / 2, h / 2 - 20,
    hasNextLevel ? `Fase ${currentLevel} concluída! Boa você é um ser um humano funcional. Nao pense que a proxima será assim` : "Parabéns! Você venceu todas as fases!",
    { fontSize: 32, color: "#e0e0e0" }
  ).setOrigin(0.5).setDepth(depth + 1).setScrollFactor(0);

  const btnW = 220;
  const btnH = 50;
  const btnLabel = hasNextLevel ? "Próxima fase" : "Jogar novamente";
  const nextBtn = scene.add.rectangle(w / 2, h / 2 + 60, btnW, btnH, 0x2c5aa0)
    .setDepth(depth + 1)
    .setScrollFactor(0)
    .setInteractive({ useHandCursor: true });
  scene.add.text(w / 2, h / 2 + 60, btnLabel, {
    fontSize: 28,
    color: "#ffffff"
  }).setOrigin(0.5).setDepth(depth + 2).setScrollFactor(0);

  nextBtn.on("pointerover", () => nextBtn.setFillStyle(0x3a6bb0));
  nextBtn.on("pointerout", () => nextBtn.setFillStyle(0x2c5aa0));
  nextBtn.on("pointerdown", () => {
    scene.scene.restart({
      level: hasNextLevel ? currentLevel + 1 : 1,
      lives: 3
    });
  });
}

// ================= POPUP GAME OVER =================
function showGameOverPopup(scene) {
  const w = config.width;
  const h = config.height;
  const depth = 2000;

  const overlay = scene.add.rectangle(w / 2, h / 2, w * 2, h * 2, 0x000000, 0.8)
    .setDepth(depth)
    .setScrollFactor(0);

  scene.add.text(w / 2, h / 2 - 60, "GAME OVER", {
    fontSize: 72,
    color: "#cc0000",
    fontStyle: "bold"
  }).setOrigin(0.5).setDepth(depth + 1).setScrollFactor(0);

  scene.add.text(w / 2, h / 2, "Sem vidas! slc é mt ruim KKKKKKKKKKKKKKKKKKKK", {
    fontSize: 32,
    color: "#e0e0e0"
  }).setOrigin(0.5).setDepth(depth + 1).setScrollFactor(0);

  const btnW = 240;
  const btnH = 50;
  const retryBtn = scene.add.rectangle(w / 2, h / 2 + 60, btnW, btnH, 0x2c5aa0)
    .setDepth(depth + 1)
    .setScrollFactor(0)
    .setInteractive({ useHandCursor: true });
  scene.add.text(w / 2, h / 2 + 60, "Tentar novamente", {
    fontSize: 26,
    color: "#ffffff"
  }).setOrigin(0.5).setDepth(depth + 2).setScrollFactor(0);

  retryBtn.on("pointerover", () => retryBtn.setFillStyle(0x3a6bb0));
  retryBtn.on("pointerout", () => retryBtn.setFillStyle(0x2c5aa0));
  retryBtn.on("pointerdown", () => {
    scene.scene.restart({ level: scene.level, lives: 3 });
  });
}

// ================= KillPlayer ==============
function killPlayer(scene) {
  if (scene.deathTriggered || scene.gameOverTriggered) return;

  scene.deathTriggered = true;
  scene.lives--;
  scene.livesText.setText("Vidas: " + scene.lives);

  if (scene.lives <= 0) {
    scene.gameOverTriggered = true;
    scene.physics.pause();
    showGameOverPopup(scene);
  } else {
    scene.scene.restart({
      level: scene.level,
      lives: scene.lives
    });
  }
}

// ================= CREATE =================
function create(data) {
  this.level = (data && data.level) ? data.level : 1;
  this.lives = (data && data.lives !== undefined) ? data.lives : 3;
  this.victoryTriggered = false;
  this.gameOverTriggered = false;
  this.deathTriggered = false;

  const makeAnim = (key, sheet, fps = 10, loop = -1, endFrame = 9) => {
    this.anims.create({
      key,
      frames: this.anims.generateFrameNumbers(sheet, { start: 0, end: endFrame }),
      frameRate: fps,
      repeat: loop
    });
  };
  makeAnim("idle", "male_hero-idle", 8, -1, 5);
  makeAnim("run", "male_hero-run", 14, -1, 9);
  makeAnim("run_turn", "male_hero-run_turn", 12, 0, 3);
  makeAnim("run_to_idle", "male_hero-run_to_idle", 10, 0, 6);
  makeAnim("jump", "male_hero-jump", 12, 0, 5);
  makeAnim("fall", "male_hero-fall", 12, 0, 3);
  makeAnim("fall_loop", "male_hero-fall_loop", 10, -1, 2);
  makeAnim("death", "male_hero-death", 8, 0, 5);

  this.anims.create({
    key: "coin_spin",
    frames: this.anims.generateFrameNumbers("coin", { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1
  });
  this.anims.create({
    key: "flag_wave",
    frames: this.anims.generateFrameNumbers("flag", { start: 0, end: 3 }),
    frameRate: 8,
    repeat: -1
  });

  // ===== ANIMAÇÕES SLIME =====
  this.anims.create({
    key: "slime_idle_anim",
    frames: this.anims.generateFrameNumbers("slime_idle", { start: 0, end: 11 }),
    frameRate: 8,
    repeat: -1
  });

  this.anims.create({
    key: "slime_attack_anim",
    frames: this.anims.generateFrameNumbers("slime_attack", { start: 0, end: 11 }),
    frameRate: 12,
    repeat: 0
  });

  // ===== BACKGROUND =====
  const bg = this.add.image(config.width / 2, config.height / 2, "background")
    .setDisplaySize(config.width, config.height)
    .setDepth(-10);

  // ===== FASE (layout conforme LEVELS[level - 1]) =====
  const levelData = LEVELS[this.level - 1] || LEVELS[0];
  const groundRows = 2;
  const groundY = config.height - groundRows * TILE_SIZE;
  const groundHeight = groundRows * TILE_SIZE;
  // ================= CHÃO DINÂMICO =================

  let groundSegments = [];

  // ===== FASE 1 =====
  if (this.level === 1) {
    groundSegments.push({
      x: 0,
      width: Math.floor(config.width * 0.5)
    });
  }

  // ===== FASE 2 =====
  if (this.level === 2) {

    // esquerdo
    groundSegments.push({
      x: 0,
      width: 800
    });

    // direito
    groundSegments.push({
      x: 1100,
      width: config.width - 1000
    });
  }


  const groundBodies = [];

  groundSegments.forEach(segment => {

    // Visual
    for (let row = 0; row < groundRows; row++) {
      const key = row === 0 ? "grass" : "dirt";
      const y = groundY + row * TILE_SIZE;

      for (let x = segment.x; x < segment.x + segment.width; x += TILE_SIZE) {
        this.add.image(x, y, key)
          .setOrigin(0, 0)
          .setDisplaySize(TILE_SIZE, TILE_SIZE);
      }
    }

    // Física
    const ground = this.add.rectangle(
      segment.x + segment.width / 2,
      groundY + groundHeight / 2,
      segment.width,
      groundHeight,
      0,
      0
    );

    this.physics.add.existing(ground, true);
    ground.body.setSize(segment.width, groundHeight);
    ground.body.updateFromGameObject();

    groundBodies.push(ground);
  });

  // Plataformas flutuantes 
  const platforms = [];
  const addPlatform = (centerX, centerY, w, h) => {
    const plat = this.add.rectangle(centerX, centerY, w, h, 0, 0);
    this.physics.add.existing(plat, true);
    plat.body.setSize(w, h);
    plat.body.updateFromGameObject();
    plat.setDepth(0);
    platforms.push(plat);
    const tileH = Math.min(TILE_SIZE, h);
    const numTiles = Math.ceil(w / TILE_SIZE);
    for (let i = 0; i < numTiles; i++) {
      const px = centerX - w / 2 + i * TILE_SIZE;
      this.add.image(px, centerY - h / 2, "grass").setOrigin(0, 0).setDepth(0).setDisplaySize(TILE_SIZE, tileH);
    }
    if (h > tileH) {
      const dirtH = Math.min(TILE_SIZE, h - tileH);
      for (let i = 0; i < numTiles; i++) {
        const px = centerX - w / 2 + i * TILE_SIZE;
        this.add.image(px, centerY - h / 2 + tileH, "dirt").setOrigin(0, 0).setDepth(0).setDisplaySize(TILE_SIZE, dirtH);
      }
    }
  };
  levelData.platforms.forEach(p => addPlatform(p[0], groundY + p[1], p[2], p[3]));

  // Coletável: moeda animada 4 frames (40x10), escala 2
  const col = levelData.collectible;
  const collectible = this.add.sprite(col.x, groundY + col.yOffset, "coin").setDepth(1).setScale(2);
  collectible.play("coin_spin");
  this.physics.add.existing(collectible, true);
  collectible.body.setCircle(10);
  collectible.body.updateFromGameObject();
  if (collectible.body.setSensor) collectible.body.setSensor(true);
  else collectible.body.isSensor = true;

  // Meta: bandeira animada 4 frames (100x32 → 25x32 por frame), escala 1 
  // ================= META DINÂMICA =================
  const goalData = levelData.goal;

  let goalX;
  let goalY;

  if (goalData) {
    goalX = goalData.x;
    goalY = groundY + goalData.yOffset;
  } else {
    goalX = config.width - 200;
    goalY = groundY - 50;
  }

  // Plataforma base da meta
  const goalPlatformW = 160;
  const goalPlatformH = 24;

  const goalPlatform = this.add.rectangle(
    goalX,
    goalY + 20,
    goalPlatformW,
    goalPlatformH,
    0,
    0
  );

  this.physics.add.existing(goalPlatform, true);
  platforms.push(goalPlatform);

  // Tiles visuais
  const goalTiles = Math.ceil(goalPlatformW / TILE_SIZE);
  for (let i = 0; i < goalTiles; i++) {
    const px = goalX - goalPlatformW / 2 + i * TILE_SIZE;
    this.add.image(px, goalY + 8, "grass")
      .setOrigin(0, 0)
      .setDisplaySize(TILE_SIZE, goalPlatformH);
  }

  // Bandeira
  const goalFlag = this.add.sprite(goalX, goalY, "flag")
    .setOrigin(0.5, 1)
    .setDepth(1)
    .setScale(1);

  goalFlag.play("flag_wave");

  // Zona de colisão
  const goalZone = this.add.rectangle(goalX, goalY - 40, 50, 80, 0, 0);
  this.physics.add.existing(goalZone, true);
  goalZone.body.setSize(50, 80);
  goalZone.body.updateFromGameObject();
  goalZone.body.isSensor = true;

  // Player: origem (0.5, 1) = pés no (x,y); 
  let collected = false;
  const PLAYER_SCALE = 1;
  const spawnX = levelData.spawnRight ? 1750 : 120;
  player = new Player(this, spawnX, groundY, PLAYER_SCALE);
  player.setDepth(100);
  this.physics.add.collider(player, [...groundBodies, ...platforms]);
  this.physics.add.overlap(player, collectible, (p, c) => {
    c.destroy();
    collected = true;
  });
  this.physics.add.overlap(player, goalZone, () => {
    if (this.victoryTriggered || this.gameOverTriggered) return;
    if (collected) {
      this.victoryTriggered = true;
      this.physics.pause();
      showVictoryPopup(this, this.level);
    } else {
      const msg = this.add.text(goalX, goalY - 60, "Pegue a moeda primeiro!", {
        fontSize: 24, color: "#ffaa00"
      }).setOrigin(0.5).setDepth(100);
      this.time.delayedCall(1500, () => msg.destroy());
    }
  });

  cursors = this.input.keyboard.createCursorKeys();
  this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

  // UI de vidas 
  this.livesText = this.add.text(24, 24, "Vidas: " + this.lives, {
    fontSize: 28, color: "#ffffff"
  }).setDepth(500).setScrollFactor(0);

  // ================= ESPINHOS (FASE 2) =================
  this.spikes = this.physics.add.staticGroup();

  if (this.level === 2) {

    for (let i = 0; i < 6; i++) {

      const spike = this.spikes.create(
        1300 + i * 64,
        groundY - 8,
        "spikes"
      );

      spike.setOrigin(0.5, 0.5);   // base do espinho no chão
      spike.refreshBody();

      spike.body.setSize(60, 12);
      spike.body.setOffset(2, 4);
    }
  }


  // ================= SLIMES (FASE 2) =================
  this.enemies = this.physics.add.group();


  if (this.level === 2) {

    const createSlime = (x, y) => {

      const slime = this.physics.add.sprite(x, y, "slime_idle");

      slime.setCollideWorldBounds(false);
      slime.play("slime_idle_anim");
      slime.setSize(50, 38);
      slime.setOffset(15, 0);

      slime.isAttacking = false;

      this.enemies.add(slime);
    };

    this.physics.add.collider(this.enemies, [...groundBodies, ...platforms]);


    createSlime(1200, groundY - 48);
    createSlime(580, groundY - 348);
  }


  this.physics.add.overlap(player, this.spikes, () => {
    killPlayer(this);
  });

  this.physics.add.overlap(player, this.enemies, () => {
    killPlayer(this);
  });

  // ===== CAMERA =====
  this.cameras.main.startFollow(player, true, 0.08, 0.08);
  this.cameras.main.setDeadzone(120, 80);
  this.cameras.main.setBounds(0, 0, config.width, config.height);

  // // ================= BOTÃO DEV - IR PARA FASE 2 =================
  // const devButton = this.add.rectangle(1700, 40, 160, 40, 0x8e44ad)
  //   .setScrollFactor(0)
  //   .setDepth(1000)
  //   .setInteractive({ useHandCursor: true });

  // this.add.text(1700, 40, "DEV: Fase 2", {
  //   fontSize: 18,
  //   color: "#ffffff"
  // })
  //   .setOrigin(0.5)
  //   .setScrollFactor(0)
  //   .setDepth(1001);

  // devButton.on("pointerover", () => devButton.setFillStyle(0xa569bd));
  // devButton.on("pointerout", () => devButton.setFillStyle(0x8e44ad));

  // devButton.on("pointerdown", () => {
  //   this.scene.restart({
  //     level: 2,
  //     lives: 3
  //   });
  // });


}

// ================= UPDATE =================
function update(time, delta) {
  if (this.victoryTriggered || this.gameOverTriggered) return;

  // Reset da fase com R 
  if (Phaser.Input.Keyboard.JustDown(this.keyR)) {
    this.scene.restart({ level: this.level, lives: 3 });
    return;
  }

  // Morte: caiu fora do mapa 
  if (!this.deathTriggered && player.y > config.height + 150) {
    this.deathTriggered = true;
    this.lives--;
    this.livesText.setText("Vidas: " + this.lives);
    if (this.lives <= 0) {
      this.gameOverTriggered = true;
      this.physics.pause();
      showGameOverPopup(this);
    } else {
      this.scene.restart({ level: this.level, lives: this.lives });
    }
    return;
  }

  // ===== SLIME AI =====
  this.enemies.children.iterate((slime) => {
    if (!slime) return;

    const distance = Phaser.Math.Distance.Between(
      slime.x,
      slime.y,
      player.x,
      player.y
    );

    if (distance < 150 && !slime.isAttacking) {
      slime.isAttacking = true;
      slime.play("slime_attack_anim");

      slime.once("animationcomplete", () => {
        slime.isAttacking = false;
        slime.play("slime_idle_anim");
      });
    }
  });


  player.update(cursors, delta);
  player.x = Phaser.Math.Clamp(player.x, 0, config.width);
}

// ================= PLAYER CLASS =================
// Frame 128x128, origem (0.5, 1) = pés. Body 40x80: offset (44, 0) alinha o body ao sprite (top-left do body = canto do frame + offset).
const PLAYER_BODY_W = 40, PLAYER_BODY_H = 80;
const PLAYER_BODY_OFFSET_X = 44, PLAYER_BODY_OFFSET_Y = 0;

class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, scale = 1) {
    super(scene, x, y, "male_hero-idle");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(scale);
    this.setOrigin(0.5, 1); // (x,y) = pés
    this.setCollideWorldBounds(false);
    this.body.setAllowGravity(true);

    this.body.setSize(PLAYER_BODY_W, PLAYER_BODY_H);
    this.body.setOffset(PLAYER_BODY_OFFSET_X, PLAYER_BODY_OFFSET_Y);
    this.body.updateFromGameObject();

    this.state = PlayerState.IDLE;
    this.facing = 1;

    this.runSpeed = 260;
    this.jumpForce = 500;

    // ===== COYOTE + BUFFER =====
    this.coyoteTime = 120;
    this.coyoteTimer = 0;

    this.jumpBuffer = 120;
    this.jumpBufferTimer = 0;

    this.play("idle");
  }

  setState(state) {
    if (this.state === state) return;
    this.state = state;

    switch (state) {
      case PlayerState.IDLE: this.play("idle"); break;
      case PlayerState.RUN: this.play("run"); break;

      case PlayerState.RUN_TURN:
        this.play("run_turn");
        this.once("animationcomplete", () => this.setState(PlayerState.RUN));
        break;

      case PlayerState.RUN_TO_IDLE:
        this.play("run_to_idle");
        this.once("animationcomplete", () => this.setState(PlayerState.IDLE));
        break;

      case PlayerState.JUMP:
        this.play("jump");
        this.setVelocityY(-this.jumpForce);
        break;

      case PlayerState.FALL:
        this.play("fall");
        this.once("animationcomplete", () => this.setState(PlayerState.FALL_LOOP));
        break;

      case PlayerState.FALL_LOOP:
        this.play("fall_loop");
        break;

      case PlayerState.DEATH:
        this.play("death");
        this.setVelocity(0, 0);
        break;
    }
  }

  update(cursors, delta) {
    const onGround = this.body.blocked.down;

    // ===== COYOTE TIMER =====
    if (onGround) this.coyoteTimer = this.coyoteTime;
    else this.coyoteTimer -= delta;

    // ===== JUMP BUFFER =====
    if (Phaser.Input.Keyboard.JustDown(cursors.up)) {
      this.jumpBufferTimer = this.jumpBuffer;
    } else {
      this.jumpBufferTimer -= delta;
    }

    // ===== MOVIMENTO =====
    if (cursors.left.isDown) {
      this.setVelocityX(-this.runSpeed);
      this.setFlipX(true);
      this.facing = -1;
      if (onGround) this.setState(PlayerState.RUN);
    }
    else if (cursors.right.isDown) {
      this.setVelocityX(this.runSpeed);
      this.setFlipX(false);
      this.facing = 1;
      if (onGround) this.setState(PlayerState.RUN);
    }
    else {
      this.setVelocityX(0);
      if (onGround && this.state === PlayerState.RUN) {
        this.setState(PlayerState.RUN_TO_IDLE);
      }
    }

    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      this.setState(PlayerState.JUMP);
    }

    if (!onGround && this.body.velocity.y > 0) {
      if (this.state !== PlayerState.FALL_LOOP) {
        this.setState(PlayerState.FALL);
      }
    }

    if (onGround && this.state === PlayerState.FALL_LOOP) {
      this.setState(PlayerState.IDLE);
    }
  }
}  