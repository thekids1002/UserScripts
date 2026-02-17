// ==UserScript==
// @name         Popup Blocker - Fluid Physics UX
// @namespace    blocker.fluid
// @version      18.0.0
// @description  UI Glassmorphism, Vật lý ném/kéo như thẻ bài, UX cao cấp
// @author       Gemini
// @match        *://*/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = {
        duration: 4.5,        // Thời gian hiển thị lâu hơn chút để kịp nhìn
        zIndex: 2147483647
    };

    let currentToast = null;
    const originalOpen = window.open.bind(window);

    class Toast {
        static show(url) {
            if (currentToast) currentToast.close();

            const isMobile = window.innerWidth <= 600;
            const domain = safeDomain(url);
            const box = document.createElement('div');
            
            // UI Style: Premium Glass Pill
            box.innerHTML = `
                <div style="display: flex; align-items: center; gap: 14px; width: 100%; pointer-events: none;">
                    
                    <div style="flex-shrink: 0; width: 42px; height: 42px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                    </div>

                    <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center;">
                        <div style="font-weight: 600; font-size: 15px; color: #fff; line-height: 1.2;">Liên kết mới</div>
                        <div style="font-size: 13px; color: rgba(255,255,255,0.6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px;">${domain}</div>
                    </div>

                    <div style="flex-shrink: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: #fff; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </div>
                </div>

                <div style="position: absolute; bottom: 0; left: 20px; right: 20px; height: 2px; border-radius: 2px; overflow: hidden; pointer-events: none;">
                    <div id="toast-bar" style="height: 100%; width: 100%; background: linear-gradient(90deg, #4ade80, #22c55e); transform-origin: left;"></div>
                </div>
            `;

            // CSS Styles - Modern & Glassy
            const commonStyle = `
                position: fixed;
                padding: 12px 16px; 
                background: rgba(20, 20, 20, 0.85); 
                backdrop-filter: blur(16px) saturate(180%);
                -webkit-backdrop-filter: blur(16px) saturate(180%);
                border: 1px solid rgba(255, 255, 255, 0.12);
                color: white;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                z-index: ${CONFIG.zIndex};
                box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.2);
                overflow: hidden;
                opacity: 0;
                user-select: none;
                -webkit-tap-highlight-color: transparent;
                touch-action: none; 
                cursor: pointer;
                will-change: transform, opacity;
            `;

            const desktopStyle = `bottom: 32px; right: 32px; width: 340px; border-radius: 24px; transform: translateY(40px) scale(0.95);`;
            const mobileStyle = `bottom: max(24px, env(safe-area-inset-bottom)); left: 16px; right: 16px; width: auto; border-radius: 28px; transform: translateY(40px) scale(0.95);`;

            box.style.cssText = commonStyle + (isMobile ? mobileStyle : desktopStyle);
            document.body.appendChild(box);

            // Animation Entry (Spring)
            requestAnimationFrame(() => {
                box.style.transition = 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.4s ease';
                box.style.opacity = '1';
                box.style.transform = 'translate(0, 0) scale(1)';
            });

            // Logic Timer
            const bar = box.querySelector('#toast-bar');
            let timeLeft = CONFIG.duration * 1000;
            let isPaused = false;
            let lastUpdate = Date.now();

            const updateTimer = () => {
                if (!isPaused) {
                    const now = Date.now();
                    timeLeft -= (now - lastUpdate);
                    const percent = Math.max(0, timeLeft / (CONFIG.duration * 1000));
                    bar.style.transform = `scaleX(${percent})`;
                    if (timeLeft <= 0) { api.close(); return; }
                }
                lastUpdate = Date.now();
                requestAnimationFrame(updateTimer);
            };
            requestAnimationFrame(updateTimer);

            const api = {
                close: () => {
                    box.style.transition = 'all 0.4s cubic-bezier(0.32, 0.72, 0, 1)';
                    box.style.opacity = '0';
                    box.style.transform = 'translateY(10px) scale(0.9)';
                    setTimeout(() => box.remove(), 400);
                    if (currentToast === api) currentToast = null;
                }
            };

            // Mở link
            const openLink = () => {
                // Hiệu ứng "Lún" (Click feedback)
                box.style.transition = 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                box.style.transform = 'scale(0.92)';
                
                setTimeout(() => {
                    originalOpen(url, '_blank');
                    api.close();
                }, 150);
            };


            // --- XỬ LÝ PHYSICS (KÉO THẢ) ---
            let startX = 0, startY = 0;
            let moveX = 0, moveY = 0;
            let isDragging = false;

            box.addEventListener('touchstart', e => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isDragging = true;
                isPaused = true;
                box.style.transition = 'none'; // Tắt transition để "dính" tay
            }, {passive: false});

            box.addEventListener('touchmove', e => {
                if (!isDragging) return;
                if (e.cancelable) e.preventDefault();

                moveX = e.touches[0].clientX - startX;
                moveY = e.touches[0].clientY - startY;

                // Physics: Xoay nhẹ theo hướng kéo (Max 15 độ)
                const rotate = Math.max(-15, Math.min(15, moveX * 0.08));
                // Physics: Thu nhỏ nhẹ khi kéo xa
                const scale = Math.max(0.9, 1 - (Math.sqrt(moveX**2 + moveY**2) / 1000));

                box.style.transform = `translate(${moveX}px, ${moveY}px) rotate(${rotate}deg) scale(${scale})`;
                
                // Mờ dần
                const distance = Math.sqrt(moveX**2 + moveY**2);
                box.style.opacity = Math.max(0.4, 1 - (distance / 350));
            }, {passive: false});

            box.addEventListener('touchend', e => {
                isDragging = false;
                isPaused = false;
                lastUpdate = Date.now();
                
                const distance = Math.sqrt(moveX**2 + moveY**2);
                
                // Tap nhẹ (< 5px di chuyển) -> Mở link
                if (distance < 5) {
                    box.style.transform = 'translate(0, 0) rotate(0deg) scale(1)';
                    openLink();
                    return;
                }

                // Kéo mạnh (> 90px) -> Ném đi
                if (distance > 90) {
                    box.style.transition = 'all 0.4s ease-out';
                    // Bay tiếp theo quán tính + xoay vòng
                    const flyX = moveX * 1.5;
                    const flyY = moveY * 1.5;
                    const flyRotate = moveX * 0.2; 

                    box.style.transform = `translate(${flyX}px, ${flyY}px) rotate(${flyRotate}deg) scale(0.8)`; 
                    box.style.opacity = '0';
                    setTimeout(() => box.remove(), 400);
                    if (currentToast === api) currentToast = null;
                } else {
                    // Kéo chưa tới -> Đàn hồi về (Elastic Snapback)
                    box.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s';
                    box.style.transform = 'translate(0, 0) rotate(0deg) scale(1)';
                    box.style.opacity = '1';
                }

                moveX = 0; moveY = 0;
            });

            // Click support for PC
            box.addEventListener('mousedown', e => {
                 // Logic tương tự touch cho PC nếu muốn kéo chuột (optional), 
                 // nhưng ở đây chỉ xử lý click đơn giản
                 if(e.button === 0) openLink();
            });

            currentToast = api;
            return api;
        }
    }

    function safeDomain(url) {
        try { return new URL(url).hostname.replace('www.', ''); } catch { return url; }
    }

    window.open = function (url) {
        if (!url || url === 'about:blank') return null;
        Toast.show(url);
        return { close: () => {}, focus: () => {}, closed: true };
    };

    document.addEventListener('click', function (e) {
        const a = e.target.closest('a');
        if (!a || !a.href || a.href.startsWith('javascript:') || a.href.startsWith('#')) return;
        if (a.target === '_blank' || e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) {
            e.preventDefault();
            Toast.show(a.href);
        }
    }, true);

})();
