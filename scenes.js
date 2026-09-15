/* シーン管理・状態保持・画面描画ロジック */

let currentScene = "title";

// メニュー内のサブタブ ("stage", "shop", "other")
let currentMenuTab = "stage";

// ゲーム進行データ
let unlockedStage = Number(localStorage.getItem("nyanko_unlockedStage")) || 1;
let currentSelectedStage = 1;
let novelPhase = "before"; 

let dialogueIndex = 0; 

// タイプライターエフェクト用変数
let displayedCharCount = 0;  
let typeWriterTimer = 0;     
const TYPEWRITER_SPEED = 2;  

// RUNゲーム関連のステータス・変数
let playerMaxHp = 50;
let playerHp = 50;
let playerAttackPower = 20;

let playerY = 300;         
let playerVy = 0;          
const gravity = 0.8;       
const minJumpPower = -10;  
const maxJumpPower = -22;  
const groundY = 300;       
let isGrounded = true;     

// チャージジャンプ関連変数
let isCharging = false;       
let chargeTimer = 0;          
const MAX_CHARGE_TIME = 120;  

// 背景スクロール用変数
let bgScrollX = 0;
const SCROLL_SPEED = 4;    

// ゲージ・コイン関連
let attackEnergy = 0;      
const maxAttackEnergy = 5; 
let stageCoins = 0;        

// ボス（敵）データ
let bossHp = 100;
let bossMaxHp = 100;

// オブジェクト管理
let flasks = [];    
let items = [];    
let spawnTimer = 0; 

// --------------------------------------------------
// 画像データの読み込み (リポジトリ階層に対応するため image/ 直接指定)
// --------------------------------------------------
const playerRunImages = [];
const TOTAL_RUN_FRAMES = 6;

for (let i = 1; i <= TOTAL_RUN_FRAMES; i++) {
    const img = new Image();
    img.src = `image/gifpucture/nyankonabe_run${i}.png`;
    playerRunImages.push(img);
}

const playerJumpImage = new Image();
playerJumpImage.src = "image/nyankonabe_jump.png";

// ★ 敵の攻撃用画像（危険標識）の読み込み
const bossWeaponImage = new Image();
bossWeaponImage.src = "image/hyousiki_kiken.png";

let playerFrameIndex = 0;
let playerFrameTimer = 0;
const FRAME_SPEED = 6;

// ボスアニメーション＆攻撃管理
let bossIdleImages = [];
let bossAtkImages = []; 
let bossFrameIndex = 0;
let bossFrameTimer = 0;
const BOSS_FRAME_SPEED = 8; 

let isBossAttacking = false;
let bossAtkTimer = 0;        
let bossAtkCooldown = 0;     
const ATK_FRAME_DURATION = 42; 

// 敵の攻撃オブジェクト配列 [{x, y, speed, width, height}]
let bossAttacks = [];

const stageBossConfig = {
    1: {
        idleFolder: "image/singoukianim",
        idlePrefix: "singouki_idle",
        idleFrameCount: 4,
        atkFolder: "image/singoukianim_atk",
        atkPrefix: "singouki_atk",
        atkFrameCount: 2
    },
    2: {
        idleFolder: "image/randoruanim",
        idlePrefix: "randoru_idle",
        idleFrameCount: 4,
        atkFolder: "",
        atkPrefix: "",
        atkFrameCount: 0
    },
    3: {
        idleFolder: "image/seiruanim",
        idlePrefix: "seiru_idle",
        idleFrameCount: 4,
        atkFolder: "",
        atkPrefix: "",
        atkFrameCount: 0
    }
};

function loadBossImages(stageNum) {
    bossIdleImages = [];
    bossAtkImages = [];
    const config = stageBossConfig[stageNum];
    
    if (config) {
        for (let i = 1; i <= config.idleFrameCount; i++) {
            const img = new Image();
            img.src = `${config.idleFolder}/${config.idlePrefix}${i}.png`;
            bossIdleImages.push(img);
        }
        if (config.atkFrameCount > 0) {
            for (let i = 1; i <= config.atkFrameCount; i++) {
                const img = new Image();
                img.src = `${config.atkFolder}/${config.atkPrefix}${i}.png`;
                bossAtkImages.push(img);
            }
        }
    }
}

const charaImages = {
    nyanko: new Image(),
    kyarameru: new Image(),
    singouki: new Image(),
    randoru: new Image(),
    seiru: new Image()
};

