var canvas, g;
var entities;
var nextSpawn, entityLapse, score;
var frameCount, scene;
var isSEPlayed, eatSE;

const Scenes = {
	GamePrepare: "GamePrepare",
	GameMain: "Gamemain",
	GameClear: "GameClear"
};

/* Webページ読み込み時の処理 */
onload = function() {
	canvas = document.getElementById("gamecanvas");
	g = canvas.getContext("2d");
	document.addEventListener('mousedown', handleMouseDown);

	init();
	setInterval("gameloop()", 20);
};

/* ステージの初期化処理 */
function init() {
	scene = Scenes.GamePrepare;
	frameCount = 0;
	entityLapse = 80;
	// 次にentityが出現するフレーム
	nextSpawn = 0;
	// そのフレームで効果音が再生されたことがあるか
	isSEPlayed = false;
	score = 0;
	entities = [];
	clickCoords = [];
}

/* ---- o ---- o ---- o ---- o ---- o ---- o ---- o ---- o
❁ Player Control
	- handleMouseDown(event)  クリックされたときの処理
o ---- o ---- o ---- o ---- o ---- o ---- o ---- o ---- */

function handleMouseDown(event) {
	if (scene == Scenes.GamePrepare) {
		scene = Scenes.GameMain;
	} else if (scene == Scenes.GameMain) {
		rect = event.target.getBoundingClientRect();
		clickX = event.clientX - rect.left;
		clickY = event.clientY - rect.top;
		clickCoords.push([clickX,clickY]);
	} else if (scene == Scenes.GameClear) {
		init();
	}
}

/* ---- o ---- o ---- o ---- o ---- o ---- o ---- o ---- o
❁ Main
	- gameloop()  1秒に50回ループ
	- update()  数値計算やオブジェクト管理など
	- draw()  描画処理
o ---- o ---- o ---- o ---- o ---- o ---- o ---- o ---- */

function gameloop() {
	update();
	draw();
}

function update() {
	if (scene == Scenes.GameMain) {
		// 経過時間が長いほどエンティティのスポーン周期を早くする
		if (frameCount == nextSpawn) {
			// エンティティをスポーンさせる
			rareSpawnRate = 0.1;
			type = Math.random() < 0.1 ? 2 : 1;
			color = type == 1 ? "#fd7e00" : "#ffd900";
			entity = new Entity(frameCount,type,24 + Math.round(16*Math.random()),color);
			entities.push(entity);
			// 次のエンティティスポーン時間を設定する
			nextSpawn += Math.ceil(96 / (2 ** Math.floor((frameCount+1)/500)));
		}

		// クリックしたエンティティを消去する
		clickCoords.forEach((cc) => {
			entities.forEach((entity) => {
				if (hitCheck(cc[0],cc[1],entity)) {
					entity.is_lapse = true;
				}
			});
		});

		entities.forEach((entity) => {
			if (entity.is_lapse) {
				score += entity.score;
				if (!isSEPlayed) {
					isSEPlayed = true;
					se = new Audio("se/pakultu.mp3");
					se.volume = 0.7;
					se.play();
				}
			}
		});

		entities = entities.filter((entity) => (!entity.is_lapse));

		// 時間切れのエンティティを消去する
		entities = entities.filter((entity) => (entity.spawnTime + entityLapse > frameCount));
		isSEPlayed = false;
		clickCoords = [];
		frameCount++;

		if (frameCount >= 2000) {
			scene = Scenes.GameClear;
		}
	}
}

function draw() {
	g.imageSmoothingEnabled = true;
	// 背景を描画
	drawBackground(g);

	// エンティティを描画
	if (scene == Scenes.GameMain) {
		entities.forEach((entity) => {
			entity.drawBackCircle(g);
			entity.drawSprite(g);
		});
	}

	// スコアを描画
	g.fillStyle = "#000000";
	g.font = "16pt Arial";
	g.globalAlpha = 1;
	var scoreLabel = "スコア : " + score;
	var scoreLabelWidth = g.measureText(scoreLabel).width;
	g.fillText(scoreLabel, 620 - scoreLabelWidth, 40);

	// 経過時間を描画
	g.fillStyle = "#000000";
	g.font = "16pt Arial";
	g.globalAlpha = 1;
	var timeLabel = "残り : " + Math.floor((40 - frameCount/50)) + " 秒";
	g.fillText(timeLabel, 20, 40);
}

/* ---- o ---- o ---- o ---- o ---- o ---- o ---- o ---- o
❁ functions
	- hitCheck(obj)
	- drawBackground()  背景を描画する
o ---- o ---- o ---- o ---- o ---- o ---- o ---- o ---- */
function hitCheck(mouseX,mouseY,obj) {
	dx = mouseX - obj.posx;
	dy = mouseY - obj.posy;
	if (dx*dx + dy*dy < obj.r * obj.r) {
		return true;
	}
	return false;
}

function drawBackground(g) {
	g.fillStyle = "#fff";
	g.fillRect(0,0,640,480);
}

/* ---- o ---- o ---- o ---- o ---- o ---- o ---- o ---- o
❁ classes
	- Sprite  基本的なオブジェクトのクラス
	- Entity  
o ---- o ---- o ---- o ---- o ---- o ---- o ---- o ---- */

class Sprite {
	constructor(r,color,spawnTime) {
		this.r = r;
		this.posx = Math.random() * (640-r*2);
		this.posy = Math.random() * (480-r*2);
		this.color = color;
		this.spawnTime = spawnTime;
		this.is_lapse = false;
	}

	drawBackCircle(g) {
		g.globalAlpha = 1 - (frameCount - this.spawnTime) / entityLapse;
		g.beginPath();
		g.arc(this.posx, this.posy, this.r, 0, Math.PI * 2);
		g.fillStyle = this.color;
		g.fill();
	}

	drawSprite(g) {
		g.globalAlpha = 1 - (frameCount - this.spawnTime) / entityLapse;
		var dWidth = this.r * 4/3;
		var dHeight = dWidth * this.image.height / this.image.width;
		g.drawImage(this.image, this.posx-dWidth/2, this.posy-dHeight/2, dWidth, dHeight)
	}
}

class Entity extends Sprite {
	constructor(spawnTime,type,r,color) {
		super(r,color,spawnTime);
		this.type = type;
		this.score = this.type == 1 ? 1 : 5;
		this.image = new Image();
		this.image.src = this.type == 1 ? "img/ebi.png" : "img/maguro.png";
	}
}