/* 画面サイズ調整・スクロール防止・フルスクリーン処理 */

// 画面操作の無効化（スクロール・キー入力の防止）
export function initScreenProtection() {
    window.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });
    window.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
    window.addEventListener("keydown", (e) => {
        const keysToBlock = [
            "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
            " ", "PageUp", "PageDown"
        ];
        if (keysToBlock.includes(e.key)) {
            e.preventDefault();
        }
    });
}

// フルスクリーン化のセットアップ
export function setupFullscreenButton(buttonId) {
    const fullscreenBtn = document.getElementById(buttonId);
    if (!fullscreenBtn) return;

    fullscreenBtn.addEventListener("click", () => {
        const docEl = document.documentElement;
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            if (docEl.requestFullscreen) {
                docEl.requestFullscreen();
            } else if (docEl.webkitRequestFullscreen) {
                docEl.webkitRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    });
}