charaImages.nyanko.src = "image/chara_nyankonabe.png";
charaImages.kyarameru.src = "image/chara_kyarameru.png";
charaImages.singouki.src = "image/chara_singouki.png";
charaImages.randoru.src = "image/chara_randoru.png";
charaImages.seiru.src = "image/chara_seiru.png";

const stageDialogues = {
    1: {
        before: [
            { name: "にゃんこ鍋", image: "nyanko", text: "はあはあ。" },
            { name: "にゃんこ鍋", image: "nyanko", text: "疲れた。" },
            { name: "にゃんこ鍋", image: "nyanko", text: "って。また赤信号かよ！" },
            { name: "にゃんこ鍋", image: "nyanko", text: "誰も見てないし、渡っちゃおう！" },
            { name: "？？？", image: "singouki", text: "フフフ... 信号無視とは面白い。ここは通さんぞ！" },
            { name: "にゃんこ鍋", image: "nyanko", text: "だ、だれだ！" },
            { name: "？？？", image: "singouki", text: "私は信号機。お前を逮捕する。" },
            { name: "にゃんこ鍋", image: "nyanko", text: "どいて。学校に遅刻しちゃうよー！" },
            { name: "信号機", image: "singouki", text: "素直に連行されてくれれば、ただで済ませてやったのに。" },
            { name: "信号機", image: "singouki", text: "赤信号のように真っ赤に染めてやる！" }
        ],  
        after: [
            { name: "にゃんこ鍋", image: "nyanko", text: "やったにゃ！敵をやっつけたぞ！" },
            { name: "にゃんこ鍋", image: "nyanko", text: "さぁ、鍋を作って食べるにゃ！" }
        ]
    },
    2: {
        before: [
            { name: "にゃんこ鍋", image: "nyanko", text: "学校についたにゃ！" },
            { name: "にゃんこ鍋", image: "nyanko", text: "教室には誰もいない。" },
            { name: "にゃんこ鍋", image: "nyanko", text: "今日は身体計測だった！保健室に向かわないと！" },
            { name: "ランドル", image: "randoru", text: "うふふ、遅刻ですかー？" },
            { name: "にゃんこ鍋", image: "nyanko", text: "保険の先生、登校中に変な奴に絡まれてて..." },
            { name: "ランドル", image: "randoru", text: "言い訳はいいですわ。まずは謝罪じゃないのですか？" },
            { name: "ランドル", image: "randoru", text: "まあ、そんなことはいいですわ。" },
            { name: "にゃんこ鍋", image: "nyanko", text: "私わるくないもん！" },
            { name: "ランドル", image: "randoru", text: "悪い子は罰を受けるものだわ。" },
            { name: "ランドル", image: "randoru", text: "目を抉り取って差し上げますわ！" }
        ],
        after: [
            { name: "にゃんこ鍋", image: "nyanko", text: "保険の先生のくせに、何怪我させようとしてるの！" },
            { name: "にゃんこ鍋", image: "nyanko", text: "職務放棄野郎！" },
            { name: "ランドル", image: "randoru", text: "...あなたは本当に悪い子ですね。" }
        ]
    },
    3: {
        before: [
            { name: "にゃんこ鍋", image: "nyanko", text: "学校についたにゃ！" },
            { name: "にゃんこ鍋", image: "nyanko", text: "教室には誰もいない。" },
            { name: "にゃんこ鍋", image: "nyanko", text: "今日は身体計測だった！保健室に向かわないと！" },
            { name: "青瑠", image: "seiru", text: "うふふ、遅刻ですかー？" },
            { name: "にゃんこ鍋", image: "nyanko", text: "保険の先生、登校中に変な奴に絡まれてて..." },
            { name: "青瑠", image: "seiru", text: "言い訳はいいですわ。まずは謝罪じゃないのですか？" },
            { name: "青瑠", image: "seiru", text: "まあ、そんなことはいいですわ。" },
            { name: "にゃんこ鍋", image: "nyanko", text: "私わるくないもん！" },
            { name: "青瑠", image: "seiru", text: "悪い子は罰を受けるものだわ。" },
            { name: "青瑠", image: "seiru", text: "目を抉り取って差し上げますわ！" }
        ],
        after: [
            { name: "にゃんこ鍋", image: "nyanko", text: "保険の先生のくせに、何怪我させようとしてるの！" },
            { name: "にゃんこ鍋", image: "nyanko", text: "職務放棄野郎！" },
            { name: "青瑠", image: "seiru", text: "...あなたは本当に悪い子ですね。" }
        ]
    }
};

