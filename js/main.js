/* js/main.js */

import { initScreenProtection, setupFullscreenButton } from "./screen.js";
import { 
    getCurrentScene, 
    setupGameEvents, 
    drawTitleScene, 
    drawMenuScene, 
    drawNovelScene, 
    drawRunGameScene  // ← ここを drawGameScene から drawRunGameScene に修正
} from "./scenes.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// 初期化
initScreenProtection();
setupFullscreenButton("fullscreenBtn");
setupGameEvents(canvas);

// メイン描画ループ
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scene = getCurrentScene();

    if (scene === "title") {
        drawTitleScene(ctx, canvas);
    } else if (scene === "menu") {
        drawMenuScene(ctx, canvas);
    } else if (scene === "novel") {
        drawNovelScene(ctx, canvas);
    } else if (scene === "run") {
        drawRunGameScene(ctx, canvas); // ← ここも drawRunGameScene に修正
    }

    requestAnimationFrame(draw);
}

// 実行開始
draw();