let resetStep = 1;

const bgImage = new Image();
bgImage.src = "image/bg_title.png";

export function getCurrentScene() {
    return currentScene;
}

export function setCurrentScene(sceneName) {
    currentScene = sceneName;
    updateUIElements();
}

function drawCoverImage(ctx, canvas, img) {
    const canvasRatio = canvas.width / canvas.height;
    const imgRatio = img.width / img.height;

    let sx, sy, sWidth, sHeight;

    if (imgRatio > canvasRatio) {
        sHeight = img.height;
        sWidth = img.height * canvasRatio;
        sx = (img.width - sWidth) / 2;
        sy = 0;
    } else {
        sWidth = img.width;
        sHeight = img.width / canvasRatio;
        sx = 0;
        sy = (img.height - sHeight) / 2;
    }

    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
}

// --------------------------------------------------
// 各シーンの描画関数
// --------------------------------------------------

export function drawTitleScene(ctx, canvas) {
    if (bgImage.complete && bgImage.naturalWidth !== 0) {
        drawCoverImage(ctx, canvas, bgImage);
    } else {
        ctx.fillStyle = "#222";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px sans-serif";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 10;
    ctx.fillText("にゃんこ鍋", canvas.width / 2, 220);
    ctx.shadowBlur = 0;
}

export function drawMenuScene(ctx, canvas) {
    ctx.fillStyle = "#2c3e50";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "center";
    
    if (currentMenuTab === "stage") {
        ctx.fillText("【 ステージ選択 】", canvas.width / 2, 100);
        ctx.font = "16px sans-serif";
        ctx.fillText(`解禁中: ステージ 1 ～ ${unlockedStage}`, canvas.width / 2, 130);
    } else if (currentMenuTab === "shop") {
        ctx.fillText("【 ショップ 】", canvas.width / 2, 100);
    } else if (currentMenuTab === "other") {
        ctx.fillText("【 その他 / 設定 】", canvas.width / 2, 100);
    }
}

export function drawNovelScene(ctx, canvas) {
    ctx.fillStyle = "#1a252f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const currentList = stageDialogues[currentSelectedStage]?.[novelPhase] || [];
    const currentData = currentList[dialogueIndex] || {
        name: "???",
        image: null,
        text: "……"
    };

    const fullText = currentData.text || "";
    if (displayedCharCount < fullText.length) {
        typeWriterTimer++;
        if (typeWriterTimer >= TYPEWRITER_SPEED) {
            typeWriterTimer = 0;
            displayedCharCount++;
        }
    }

    const textToDraw = fullText.slice(0, displayedCharCount);

    const windowPadding = 15;
    const windowX = windowPadding;
    const windowY = canvas.height - 220;
    const windowWidth = canvas.width - (windowPadding * 2);
    const windowHeight = 200;

    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(windowX, windowY, windowWidth, windowHeight);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(windowX, windowY, windowWidth, windowHeight);

    const charaAreaWidth = 140;
    const maxCharaWidth = 150;
    const maxCharaHeight = 120;
    const areaCenterX = windowX + charaAreaWidth / 2;
    const areaCenterY = windowY + 15 + maxCharaHeight / 2;

    const activeCharaImage = charaImages[currentData.image];

    if (activeCharaImage && activeCharaImage.complete && activeCharaImage.naturalWidth !== 0) {
        const imgW = activeCharaImage.naturalWidth;
        const imgH = activeCharaImage.naturalHeight;
        const scale = Math.min(maxCharaWidth / imgW, maxCharaHeight / imgH);

        const drawW = imgW * scale;
        const drawH = imgH * scale;

        const drawX = areaCenterX - drawW / 2;
        const drawY = areaCenterY - drawH / 2;

        ctx.drawImage(activeCharaImage, drawX, drawY, drawW, drawH);
    } else {
        const dummyX = areaCenterX - maxCharaWidth / 2;
        const dummyY = areaCenterY - maxCharaHeight / 2;
        ctx.fillStyle = "#34495e";
        ctx.fillRect(dummyX, dummyY, maxCharaWidth, maxCharaHeight);
        ctx.fillStyle = "#7f8c8d";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("CHARA", areaCenterX, areaCenterY);
    }

    ctx.fillStyle = "#ffeaa7";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(currentData.name, areaCenterX, windowY + 15 + maxCharaHeight + 25);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(windowX + charaAreaWidth, windowY + 10);
    ctx.lineTo(windowX + charaAreaWidth, windowY + windowHeight - 10);
    ctx.stroke();

    const textAreaX = windowX + charaAreaWidth + 15;
    const textAreaY = windowY + 30;
    const maxTextWidth = windowWidth - charaAreaWidth - 30;
    const lineHeight = 24;

    ctx.fillStyle = "#ffffff";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "left";

    drawAutoWrapText(ctx, textToDraw, textAreaX, textAreaY, maxTextWidth, lineHeight);

    ctx.fillStyle = "#888888";
    ctx.font = "13px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("▼ タップして次へ", windowX + windowWidth - 15, windowY + windowHeight - 15);
}

function drawAutoWrapText(ctx, text, x, y, maxWidth, lineHeight) {
    let currentY = y;
    let line = "";

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const testLine = line + char;
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && line !== "") {
            ctx.fillText(line, x, currentY);
            line = char;
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, currentY);
}

// RUNゲーム画面
export function drawRunGameScene(ctx, canvas) {
    const windowPadding = 15;
    const windowX = windowPadding;
    const windowY = canvas.height - 220;
    const windowWidth = canvas.width - (windowPadding * 2);
    const windowHeight = 200;

    const groundY = windowY - 60;
    const playerX = 60; 

    if (isCharging && isGrounded) {
        chargeTimer++;
        if (chargeTimer > MAX_CHARGE_TIME) {
            chargeTimer = MAX_CHARGE_TIME; 
        }
    }

    playerVy += gravity;
    playerY += playerVy;
    if (playerY >= groundY) {
        playerY = groundY;
        playerVy = 0;
        isGrounded = true;
    }

    if (isGrounded) {
        playerFrameTimer++;
        if (playerFrameTimer >= FRAME_SPEED) {
            playerFrameTimer = 0;
            playerFrameIndex = (playerFrameIndex + 1) % playerRunImages.length;
        }
    }

    // ボスアニメーションフレーム更新
    if (bossIdleImages.length > 0) {
        bossFrameTimer++;
        if (bossFrameTimer >= BOSS_FRAME_SPEED) {
            bossFrameTimer = 0;
            bossFrameIndex = (bossFrameIndex + 1) % bossIdleImages.length;
        }
    }

    // --------------------------------------------------
    // 敵（ボス）の攻撃 AI・アニメーション更新
    // --------------------------------------------------
    if (!isBossAttacking) {
        bossAtkCooldown--;
        if (bossAtkCooldown <= 0 && bossAtkImages.length >= 2) {
            isBossAttacking = true;
            bossAtkTimer = 0;
            bossAtkCooldown = 300; // クールダウン（約5秒）

            const heights = [70, 120, 30];
            const randomHeight = heights[Math.floor(Math.random() * heights.length)];

            bossAttacks.push({
                x: canvas.width + 50,
                y: groundY - randomHeight,
                speed: 7,
                width: 120,
                height: 180
            });
        }
    } else {
        bossAtkTimer++;
        if (bossAtkTimer >= ATK_FRAME_DURATION * 2) {
            isBossAttacking = false; 
            bossAtkTimer = 0;
        }
    }

    // --------------------------------------------------
    // 敵の攻撃オブジェクト（危険標識）の移動・判定処理
    // --------------------------------------------------
    const playerHitSize = 30;

    for (let i = bossAttacks.length - 1; i >= 0; i--) {
        const atk = bossAttacks[i];
        atk.x -= atk.speed; 

        // 当たり判定
        if (Math.abs(atk.x - playerX) < playerHitSize && Math.abs(atk.y - (playerY - 20)) < playerHitSize) {
            playerHp -= 10; 
            if (playerHp < 0) playerHp = 0;
            bossAttacks.splice(i, 1);
            continue;
        }

        if (atk.x < -50) {
            bossAttacks.splice(i, 1);
        }
    }

    // アイテム生成
    spawnTimer++;
    if (spawnTimer > 90) {
        spawnTimer = 0;
        const itemType = Math.random() < 0.6 ? "energy" : "coin";
        items.push({
            x: canvas.width + 20,
            y: groundY - 30 - Math.random() * 50,
            type: itemType
        });
    }

    const playerSize = 40;

    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.x -= SCROLL_SPEED;

        if (Math.abs(item.x - playerX) < playerSize && Math.abs(item.y - (playerY - 40)) < playerSize) {
            if (item.type === "energy") {
                if (attackEnergy < maxAttackEnergy) attackEnergy++;
                
                if (attackEnergy >= maxAttackEnergy) {
                    attackEnergy = 0;
                    flasks.push({
                        x: playerX + 20,
                        y: playerY - 60,
                        speed: 8
                    });
                }
            } else if (item.type === "coin") {
                stageCoins++;
            }
            items.splice(i, 1);
            continue;
        }

        if (item.x < -20) items.splice(i, 1);
    }

    const bossX = canvas.width - 50; 
    const bossY = groundY; 

    const bossDrawWidth = 180;
    const bossDrawHeight = 180;

    const bossHitWidth = 60; 
    const bossHitHeight = 120;

    // フラスコ更新・当たり判定
    for (let i = flasks.length - 1; i >= 0; i--) {
        const flask = flasks[i];
        flask.x += flask.speed;

        if (Math.abs(flask.x - bossX) < bossHitWidth / 2 && Math.abs(flask.y - (bossY - 80)) < bossHitHeight / 2) {
            bossHp -= playerAttackPower;
            flasks.splice(i, 1);

            if (bossHp <= 0) {
                bossHp = 0;
                completeRunGame();
            }
            continue;
        }

        if (flask.x > canvas.width + 20) flasks.splice(i, 1);
    }

    // 背景描画
    bgScrollX = (bgScrollX - SCROLL_SPEED) % canvas.width;

    ctx.fillStyle = "#87ceeb";
    ctx.fillRect(0, 0, canvas.width, groundY);

    ctx.fillStyle = "#388e3c";
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

    ctx.strokeStyle = "#2e7d32";
    ctx.lineWidth = 4;
    const stripeSpacing = 80;

    for (let x = bgScrollX; x < canvas.width; x += stripeSpacing) {
        if (x >= -40) {
            ctx.beginPath();
            ctx.moveTo(x, groundY);
            ctx.lineTo(x - 20, canvas.height);
            ctx.stroke();
        }
    }

    // プレイヤー描画
    const playerDrawWidth = 120;
    const playerDrawHeight = 120;
    const drawX = playerX - (playerDrawWidth / 2);
    const drawY = playerY - playerDrawHeight + 10; 

    let currentImg;
    if (isGrounded) {
        currentImg = playerRunImages[playerFrameIndex];
    } else {
        currentImg = playerJumpImage;
    }

    if (currentImg && currentImg.complete && currentImg.naturalWidth !== 0) {
        ctx.drawImage(currentImg, drawX, drawY, playerDrawWidth, playerDrawHeight);
    } else {
        ctx.fillStyle = "#ffeb3b";
        ctx.fillRect(drawX, drawY, playerDrawWidth, playerDrawHeight);
    }

    // チャージメーター描画
    if (isCharging && isGrounded) {
        const meterWidth = 60;
        const meterHeight = 8;
        const meterX = playerX - meterWidth / 2;
        const meterY = drawY - 15; 

        const chargeRatio = chargeTimer / MAX_CHARGE_TIME;

        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(meterX - 2, meterY - 2, meterWidth + 4, meterHeight + 4);

        ctx.fillStyle = chargeRatio >= 1.0 ? "#ff5722" : "#ffeb3b";
        ctx.fillRect(meterX, meterY, meterWidth * chargeRatio, meterHeight);
    }

    // --------------------------------------------------
    // ボス描画
    // --------------------------------------------------
    const bossDrawX = bossX - (bossDrawWidth / 2);
    const bossDrawY = groundY - bossDrawHeight + 10;

    let currentBossImg = null;

    if (isBossAttacking && bossAtkImages.length >= 2) {
        if (bossAtkTimer < ATK_FRAME_DURATION) {
            currentBossImg = bossAtkImages[0];
        } else {
            currentBossImg = bossAtkImages[1];
        }
    } else if (bossIdleImages.length > 0) {
        const safeIndex = bossFrameIndex % bossIdleImages.length;
        currentBossImg = bossIdleImages[safeIndex];
    }

    if (currentBossImg && currentBossImg.complete && currentBossImg.naturalWidth !== 0) {
        ctx.drawImage(currentBossImg, bossDrawX, bossDrawY, bossDrawWidth, bossDrawHeight);
    } else {
        ctx.fillStyle = "#e74c3c";
        ctx.fillRect(bossX - 45, groundY - 90, 90, 90);
    }

    // --------------------------------------------------
    // 敵の攻撃（危険標識：左に90度回転描画）
    // --------------------------------------------------
    bossAttacks.forEach(atk => {
        if (bossWeaponImage.complete && bossWeaponImage.naturalWidth !== 0) {
            ctx.save();
            ctx.translate(atk.x, atk.y);
            ctx.rotate(-Math.PI / 2);
            ctx.drawImage(
                bossWeaponImage,
                -atk.width / 2,
                -atk.height / 2,
                atk.width,
                atk.height
            );
            ctx.restore();
        } else {
            ctx.fillStyle = "#ff0055";
            ctx.beginPath();
            ctx.arc(atk.x, atk.y, 15, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // ボスHPバー
    const hpBarWidth = 90;
    const hpBarY = bossDrawY + 15;
    ctx.fillStyle = "#000";
    ctx.fillRect(bossX - (hpBarWidth / 2), hpBarY, hpBarWidth, 8);
    ctx.fillStyle = "#2ecc71";
    ctx.fillRect(bossX - (hpBarWidth / 2), hpBarY, (bossHp / bossMaxHp) * hpBarWidth, 8);

    // アイテム描画
    items.forEach(item => {
        if (item.type === "energy") {
            ctx.fillStyle = "#00bcd4";
            ctx.beginPath();
            ctx.moveTo(item.x, item.y - 10);
            ctx.lineTo(item.x + 8, item.y);
            ctx.lineTo(item.x, item.y + 10);
            ctx.lineTo(item.x - 8, item.y);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillStyle = "#ffc107";
            ctx.beginPath();
            ctx.arc(item.x, item.y, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // フラスコ描画
    ctx.fillStyle = "#9c27b0";
    flasks.forEach(flask => {
        ctx.beginPath();
        ctx.arc(flask.x, flask.y, 6, 0, Math.PI * 2);
        ctx.fill();
    });

    // UIウィンドウ枠
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(windowX, windowY, windowWidth, windowHeight);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(windowX, windowY, windowWidth, windowHeight);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "left";

    const textX = windowX + 25;
    ctx.fillText(`HP: ${playerHp} / ${playerMaxHp}`, textX, windowY + 55);
    ctx.fillText(`攻撃可能: ${attackEnergy} / ${maxAttackEnergy}`, textX, windowY + 95);
    ctx.fillText(`COIN: ${stageCoins}`, textX, windowY + 135);
}

// --------------------------------------------------
// イベント・進行制御ロジック
// --------------------------------------------------
export function selectStage(stageNum) {
    if (stageNum > unlockedStage) return;

    currentSelectedStage = stageNum;
    novelPhase = "before";
    dialogueIndex = 0;
    
    displayedCharCount = 0;
    typeWriterTimer = 0;

    bgScrollX = 0;

    playerHp = playerMaxHp;
    bossHp = 100;
    bossMaxHp = 100;
    attackEnergy = 0;
    flasks = [];
    items = [];
    bossAttacks = []; 
    playerY = groundY;
    playerVy = 0;
    playerFrameIndex = 0;
    playerFrameTimer = 0;

    bossFrameIndex = 0;
    bossFrameTimer = 0;
    isBossAttacking = false;
    bossAtkTimer = 0;
    bossAtkCooldown = 180; 
    loadBossImages(stageNum);

    setCurrentScene("novel");
}

export function advanceNovel() {
    const currentList = stageDialogues[currentSelectedStage]?.[novelPhase] || [];
    const currentData = currentList[dialogueIndex];
    const fullText = currentData ? currentData.text : "";

    if (displayedCharCount < fullText.length) {
        displayedCharCount = fullText.length;
        return;
    }

    if (dialogueIndex < currentList.length - 1) {
        dialogueIndex++;
        displayedCharCount = 0;
        typeWriterTimer = 0;
    } else {
        if (novelPhase === "before") {
            setCurrentScene("run");
        } else {
            if (currentSelectedStage === unlockedStage) {
                unlockedStage++;
                localStorage.setItem("nyanko_unlockedStage", unlockedStage);
            }
            setCurrentScene("menu");
        }
    }
}

export function completeRunGame() {
    novelPhase = "after";
    dialogueIndex = 0;
    displayedCharCount = 0;
    typeWriterTimer = 0;
    setCurrentScene("novel");
}

export function showResetDialog() {
    resetStep = 1;
    const overlay = document.getElementById("dialogOverlay");
    const msg = document.getElementById("dialogMessage");
    if (overlay && msg) {
        msg.textContent = "初期化しますか？";
        overlay.style.display = "flex";
    }
}

export function closeResetDialog() {
    const overlay = document.getElementById("dialogOverlay");
    if (overlay) {
        overlay.style.display = "none";
    }
}

function updateUIElements() {
    const startBtn = document.getElementById("startBtn");
    const resetBtn = document.getElementById("resetBtn");
    const menuUI = document.getElementById("menuUI");

    if (startBtn) {
        startBtn.style.display = currentScene === "title" ? "block" : "none";
    }
    if (resetBtn) {
        resetBtn.style.display = currentScene === "title" ? "block" : "none";
    }
    if (menuUI) {
        menuUI.style.display = currentScene === "menu" ? "flex" : "none";

        if (currentScene === "menu") {
            document.querySelectorAll(".stage-btn").forEach(btn => {
                const stageNum = Number(btn.dataset.stage);
                if (stageNum > unlockedStage) {
                    btn.disabled = true;
                    btn.textContent = `ステージ ${stageNum} 🔒`;
                } else {
                    btn.disabled = false;
                    btn.textContent = `ステージ ${stageNum}`;
                }
            });
        }
    }
}

export function setupGameEvents(canvas) {
    const startBtn = document.getElementById("startBtn");
    if (startBtn) {
        startBtn.addEventListener("click", () => {
            setCurrentScene("menu");
        });
    }

    const resetBtn = document.getElementById("resetBtn");
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            showResetDialog();
        });
    }

    const dialogYesBtn = document.getElementById("dialogYesBtn");
    if (dialogYesBtn) {
        dialogYesBtn.addEventListener("click", () => {
            if (resetStep === 1) {
                resetStep = 2;
                const msg = document.getElementById("dialogMessage");
                if (msg) msg.textContent = "本当に初期化しますか？";
            } else if (resetStep === 2) {
                localStorage.removeItem("nyanko_unlockedStage");
                unlockedStage = 1;
                currentSelectedStage = 1;
                closeResetDialog();
                setCurrentScene("title");
            }
        });
    }

    const dialogNoBtn = document.getElementById("dialogNoBtn");
    if (dialogNoBtn) {
        dialogNoBtn.addEventListener("click", () => {
            closeResetDialog();
            setCurrentScene("title");
        });
    }

    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            currentMenuTab = e.target.dataset.tab;
        });
    });

    document.querySelectorAll(".stage-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const stageNum = Number(e.target.dataset.stage);
            selectStage(stageNum);
        });
    });

    const handlePressStart = (e) => {
        if (currentScene === "novel") {
            advanceNovel();
        } else if (currentScene === "run") {
            if (attackEnergy >= maxAttackEnergy) {
                attackEnergy = 0;
                flasks.push({
                    x: 60 + 20,
                    y: playerY - 60,
                    speed: 8
                });
            }

            if (isGrounded) {
                isCharging = true;
                chargeTimer = 0;
            }
        }
    };

    const handlePressEnd = (e) => {
        if (currentScene === "run" && isCharging && isGrounded) {
            const rate = chargeTimer / MAX_CHARGE_TIME;
            playerVy = minJumpPower + (maxJumpPower - minJumpPower) * rate;

            isGrounded = false;
            isCharging = false;
            chargeTimer = 0;
        }
    };

    canvas.addEventListener("mousedown", handlePressStart);
    canvas.addEventListener("mouseup", handlePressEnd);

    canvas.addEventListener("touchstart", (e) => {
        e.preventDefault(); 
        handlePressStart(e);
    }, { passive: false });

    canvas.addEventListener("touchend", (e) => {
        e.preventDefault();
        handlePressEnd(e);
    }, { passive: false });
}

// --------------------------------------------------
// メインループの定義および実行開始処理
// --------------------------------------------------
export function startLoop(canvas) {
    const ctx = canvas.getContext("2d");

    function loop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        switch (currentScene) {
            case "title":
                drawTitleScene(ctx, canvas);
                break;
            case "menu":
                drawMenuScene(ctx, canvas);
                break;
            case "novel":
                drawNovelScene(ctx, canvas);
                break;
            case "run":
                drawRunGameScene(ctx, canvas);
                break;
        }

        requestAnimationFrame(loop);
    }

    loop();
}