// Add 'android' class to body if user is on an Android device
if (/Android/i.test(navigator.userAgent)) {
    document.body.classList.add('android');
}
let exactVideoDurationMinutes = 0;

// ========================================================
// SECTION A: SPACE COMBAT GAME CANVAS BACKGROUND LOOP
// ========================================================
const canvas = document.getElementById('battleCanvas');
const ctx = canvas.getContext('2d');
let totalKills = 0;

// ========================================================
// SELECTIVE 8-BIT RESOLUTION OVERRIDE
// ========================================================
function syncCanvasDimensions() {
    const allCanvases = document.querySelectorAll('canvas');
    
    allCanvases.forEach(c => {
        if (c.clientWidth === 0) return;
        
        // RULE 1: HARDCODED GAMES & TOP ANIMATIONS (Do absolutely nothing)
        // These rely on their fixed internal coordinates to draw properly.
        const fixedCanvases = [
            'miniGameCanvas', 
            'antiAiCanvas', 
            'atmosCanvas', 
            'pacingCanvas',
            'vignetteCanvas',       // How To Fight: Top animation
            'headerChaseCanvas',    // Config: Top animation
            'formatLibraryCanvas'   // Format DB: Top animation
        ];
        
        if (fixedCanvases.includes(c.id)) {
            return; // Skip them entirely so they don't zoom in!
        }
        
        // RULE 2: FULL-SCREEN GAME (Keep at 100% dynamic resolution)
        if (c.id === 'battleCanvas') {
            if (c.width !== c.clientWidth || c.height !== c.clientHeight) {
                c.width = c.clientWidth;
                c.height = c.clientHeight;
            }
            return; 
        }

        // RULE 3: HEAVY ABSTRACT BACKGROUNDS (Drop to 50% dynamic resolution)
        // Only the pure background canvases get halved to save GPU power.
        const targetW = Math.floor(c.clientWidth / 2);
        const targetH = Math.floor(c.clientHeight / 2);
        
        if (c.width !== targetW || c.height !== targetH) {
            c.width = targetW;
            c.height = targetH;
        }
    });
}
window.addEventListener('resize', syncCanvasDimensions);
// Run once on load to ensure all canvases size correctly
setTimeout(syncCanvasDimensions, 100);

const bots = []; const lasers = []; const particles = []; const stars = [];
let shootingStar = null; let activeUfo = null; 

for (let s = 0; s < 40; s++) {
    stars.push({
        x: Math.random(), y: Math.random() * 0.78, 
        size: Math.random() * 2.5 + 1.0,
        twinkleSpeed: 0.05 + Math.random() * 0.08, phase: Math.random() * Math.PI
    });
}

const spaceRangers = [
    { x: 0.89, y: 0.52, state: 'idle', timer: 0 },
    { x: 0.94, y: 0.70, state: 'idle', timer: 25 }
];

const failTexts = ["[GARBLED DATA]", "[ERR: MALFUNCTION]", "TRANS_FAIL", "[NONSENSE]", "BOT_HALT"];

for (let i = 0; i < 4; i++) {
    let horizontalOffset = 0.04 + (i * 0.06);
    let verticalOffset = (i === 3) ? 0.72 + (Math.random() * 0.05) : 0.52 + (Math.random() * 0.06);
    bots.push({
        x: horizontalOffset, y: verticalOffset, isDead: false,
        typingTimer: i * 5, textBubble: failTexts[i % failTexts.length],
        bubbleTimer: Math.random() * 80, botIndex: i 
    });
}

function drawArcadeScene() {
    if (canvas.clientWidth === 0) { requestAnimationFrame(drawArcadeScene); return; }
    syncCanvasDimensions();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    stars.forEach(star => {
        star.phase += star.twinkleSpeed;
        let alpha = 0.1 + Math.abs(Math.sin(star.phase)) * 0.9; 
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(star.x * canvas.width, star.y * canvas.height, star.size, star.size);
    });
    
    if (!activeUfo && Math.random() < 0.002) {
        activeUfo = { x: -50, y: canvas.height * 0.1 + Math.random() * (canvas.height * 0.3), frame: 0, speed: 5 + Math.random() * 4 };
    }

    if (activeUfo) {
        activeUfo.x += activeUfo.speed; activeUfo.frame++;
        let ufoY = activeUfo.y + Math.sin(activeUfo.frame * 0.1) * 25;
        ctx.save(); ctx.translate(activeUfo.x, ufoY);
        ctx.fillStyle = 'rgba(0, 240, 255, 0.5)'; ctx.beginPath(); ctx.arc(0, -5, 14, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#95a5a6'; ctx.beginPath(); ctx.ellipse(0, 0, 28, 8, 0, 0, Math.PI * 2); ctx.fill();
        if (activeUfo.frame % 16 < 8) {
            ctx.fillStyle = '#ff007f'; ctx.beginPath(); ctx.arc(-16, 2, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(16, 2, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#39ff14'; ctx.beginPath(); ctx.arc(0, 3, 3, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
        if (activeUfo.x > canvas.width + 60) activeUfo = null;
    }

    if (!shootingStar && Math.random() < 0.004) { 
        shootingStar = { x: Math.random()*canvas.width*0.5, y: Math.random()*canvas.height*0.3, dx: 8+Math.random()*6, dy: 2+Math.random()*3, length: 45+Math.random()*30, life: 35 };
    }

    if (shootingStar) {
        shootingStar.x += shootingStar.dx; shootingStar.y += shootingStar.dy; shootingStar.life--;
        ctx.lineWidth = 2; ctx.shadowBlur = 10; ctx.shadowColor = 'var(--neon-cyan)';
        let grad = ctx.createLinearGradient(shootingStar.x, shootingStar.y, shootingStar.x - shootingStar.length, shootingStar.y - (shootingStar.length * 0.3));
        grad.addColorStop(0, '#ffffff'); grad.addColorStop(1, 'rgba(0, 240, 255, 0)');
        ctx.strokeStyle = grad; ctx.beginPath(); ctx.moveTo(shootingStar.x, shootingStar.y); ctx.lineTo(shootingStar.x - shootingStar.length, shootingStar.y - (shootingStar.length * 0.3)); ctx.stroke(); ctx.shadowBlur = 0;
        if (shootingStar.life <= 0 || shootingStar.x > canvas.width) shootingStar = null;
    }

    let px = canvas.width * 0.14; let py = canvas.height * 0.18;
    ctx.strokeStyle = 'rgba(255, 0, 127, 0.45)'; ctx.lineWidth = 5; ctx.save(); ctx.translate(px, py); ctx.rotate(-Math.PI / 8); ctx.beginPath();
    ctx.ellipse(0, 0, 55, 12, 0, Math.PI, 0); ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#1c0d2e'; ctx.beginPath(); ctx.arc(px, py, 26, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.fillStyle = '#ff007f'; ctx.beginPath(); ctx.arc(px, py, 26, Math.PI * 0.4, Math.PI * 1.4); ctx.clip();
    ctx.fillStyle = 'rgba(0, 240, 255, 0.15)'; ctx.fillRect(px - 30, py - 30, 60, 60); ctx.restore();
    ctx.strokeStyle = 'rgba(255, 0, 127, 0.85)'; ctx.lineWidth = 5; ctx.save(); ctx.translate(px, py); ctx.rotate(-Math.PI / 8); ctx.beginPath();
    ctx.ellipse(0, 0, 55, 12, 0, 0, Math.PI); ctx.stroke(); ctx.restore();

    ctx.strokeStyle = '#1f4e1f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, canvas.height * 0.82);
    ctx.lineTo(canvas.width, canvas.height * 0.82); ctx.stroke();

    bots.forEach(bot => {
        let bx = bot.x * canvas.width; let by = bot.y * canvas.height;
        if (bot.isDead) {
            ctx.fillStyle = '#1c1f24'; ctx.beginPath(); ctx.ellipse(bx, by + 20, 25, 10, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#4f5d65'; ctx.fillRect(bx - 15, by + 5, 30, 12); 
            return;
        }
        
        bot.typingTimer += 0.12; let bob = Math.sin(bot.typingTimer) * 3;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; ctx.beginPath(); ctx.ellipse(bx, by + 22, 20, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2c3e50'; ctx.beginPath(); ctx.roundRect(bx - 20, by - 15 + bob, 40, 35, 8); ctx.fill();
        ctx.fillStyle = '#7a8d96'; ctx.beginPath(); ctx.roundRect(bx - 14, by - 10 + bob, 28, 22, 4); ctx.fill();
        ctx.fillStyle = '#111'; ctx.fillRect(bx - 10, by - 5 + bob, 20, 12);
        ctx.fillStyle = (Math.floor(bot.typingTimer) % 2 === 0) ? '#ff007f' : '#00f0ff'; ctx.fillRect(bx - 8, by - 1 + bob, 16, 2);
        ctx.fillStyle = '#34495e'; ctx.beginPath(); ctx.roundRect(bx - 12, by - 30 + bob, 24, 16, 6); ctx.fill();
        ctx.fillStyle = '#111'; ctx.fillRect(bx - 9, by - 26 + bob, 18, 7);
        ctx.fillStyle = '#ff0055'; ctx.fillRect(bx - 3 + Math.sin(bot.typingTimer)*2, by - 24 + bob, 6, 4);
        ctx.fillStyle = '#1c1f24'; ctx.fillRect(bx - 25, by - 6 + bob, 6, 14); 
        ctx.fillStyle = '#4f5d65'; ctx.fillRect(bx - 28, by + 4 + bob, 6, 12);
        
        bot.bubbleTimer++;
        if (bot.bubbleTimer > 100) {
            ctx.fillStyle = "rgba(0, 0, 0, 1.0)";
            ctx.strokeStyle = '#ff007f'; ctx.lineWidth = 2; ctx.font = "bold 16px 'Courier New'";
            let txtWidth = ctx.measureText(bot.textBubble).width;
            ctx.beginPath(); ctx.roundRect(bx - 15, by - 56, txtWidth + 14, 22, 4); ctx.fill(); ctx.stroke();
            ctx.fillStyle = "#ffffff"; ctx.fillText(bot.textBubble, bx - 8, by - 40);
            if (bot.bubbleTimer > 165) bot.bubbleTimer = 0;
        }
    });

    spaceRangers.forEach(ranger => {
        ranger.timer++; let rx = ranger.x * canvas.width; let ry = ranger.y * canvas.height;
        if (ranger.timer % 65 === 0) {
            const liveBots = bots.filter(b => !b.isDead);
            if (liveBots.length > 0) {
                const target = liveBots[Math.floor(Math.random() * liveBots.length)];
                ranger.state = 'firing';
                lasers.push({ sx: rx - 44, sy: ry - 4, tx: target.x * canvas.width + 4, ty: target.y * canvas.height + 2, life: 6, targetBot: target });
            }
        }
        
        ctx.fillStyle = '#d5dbdb'; ctx.beginPath(); ctx.roundRect(rx - 8, ry - 14, 20, 32, 4); ctx.fill();
        ctx.fillStyle = '#3498db'; ctx.fillRect(rx - 8, ry - 14, 6, 8); 
        ctx.fillStyle = '#27ae60'; ctx.fillRect(rx, ry - 8, 8, 6);
        ctx.fillStyle = '#ecf0f1'; ctx.beginPath(); ctx.arc(rx + 2, ry - 24, 11, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#bdc3c7'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#00f0ff'; ctx.beginPath(); ctx.arc(rx - 1, ry - 24, 7, Math.PI * 0.5, Math.PI * 1.5); ctx.fill();
        ctx.fillStyle = '#2c3e50'; ctx.fillRect(rx - 34, ry - 8, 28, 9); 
        ctx.fillStyle = '#95a5a6'; ctx.fillRect(rx - 44, ry - 6, 12, 5);
        ctx.strokeStyle = '#d5dbdb'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(rx + 4, ry - 2); ctx.lineTo(rx - 12, ry - 2); ctx.moveTo(rx, ry + 8); ctx.lineTo(rx - 22, ry - 2); ctx.stroke();
        
        if (ranger.state === 'firing') {
            ctx.fillStyle = '#39ff14'; ctx.beginPath(); ctx.arc(rx - 45, ry - 4, 7, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(rx - 45, ry - 4, 3, 0, Math.PI * 2); ctx.fill();
        }
        if (ranger.timer % 71 === 0) ranger.state = 'idle';
    });

    for (let i = lasers.length - 1; i >= 0; i--) {
        let l = lasers[i]; l.life--;
        ctx.strokeStyle = 'rgba(57, 255, 20, 0.35)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(l.sx, l.sy); ctx.lineTo(l.tx, l.ty); ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(l.sx, l.sy); ctx.lineTo(l.tx, l.ty); ctx.stroke();
        
        if (l.life <= 0) {
            if (!l.targetBot.isDead) {
                l.targetBot.isDead = true; totalKills++;
                const kc = document.getElementById('killCount');
                if(kc) kc.innerText = String(totalKills).padStart(3, '0');
                for(let p=0; p<22; p++) { particles.push({ x: l.tx, y: l.ty, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.6) * 9, size: Math.random() * 4 + 2, life: 28 }); }
            }
            lasers.splice(i, 1);
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.life--;
        ctx.fillStyle = p.life > 14 ? '#ffffff' : (p.life > 6 ? '#ffea00' : '#ff007f');
        ctx.fillRect(p.x, p.y, p.size, p.size);
        if (p.life <= 0) particles.splice(i, 1);
    }

    if (bots.filter(b => b.isDead).length === bots.length) {
        bots.forEach(b => { b.isDead = false; b.y = b.botIndex === 3 ? 0.72 + (Math.random() * 0.05) : 0.52 + (Math.random() * 0.06); b.bubbleTimer = 0; });
    }
    
    requestAnimationFrame(drawArcadeScene);
}
drawArcadeScene();

// ========================================================
// SECTION B: HEADER PROTOCOL CHASE MINI-GAME CANVAS
// ========================================================
const headCanvas = document.getElementById('headerChaseCanvas');
if (headCanvas) {
    const hctx = headCanvas.getContext('2d');
    function syncHeaderCanvas() {
        if (headCanvas.clientWidth === 0) return;
        if (headCanvas.width !== headCanvas.clientWidth || headCanvas.height !== headCanvas.clientHeight) {
            headCanvas.width = headCanvas.clientWidth;
            headCanvas.height = headCanvas.clientHeight;
        }
    }

    const actorBot = { x: 120, y: 24, size: 10, targetX: 200, speed: 1.4, isDead: false, respawnTimer: 0, bobCycle: 0 };
    const actorHero = { x: 40, y: 24, targetX: 130, speed: 1.8, beamActive: false, beamLife: 0 };
    const actorDebris = [];

    function drawHeaderChaseLoop() {
        if (headCanvas.clientWidth === 0) { requestAnimationFrame(drawHeaderChaseLoop); return; }
        syncHeaderCanvas();
        hctx.clearRect(0, 0, headCanvas.width, headCanvas.height);
        hctx.strokeStyle = '#11111a'; hctx.lineWidth = 1;
        
        for (let j = 0; j < headCanvas.width; j += 20) { hctx.beginPath(); hctx.moveTo(j, 0); hctx.lineTo(j, headCanvas.height); hctx.stroke(); }
        hctx.strokeStyle = '#18ff6d'; hctx.lineWidth = 2; hctx.beginPath(); hctx.moveTo(0, headCanvas.height - 4); hctx.lineTo(headCanvas.width, headCanvas.height - 4); hctx.stroke();

        for (let d = actorDebris.length - 1; d >= 0; d--) {
            let p = actorDebris[d]; p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life--;
            hctx.fillStyle = p.color; hctx.fillRect(p.x, p.y, p.size, p.size);
            if (p.life <= 0) actorDebris.splice(d, 1);
        }

        if (actorBot.isDead) {
            actorBot.respawnTimer--;
            if (actorBot.respawnTimer <= 0) {
                actorBot.isDead = false; actorBot.x = -20; actorBot.targetX = Math.random() * (headCanvas.width * 0.4) + 60;
            }
        } else {
            actorBot.bobCycle += 0.2; let bob = Math.sin(actorBot.bobCycle) * 3;
            if (Math.abs(actorBot.x - actorBot.targetX) < 5) actorBot.targetX = Math.random() * (headCanvas.width - 60) + 30;
            actorBot.x += (actorBot.targetX > actorBot.x) ? actorBot.speed : -actorBot.speed;
            hctx.fillStyle = '#ff007f'; hctx.fillRect(actorBot.x - 6, actorBot.y - 6 + bob, 12, 10);
            hctx.fillStyle = '#000'; hctx.fillRect(actorBot.x - 4, actorBot.y - 3 + bob, 8, 4);
            hctx.fillStyle = '#00f0ff'; hctx.fillRect(actorBot.x - 2, actorBot.y - 2 + bob, 4, 2);
        }

        if (!actorBot.isDead) actorHero.targetX = actorBot.x - 45; else actorHero.targetX = headCanvas.width * 0.3;
        actorHero.x += (actorHero.targetX > actorHero.x) ? actorHero.speed : -actorHero.speed;
        
        if (!actorBot.isDead && !actorHero.beamActive && Math.abs(actorHero.x - (actorBot.x - 45)) < 15 && Math.random() < 0.015) {
            actorHero.beamActive = true; actorHero.beamLife = 10;
        }

        if (actorHero.beamActive) {
            actorHero.beamLife--;
            hctx.strokeStyle = '#39ff14'; hctx.lineWidth = 3; hctx.beginPath(); hctx.moveTo(actorHero.x + 8, actorHero.y - 1); hctx.lineTo(actorBot.x, actorBot.y); hctx.stroke();
            hctx.strokeStyle = '#fff'; hctx.lineWidth = 1; hctx.beginPath(); hctx.moveTo(actorHero.x + 8, actorHero.y - 1); hctx.lineTo(actorBot.x, actorBot.y); hctx.stroke();
            if (actorHero.beamLife <= 0) {
                actorHero.beamActive = false; actorBot.isDead = true; actorBot.respawnTimer = 90; 
                for (let k = 0; k < 12; k++) { actorDebris.push({ x: actorBot.x, y: actorBot.y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.7) * 5, size: Math.random() * 3 + 2, color: Math.random() > 0.5 ? '#ff007f' : '#ffffff', life: 20 }); }
            }
        }

        hctx.fillStyle = '#ffffff'; hctx.beginPath(); hctx.arc(actorHero.x, actorHero.y - 4, 6, 0, Math.PI * 2); hctx.fill(); 
        hctx.fillStyle = '#00f0ff'; hctx.fillRect(actorHero.x + 1, actorHero.y - 6, 4, 4); 
        hctx.fillStyle = '#3498db'; hctx.fillRect(actorHero.x - 5, actorHero.y, 10, 10); 
        hctx.fillStyle = '#ffea00'; hctx.fillRect(actorHero.x - 9, actorHero.y + 1, 4, 3); 
        requestAnimationFrame(drawHeaderChaseLoop);
    }
    drawHeaderChaseLoop();
}

// ========================================================
// SECTION C: UI, NAVIGATION, AND DATA HARVESTER
// ========================================================
document.addEventListener("DOMContentLoaded", () => {

// --- PRECISION MOBILE TOUCH FEEDBACK & DEFAULT GLOW ---
    const menuItems = document.querySelectorAll('.menu-item');
    
    // 1. Immediately light up the first option (Start Game) on page load
    if (menuItems.length > 0) {
        menuItems[0].classList.add('arcade-glow');
    }

    menuItems.forEach(item => {
        // Light up instantly on touch
        item.addEventListener('touchstart', function() {
            // 2. Instantly kill the default start glow (and any others) when the user interacts
            menuItems.forEach(el => el.classList.remove('arcade-glow'));
            
            // 3. Light up the specific item being tapped
            this.classList.add('arcade-glow');
        }, {passive: true});

        // Remove the light 300ms after the tap finishes
        item.addEventListener('touchend', function() {
            setTimeout(() => {
                this.classList.remove('arcade-glow');
            }, 300); 
        });
    });
    
    // Buttons
    // Buttons
    const startGameBtn = document.querySelector('[data-action="start-game"]');
    const intelBtn = document.querySelector('[data-action="intel"]');
    const trophiesBtn = document.querySelector('[data-action="trophies"]');
    const creditsBtn = document.querySelector('[data-action="credits-help"]');
    const formatBtn = document.querySelector('[data-action="format"]');
    
    const backToMenuBtn = document.getElementById('backToMenuBtn');
    const backToMenuFromIntelBtn = document.getElementById('backToMenuFromIntelBtn');
    const backToMenuFromTrophiesBtn = document.getElementById('backToMenuFromTrophiesBtn');
    const backToMenuFromContactBtn = document.getElementById('backToMenuFromContactBtn');
const backToMenuFromHubBtn = document.getElementById('backToMenuFromHubBtn');
    
    const lockProtocolBtn = document.getElementById('lockProtocolBtn');
    const backToConfigBtn = document.getElementById('backToConfigBtn');
    const ccOptionBtn = document.getElementById('ccOptionBtn');
    
    const creditCardForm = document.getElementById('creditCardForm');
    const premiumCheckbox = document.getElementById('premiumCaptions');
    const specialInstForm = document.getElementById('specialInstructionsForm');

    // -- PRIMARY BEAM: MOVIE UPLOADER --
    const movieUploadBtn = document.getElementById('movieUploadBtn');
    const hiddenFileInput = document.getElementById('hiddenMovieFileInput');
    const progressContainer = document.getElementById('arcadeProgressContainer');
    const progressBar = document.getElementById('arcadeProgressBar');
    
    if (movieUploadBtn && hiddenFileInput) {
        
        // Modal Element Variables
        const cargoModal = document.getElementById('cargoWarningModal');
        const closeCargoBtn = document.getElementById('closeCargoBtn');
        const proceedBtn = document.getElementById('proceedToUploadBtn');

        // 1. Intercept the original click and show the Warning Modal
        movieUploadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (cargoModal) cargoModal.classList.add('active-modal');
            else hiddenFileInput.click(); // Fallback if modal is missing
        });

        // 2. Allow user to cancel
        if (closeCargoBtn) {
            closeCargoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                cargoModal.classList.remove('active-modal');
            });
        }

        // 3. Acknowledge warning and trigger actual file explorer
        if (proceedBtn) {
            proceedBtn.addEventListener('click', (e) => {
                e.preventDefault();
                cargoModal.classList.remove('active-modal');
                hiddenFileInput.click(); // Launches file selector
            });
        }

        hiddenFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Extract exact duration invisibly
            if (file.type.startsWith('video/')) {
                const videoElement = document.createElement('video');
                videoElement.preload = 'metadata';
                videoElement.onloadedmetadata = function() {
                    window.URL.revokeObjectURL(videoElement.src);
                    exactVideoDurationMinutes = videoElement.duration / 60; 
                }
                videoElement.src = URL.createObjectURL(file);
            }

            const btnText = document.getElementById('movieUploadText');
            const btnIcon = document.querySelector('.group-clapboard .flat-vector-icon');
            const healthHUD = document.getElementById('arcadeHealthHUD');
            
            if(btnText) btnText.innerText = "REQUESTING SECURE UPLINK...";
            if(btnIcon) btnIcon.style.color = "var(--neon-cyan)";
            movieUploadBtn.style.borderColor = "var(--neon-cyan)";
            if(healthHUD) healthHUD.classList.add('active');

            try {
                const initRes = await fetch('/api/getUploadUrl', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileName: file.name, mimeType: file.type || 'application/octet-stream' })
                });
                
                if (!initRes.ok) throw new Error('Vercel link failed.');
                const { uploadUrl } = await initRes.json();
                
                if(btnText) btnText.innerText = `TRANSMITTING: 0%`;

                const xhr = new XMLHttpRequest();
                xhr.open('PUT', uploadUrl, true);
                xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = Math.floor((event.loaded / event.total) * 100);
                        const chunkyPercent = Math.floor(percentComplete / 2) * 2;
                        const colorStop = document.getElementById('heartColorStop');
                        const emptyStop = document.getElementById('heartEmptyStop');
                        
                        if(btnText) btnText.innerText = `RESTORING DATA: ${percentComplete}%`;
                        
                        if(progressBar) {
                            progressBar.style.width = `${chunkyPercent}%`;
                            let currentColor = 'var(--neon-pink)';
                            if (chunkyPercent < 30) { currentColor = 'var(--neon-pink)'; } 
                            else if (chunkyPercent < 70) { currentColor = '#ffea00'; } 
                            else { currentColor = 'var(--neon-green)'; }

                            progressBar.style.backgroundColor = currentColor;
                            if (colorStop && emptyStop) {
                                colorStop.setAttribute('stop-color', currentColor);
                                colorStop.setAttribute('offset', `${chunkyPercent}%`);
                                emptyStop.setAttribute('offset', `${chunkyPercent}%`);
                            }
                        }
                    }
                };

                xhr.onload = () => {
                    if (xhr.status === 200) {
                        if(btnText) btnText.innerText = "CARGO SECURED ✓";
                        if(btnIcon) btnIcon.style.color = "var(--neon-green)";
                        movieUploadBtn.style.borderColor = "var(--neon-green)";
                        movieUploadBtn.style.background = "rgba(57, 255, 20, 0.05)";
                    } else { throw new Error('Transmission rejected.'); }
                };

                xhr.onerror = () => {
                    if(btnText) btnText.innerText = "UPLINK FAILED. RETRY.";
                    if(btnIcon) btnIcon.style.color = "var(--neon-pink)";
                    movieUploadBtn.style.borderColor = "var(--neon-pink)";
                };
                xhr.send(file);
            } catch (err) {
                console.error(err);
                if(btnText) btnText.innerText = "UPLINK FAILED. RETRY.";
                if(btnIcon) btnIcon.style.color = "var(--neon-pink)";
                movieUploadBtn.style.borderColor = "var(--neon-pink)";
            }
        });
    } 

    // --- SECONDARY BEAM: SCRIPT UPLOADER ---
    const hiddenScriptInput = document.getElementById('hiddenScriptFileInput');
    if (hiddenScriptInput) {
        hiddenScriptInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const scriptText = document.getElementById('scriptUploadText');
            const scriptIcon = document.querySelector('.script-icon-target');
            const scriptBox = document.querySelector('.group-script');

            if(scriptText) scriptText.innerText = "BEAMING SCRIPT TO VAULT...";
            if(scriptIcon) scriptIcon.style.color = "var(--neon-cyan)";
            if(scriptBox) scriptBox.style.borderColor = "var(--neon-cyan)";

            try {
                const initRes = await fetch('/api/getUploadUrl', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileName: file.name, mimeType: file.type || 'text/plain' })
                });

                if (!initRes.ok) throw new Error('Vercel link failed.');
                const { uploadUrl } = await initRes.json();
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', uploadUrl, true);
                xhr.setRequestHeader('Content-Type', file.type || 'text/plain');

                xhr.onload = () => {
                    if (xhr.status === 200) {
                        if(scriptText) scriptText.innerText = "SCRIPT SECURED ✓";
                        if(scriptIcon) scriptIcon.style.color = "var(--neon-green)";
                        if(scriptBox) {
                            scriptBox.style.borderColor = "var(--neon-green)";
                            scriptBox.style.background = "rgba(57, 255, 20, 0.05)";
                        }
                    } else { throw new Error('Transmission rejected.'); }
                };

                xhr.onerror = () => {
                    if(scriptText) scriptText.innerText = "UPLINK FAILED. RETRY.";
                    if(scriptIcon) scriptIcon.style.color = "var(--neon-pink)";
                    if(scriptBox) scriptBox.style.borderColor = "var(--neon-pink)";
                };
                xhr.send(file);
            } catch (err) {
                console.error(err);
                if(scriptText) scriptText.innerText = "UPLINK FAILED. RETRY.";
                if(scriptIcon) scriptIcon.style.color = "var(--neon-pink)";
                if(scriptBox) scriptBox.style.borderColor = "var(--neon-pink)";
            }
        });
    }

    // -- BULLETPROOF NAVIGATION & HISTORY LOGIC --
    let spaHistory = ['mainMenuLayer']; 

// --- NEW: PAYMENT TERMINAL SCRUBBER ---
    function resetPaymentTerminal() {
        const nameInput = document.getElementById('pilotNameInput');
        const emailInput = document.getElementById('pilotEmailInput');
        const paymentLayer = document.getElementById('paymentInterface');
        const alertBox = document.getElementById('globalSystemAlert');
        const ccForm = document.getElementById('creditCardForm');

        if (nameInput) { nameInput.value = ''; nameInput.classList.remove('input-error-flash'); }
        if (emailInput) { emailInput.value = ''; emailInput.classList.remove('input-error-flash'); }
        if (paymentLayer) paymentLayer.classList.remove('system-red-alert');
        if (alertBox) { alertBox.classList.remove('global-alert-active'); alertBox.classList.add('global-alert-hidden'); }
        if (ccForm) ccForm.classList.remove('active');

        if (typeof cardElement !== 'undefined') cardElement.clear();
        const cardErrors = document.getElementById('card-errors');
        if (cardErrors) cardErrors.textContent = '';

        const submitBtn = document.getElementById('submitPaymentBtn');
        if (submitBtn) {
            submitBtn.innerText = 'CONFIRM TRANSFER ▶';
            submitBtn.style.color = ''; submitBtn.style.borderColor = ''; submitBtn.style.pointerEvents = 'auto';
        }
        
        const paypalBtn = document.getElementById('paypalOptionBtn');
        if (paypalBtn) {
            const paypalText = paypalBtn.querySelector('.payment-name');
            if (paypalText) paypalText.innerText = 'PAYPAL';
            paypalBtn.style.color = ''; paypalBtn.style.borderColor = ''; paypalBtn.style.background = ''; paypalBtn.style.pointerEvents = 'auto';
        }
    }

    function executeLayerSwitch(targetId, pushHistory = true) {
        // --- NEW: INTERCEPT DEPARTURE FROM PAYMENT LAYER ---
        const paymentLayer = document.getElementById('paymentInterface');
        if (paymentLayer && paymentLayer.classList.contains('active-layer') && targetId !== 'paymentInterface') {
            resetPaymentTerminal();
        }
        // ---------------------------------------------------

        // We added 'deploymentInterface' to this list so the app knows it exists
        const allLayers = ['mainMenuLayer', 'configInterface', 'paymentInterface', 'intelInterface', 'trophiesInterface', 'contactInterface', 'formatInterface', 'systemSettingsHub', 'deploymentInterface'];
        
        allLayers.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('active-layer');
        });

        const targetEl = document.getElementById(targetId);
        if (targetEl) targetEl.classList.add('active-layer');

// ⬇️ ⬇️ ⬇️ ADD THIS NEW BLOCK HERE ⬇️ ⬇️ ⬇️
        if (targetId === 'mainMenuLayer') {
            // We use a 350ms delay to ensure this fires AFTER the 300ms touch-wipe finishes!
            setTimeout(() => {
                const menuItems = document.querySelectorAll('.menu-item');
                if (menuItems.length > 0) {
                    // Wipe the glow from all items, then force it back onto the first one
                    menuItems.forEach(el => el.classList.remove('arcade-glow'));
                    menuItems[0].classList.add('arcade-glow');
                }
            }, 350); 
        }
        // ⬆️ ⬆️ ⬆️ END OF NEW BLOCK ⬆️ ⬆️ ⬆️

        if (pushHistory) {
            window.history.pushState({ id: targetId }, '', `#${targetId}`);
            spaHistory.push(targetId); 
        }
        
        // Reset scrollbars
        const crtScreen = document.querySelector('.crt-screen');
        if (crtScreen) crtScreen.scrollTop = 0;
        const formatEl = document.querySelector('.format-scroll-box'); 
        if (formatEl) formatEl.scrollTop = 0;
    }

    if (!window.history.state) { window.history.replaceState({ id: 'mainMenuLayer' }, '', '#mainMenuLayer'); }

if (!window.history.state) { window.history.replaceState({ id: 'mainMenuLayer' }, '', '#mainMenuLayer'); }

    // Sync browser back/forward buttons with SPA layer switching
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.id) {
            executeLayerSwitch(e.state.id, false);
        }
    })

    // Custom Back Function: Looks at our array and goes to the previous screen
    const handleSpaBack = (e) => {
        if (e) e.preventDefault();
        if (spaHistory.length > 1) {
            spaHistory.pop(); // Remove the current page
            const previousLayer = spaHistory[spaHistory.length - 1]; // Get the page before it
            executeLayerSwitch(previousLayer, false); // Switch without adding to history again
        } else {
            executeLayerSwitch('mainMenuLayer', false); // Fallback failsafe
        }
    };

    // Forward Navigation
    if(startGameBtn) startGameBtn.addEventListener('click', (e) => { e.preventDefault(); executeLayerSwitch('configInterface'); });
    if(intelBtn) intelBtn.addEventListener('click', (e) => { e.preventDefault(); executeLayerSwitch('intelInterface'); });
    if(trophiesBtn) trophiesBtn.addEventListener('click', (e) => { e.preventDefault(); executeLayerSwitch('trophiesInterface'); });
    if(creditsBtn) creditsBtn.addEventListener('click', (e) => { e.preventDefault(); executeLayerSwitch('contactInterface'); });
    
    // Hub Navigation
    if(formatBtn) formatBtn.addEventListener('click', (e) => { e.preventDefault(); executeLayerSwitch('systemSettingsHub'); });
    
    // NEW: Open specific pages from the Hub monitors
    const btnFormatDb = document.getElementById('btn-format-db');
    const btnDeployManual = document.getElementById('btn-deploy-manual');
    
    if(btnFormatDb) btnFormatDb.addEventListener('click', (e) => {
        e.preventDefault();
        const formatDb = document.getElementById('formatInterface');
        formatDb.classList.remove('side-drawer', 'open');
        formatDb.classList.add('spa-layer');
        executeLayerSwitch('formatInterface');
    });
    if(btnDeployManual) btnDeployManual.addEventListener('click', () => executeLayerSwitch('deploymentInterface'));
    
    // Unified Back Navigation
    const formatReturnBtn = document.querySelector('#formatInterface .back-btn');
    const backToHubFromDeployBtn = document.getElementById('backToHubFromDeployBtn');

    if(backToMenuBtn) backToMenuBtn.addEventListener('click', handleSpaBack);
    if(backToMenuFromIntelBtn) backToMenuFromIntelBtn.addEventListener('click', handleSpaBack);
    if(backToMenuFromTrophiesBtn) backToMenuFromTrophiesBtn.addEventListener('click', handleSpaBack);
    if(backToMenuFromContactBtn) backToMenuFromContactBtn.addEventListener('click', handleSpaBack);
    if(formatReturnBtn) formatReturnBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const formatDb = document.getElementById('formatInterface');
    if (formatDb.classList.contains('side-drawer')) {
        formatDb.classList.remove('open');
    } else {
        handleSpaBack(e);
    }
});
    if(backToMenuFromHubBtn) backToMenuFromHubBtn.addEventListener('click', handleSpaBack); 
    if(backToConfigBtn) backToConfigBtn.addEventListener('click', handleSpaBack);
    if(backToHubFromDeployBtn) backToHubFromDeployBtn.addEventListener('click', handleSpaBack);

    if(lockProtocolBtn) lockProtocolBtn.addEventListener('click', () => executeLayerSwitch('paymentInterface'));

    // --- PRESERVED EXISTING LOGIC (Do not delete these!) ---
    if(ccOptionBtn) ccOptionBtn.addEventListener('click', () => {
        creditCardForm.classList.toggle('active');
        if(creditCardForm.classList.contains('active')){
            setTimeout(() => creditCardForm.scrollIntoView({behavior: "smooth", block: "end"}), 100);
        }
    });

    if(premiumCheckbox) premiumCheckbox.addEventListener('change', (e) => {
        if(e.target.checked) specialInstForm.style.display = 'flex';
        else specialInstForm.style.display = 'none';
        calculateEstimate();
    });

    // Cost Estimator Elements
    const runtimeInput = document.getElementById('runtimeInput');
    const rateRadios = document.querySelectorAll('input[name="rateTier"]');
    const costOutputDisplay = document.getElementById('costOutputDisplay');
    const extraCheckboxes = document.querySelectorAll('.flat-check-row input[type="checkbox"]');
    const stylingDropdown = document.getElementById('stylingEnvironmentDropdown');

    // Add these DOM references above calculateEstimate()
    const styleMinimal = document.getElementById('styleMinimal');
    const styleSDH = document.getElementById('styleSDH');
    const styleAnime = document.getElementById('styleAnime');

    // --- STYLING ENVIRONMENT MULTI-SELECT ---
    const stylingHeader = document.getElementById('stylingSelectHeader');
    const stylingContainer = document.getElementById('stylingMultiSelect');
    const stylingLabelText = document.getElementById('stylingSelectLabelText');
    const stylingCheckboxesList = document.querySelectorAll('#stylingSelectOptions input[type="checkbox"]');

    if (stylingHeader && stylingContainer) {
        // Toggle dropdown open/close
        stylingHeader.addEventListener('click', (e) => {
            e.stopPropagation();
            stylingContainer.classList.toggle('open');
        });

        stylingCheckboxesList.forEach(cb => {
            cb.addEventListener('change', () => {
                
                // Enforce Mutual Exclusivity
                if (cb.id === 'styleMinimal' && cb.checked) { document.getElementById('styleSDH').checked = false; }
                if (cb.id === 'styleSDH' && cb.checked) { document.getElementById('styleMinimal').checked = false; }

                // Update UI Label
                let selectedCount = document.querySelectorAll('#stylingSelectOptions input[type="checkbox"]:checked').length;
                if (selectedCount === 0) {
                    stylingLabelText.innerText = "Select Styling...";
                } else if (selectedCount === 1) {
                let selectedLabel = document.querySelector('#stylingSelectOptions input[type="checkbox"]:checked').nextElementSibling.innerText;
                stylingLabelText.innerText = selectedLabel; // Restores the full parenthetical text
            } else {
                    stylingLabelText.innerText = selectedCount + " Styles Selected";
                }

                // Recalculate Total
                calculateEstimate();
            });
        });
    }
    if (styleAnime) styleAnime.addEventListener('change', calculateEstimate);

    function calculateEstimate() {
        let minutes = parseFloat(runtimeInput.value) || 0;
        let baseRate = 1.50; 
        
        const selectedTier = document.querySelector('input[name="rateTier"]:checked');
        if (selectedTier && selectedTier.value === 'express') baseRate += 0.60;

        let extraFees = 0;
        if (premiumCheckbox && premiumCheckbox.checked) extraFees += 0.75;
        
        // Updated to check the new Anime checkbox instead of the dropdown
        if (styleAnime && styleAnime.checked) extraFees += 0.35;
        
        const burnedInCheck = document.querySelector('#multiSelectOptions input[value="burned-in"]');
        if (burnedInCheck && burnedInCheck.checked) extraFees += 0.20;
        
        let totalPerMinute = baseRate + extraFees;
        let totalCost = minutes * totalPerMinute;

        if(costOutputDisplay) costOutputDisplay.innerText = `$${totalCost.toFixed(2)}`;
    }

    // KEEP THESE EVENT LISTENERS SO THE CALCULATOR UPDATES LIVE
    if (runtimeInput) {
        runtimeInput.addEventListener('input', calculateEstimate);
        runtimeInput.addEventListener('change', calculateEstimate);
    }
    rateRadios.forEach(r => r.addEventListener('change', calculateEstimate));
    extraCheckboxes.forEach(c => c.addEventListener('change', calculateEstimate));
    
    // Initial calculation on load
    calculateEstimate();

    // --- MULTI-SELECT DROPDOWN BEHAVIOR ---
    const multiSelectHeader = document.getElementById('multiSelectHeader');
    const multiSelectContainer = document.getElementById('formatMultiSelect');
    const multiSelectLabelText = document.getElementById('multiSelectLabelText');
    const formatCheckboxes = document.querySelectorAll('#multiSelectOptions input[type="checkbox"]');

    if (multiSelectHeader && multiSelectContainer) {
        multiSelectHeader.addEventListener('click', (e) => {
            e.stopPropagation();
            multiSelectContainer.classList.toggle('open');
        });

        formatCheckboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                let selectedCount = document.querySelectorAll('#multiSelectOptions input[type="checkbox"]:checked').length;
                if (selectedCount === 0) {
                    multiSelectLabelText.innerText = "Select Formats...";
                } else if (selectedCount === 1) {
                    let selectedLabel = document.querySelector('#multiSelectOptions input[type="checkbox"]:checked').nextElementSibling.innerText;
                    multiSelectLabelText.innerText = selectedLabel;
                } else {
                    multiSelectLabelText.innerText = selectedCount + " Formats Selected";
                }
            });
        });
    }

    const bubbles = document.querySelectorAll('.bot-bubble');
    const chatter = ["BZZT", "NEED HUMANS", "MALFUNCTION", "SYNTAX ERR", "011001", "AI FAILED"];
    setInterval(() => {
        const paymentLayerEl = document.getElementById('paymentInterface');
        if(paymentLayerEl && paymentLayerEl.classList.contains('active-layer')){
            const randomBubble = bubbles[Math.floor(Math.random() * bubbles.length)];
            if(randomBubble) {
                randomBubble.innerText = chatter[Math.floor(Math.random() * chatter.length)];
                randomBubble.classList.add('show');
                setTimeout(() => randomBubble.classList.remove('show'), 2000);
            }
        }
    }, 1500);

    const trophiesInterface = document.getElementById('trophiesInterface');
    const hsRows = document.querySelectorAll('.hs-row:not(.hs-header)');
    setInterval(() => {
        if(trophiesInterface && trophiesInterface.classList.contains('active-layer')) {
            hsRows.forEach(row => row.classList.remove('glitch-anim'));
            if(Math.random() < 0.3) {
                const randomRow = hsRows[Math.floor(Math.random() * hsRows.length)];
                randomRow.classList.add('glitch-anim');
                setTimeout(() => randomRow.classList.remove('glitch-anim'), 300);
            }
        }
    }, 2000);

// --- UNIFIED DROPDOWN CLICK MANAGER ---
    document.addEventListener('click', (e) => {
        const formatContainer = document.getElementById('formatMultiSelect');
        const stylingContainer = document.getElementById('stylingMultiSelect');
        
        if (formatContainer && formatContainer.classList.contains('open') && !formatContainer.contains(e.target)) {
            formatContainer.classList.remove('open');
        }
        if (stylingContainer && stylingContainer.classList.contains('open') && !stylingContainer.contains(e.target)) {
            stylingContainer.classList.remove('open');
        }
    });

    // --- DATA HARVESTER & SECURE COMM-LINK (WITH STRIPE) ---

const applePayBtn = document.getElementById('applePayOptionBtn');
    const googlePayBtn = document.getElementById('googlePayOptionBtn');
    const paypalBtn = document.getElementById('paypalOptionBtn');

    // --- NEW: UNIVERSAL ERROR TRIGGER ---
    function triggerInputError(message) {
        const alertBox = document.getElementById('globalSystemAlert');
        const alertText = document.getElementById('globalAlertText');
        const nameInput = document.getElementById('pilotNameInput');
        const emailInput = document.getElementById('pilotEmailInput');
        const paymentLayer = document.getElementById('paymentInterface'); 
        
        // Set the custom error message
        if (alertText) alertText.innerText = message;
        
        // Reveal the flashing alert box
        if (alertBox) {
            alertBox.classList.remove('global-alert-hidden');
            alertBox.classList.add('global-alert-active');
        }

        // Trigger the massive red background glow
        if (paymentLayer) {
            paymentLayer.classList.add('system-red-alert');
        }
        
        // Universal cleanup function to kill alarms when typing starts
        function clearErrors() {
            if (nameInput) nameInput.classList.remove('input-error-flash');
            if (emailInput) emailInput.classList.remove('input-error-flash');
            
            if (alertBox) {
                alertBox.classList.remove('global-alert-active');
                alertBox.classList.add('global-alert-hidden');
            }
            if (paymentLayer) {
                paymentLayer.classList.remove('system-red-alert');
            }
            
            if (nameInput) nameInput.removeEventListener('input', clearErrors);
            if (emailInput) emailInput.removeEventListener('input', clearErrors);
        }

        // Highlight specifically what is missing and listen for the fix
        if (nameInput && nameInput.value.trim() === '') {
            nameInput.classList.add('input-error-flash');
            nameInput.addEventListener('input', clearErrors);
        }
        if (emailInput && emailInput.value.trim() === '') {
            emailInput.classList.add('input-error-flash');
            emailInput.addEventListener('input', clearErrors);
        }
    }

    // Helper function to calculate exact pennies for Stripe/PayPal
    function getCalculatedPennies() {
        // 1. Determine Base Rate & Tiers
        let baseRate = 1.50;
        const selectedTier = document.querySelector('input[name="rateTier"]:checked');
        if (selectedTier && selectedTier.value === 'express') baseRate += 0.60;

        // 2. Add Extra Fees
        let extraFees = 0;
        const premiumCheckbox = document.getElementById('premiumCaptions');
        if (premiumCheckbox && premiumCheckbox.checked) extraFees += 0.75;
        const styleAnime = document.getElementById('styleAnime');
        if (styleAnime && styleAnime.checked) extraFees += 0.35;
        const burnedInCheck = document.querySelector('#multiSelectOptions input[value="burned-in"]');
        if (burnedInCheck && burnedInCheck.checked) extraFees += 0.20;

        let totalPerMinute = baseRate + extraFees;

        // 3. Use Exact Video Length if uploaded, otherwise use manual estimate
        let minutesToCharge = 10; // Failsafe
        if (exactVideoDurationMinutes > 0) {
            minutesToCharge = exactVideoDurationMinutes;
        } else {
            const manualInput = document.getElementById('runtimeInput');
            if (manualInput) minutesToCharge = parseFloat(manualInput.value) || 10;
        }

        let realCost = minutesToCharge * totalPerMinute;
        let finalPennies = Math.round(realCost * 100);
        
        // 4. STRIPE FAILSAFE: Enforce absolute $0.50 minimum to prevent system crash
        return Math.max(50, finalPennies); 
    }
    
    // 1. Initialize Stripe
    // Replace with your actual PUBLIC key (pk_test_...)
    const stripe = Stripe('pk_live_51TlXeNCejAZX7wgC4NdqWT1uTPrVRScL1JnKnrRTC5l4M4iY27WTOQaN5riQC6wNiDeMfemQrsMk0QphUdJsHPnH00qK5hV8aI'); 
    const elements = stripe.elements();

    // Match the VT323 Phosphor font of the .cc-input class
    const cardStyle = {
        base: {
            color: '#39ff14', 
            fontFamily: '"VT323", monospace', 
            fontSmoothing: 'antialiased',
            fontSize: window.innerWidth < 600 ? '16px' : '24px', 
            letterSpacing: 'normal',
            '::placeholder': {
                color: 'rgba(57, 255, 20, 0.4)' 
            },
            // --- NEW: FORCES AUTOFILL TO STAY NEON GREEN ---
            ':-webkit-autofill': {
                color: '#39ff14',
            }
        },
        invalid: {
            color: '#ff007f',
            iconColor: '#ff007f'
        }
    };

    const cardElement = elements.create('card', { style: cardStyle });
    cardElement.mount('#card-element');

    cardElement.on('change', function(event) {
        const displayError = document.getElementById('card-errors');
        if (event.error) {
            displayError.textContent = `[ ERR ] ${event.error.message.toUpperCase()}`;
        } else {
            displayError.textContent = '';
        }
    });

// --- STANDARD CREDIT CARD UPLINK LOGIC ---
    const submitPaymentBtn = document.getElementById('submitPaymentBtn');
    if (submitPaymentBtn) {
        submitPaymentBtn.addEventListener('click', async (e) => {
            e.preventDefault();

// --- NEW: VALIDATION BOUNCER FOR CREDIT CARD ---
            const pilotNameEl = document.getElementById('pilotNameInput');
            const pilotEmailEl = document.getElementById('pilotEmailInput');
            
            if (!pilotNameEl || pilotNameEl.value.trim() === '' || !pilotEmailEl || pilotEmailEl.value.trim() === '') {
                triggerInputError("[ SYSTEM FAULT ] PILOT NAME AND COORDS REQUIRED FOR UPLINK.");
                return; // Kills the function instantly so Stripe doesn't process
            }
            // ------------------------------------------------

            const originalText = submitPaymentBtn.innerText;
            submitPaymentBtn.innerText = "PROCESSING UPLINK...";
            submitPaymentBtn.style.pointerEvents = 'none';

            try {
                // 1. Fetch Intent from Vercel
                const res = await fetch('/api/create-payment-intent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: getCalculatedPennies() / 100 })
                });
                const data = await res.json();
                if (data.error) throw new Error(data.error);

                // 2. Transmit to Stripe Mainframe
                const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
                    payment_method: {
                        card: cardElement,
                        billing_details: {
                            name: document.getElementById('pilotNameInput').value || 'Unknown',
                            email: document.getElementById('pilotEmailInput').value || 'Unknown'
                        }
                    }
                });

                if (error) throw new Error(error.message);

                // 3. SUCCESS! Update UI and trigger mission
                submitPaymentBtn.innerText = "TRANSFER COMPLETE ✓";
                submitPaymentBtn.style.color = "var(--neon-green)";
                submitPaymentBtn.style.borderColor = "var(--neon-green)";
                
                triggerMissionSuccess();

            } catch (err) {
                // REVERT ON FAILURE
                submitPaymentBtn.innerText = originalText;
                submitPaymentBtn.style.pointerEvents = 'auto';
                document.getElementById('card-errors').textContent = `[ SYSTEM FAULT ] ${err.message.toUpperCase()}`;
            }
        });
    }

    // ==========================================
    // PATH B: CUSTOM DIGITAL WALLET WIRING
    // ==========================================
    // --- MISSION SUCCESS & DATA HARVESTING ---
    function triggerMissionSuccess() {
        
        // --- 1. MASSIVE DATA HARVESTER ---
        const pilotNameEl = document.getElementById('pilotNameInput');
        const pilotEmailEl = document.getElementById('pilotEmailInput');
        const pilotName = pilotNameEl && pilotNameEl.value.trim() !== '' ? pilotNameEl.value.trim() : 'HUMAN PILOT';
        const pilotEmail = pilotEmailEl && pilotEmailEl.value.trim() !== '' ? pilotEmailEl.value.trim() : '[UNKNOWN COORDS]';

        // Extract Cargo (Files)
        const movieInput = document.getElementById('hiddenMovieFileInput');
        const cargoVideo = (movieInput && movieInput.files && movieInput.files.length > 0) ? movieInput.files[0].name : 'NO VIDEO UPLOADED';

        const scriptInput = document.getElementById('hiddenScriptFileInput');
        const cargoScript = (scriptInput && scriptInput.files && scriptInput.files.length > 0) ? scriptInput.files[0].name : 'NO SCRIPT UPLOADED';

        // Core Mission Specs
        // Pulls actual metadata duration if a video was uploaded
        const runtimeInput = document.getElementById('runtimeInput');
        let projectLength = runtimeInput ? runtimeInput.value : '10';
        
        if (exactVideoDurationMinutes > 0) {
            projectLength = exactVideoDurationMinutes.toFixed(2) + ' min (Actual Metadata)';
        } else {
            projectLength = projectLength + ' min (User Estimate)';
        }

        const rateTierEl = document.querySelector('input[name="rateTier"]:checked');
        const deliverySpeed = rateTierEl ? rateTierEl.value.toUpperCase() : 'STANDARD';
        
        // Harvest Mutually Exclusive / Multi-Select Styling Checkboxes
        const styleMinimal = document.getElementById('styleMinimal');
        const styleSDH = document.getElementById('styleSDH');
        const styleAnime = document.getElementById('styleAnime');
        
        const selectedStyles = [];
        if (styleMinimal && styleMinimal.checked) selectedStyles.push(styleMinimal.value);
        if (styleSDH && styleSDH.checked) selectedStyles.push(styleSDH.value);
        if (styleAnime && styleAnime.checked) selectedStyles.push(styleAnime.value);
        
        const stylingEnvironment = selectedStyles.length > 0 ? selectedStyles.join(' + ') : 'Standard (Unspecified)';

        // Pulls the actual calculated cost based on true video length, not the manual estimate
        const exactPennies = getCalculatedPennies();
        const fundsCaptured = '$' + (exactPennies / 100).toFixed(2);

        // Arrays for Multi-Select Formats
        const formatsArray = [];
        document.querySelectorAll('#multiSelectOptions input[type="checkbox"]:checked').forEach(cb => {
            formatsArray.push(cb.nextElementSibling.innerText);
        });
        const formats = formatsArray.length > 0 ? formatsArray.join(' | ') : 'None Selected';

        // Special Instructions
        let specialInstructions = "None";
        const premiumCheck = document.getElementById('premiumCaptions');
        if (premiumCheck && premiumCheck.checked) {
            const instArea = document.querySelector('#specialInstructionsForm textarea');
            if (instArea && instArea.value.trim() !== '') {
                specialInstructions = instArea.value.trim();
            }
        }

        // 2. Populate Target Text on Modal
        const emailDisplay = document.getElementById('modalEmailDisplay');
        if (emailDisplay) {
            emailDisplay.innerHTML = pilotEmail.replace('@', '<wbr>@');
        }
        
        // 3. Launch the Pop-Up
        const modal = document.getElementById('missionSuccessModal');
        if (modal) {
            modal.classList.add('mission-active');
        } 
        
        // 4. Play Video
        const cockpitVideo = document.getElementById('ufoCockpitVideo');
        if (cockpitVideo) {
            cockpitVideo.currentTime = 0;
            cockpitVideo.play().catch(e => console.log("Autoplay prevented.", e));
        }

        // 5. Fire Backend with FULL PAYLOAD
        if (pilotEmail !== '[UNKNOWN COORDS]') {
            
            // THE EXACT PAYLOAD PACKAGE MATCHING YOUR BACKEND
            const payload = { 
                pilotName: pilotName, 
                pilotEmail: pilotEmail,
                movieFileName: cargoVideo,           // Matches backend
                scriptFileName: cargoScript,         // Matches backend
                projectLength: projectLength,        // Matches backend
                deliveryTier: deliverySpeed,         // Matches backend
                format: formats,                     // Matches backend
                styling: stylingEnvironment,         // Matches backend
                specialInstructions: specialInstructions, 
                totalCost: fundsCaptured             // Matches backend
            };

            fetch('/api/sendMission', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(err => console.error("Data dispatch failed:", err));
        }

        // --- 6. PERFECTLY SYMMETRICAL V-SHAPE LASERS ---
        const fireBtn = document.getElementById('ufoFireBtn');
        if (fireBtn) {
            fireBtn.classList.add('active');
            setTimeout(() => fireBtn.classList.remove('active'), 200);

            const laserContainer = document.getElementById('ufoLaserContainer');
            if (laserContainer) {
                const laserLeft = document.createElement('div');
                laserLeft.className = 'synth-laser-blast laser-cyan';
                laserLeft.style.transformOrigin = 'center right';
                laserLeft.style.marginLeft = '-450px'; 
                laserLeft.style.setProperty('--start-x', '0px'); 
                laserLeft.style.setProperty('--aim-x', '300px'); 
                laserLeft.style.setProperty('--angle', '-25deg'); 

                const laserRight = document.createElement('div');
                laserRight.className = 'synth-laser-blast laser-pink';
                laserRight.style.transformOrigin = 'center left';
                laserRight.style.marginLeft = '50px'; 
                laserRight.style.setProperty('--start-x', '0px'); 
                laserRight.style.setProperty('--aim-x', '-300px'); 
                laserRight.style.setProperty('--angle', '25deg'); 

                laserContainer.appendChild(laserLeft);
                laserContainer.appendChild(laserRight);

                setTimeout(() => {
                    if (laserContainer.contains(laserLeft)) laserLeft.remove();
                    if (laserContainer.contains(laserRight)) laserRight.remove();
                }, 600);
            }
        }
        
        // 7. START RANDOM ASTEROID STRIKES
        scheduleNextAsteroid();
    }

window.triggerMissionSuccess = triggerMissionSuccess;

    // --- AUTONOMOUS ASTEROID STRIKES ---
    let asteroidTimeout;
    function scheduleNextAsteroid() {
        const modal = document.getElementById('missionSuccessModal');
        if (!modal || modal.style.display === 'none') return; 

        const hull = document.getElementById('ufoShipHull');
        if (hull) {
            hull.classList.remove('asteroid-strike');
            void hull.offsetWidth; // Force CSS reflow
            hull.classList.add('asteroid-strike');
        }

        const nextHit = 4000 + (Math.random() * 8000);
        asteroidTimeout = setTimeout(scheduleNextAsteroid, nextHit);
    }

    // --- HEAVY TACTILE COCKPIT CONTROLS ---
    
    // Arrays for Monitor Color Cycling
    const monitorColors = [
        { t: 'var(--neon-green)', s: '#fff' },
        { t: 'var(--neon-pink)', s: 'var(--neon-cyan)' },
        { t: 'var(--neon-cyan)', s: 'var(--neon-pink)' },
        { t: '#ffea00', s: '#fff' },
        { t: '#fff', s: 'var(--neon-green)' }
    ];
    let m1Index = 0;
    let m2Index = 0;

    document.addEventListener('click', (e) => {
        
        // --- 1. INTERACTIVE BUTTON ROUTER ---
        const interactiveBtn = e.target.closest('.interactive-btn');
        if (interactiveBtn) {
            e.preventDefault();
            interactiveBtn.classList.add('active');
            setTimeout(() => interactiveBtn.classList.remove('active'), 200);

            const action = interactiveBtn.getAttribute('data-action');
            const colorTarget = interactiveBtn.getAttribute('data-color');
            
            // A. Trigger Glitch Animation
            if (action === 'glitch') {
                const mainMonitor1 = document.getElementById('monitor1');
                const mainMonitor2 = document.getElementById('monitor2');
                if(mainMonitor1) mainMonitor1.classList.add('random-glitch-active');
                if(mainMonitor2) mainMonitor2.classList.add('random-glitch-active');
                setTimeout(() => { 
                    if(mainMonitor1) mainMonitor1.classList.remove('random-glitch-active'); 
                    if(mainMonitor2) mainMonitor2.classList.remove('random-glitch-active'); 
                }, 400);
            }
            
            // B. Radar Color Shift & Spawn Bogeys (Bulletproof Class Toggle)
            if (action === 'radar') {
                const radar = document.getElementById('synthRadar');
                const sweep = document.getElementById('radarSweepEl');
                
                // 1. Toggle the CSS class instead of string matching inline styles
                if (sweep) {
                    sweep.classList.toggle('radar-sweep-cyan');
                }
                
                // 2. Spawn 3 random blips inside the circular scope
                if (radar) {
                    for(let i = 0; i < 3; i++) {
                        const bogey = document.createElement('div');
                        bogey.className = 'radar-bogey';
                        // Keep them inside the circle
                        const radius = Math.random() * 20; 
                        const angle = Math.random() * Math.PI * 2;
                        bogey.style.top = `calc(50% + ${Math.sin(angle) * radius}px)`;
                        bogey.style.left = `calc(50% + ${Math.cos(angle) * radius}px)`;
                        radar.appendChild(bogey);
                        setTimeout(() => bogey.remove(), 1500 + Math.random() * 2000);
                    }
                }
            }

            // C. Monitor Color Profiles
            if (colorTarget === 'green') {
                m1Index = (m1Index + 1) % monitorColors.length;
                const m1Text = document.getElementById('monitor1Text');
                if (m1Text) {
                    m1Text.style.color = monitorColors[m1Index].t;
                    m1Text.style.textShadow = `0 0 10px ${monitorColors[m1Index].t}`;
                }
            }
            if (colorTarget === 'pink') {
                m2Index = (m2Index + 1) % monitorColors.length;
                const m2Sub = document.getElementById('monitor2Sub');
                const m2Email = document.getElementById('modalEmailDisplay');
                if (m2Sub && m2Email) {
                    m2Sub.style.color = monitorColors[m2Index].t;
                    m2Sub.style.textShadow = `0 0 10px ${monitorColors[m2Index].t}`;
                    m2Email.style.color = monitorColors[m2Index].s;
                    m2Email.style.textShadow = `0 0 10px ${monitorColors[m2Index].s}`;
                }
            }
        }

        // --- 2. PERFECT V-SHAPE SYMMETRICAL LASERS ---
        const fireBtn = e.target.closest('#ufoFireBtn');
        if (fireBtn) {
            e.preventDefault();
            fireBtn.classList.add('active');
            setTimeout(() => fireBtn.classList.remove('active'), 200);

            const laserContainer = document.getElementById('ufoLaserContainer');
            if (laserContainer) {
                // Left Beam: Starts 5% off left edge, angles Up & Right (-60 degrees)
                const laserLeft = document.createElement('div');
                laserLeft.className = 'synth-laser-blast laser-cyan';
                laserLeft.style.left = '5%';
                laserLeft.style.setProperty('--start-x', '0px'); 
                laserLeft.style.setProperty('--aim-x', '300px'); 
                laserLeft.style.setProperty('--angle', '-60deg'); 

                // Right Beam: Starts 5% off right edge, angles Up & Left (-120 degrees)
                const laserRight = document.createElement('div');
                laserRight.className = 'synth-laser-blast laser-pink';
                laserRight.style.right = '5%';
                laserRight.style.setProperty('--start-x', '0px'); 
                laserRight.style.setProperty('--aim-x', '-300px'); 
                laserRight.style.setProperty('--angle', '-120deg'); 

                laserContainer.appendChild(laserLeft);
                laserContainer.appendChild(laserRight);

                setTimeout(() => {
                    if (laserContainer.contains(laserLeft)) laserLeft.remove();
                    if (laserContainer.contains(laserRight)) laserRight.remove();
                }, 600);
            }
        }

        // --- 3. HEAVY SHIP TILT ---
        const popupBox = document.getElementById('ufoShipHull');

        if (e.target.closest('#tiltLeftBtn') && popupBox) {
            e.preventDefault();
            popupBox.classList.add('ship-tilt-left');
            setTimeout(() => { popupBox.classList.remove('ship-tilt-left'); }, 500);
        }
        if (e.target.closest('#tiltRightBtn') && popupBox) {
            e.preventDefault();
            popupBox.classList.add('ship-tilt-right');
            setTimeout(() => { popupBox.classList.remove('ship-tilt-right'); }, 500);
        }

        // --- 4. ABORT BUTTON ---
        const abortBtn = e.target.closest('#closeMissionModalBtn');
        if (abortBtn) {
            e.preventDefault();
            
            const modal = document.getElementById('missionSuccessModal');
            if (modal) {
                modal.classList.remove('mission-active');
            }
            
            clearTimeout(asteroidTimeout); 
            
            const cockpitVideo = document.getElementById('ufoCockpitVideo');
            if (cockpitVideo) cockpitVideo.pause();
            
            // --> TRIGGER THE FULL SYSTEM PURGE <--
            resetArcadeState();
            
            const textSpans = document.querySelectorAll('.payment-name');
            textSpans.forEach(span => {
                if(span.innerText.includes('COMPLETE')) span.innerText = span.getAttribute('data-original') || 'PAYMENT';
            });
            
            executeLayerSwitch('mainMenuLayer');
        }
    });

    // --- 1. DIGITAL WALLET (APPLE PAY / GOOGLE PAY) LOGIC ---
    const paymentRequest = stripe.paymentRequest({
        country: 'US',
        currency: 'usd',
        total: {
            label: 'Subtitle Arcade Mission',
            amount: 1500, 
        },
        requestPayerName: false,
        requestPayerEmail: false,
    });

    // Helper to flash an error without permanently ruining the button's look
    const bindUnavailableFlash = (btn) => {
        if (!btn) return;
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const textSpan = btn.querySelector('.payment-name');
            const originalText = textSpan.innerText;
            textSpan.innerText = "UNAVAILABLE";
            btn.style.borderColor = "var(--neon-pink)";
            
            setTimeout(() => {
                textSpan.innerText = originalText;
                btn.style.borderColor = "";
            }, 2000);
        });
    };

    paymentRequest.canMakePayment().then((result) => {
        const triggerWallet = (e) => {
            e.preventDefault();

            // --- ADDED: VALIDATION BOUNCER FOR DIGITAL WALLETS ---
            const pilotNameEl = document.getElementById('pilotNameInput');
            const pilotEmailEl = document.getElementById('pilotEmailInput');
            
            if (!pilotNameEl || pilotNameEl.value.trim() === '' || !pilotEmailEl || pilotEmailEl.value.trim() === '') {
                triggerInputError("[ SYSTEM FAULT ] PILOT NAME AND COORDS REQUIRED FOR UPLINK.");
                return; // Kills the function so the wallet doesn't open
            }
            // ------------------------------------------------------

            paymentRequest.update({
                total: { label: 'Subtitle Arcade Mission', amount: getCalculatedPennies() }
            });
            paymentRequest.show(); 
        };

        if (result && result.applePay && applePayBtn) {
            applePayBtn.addEventListener('click', triggerWallet);
        } else {
            bindUnavailableFlash(applePayBtn);
        }

        if (result && result.googlePay && googlePayBtn) {
            googlePayBtn.addEventListener('click', triggerWallet);
        } else {
            bindUnavailableFlash(googlePayBtn);
        }
    });

    paymentRequest.on('paymentmethod', async (ev) => {
        try {
            const intentRes = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: getCalculatedPennies() / 100 })
            });
            const intentData = await intentRes.json();

            // Catch backend errors before Stripe crashes
            if (intentData.error) throw new Error(intentData.error);

            const { error, paymentIntent } = await stripe.confirmCardPayment(
                intentData.clientSecret,
                { payment_method: ev.paymentMethod.id },
                { handleActions: false }
            );

            if (error) {
                ev.complete('fail');
                document.getElementById('card-errors').textContent = `[ WALLET FAULT ] ${error.message.toUpperCase()}`;
            } else {
                
                ev.complete('success');
                // TRIGGER THE MISSION SEQUENCE
                triggerMissionSuccess(); 
            }
        } catch (err) {
            ev.complete('fail');
            document.getElementById('card-errors').textContent = `[ SYSTEM FAULT ] ${err.message.toUpperCase()}`;
        }
    });

    // --- 2. PAYPAL POP-UP UPLINK LOGIC ---
    if (paypalBtn) {
        paypalBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            // --- UPDATED: VALIDATION BOUNCER WITH NEON ALERT ---
            const pilotEmailEl = document.getElementById('pilotEmailInput');
            if (!pilotEmailEl || pilotEmailEl.value.trim() === '') {
                triggerInputError("[ SYSTEM FAULT ] RETURN COORDS (EMAIL) REQUIRED FOR UPLINK.");
                return; // Kills the function so the popup doesn't open
            }
            // ---------------------------------------------------
            const textSpan = paypalBtn.querySelector('.payment-name');
            const originalText = textSpan.innerText;
            
            textSpan.innerText = "CONNECTING...";
            paypalBtn.style.pointerEvents = 'none';

            try {
                // 1. Fetch direct PayPal approval link AND the Order ID
                const res = await fetch('/api/create-paypal-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: getCalculatedPennies() / 100 })
                });
                
                const data = await res.json();
                if (data.error) throw new Error(data.error);

                const currentOrderId = data.orderId; // Store the ID for the capture phase

                // 2. Calculate the center of the screen
                const width = 450;
                const height = 600;
                const left = window.screenX + (window.outerWidth - width) / 2;
                const top = window.screenY + (window.outerHeight - height) / 2;
                
                // 3. Launch the mini-browser overlay
                window.open(data.url, 'PayPal_Uplink', `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`);

                // 4. Wait for the signal from the API callback
                const handleMessage = async (event) => {
                    if (event.origin !== window.location.origin) return;

                    if (event.data === 'PAYPAL_SUCCESS') {
                        window.removeEventListener('message', handleMessage);
                        textSpan.innerText = "CAPTURING FUNDS...";

                        try {
                            // 5. Fire the Capture Node using the stored Order ID
                            const captureRes = await fetch('/api/capture-paypal-order', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ orderID: currentOrderId })
                            });

                            const captureData = await captureRes.json();
                            if (captureData.error) throw new Error(captureData.error);

                            // 6. SUCCESS! Update UI
                            textSpan.innerText = "TRANSFER COMPLETE ✓";
                            paypalBtn.style.color = "var(--neon-green)";
                            paypalBtn.style.borderColor = "var(--neon-green)";
                            paypalBtn.style.background = "rgba(57, 255, 20, 0.05)";
                            
                            // TRIGGER THE MISSION SEQUENCE
                            triggerMissionSuccess();

                        } catch (captureErr) {
                            textSpan.innerText = originalText;
                            paypalBtn.style.pointerEvents = 'auto';
                            document.getElementById('card-errors').textContent = `[ CAPTURE FAULT ] ${captureErr.message.toUpperCase()}`;
                        }

                    } else if (event.data === 'PAYPAL_CANCEL') {
                        window.removeEventListener('message', handleMessage);
                        textSpan.innerText = originalText;
                        paypalBtn.style.pointerEvents = 'auto';
                        document.getElementById('card-errors').textContent = "[ PAYPAL FAULT ] PILOT ABORTED SEQUENCE.";
                    }
                };

                window.addEventListener('message', handleMessage);

            } catch (err) {
                textSpan.innerText = originalText;
                paypalBtn.style.pointerEvents = 'auto';
                document.getElementById('card-errors').textContent = `[ PAYPAL FAULT ] ${err.message.toUpperCase()}`;
            }
        });
    }
    // ==========================================
// --- SECURE CONTACT FORM COMM-LINK ---
    const sendContactBtn = document.getElementById('sendContactBtn');
    
    if (sendContactBtn) {
        sendContactBtn.addEventListener('click', async (e) => {
            e.preventDefault(); // Stops the browser from reloading or warning

            const nameEl = document.getElementById('contactName');
            const emailEl = document.getElementById('contactEmail');
            const messageEl = document.getElementById('contactMessage');

            const name = nameEl ? nameEl.value.trim() : '';
            const email = emailEl ? emailEl.value.trim() : '';
            const message = messageEl ? messageEl.value.trim() : '';

            // Validation Check
            if (!name || !email || !message) {
                const originalText = sendContactBtn.innerText;
                sendContactBtn.innerText = "ERR: MISSING DATA";
                sendContactBtn.style.color = "var(--neon-pink)";
                sendContactBtn.style.borderColor = "var(--neon-pink)";
                
                setTimeout(() => {
                    sendContactBtn.innerText = originalText;
                    sendContactBtn.style.color = "";
                    sendContactBtn.style.borderColor = "";
                }, 2000);
                return;
            }

            // Begin Transmission
            sendContactBtn.innerText = "TRANSMITTING...";
            sendContactBtn.style.color = "var(--neon-cyan)";
            sendContactBtn.style.borderColor = "var(--neon-cyan)";

            try {
                const res = await fetch('/api/sendContact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, message })
                });

                if (!res.ok) throw new Error('Transmission failed');

                // Success Visuals & Form Clear
                sendContactBtn.innerText = "MESSAGE SECURED ✓";
                sendContactBtn.style.color = "var(--neon-green)";
                sendContactBtn.style.borderColor = "var(--neon-green)";
                sendContactBtn.style.background = "rgba(57, 255, 20, 0.05)";
                
                if(nameEl) nameEl.value = '';
                if(emailEl) emailEl.value = '';
                if(messageEl) messageEl.value = '';

            } catch (err) {
                console.error(err);
                sendContactBtn.innerText = "COMM-LINK FAILED. RETRY.";
                sendContactBtn.style.color = "var(--neon-pink)";
                sendContactBtn.style.borderColor = "var(--neon-pink)";
            }
        });
    }

// --- CARTOON WORD BUBBLE & SMOKE ENGINE ---
    const formatHelpIcon = document.getElementById('formatHelpIcon');
    const helpIconWrapper = document.getElementById('helpIconWrapper');
    const smokeBurst = document.getElementById('smokeBurst');
    const matrixSection = document.getElementById('formatMultiSelect');
    
    if (formatHelpIcon && helpIconWrapper) {
        
        // 1. Create the global speech bubble
        const tooltip = document.createElement('div');
        tooltip.className = 'pro-arcade-tooltip';
        tooltip.innerHTML = "WHAT ARE ALL THESE<br>RANDOM LETTERS?<br><br>WHAT AM I SUPPOSED<br>TO PICK?!";
        document.body.appendChild(tooltip);

        // 2. Navigation Click Handler (Slides drawer in)
        formatHelpIcon.addEventListener('click', (e) => {
            e.preventDefault();
            const formatDb = document.getElementById('formatInterface');
            formatDb.classList.add('side-drawer');
            formatDb.classList.remove('spa-layer');
            void formatDb.offsetWidth; // Forces CSS to recognize the change
            formatDb.classList.add('open'); 
            
            tooltip.classList.remove('visible'); 
            setTimeout(() => {
                tooltip.style.top = '-9999px';
                tooltip.style.left = '-9999px';
            }, 200); 
        });

        // 3. Hover / Touch Logic
        const showTooltip = () => {
            const rect = formatHelpIcon.getBoundingClientRect();
            const scrollY = window.scrollY || window.pageYOffset;
            const scrollX = window.scrollX || window.pageXOffset;
            
            tooltip.style.top = `${rect.top + scrollY - 140}px`; 
            tooltip.style.left = `${rect.left + scrollX - 118}px`; 
            
            tooltip.classList.add('visible');
        };

        const hideTooltip = () => {
            tooltip.classList.remove('visible');
            setTimeout(() => {
                if (!tooltip.classList.contains('visible')) {
                    tooltip.style.top = '-9999px';
                    tooltip.style.left = '-9999px';
                }
            }, 200);
        };

        // Desktop Mouse Listeners
        formatHelpIcon.addEventListener('mouseenter', showTooltip);
        formatHelpIcon.addEventListener('mouseleave', hideTooltip);

        // Mobile Touch Listeners
        formatHelpIcon.addEventListener('touchstart', showTooltip, {passive: true});
        formatHelpIcon.addEventListener('touchend', () => {
            setTimeout(hideTooltip, 1500); 
        });

        // 4. Viewport Observer for Smoke & Help Icon (SPA Reset Ready)
        if (smokeBurst && matrixSection) {
            let smokeTimer, popTimer; // Memory for the timers so we can cancel them

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        
                        // Wait a full 800ms after scrolling into view
                        smokeTimer = setTimeout(() => {
                            
                            // 1. Trigger the main smoke burst
                            smokeBurst.classList.add('active');
                            
                            // 2. Fire the 6 little cartoon puffs outward (slightly wider spread)
                            for(let i = 0; i < 6; i++) {
                                const puff = document.createElement('div');
                                puff.className = 'smoke-puff';
                                const angle = (Math.PI * 2 / 6) * i + (Math.random() * 0.5);
                                puff.style.setProperty('--tx', `${Math.cos(angle) * 45}px`);
                                puff.style.setProperty('--ty', `${Math.sin(angle) * 45}px`);
                                helpIconWrapper.appendChild(puff);
                                
                                // Clean up the DOM after slower animation
                                setTimeout(() => puff.remove(), 1000);
                            }

                            // 3. Wait 400ms for the smoke to fully billow before popping the Question Mark
                            popTimer = setTimeout(() => {
                                formatHelpIcon.classList.add('active');
                            }, 400); 
                            
                        }, 800); 
                    } else {
                        // THE FIX: If they leave the page or scroll away, reset everything!
                        clearTimeout(smokeTimer);
                        clearTimeout(popTimer);
                        smokeBurst.classList.remove('active');
                        formatHelpIcon.classList.remove('active');
                    }
                });
            }, { threshold: 0.1 });
            observer.observe(matrixSection);
        }
    }
});

// ^^^ STRICTLY CLOSED DOMContentLoaded.

// ^^^ STRICTLY CLOSED DOMContentLoaded.

// ========================================================
// SECTION D: HIGH-RES CANVAS ACTION VIGNETTE
// ========================================================
const vCanvas = document.getElementById('vignetteCanvas');
if (vCanvas) {
    vCanvas.width = 600; vCanvas.height = 250;
    const vctx = vCanvas.getContext('2d');
    let vFrame = 0; let vSparks = [];
    const vBgStars = [];
    for(let i = 0; i < 20; i++) {
        vBgStars.push({ x: Math.random() * 600, y: Math.random() * 250, size: Math.random() * 2, twinkle: Math.random() * Math.PI * 2 });
    }

    let currentScale = 1; let currentOffsetX = 0; let currentOffsetY = 0;

    function drawSleekRect(ctx, x, y, w, h, r, gradient) {
        ctx.fillStyle = gradient; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
    }

    function drawVignette() {
        if (vCanvas.clientWidth === 0) { requestAnimationFrame(drawVignette); return; }
        vFrame++; let cycle = vFrame % 420;

        let botAlive = true; let botX = 150; let botY = 160 + Math.sin(vFrame * 0.2) * 2;
        let botAngle = 0; let rangerX = 650; let targetScale = 1;
        let targetOffsetX = 0; let targetOffsetY = 0;

        if (cycle >= 360) { rangerX = 650; } 
        else if (cycle >= 320) { rangerX = 420 + ((cycle - 320) / 40) * 230; } 
        else if (cycle >= 100) { rangerX = 420; } 
        else if (cycle >= 60) { rangerX = 650 - ((cycle - 60) / 40) * 230; } 
        else { rangerX = 650; }

        if (cycle >= 360) { botAlive = true; botX = -50 + ((cycle - 360) / 60) * 200; } 
        else if (cycle >= 320) { botAlive = false; botX = 150; botY = 215 + ((cycle - 320) / 40) * 100; botAngle = -Math.PI / 2.2; } 
        else if (cycle >= 120) { botAlive = false; botX = 150; botY = 215; botAngle = -Math.PI / 2.2; }

        if (cycle > 180 && cycle < 300) {
            targetScale = 3.2; 
            let focusX = rangerX - 25; let focusY = 150;
            targetOffsetX = (vCanvas.width / 2) - (focusX * targetScale);
            targetOffsetY = (vCanvas.height / 2) - (focusY * targetScale);
        }

        currentScale += (targetScale - currentScale) * 0.06;
        currentOffsetX += (targetOffsetX - currentOffsetX) * 0.06;
        currentOffsetY += (targetOffsetY - currentOffsetY) * 0.06;

        vctx.clearRect(0, 0, vCanvas.width, vCanvas.height);
        vctx.save();
        vctx.translate(currentOffsetX, currentOffsetY); vctx.scale(currentScale, currentScale);

        vctx.fillStyle = '#040a18'; vctx.fillRect(-200, -200, 1000, 600); 

        vBgStars.forEach(s => {
            let a = 0.5 + Math.sin(vFrame * 0.05 + s.twinkle) * 0.5;
            vctx.fillStyle = `rgba(255, 255, 255, ${a})`; vctx.fillRect(s.x, s.y, s.size, s.size);
        });

        let pg = vctx.createRadialGradient(120, 60, 10, 120, 60, 45);
        pg.addColorStop(0, '#ff007f'); pg.addColorStop(1, 'transparent');
        vctx.fillStyle = pg; vctx.fillRect(70, 10, 100, 100);
        vctx.strokeStyle = '#ffea00'; vctx.lineWidth = 2; vctx.beginPath(); 
        vctx.ellipse(120, 60, 65, 10, Math.PI/6, 0, Math.PI*2); vctx.stroke();

        vctx.fillStyle = '#00f0ff'; vctx.beginPath(); vctx.arc(480, 40, 12, 0, Math.PI*2); vctx.fill();

        let ufoBgX = (vFrame * 0.8) % 900 - 100;
        vctx.save();
        vctx.translate(ufoBgX, 80 + Math.sin(vFrame * 0.05) * 10);
        vctx.fillStyle = 'rgba(0, 240, 255, 0.4)'; vctx.beginPath(); vctx.arc(0, -3, 8, Math.PI, 0); vctx.fill();
        vctx.fillStyle = '#95a5a6'; vctx.beginPath(); vctx.ellipse(0, 0, 18, 4, 0, 0, Math.PI * 2); vctx.fill();
        vctx.restore();

        vctx.shadowBlur = 15; vctx.shadowColor = '#1f4e1f';
        vctx.strokeStyle = '#27ae60'; vctx.lineWidth = 3;
        vctx.beginPath(); vctx.moveTo(-100, 230); vctx.lineTo(800, 230); vctx.stroke();
        vctx.shadowBlur = 0; 

        let termGrad = vctx.createLinearGradient(40, 110, 120, 230);
        termGrad.addColorStop(0, '#34495e'); termGrad.addColorStop(1, '#111');
        drawSleekRect(vctx, 40, 110, 80, 120, 8, termGrad);
        vctx.fillStyle = '#000'; vctx.fillRect(50, 120, 60, 60);
        vctx.strokeStyle = '#39ff14'; vctx.lineWidth = 2; vctx.shadowBlur = 10; vctx.shadowColor = '#39ff14';
        vctx.strokeRect(50, 120, 60, 60); vctx.shadowBlur = 0;
        
        vctx.save(); vctx.beginPath(); vctx.rect(50, 120, 60, 60); vctx.clip();
        vctx.fillStyle = 'rgba(57,255,20,0.5)';
        let offset = -(vFrame * 1.5) % 20;
        for(let i = 0; i < 80; i += 12) { vctx.fillRect(52, 120 + i + offset, 40 + Math.sin(i)*10, 3); }
        vctx.restore();

        vctx.save(); vctx.translate(botX, botY); vctx.rotate(botAngle);

        if(botAlive) {
            let metalGrad = vctx.createLinearGradient(-20, 10, 20, 55);
            metalGrad.addColorStop(0, '#5D6D7E'); metalGrad.addColorStop(1, '#2c3e50');
            drawSleekRect(vctx, -25, 55, 10, 15, 2, '#1c1f24'); drawSleekRect(vctx, -15, 55, 30, 15, 4, '#4f5d65');
            drawSleekRect(vctx, -20, 10, 40, 45, 6, metalGrad); drawSleekRect(vctx, -15, -15, 30, 20, 4, '#34495e');
            vctx.fillStyle = '#0a0a0a'; vctx.fillRect(-10, -10, 20, 10);
            vctx.shadowBlur = 15; vctx.shadowColor = '#ff0055'; vctx.fillStyle = '#ff0055'; 
            let eyeX = -8 + Math.sin(vFrame * 0.1) * 6; vctx.fillRect(eyeX, -8, 5, 6);
            vctx.shadowBlur = 0; drawSleekRect(vctx, -30 + Math.sin(vFrame)*3, 25, 25, 8, 3, '#7a8d96');
        } else {
            drawSleekRect(vctx, -20, 10, 40, 45, 6, '#1a1c20'); drawSleekRect(vctx, -15, -15, 30, 20, 4, '#111');
        }
        vctx.restore();

        if(cycle === 120) {
            for(let s=0; s<15; s++) {
                vSparks.push({ x: botX, y: botY + 20, vx: (Math.random()-0.5)*18, vy: (Math.random()-0.8)*18, life: 30 + Math.random()*20 });
            }
        }

        let rangerGunUp = cycle >= 80 && cycle < 140;
        let rangerThumbUp = cycle >= 160 && cycle < 310;

        vctx.save(); vctx.translate(rangerX, 160);
        let armorGrad = vctx.createLinearGradient(-15, 0, 15, 50);
        armorGrad.addColorStop(0, '#ffffff'); armorGrad.addColorStop(1, '#bdc3c7');

        drawSleekRect(vctx, -5, 5, 25, 35, 4, '#2980b9'); drawSleekRect(vctx, -15, 0, 30, 50, 8, armorGrad);
        vctx.fillStyle = '#ecf0f1'; vctx.beginPath(); vctx.arc(0, -15, 18, 0, Math.PI*2); vctx.fill();
        vctx.shadowBlur = 10; vctx.shadowColor = '#00f0ff';
        vctx.fillStyle = '#00f0ff'; vctx.beginPath(); vctx.arc(-4, -15, 14, Math.PI*0.6, Math.PI*1.4); vctx.fill();
        vctx.shadowBlur = 0;

        if (rangerGunUp) {
            drawSleekRect(vctx, -50, 12, 45, 12, 4, '#2c3e50'); drawSleekRect(vctx, -60, 15, 15, 6, 2, '#95a5a6'); 
        } else if (rangerThumbUp) {
            vctx.shadowBlur = 12; vctx.shadowColor = '#ffffff';
            drawSleekRect(vctx, -25, -5, 14, 28, 5, armorGrad); 
            drawSleekRect(vctx, -29, -12, 16, 16, 3, '#ffffff'); drawSleekRect(vctx, -29, -22, 6, 12, 3, '#ffffff'); 
            vctx.strokeStyle = '#bdc3c7'; vctx.lineWidth = 1.5; vctx.beginPath();
            vctx.moveTo(-22, -8); vctx.lineTo(-14, -8); vctx.moveTo(-22, -4); vctx.lineTo(-14, -4);
            vctx.moveTo(-22, 0); vctx.lineTo(-14, 0); vctx.stroke(); vctx.shadowBlur = 0;
            if (cycle > 190 && cycle < 280) {
                let blingScale = Math.abs(Math.sin(vFrame * 0.15)); vctx.fillStyle = '#ffffff'; vctx.beginPath();
                vctx.ellipse(-26, -24, 2*blingScale, 10*blingScale, 0, 0, Math.PI*2); vctx.ellipse(-26, -24, 10*blingScale, 2*blingScale, 0, 0, Math.PI*2); vctx.fill();
            }
        } else { drawSleekRect(vctx, -10, 10, 12, 35, 4, armorGrad); }
        vctx.restore();

        if (cycle > 120 && cycle < 128) {
            vctx.shadowBlur = 20; vctx.shadowColor = '#39ff14';
            vctx.strokeStyle = '#39ff14'; vctx.lineWidth = 8;
            vctx.beginPath(); vctx.moveTo(rangerX - 60, 175); vctx.lineTo(botX, 180); vctx.stroke();
            vctx.strokeStyle = '#fff'; vctx.lineWidth = 3; vctx.stroke(); vctx.shadowBlur = 0;
        }

        for(let i = vSparks.length - 1; i >= 0; i--) {
            let s = vSparks[i]; s.x += s.vx; s.y += s.vy; s.vy += 0.8; s.life--; vctx.shadowBlur = 10;
            if (s.life > 20) { vctx.fillStyle = '#ffffff'; vctx.shadowColor = '#ffffff'; }
            else if (s.life > 10) { vctx.fillStyle = '#00f0ff'; vctx.shadowColor = '#00f0ff'; }
            else { vctx.fillStyle = '#ff007f'; vctx.shadowColor = '#ff007f'; }
            vctx.beginPath(); vctx.arc(s.x, s.y, (s.life/10) + 1, 0, Math.PI*2); vctx.fill(); vctx.shadowBlur = 0;
            if(s.life <= 0) vSparks.splice(i, 1);
        }
        vctx.restore(); requestAnimationFrame(drawVignette);
    }
    drawVignette();
}

// ========================================================
// SECTION E: INTEL PAGE CANVAS
// ========================================================
const intelCanvas = document.getElementById('intelBgCanvas');
if (intelCanvas) {
    const ictx = intelCanvas.getContext('2d'); let iFrame = 0;
    function syncIntelDimensions() {
        if (intelCanvas.clientWidth === 0) return;
        if (intelCanvas.width !== intelCanvas.clientWidth || intelCanvas.height !== intelCanvas.clientHeight) {
            intelCanvas.width = intelCanvas.clientWidth; intelCanvas.height = intelCanvas.clientHeight;
        }
    }
    window.addEventListener('resize', syncIntelDimensions);

    const iStars = [];
    for (let i = 0; i < 80; i++) {
        iStars.push({ x: Math.random(), y: Math.random(), size: Math.random() * 2 + 1, twinkle: Math.random() * Math.PI * 2, speed: 0.02 + Math.random() * 0.03 });
    }

    let satellite = { x: -100, y: 0, angle: 0 }; let intelUfo = { x: 0, y: 0, active: false, type: 0 };

    function drawIntelScene() {
        if (intelCanvas.clientWidth === 0) { requestAnimationFrame(drawIntelScene); return; }
        syncIntelDimensions(); ictx.clearRect(0, 0, intelCanvas.width, intelCanvas.height); iFrame++;

        iStars.forEach(star => {
            star.twinkle += star.speed; let alpha = 0.2 + Math.abs(Math.sin(star.twinkle)) * 0.8;
            ictx.fillStyle = `rgba(255, 255, 255, ${alpha})`; ictx.fillRect(star.x * intelCanvas.width, star.y * intelCanvas.height, star.size, star.size);
        });

        let gw = intelCanvas.width; let gh = intelCanvas.height;
        ictx.save(); ictx.translate(gw * 0.85, gh * 0.15); ictx.fillStyle = '#1c0d2e'; ictx.beginPath(); ictx.arc(0, 0, 150, 0, Math.PI * 2); ictx.fill();
        ictx.save(); ictx.fillStyle = '#2ecc71'; ictx.beginPath(); ictx.arc(0, 0, 150, Math.PI * 0.4, Math.PI * 1.4); ictx.clip();
        ictx.fillStyle = 'rgba(0, 240, 255, 0.2)'; ictx.fillRect(-150, -150, 300, 300); ictx.restore();
        ictx.strokeStyle = 'rgba(57, 255, 20, 0.85)'; ictx.lineWidth = 6; ictx.beginPath(); ictx.ellipse(0, 0, 200, 40, Math.PI/6, 0, Math.PI*2); ictx.stroke(); ictx.restore();

        ictx.save(); ictx.translate(gw * 0.1, gh * 0.8); ictx.fillStyle = '#8e44ad'; ictx.beginPath(); ictx.arc(0, 0, 40, 0, Math.PI * 2); ictx.fill();
        ictx.fillStyle = '#732d91'; ictx.fillRect(-12, -12, 12, 12); ictx.fillRect(10, 5, 15, 15); ictx.fillRect(-5, 15, 8, 8); ictx.restore();

        satellite.x = (iFrame * 0.4) % (gw + 200) - 100; satellite.y = gh * 0.6 + Math.sin(iFrame * 0.005) * 100; satellite.angle += 0.01;
        ictx.save(); ictx.translate(satellite.x, satellite.y); ictx.rotate(satellite.angle);
        ictx.fillStyle = '#2980b9'; ictx.fillRect(-45, -10, 30, 20); ictx.fillRect(15, -10, 30, 20);
        ictx.fillStyle = '#bdc3c7'; ictx.fillRect(-15, -2, 10, 4); ictx.fillRect(5, -2, 10, 4);
        ictx.fillStyle = '#7f8c8d'; ictx.fillRect(-12, -12, 24, 24);
        if (iFrame % 30 < 15) { ictx.fillStyle = '#e74c3c'; ictx.fillRect(-3, -3, 6, 6); }
        ictx.restore();

        if (!intelUfo.active && Math.random() < 0.005) { intelUfo.active = true; intelUfo.x = gw + 50; intelUfo.y = gh * 0.3 + Math.random() * 100; intelUfo.type = Math.floor(Math.random() * 3); }

        if (intelUfo.active) {
            intelUfo.x -= 6; ictx.save(); ictx.translate(intelUfo.x, intelUfo.y + Math.sin(iFrame * 0.1) * 15);
            if (intelUfo.type === 0) {
                ictx.fillStyle = 'rgba(0, 240, 255, 0.5)'; ictx.beginPath(); ictx.arc(0, -3, 10, Math.PI, 0); ictx.fill();
                ictx.fillStyle = '#95a5a6'; ictx.beginPath(); ictx.ellipse(0, 0, 22, 6, 0, 0, Math.PI * 2); ictx.fill();
                if (iFrame % 16 < 8) { ictx.fillStyle = '#ff007f'; ictx.fillRect(-14, 0, 4, 4); ictx.fillRect(10, 0, 4, 4); ictx.fillStyle = '#39ff14'; ictx.fillRect(-2, 2, 4, 4); }
            } else if (intelUfo.type === 1) {
                ictx.fillStyle = '#39ff14'; ictx.fillRect(-12, -8, 24, 16); ictx.fillRect(-20, -4, 8, 8); ictx.fillRect(12, -4, 8, 8);
                ictx.fillStyle = '#000'; ictx.fillRect(-8, -4, 4, 4); ictx.fillRect(4, -4, 4, 4);
            } else {
                ictx.fillStyle = '#ffea00'; ictx.beginPath(); ictx.moveTo(0, -12); ictx.lineTo(-16, 8); ictx.lineTo(16, 8); ictx.fill();
                ictx.fillStyle = '#ff007f'; ictx.fillRect(-6, 8, 12, 6);
            }
            ictx.restore(); if (intelUfo.x < -50) intelUfo.active = false;
        }
        requestAnimationFrame(drawIntelScene);
    }
    drawIntelScene();
}

// ========================================================
// SECTION F: TROPHIES PAGE CANVAS
// ========================================================
const tCanvas = document.getElementById('trophiesBgCanvas');
if (tCanvas) {
    const tctx = tCanvas.getContext('2d'); let tFrame = 0;
    function syncTrophiesDimensions() {
        if (tCanvas.clientWidth === 0) return;
        if (tCanvas.width !== tCanvas.clientWidth || tCanvas.height !== tCanvas.clientHeight) {
            tCanvas.width = tCanvas.clientWidth; tCanvas.height = tCanvas.clientHeight;
        }
    }
    window.addEventListener('resize', syncTrophiesDimensions);

    const tStars = [];
    for (let i = 0; i < 25; i++) {
        tStars.push({ x: Math.random(), y: Math.random(), size: Math.random() * 3 + 1, twinkle: Math.random() * Math.PI * 2, speed: 0.05 + Math.random() * 0.05 });
    }

    let tUfos = []; let tLasers = []; let tPlanets = []; let tParticles = [];

    function drawTrophiesScene() {
        if (tCanvas.clientWidth === 0) { requestAnimationFrame(drawTrophiesScene); return; }
        syncTrophiesDimensions(); tctx.clearRect(0, 0, tCanvas.width, tCanvas.height); tFrame++;
        let tw = tCanvas.width; let th = tCanvas.height; let centerX = tw / 2; let centerY = th / 2;

        tStars.forEach(star => {
            star.twinkle += star.speed; let alpha = 0.1 + Math.abs(Math.sin(star.twinkle)) * 0.9;
            tctx.fillStyle = (Math.random() < 0.05) ? '#ff007f' : `rgba(255, 255, 255, ${alpha})`;
            tctx.fillRect(star.x * tw, star.y * th, star.size, star.size);
        });

        if (Math.random() < 0.02 && tUfos.length < 4) {
            let startLeft = Math.random() > 0.5;
            tUfos.push({ x: startLeft ? -50 : tw + 50, y: Math.random() * (th * 0.4), vx: startLeft ? (3 + Math.random() * 4) : -(3 + Math.random() * 4), vy: Math.sin(tFrame * 0.05) * 2, type: Math.floor(Math.random() * 3), fireTimer: 0 });
        }

        for(let i = tUfos.length - 1; i >= 0; i--) {
            let u = tUfos[i]; u.x += u.vx; u.y += Math.sin(tFrame * 0.1) * 3; u.fireTimer++;
            tctx.save(); tctx.translate(u.x, u.y);
            if (u.type === 0) {
                tctx.fillStyle = 'rgba(0, 240, 255, 0.6)'; tctx.fillRect(-8, -10, 16, 10);
                tctx.fillStyle = '#ff0055'; tctx.fillRect(-20, 0, 40, 8);
                if(tFrame % 10 < 5) { tctx.fillStyle = '#fff'; tctx.fillRect(-15, 2, 4, 4); tctx.fillRect(11, 2, 4, 4); }
            } else if (u.type === 1) {
                tctx.fillStyle = '#39ff14'; tctx.fillRect(-12, -8, 24, 16); tctx.fillRect(-20, -4, 8, 8); tctx.fillRect(12, -4, 8, 8);
                tctx.fillStyle = '#000'; tctx.fillRect(-8, -4, 4, 4); tctx.fillRect(4, -4, 4, 4);
            } else {
                tctx.fillStyle = '#ffea00'; tctx.beginPath(); tctx.moveTo(0, -12); tctx.lineTo(-16, 8); tctx.lineTo(16, 8); tctx.fill();
                tctx.fillStyle = '#ff007f'; tctx.fillRect(-6, 8, 12, 6);
            }
            tctx.restore();

            if (u.fireTimer > 40 && Math.random() < 0.05) {
                u.fireTimer = 0; let dx = centerX - u.x; let dy = centerY - u.y; let mag = Math.sqrt(dx*dx + dy*dy);
                let lColor = ['#00f0ff', '#ff0055', '#39ff14', '#ffea00'][Math.floor(Math.random()*4)];
                tLasers.push({ x: u.x, y: u.y, vx: (dx/mag)*12, vy: (dy/mag)*12, life: 60, color: lColor });
            }
            if (u.x < -100 || u.x > tw + 100) tUfos.splice(i, 1);
        }

        if (Math.random() < 0.008) {
            let explosionTarget = (Math.random() < 0.3) ? Infinity : (th * 0.3 + Math.random() * (th * 0.6));
            tPlanets.push({ x: Math.random() * tw, y: -50, vx: (Math.random() - 0.5) * 2, vy: 4 + Math.random() * 3, radius: 20 + Math.random() * 30, color: Math.random() > 0.5 ? '#ff007f' : '#ffea00', type: Math.floor(Math.random() * 3), explodeY: explosionTarget });
        }

        for(let i = tPlanets.length - 1; i >= 0; i--) {
            let p = tPlanets[i]; p.x += p.vx; p.y += p.vy; tctx.fillStyle = p.color;
            if (p.type === 0) {
                tctx.beginPath(); tctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); tctx.fill();
                tctx.fillStyle = 'rgba(0,0,0,0.3)'; tctx.fillRect(p.x - p.radius/2, p.y - p.radius/2, p.radius, p.radius/2);
            } else if (p.type === 1) {
                tctx.beginPath(); tctx.arc(p.x, p.y, p.radius * 0.8, 0, Math.PI*2); tctx.fill();
                tctx.strokeStyle = '#39ff14'; tctx.lineWidth = 4; tctx.beginPath(); tctx.ellipse(p.x, p.y, p.radius * 1.4, p.radius * 0.3, Math.PI/8, 0, Math.PI*2); tctx.stroke();
            } else {
                tctx.beginPath(); tctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); tctx.fill();
                tctx.fillStyle = 'rgba(0,0,0,0.4)'; tctx.fillRect(p.x - p.radius*0.4, p.y - p.radius*0.4, p.radius*0.2, p.radius*0.2);
                tctx.fillRect(p.x + p.radius*0.2, p.y + p.radius*0.1, p.radius*0.3, p.radius*0.3); tctx.fillRect(p.x - p.radius*0.2, p.y + p.radius*0.3, p.radius*0.15, p.radius*0.15);
            }

            if (p.y > p.explodeY) {
                for(let s=0; s<20; s++) { tParticles.push({ x: p.x, y: p.y, vx: (Math.random()-0.5)*15, vy: (Math.random()-0.8)*15, color: p.color, life: 20 + Math.random()*20 }); }
                const trophiesContainer = document.getElementById('trophiesInterface');
                if(trophiesContainer) { trophiesContainer.classList.add('screen-glitch'); setTimeout(() => trophiesContainer.classList.remove('screen-glitch'), 150); }
                tPlanets.splice(i, 1);
            } else if (p.y > th + 100) { tPlanets.splice(i, 1); }
        }

        for(let i = tLasers.length - 1; i >= 0; i--) {
            let l = tLasers[i]; l.x += l.vx; l.y += l.vy; l.life--;
            tctx.fillStyle = l.color; tctx.fillRect(l.x, l.y, 8, 8); tctx.fillStyle = '#fff'; tctx.fillRect(l.x+2, l.y+2, 4, 4);
            if (l.life <= 0) tLasers.splice(i, 1);
        }

        for(let i = tParticles.length - 1; i >= 0; i--) {
            let p = tParticles[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.5; p.life--; tctx.fillStyle = p.color; tctx.fillRect(p.x, p.y, 6, 6);
            if (p.life <= 0) tParticles.splice(i, 1);
        }
        requestAnimationFrame(drawTrophiesScene);
    }
    drawTrophiesScene();
}

// ========================================================
// SECTION G: HORIZONTAL CORRUPTED DATA STREAM
// ========================================================
const mCanvas = document.getElementById('contactBgCanvas');
if (mCanvas) {
    const mctx = mCanvas.getContext('2d');
    const chars = '01X¥Z!<>{}[]■□#-+=*&^%$#@';
    const colors = ['#00f0ff', '#ff007f', '#39ff14', '#ffea00', '#ffffff'];
    const fontSize = 18; let rows = 0; let streams = [];

    function initDataStream() {
        if (mCanvas.clientWidth === 0) return;
        mCanvas.width = mCanvas.clientWidth; mCanvas.height = mCanvas.clientHeight;
        rows = Math.floor(mCanvas.height / fontSize); streams = [];
        for(let y = 0; y < rows; y++) { streams[y] = { x: Math.floor(Math.random() * (mCanvas.width / fontSize)), color: colors[Math.floor(Math.random() * colors.length)], speed: 1 + Math.floor(Math.random() * 2) }; }
    }
    window.addEventListener('resize', initDataStream);

    function drawDataStream() {
        if (mCanvas.clientWidth === 0) { requestAnimationFrame(drawDataStream); return; }
        if (streams.length === 0) initDataStream();

        mctx.fillStyle = 'rgba(5, 5, 8, 0.2)'; mctx.fillRect(0, 0, mCanvas.width, mCanvas.height);
        mctx.save();
        if (Math.random() < 0.05) { mctx.translate((Math.random() - 0.5) * 10, 0); }
        mctx.font = 'bold ' + fontSize + 'px "VT323", monospace';

        for (let y = 0; y < rows; y++) {
            let s = streams[y]; const text = chars.charAt(Math.floor(Math.random() * chars.length));
            mctx.fillStyle = (Math.random() < 0.05) ? '#ffffff' : s.color;
            let drawX = s.x * fontSize;
            if (Math.random() < 0.005) { mctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; mctx.fillRect(drawX - 80, (y * fontSize) - fontSize + 4, 160, 2); }
            mctx.fillText(text, drawX, y * fontSize);
            s.x += s.speed;
            if (drawX > mCanvas.width && Math.random() > 0.8) { s.x = -2; s.color = colors[Math.floor(Math.random() * colors.length)]; s.speed = 1 + Math.floor(Math.random() * 3); }
        }
        mctx.restore(); setTimeout(() => { requestAnimationFrame(drawDataStream); }, 40);
    }
    drawDataStream();
}

// ========================================================
// SECTION H: TERMINAL DEFENSE v4.0 (CINEMATIC BOSS EDITION)
// ========================================================
document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById('startMiniGameBtn');
    const closeBtn = document.getElementById('closeMiniGameBtn');
    const playBtn = document.getElementById('startGameplayBtn');
    const modal = document.getElementById('miniGameModal');
    const mgCanvas = document.getElementById('miniGameCanvas');
    const directive = document.getElementById('gameDirective');
    
    if (!startBtn || !mgCanvas) return;
    
    const mgctx = mgCanvas.getContext('2d');
    let gameLoopId; let gameState = 'stopped'; 
    const WORLD_WIDTH = 2400; const GROUND_Y = 450; 
    let camera = { x: 0, y: 0 };
    
    let mouse = { screenX: 400, screenY: 250 };
    let player = { x: 400, y: 250, vy: 0, facing: 1 };
    let bullets = []; let bots = []; let particles = []; let floatingTexts = []; let flashes = []; 
    
    // --- BOSS FIGHT & CINEMATIC VARIABLES ---
    let sessionKills = 0;
    let boss = null;
    let princess = null;
    let cinematicState = null; // 'slowmo', 'rescue', 'flyaway', 'fadeout', 'done'
    let slowMoTimer = 0;
    let skyOpacity = 1.0;
    let victoryBanner = null;

    // --- 8-BIT AUDIO SYNTHESIZER ---
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let musicLoop;
    
    const dreamyChords = [
        [261.63, 329.63, 392.00, 493.88], [174.61, 261.63, 329.63, 440.00],
        [220.00, 261.63, 329.63, 493.88], [196.00, 246.94, 293.66, 392.00] 
    ];
    let chordStep = 0; let arpStep = 0;

    const SFX = {
        laser: () => {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
            osc.type = 'sine'; osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
            osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 0.3);
        },
        explosion: (giant = false) => {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const bufferSize = audioCtx.sampleRate * (giant ? 1.5 : 0.5);
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const noise = audioCtx.createBufferSource(); noise.buffer = buffer;
            const filter = audioCtx.createBiquadFilter(); filter.type = 'lowpass'; 
            filter.frequency.setValueAtTime(giant ? 200 : 400, audioCtx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + (giant ? 1.5 : 0.5));
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(giant ? 0.6 : 0.3, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + (giant ? 1.5 : 0.5));
            noise.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination); noise.start();
        },
        typing: () => {
            if (audioCtx.state === 'suspended') return;
            const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
            osc.type = 'sine'; osc.frequency.setValueAtTime(800 + Math.random() * 400, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.02, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
            osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 0.1);
        },
        startMusic: () => {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            if (musicLoop) clearInterval(musicLoop);
            musicLoop = setInterval(() => {
                const now = audioCtx.currentTime; const currentChord = dreamyChords[chordStep];
                if (arpStep === 0) {
                    currentChord.forEach(freq => {
                        const padOsc = audioCtx.createOscillator(); const padGain = audioCtx.createGain();
                        padOsc.type = 'triangle'; padOsc.frequency.value = freq / 2; 
                        padGain.gain.setValueAtTime(0.001, now); padGain.gain.exponentialRampToValueAtTime(0.03, now + 0.5); padGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
                        padOsc.connect(padGain); padGain.connect(audioCtx.destination); padOsc.start(now); padOsc.stop(now + 2.0);
                    });
                }
                const arpOsc = audioCtx.createOscillator(); const arpGain = audioCtx.createGain();
                arpOsc.type = 'sine'; arpOsc.frequency.value = currentChord[arpStep % currentChord.length] * 2; 
                arpGain.gain.setValueAtTime(0.04, now); arpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                arpOsc.connect(arpGain); arpGain.connect(audioCtx.destination); arpOsc.start(now); arpOsc.stop(now + 0.4);
                arpStep++; if (arpStep >= 8) { arpStep = 0; chordStep = (chordStep + 1) % dreamyChords.length; }
            }, 250); 
        },
        startBossMusic: () => {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            if (musicLoop) clearInterval(musicLoop);
            musicLoop = setInterval(() => {
                const now = audioCtx.currentTime;
                const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
                osc.type = 'sawtooth'; osc.frequency.value = (Math.random() > 0.5) ? 65.41 : 73.42; 
                gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
                osc.connect(gain); gain.connect(audioCtx.destination); osc.start(now); osc.stop(now + 0.6);
            }, 600);
        },
        startRescueMusic: () => {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            if (musicLoop) clearInterval(musicLoop);
            
            // Lush, ethereal, overlapping synth pads for the flight into space
            const etherealChords = [
                [261.63, 392.00, 523.25, 659.25], 
                [349.23, 523.25, 698.46, 880.00], 
                [220.00, 329.63, 440.00, 587.33], 
                [196.00, 293.66, 392.00, 523.25]  
            ];
            let dStep = 0; let aStep = 0;
            
            musicLoop = setInterval(() => {
                const now = audioCtx.currentTime;
                const currentChord = etherealChords[dStep];
                
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.value = currentChord[aStep % currentChord.length];
                
                gain.gain.setValueAtTime(0.001, now);
                gain.gain.exponentialRampToValueAtTime(0.08, now + 1.0);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
                
                const filter = audioCtx.createBiquadFilter();
                filter.type = 'lowpass'; filter.frequency.value = 1200;
                
                osc.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
                osc.start(now); osc.stop(now + 3.0);
                
                aStep++;
                if (aStep >= 4) {
                    aStep = 0;
                    dStep = (dStep + 1) % etherealChords.length;
                }
            }, 400);
        },
        stopMusic: () => { if (musicLoop) clearInterval(musicLoop); }
    };
    
    // MASSIVELY EXPANDED SKY 
    // Constrained X to 1200px (parallax limit) and biased 40% of Y coords to the ground
    const stars = Array.from({length: 2500}, () => {
        const isGroundLevel = Math.random() < 0.4;
        const yPos = isGroundLevel 
            ? (Math.random() * 1000 - 500) 
            : (Math.random() * 19000 - 19000);
            
        return { 
            x: Math.random() * 1200, 
            y: yPos, 
            s: Math.random() * 2.5 + 0.5, 
            a: Math.random() * Math.PI * 2 
        };
    });
    
    // Distant planets to pass during the flight
    const planets = [
        // Visible during standard ground gameplay
        { x: 150, y: 120, r: 60, c: '#2c3e50', ring: true }, 
        { x: 600, y: 50, r: 35, c: '#7b241c', ring: false },
        { x: 1000, y: 180, r: 90, c: '#0b5345', ring: true },
        
        // Deep space planets seen during the flyaway sequence
        { x: 400, y: -400, r: 140, c: '#4a235a', ring: false }, 
        { x: 800, y: -1200, r: 110, c: '#1c2833', ring: true },
        { x: 200, y: -2500, r: 80, c: '#2c3e50', ring: false },
        { x: 900, y: -4500, r: 200, c: '#78281f', ring: true },
        { x: 300, y: -6500, r: 120, c: '#0b5345', ring: false },
        { x: 700, y: -8500, r: 350, c: '#4a235a', ring: true },
        { x: 100, y: -10500, r: 180, c: '#2c3e50', ring: false },
        { x: 950, y: -12500, r: 250, c: '#1c2833', ring: true },
        { x: 500, y: -15000, r: 400, c: '#7b241c', ring: false }
    ];
    
    const terminals = [
        { x: 300, y: GROUND_Y, hp: 100, smashed: false, bot: null, tick: 0 }, 
        { x: 900, y: GROUND_Y, hp: 100, smashed: false, bot: null, tick: 15 },
        { x: 1500, y: GROUND_Y, hp: 100, smashed: false, bot: null, tick: 30 }, 
        { x: 2100, y: GROUND_Y, hp: 100, smashed: false, bot: null, tick: 45 }
    ];
    
    const badQuotes = [
        "ROWS, BUD", "YOU CAN'T HANDLE THE TOOTH!", "YOU DEPLETE ME",
        "IF YOU BILLED IT, THEY WILL COME", "YOU'RE GONNA NEED A BIGGER GOAT", "WE'LL ALWAYS HAVE PARROTS"
    ];

    startBtn.addEventListener('click', () => {
        modal.classList.add('active-modal'); gameState = 'directive'; directive.style.display = 'flex'; directive.style.opacity = '1';
        resetGame(); gameLoopId = requestAnimationFrame(gameLoop);
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active-modal'); gameState = 'stopped'; cancelAnimationFrame(gameLoopId);
        SFX.stopMusic(); if(victoryBanner) { victoryBanner.remove(); victoryBanner = null; }
    });

    playBtn.addEventListener('click', () => {
        directive.style.opacity = '0'; setTimeout(() => { directive.style.display = 'none'; gameState = 'playing'; SFX.startMusic(); }, 300);
    });

    mgCanvas.addEventListener('mousemove', (e) => {
        if(cinematicState) return; 
        const rect = mgCanvas.getBoundingClientRect();
        const scaleX = mgCanvas.width / rect.width; const scaleY = mgCanvas.height / rect.height;
        mouse.screenX = (e.clientX - rect.left) * scaleX; mouse.screenY = (e.clientY - rect.top) * scaleY;
    });

    mgCanvas.addEventListener('mousedown', () => {
        if (gameState !== 'playing' || cinematicState) return;
        SFX.laser();
        bullets.push({ x: player.x + (30 * player.facing), y: player.y - 12, vx: 25 * player.facing, life: 80 });
    });

    function showVictoryBanner() {
    if(victoryBanner) return;
    victoryBanner = document.createElement('div');
    victoryBanner.innerHTML = `
        <h2 style='color:#00f0ff; font-family:"Press Start 2P", monospace; text-shadow:2px 2px 0 #000; margin-bottom: 24px; font-size: 16px; line-height: 1.8;'>
            THE CAPTION-BOTS HAVE BEEN SMASHED,<br>BUT NOW YOUR TRUE MISSION BEGINS.....
        </h2>
        <button id='victoryMissionBtn' class='override-btn-green' style='width:auto; padding: 15px 30px !important;'>BEGIN SUBTITLING MISSION ▶</button>
    `;
    
    victoryBanner.style.position = 'absolute'; 
    victoryBanner.style.top = '50%'; 
    victoryBanner.style.left = '50%'; 
    victoryBanner.style.transform = 'translate(-50%, -50%)';
    victoryBanner.style.background = 'rgba(0,0,0,0.85)'; 
    victoryBanner.style.padding = '40px'; 
    victoryBanner.style.border = '4px solid #39ff14'; 
    victoryBanner.style.textAlign = 'center'; 
    victoryBanner.style.zIndex = '1000'; 
    victoryBanner.style.borderRadius = '8px';
    victoryBanner.style.boxShadow = '0 0 40px rgba(57, 255, 20, 0.4)';
    victoryBanner.style.opacity = '0';
    victoryBanner.style.transition = 'opacity 3s ease-in-out';
    
    modal.querySelector('div[style*="position: relative"]').appendChild(victoryBanner);
    
    // Trigger CSS reflow to start the slow fade
    requestAnimationFrame(() => { victoryBanner.style.opacity = '1'; });
    
    document.getElementById('victoryMissionBtn').addEventListener('click', () => {
        modal.classList.remove('active-modal'); 
        gameState = 'stopped'; 
        cancelAnimationFrame(gameLoopId); 
        SFX.stopMusic();
        victoryBanner.remove(); 
        victoryBanner = null;
        
        // SPA ROUTING FIX: Simulate a click on the main menu button 
        // to fire your native SPA transition smoothly without reloading.
        const startGameBtn = document.querySelector('[data-action="start-game"]');
        if (startGameBtn) {
            startGameBtn.click();
        } else {
            // Fallback failsafe
            window.location.hash = 'configInterface';
        }
    });
}

    function resetGame() {
        bullets = []; bots = []; particles = []; floatingTexts = []; flashes = [];
        terminals.forEach(t => { t.hp = 100; t.smashed = false; t.bot = null; });
        player.x = 400; player.y = 250; player.vy = 0; player.facing = 1; 
        camera = { x: 0, y: 0 }; sessionKills = 0; boss = null; princess = null; cinematicState = null; skyOpacity = 1.0;
        if(victoryBanner) { victoryBanner.remove(); victoryBanner = null; }
    }

    function gameLoop() {
        if (gameState === 'stopped') return;
        
        let timeScale = cinematicState === 'slowmo' ? 0.15 : 1; 

        if (gameState === 'playing') {
            
            // --- PLAYER MOVEMENT ---
            if (!cinematicState) {
                let targetX = mouse.screenX + camera.x; let targetY = mouse.screenY + camera.y;
                if (targetY > GROUND_Y - 35) targetY = GROUND_Y - 35;
                if (targetX > player.x + 10) player.facing = 1; else if (targetX < player.x - 10) player.facing = -1;
                player.x += (targetX - player.x) * 0.08; player.y += (targetY - player.y) * 0.08;
                if (player.x < 20) player.x = 20; if (player.x > WORLD_WIDTH - 20) player.x = WORLD_WIDTH - 20;
            }

            // --- CAMERA TRACKING (X and Y) ---
            let targetCamX = player.x - (mgCanvas.width / 2);
            if (targetCamX < 0) targetCamX = 0; if (targetCamX > WORLD_WIDTH - mgCanvas.width) targetCamX = WORLD_WIDTH - mgCanvas.width;
            camera.x += (targetCamX - camera.x) * 0.1;

            let targetCamY = 0;
            if (cinematicState === 'flyaway' || cinematicState === 'fadeout' || cinematicState === 'done') {
                targetCamY = player.y - 250; 
                // CAMERA LOCK: Stops following player once it reaches high altitude
                if (targetCamY < -12000) targetCamY = -12000; 
            }
            camera.y += (targetCamY - camera.y) * 0.08;

            // --- BOSS SPAWN (15 KILLS) ---
            if (sessionKills >= 15 && !boss && !cinematicState) {
                SFX.startBossMusic();
                bots.forEach(b => { createExplosion(b.x, b.y, '#ff007f'); if(b.target) b.target.bot = null; });
                bots = [];
                // Increased to 25 HP and added maxHp for the HUD meter
                boss = { x: player.x, y: -200, vx: 8, vy: 0, hp: 25, maxHp: 25, state: 'falling', textTimer: 50 };
            }

            // --- STANDARD BOTS ---
            if (!boss && !cinematicState && Math.random() < 0.02 && bots.length < 6) {
                let openTerms = terminals.filter(t => t.bot === null && !t.smashed && t.hp > 0);
                if (openTerms.length > 0) {
                    let target = openTerms[Math.floor(Math.random() * openTerms.length)];
                    let startX = target.x + (Math.random() > 0.5 ? 800 : -800);
                    let bot = { x: startX, y: -100, target: target, state: 'falling', typeProg: 0 };
                    target.bot = bot; bots.push(bot);
                }
            }
            
            bots.forEach(b => {
                if (b.state === 'falling') {
                    b.y += 5; if (b.y >= GROUND_Y - 30) b.state = 'moving';
                } else if (b.state === 'moving') {
                    b.x += (b.target.x - b.x) * 0.035; if (Math.abs(b.x - b.target.x) < 20) b.state = 'typing';
                } else if (b.state === 'typing' && b.target.hp > 0 && !b.target.smashed) {
                    b.typeProg += 0.25; 
                    if (Math.random() < 0.3) SFX.typing();
                    if (b.typeProg >= 100) {
                        b.typeProg = 0; b.target.hp -= 26; 
                        createExplosion(b.target.x, b.target.y - 40, '#ffea00', true);
                        floatingTexts.push({ text: badQuotes[Math.floor(Math.random() * badQuotes.length)], x: b.target.x, y: b.target.y - 80, life: 100, color: '#ff007f', vx: 0, vy: -0.6 });
                    }
                }
            });

            // --- GIANT BOSS BEHAVIOR ---
            if (boss && boss.hp > 0) {
                // Initialize Phase 2 properties
                if (boss.armExt === undefined) { boss.armExt = 0; boss.swipePhase = 0; }

                boss.vy += 0.4 * timeScale; 
                boss.x += boss.vx * timeScale;
                boss.y += boss.vy * timeScale;

                if(boss.x < 100) { boss.x = 100; boss.vx *= -1; }
                if(boss.x > WORLD_WIDTH - 100) { boss.x = WORLD_WIDTH - 100; boss.vx *= -1; }

                // PHASE 2 TRIGGER: 10 shots landed (HP is 15 or less out of 25)
                let phaseTwo = boss.hp <= 15;

                // Grow arms dynamically when in Phase 2
                if (phaseTwo && boss.armExt < 1) boss.armExt += 0.05 * timeScale;
                
                // --- NEW DYNAMIC FLOOR LOGIC ---
                let bounceFloor = GROUND_Y - 20; // Default to hitting the actual ground
                
                // Check if he is hovering directly over a surviving terminal
                terminals.forEach(t => {
                    // If the terminal is alive and his center is above it, raise the floor
                    if (!t.smashed && Math.abs(t.x - boss.x) < 90) {
                        bounceFloor = GROUND_Y - 120;
                    }
                });

                // Ground (or Terminal) Bounce & Smashing
                if (boss.y > bounceFloor) {
                    boss.y = bounceFloor;
                    boss.vy = -18; 
                    SFX.explosion();
                    createExplosion(boss.x, boss.y + 20, '#ff007f'); // Explosion moved to his feet
                    
                    // Smash any terminals he lands on
                    terminals.forEach(t => {
                        if (!t.smashed && Math.abs(t.x - boss.x) < 150) {
                            t.hp = 0; t.smashed = true;
                            createExplosion(t.x, t.y, '#ffea00', true);
                            for(let p=0; p<40; p++) {
                                particles.push({ x: t.x, y: t.y, vx: (Math.random()-0.5)*20, vy: (Math.random()-1)*20, life: 60+Math.random()*40, color: ['#34495e', '#1a1a24', '#00f0ff', '#ffffff'][Math.floor(Math.random()*4)], s: Math.random()*8+2 });
                            }
                        }
                    });
                }
                
                // ... (Leave your swatting and text vomit logic untouched below this)

                // Swat Player (Range increases dynamically as arms grow)
                let swatRangeX = 120 + (boss.armExt * 70);
                let swatRangeY = 150 + (boss.armExt * 50);
                
                if (Math.abs(boss.x - player.x) < swatRangeX && Math.abs(boss.y - player.y) < swatRangeY) {
                    player.x += (player.x < boss.x ? -40 : 40);
                    SFX.explosion();
                    boss.swipePhase = Math.PI; // Trigger the visual arm swing
                }

                // Animate the swipe resetting
                if (boss.swipePhase > 0) {
                    boss.swipePhase -= 0.15 * timeScale;
                    if (boss.swipePhase < 0) boss.swipePhase = 0;
                }

                // Vomit Bad Text Constantly
                boss.textTimer -= timeScale;
                if (boss.textTimer <= 0) {
                    floatingTexts.push({ text: badQuotes[Math.floor(Math.random() * badQuotes.length)], x: boss.x, y: boss.y - 150, life: 120, color: '#ff007f', vx: (Math.random()-0.5)*4, vy: -2 });
                    boss.textTimer = 25;
                }
            }

            // --- BULLETS & HIT DETECTION ---
            for (let i = bullets.length - 1; i >= 0; i--) {
                let b = bullets[i]; b.x += b.vx * timeScale; b.life -= timeScale;
                let hit = false;
                
                for (let j = bots.length - 1; j >= 0; j--) {
                    let bot = bots[j];
                    if (Math.abs(b.x - bot.x) < 35 && Math.abs(b.y - bot.y) < 40) {
                        createExplosion(bot.x, bot.y, '#00f0ff', true);
                        if (bot.target) bot.target.bot = null;
                        bots.splice(j, 1); hit = true; sessionKills++; break;
                    }
                }

                if (!hit && boss && boss.hp > 0 && Math.abs(b.x - boss.x) < 100 && Math.abs(b.y - boss.y) < 150) {
                    boss.hp--; hit = true; 
                    createExplosion(b.x, b.y, '#39ff14', true);
                    
                    if (boss.hp <= 0) {
                        cinematicState = 'slowmo'; slowMoTimer = 150;
                        SFX.stopMusic(); SFX.explosion(true);
                        
                        // Giant Slow-Mo Explosion
                        for(let p=0; p<200; p++) {
                            particles.push({ x: boss.x, y: boss.y, vx: (Math.random()-0.5)*40, vy: (Math.random()-0.5)*40, life: 100 + Math.random()*150, color: ['#ff007f', '#111', '#444', '#ffea00'][Math.floor(Math.random()*4)], s: Math.random()*12+4 });
                        }
                        
                        // Giant Text Shrapnel
                        for(let q=0; q<15; q++) {
                            floatingTexts.push({ text: badQuotes[Math.floor(Math.random()*badQuotes.length)], x: boss.x, y: boss.y, vx: (Math.random()-0.5)*25, vy: (Math.random()-1)*20, life: 300, color: '#00f0ff' });
                        }
                    }
                }
                
                if (hit || b.life <= 0) bullets.splice(i, 1);
            }

            // --- THE CINEMATIC FINALE PHASES ---
            if (cinematicState === 'slowmo') {
                slowMoTimer--;
                if (slowMoTimer <= 0) {
                    cinematicState = 'rescue';
                    princess = { x: player.x - 500, y: GROUND_Y - 35, vx: 4 };
                    player.facing = -1; 
                }
            } else if (cinematicState === 'rescue') {
                princess.x += princess.vx;
                
                // Pop fireworks in background
                if(Math.random() < 0.08) {
                    createExplosion(player.x + (Math.random()-0.5)*600, GROUND_Y - 150 - Math.random()*300, ['#ff007f', '#00f0ff', '#39ff14', '#ffea00'][Math.floor(Math.random()*4)], true);
                }

                if (Math.abs(princess.x - player.x) < 20) {
                    cinematicState = 'flyaway';
                    player.vy = -2; // Initial takeoff speed
                    SFX.startRescueMusic(); 
                }
            } else if (cinematicState === 'flyaway') {
                player.vy -= 0.12; // Continually accelerate upwards
                player.y += player.vy;
                princess.x = player.x + (15 * player.facing);
                princess.y = player.y;
                
                // Random trailing fireworks
                if(Math.random() < 0.05) {
                    createExplosion(player.x + (Math.random()-0.5)*400, player.y - Math.random()*200, ['#ff007f', '#00f0ff', '#39ff14', '#ffea00'][Math.floor(Math.random()*4)], true);
                }
                
                // Player breaks past the locked camera lens and flies completely off-screen
                if (player.y < camera.y - 800) {
                    // Skip the fadeout phase entirely and hold the bright sky
                    cinematicState = 'done'; 
                    showVictoryBanner();
                }
            }
        }

        // ================= DRAWING ROUTINES =================
        mgctx.fillStyle = '#020305'; mgctx.fillRect(0, 0, mgCanvas.width, mgCanvas.height);
        mgctx.save(); mgctx.translate(-camera.x, -camera.y); 

        // Starry Sky & Planets
        mgctx.globalAlpha = skyOpacity;
        mgctx.save(); mgctx.translate(camera.x * 0.8, camera.y * 0.8); 
        
        // Turn on the neon glow engine specifically for the stars during the finale
        if (cinematicState === 'done') {
            mgctx.shadowBlur = 10;
            mgctx.shadowColor = '#ffffff';
        }

        stars.forEach(s => { 
            s.a += 0.05 * timeScale; 
            
            if (cinematicState === 'done') {
                // FINALE: Maximum brightness, solid white, physically throbbing size
                mgctx.fillStyle = '#ffffff'; 
                let popSize = s.s + Math.abs(Math.sin(s.a)) * 1.5;
                mgctx.fillRect(s.x, s.y, popSize, popSize); 
            } else {
                // GAMEPLAY: Normal twinkling opacity
                mgctx.fillStyle = `rgba(255, 255, 255, ${0.4 + Math.sin(s.a) * 0.5})`; 
                mgctx.fillRect(s.x, s.y, s.s, s.s); 
            }
        });
        
        // Kill the glow so the planets don't look blurry
        mgctx.shadowBlur = 0;

        mgctx.restore();
        mgctx.globalAlpha = 1.0;

        // Distant Mountains
        mgctx.save(); mgctx.translate(camera.x * 0.5, camera.y * 0.5); 
        mgctx.fillStyle = '#060a10';
        mgctx.beginPath(); mgctx.moveTo(0, GROUND_Y);
        for(let i=0; i<=WORLD_WIDTH; i+=150) { mgctx.lineTo(i, GROUND_Y - 80 - Math.sin(i*0.02)*60 - Math.cos(i*0.05)*40); }
        mgctx.lineTo(WORLD_WIDTH, GROUND_Y); mgctx.fill(); 
        mgctx.restore();

        // Floor / Ground Line
        mgctx.fillStyle = '#0a1015'; mgctx.fillRect(0, GROUND_Y, WORLD_WIDTH, mgCanvas.height + Math.abs(camera.y));
        mgctx.strokeStyle = '#00f0ff'; mgctx.lineWidth = 2; mgctx.shadowBlur = 10; mgctx.shadowColor = '#00f0ff';
        mgctx.beginPath(); mgctx.moveTo(0, GROUND_Y); mgctx.lineTo(WORLD_WIDTH, GROUND_Y); mgctx.stroke(); mgctx.shadowBlur = 0;
        
        mgctx.strokeStyle = 'rgba(0, 240, 255, 0.15)'; mgctx.lineWidth = 1;
        for(let i=0; i<WORLD_WIDTH; i+=60) { mgctx.beginPath(); mgctx.moveTo(i, GROUND_Y); mgctx.lineTo(i - 100, GROUND_Y + 1500); mgctx.stroke(); }

        // Terminals
        terminals.forEach(t => {
            if (t.smashed) {
                mgctx.fillStyle = '#1a1a24';
                mgctx.beginPath(); mgctx.moveTo(t.x - 45, t.y); mgctx.lineTo(t.x - 35, t.y - 15); mgctx.lineTo(t.x - 10, t.y - 5); mgctx.lineTo(t.x + 15, t.y - 20); mgctx.lineTo(t.x + 45, t.y); mgctx.fill();
                mgctx.fillStyle = '#ff0000'; mgctx.fillRect(t.x - 10, t.y - 5, 4, 4);
            } else {
                mgctx.fillStyle = '#1a1a24'; mgctx.fillRect(t.x - 45, t.y - 30, 90, 30);
                mgctx.fillStyle = '#2d2d38'; mgctx.fillRect(t.x - 50, t.y - 35, 100, 5); 
                mgctx.fillStyle = '#000'; mgctx.fillRect(t.x - 20, t.y - 30, 40, 30); 
                mgctx.fillStyle = '#00f0ff'; mgctx.fillRect(t.x - 15, t.y - 20, 5, 2); 
                
                mgctx.fillStyle = '#333'; mgctx.beginPath(); mgctx.moveTo(t.x - 30, t.y - 35); mgctx.lineTo(t.x + 30, t.y - 35); mgctx.lineTo(t.x + 35, t.y - 25); mgctx.lineTo(t.x - 35, t.y - 25); mgctx.fill();

                mgctx.fillStyle = '#34495e'; mgctx.fillRect(t.x - 35, t.y - 85, 70, 50); 
                mgctx.fillStyle = '#111'; mgctx.fillRect(t.x - 30, t.y - 80, 60, 40); 

                if (t.hp <= 0) {
                    mgctx.fillStyle = '#550000'; mgctx.fillRect(t.x - 25, t.y - 75, 50, 30);
                    mgctx.fillStyle = '#fff'; mgctx.font = "8px 'Press Start 2P', monospace"; mgctx.fillText("DEAD", t.x - 15, t.y - 58);
                } else if (t.bot && t.bot.state === 'typing') {
                    mgctx.fillStyle = (Math.floor(Date.now() / 100) % 2 === 0) ? '#ff007f' : '#33001a'; mgctx.fillRect(t.x - 25, t.y - 75, 50, 30);
                } else {
                    t.tick++; mgctx.fillStyle = '#001a00'; mgctx.fillRect(t.x - 25, t.y - 75, 50, 30);
                    mgctx.fillStyle = '#39ff14'; for(let line=0; line<4; line++) { mgctx.fillRect(t.x - 20, t.y - 70 + (line*6), 15 + Math.sin(t.tick*0.1 + line)*15, 3); }
                }
                
                mgctx.fillStyle = '#111'; mgctx.fillRect(t.x - 25, t.y - 95, 50, 4);
                mgctx.fillStyle = t.hp > 50 ? '#39ff14' : '#ff007f'; mgctx.fillRect(t.x - 25, t.y - 95, (t.hp/100)*50, 4);
            }
        });

        // Bots
        bots.forEach(b => {
            let bob = (b.state === 'moving' || b.state === 'typing') ? Math.sin(Date.now() * 0.015) * 6 : 0;
            mgctx.fillStyle = '#1c1f24'; mgctx.fillRect(b.x - 25, b.y - 45 + bob, 50, 40);
            mgctx.fillStyle = '#4f5d65'; mgctx.fillRect(b.x - 20, b.y - 40 + bob, 40, 30);
            mgctx.fillStyle = '#2c3e50'; mgctx.fillRect(b.x - 15, b.y - 65 + bob, 30, 20);
            mgctx.fillStyle = '#111'; mgctx.fillRect(b.x - 10, b.y - 60 + bob, 20, 10);
            mgctx.shadowBlur = 10; mgctx.shadowColor = '#ff007f'; mgctx.fillStyle = '#ff007f'; mgctx.fillRect(b.x - 5, b.y - 58 + bob, 10, 6); mgctx.shadowBlur = 0;
            mgctx.fillStyle = '#111'; mgctx.fillRect(b.x - 30, b.y - 10, 20, 10); mgctx.fillRect(b.x + 10, b.y - 10, 20, 10);
            
            if (b.state === 'typing') {
                mgctx.fillStyle = '#7a8d96'; let flail = Math.sin(Date.now() * 0.04) * 10;
                mgctx.fillRect(b.x - 35, b.y - 30 + flail, 15, 8); mgctx.fillRect(b.x + 20, b.y - 30 - flail, 15, 8); 
                mgctx.fillStyle = '#111'; mgctx.fillRect(b.x - 20, b.y - 80, 40, 6);
                mgctx.fillStyle = '#ffea00'; mgctx.fillRect(b.x - 20, b.y - 80, (b.typeProg/100)*40, 6);
            }
        });

        // Boss
        if (boss && boss.hp > 0) {
            mgctx.save(); mgctx.translate(boss.x, boss.y);
            let bossBob = Math.sin(Date.now() * 0.01) * 10;
            
            // DRAW METAL ARMS (Phase 2)
            if (boss.armExt > 0) {
                let armLen = 80 * boss.armExt;
                let swipeRotation = Math.sin(boss.swipePhase) * 1.5; // Swings inward when triggered
                
                // Left Arm
                mgctx.save();
                mgctx.translate(-75, -80 + bossBob);
                mgctx.rotate((Math.PI / 4) + swipeRotation + Math.sin(Date.now()*0.005)*0.2);
                mgctx.fillStyle = '#4f5d65'; mgctx.fillRect(-15, 0, 30, armLen); // Upper arm strut
                mgctx.fillStyle = '#2c3e50'; mgctx.fillRect(-20, armLen - 10, 40, 30); // Hand chassis
                mgctx.fillStyle = '#ff007f'; mgctx.fillRect(-20, armLen + 20, 10, 15); mgctx.fillRect(10, armLen + 20, 10, 15); // Neon Claws
                mgctx.restore();

                // Right Arm
                mgctx.save();
                mgctx.translate(75, -80 + bossBob);
                mgctx.rotate((-Math.PI / 4) - swipeRotation - Math.sin(Date.now()*0.005)*0.2);
                mgctx.fillStyle = '#4f5d65'; mgctx.fillRect(-15, 0, 30, armLen); 
                mgctx.fillStyle = '#2c3e50'; mgctx.fillRect(-20, armLen - 10, 40, 30); 
                mgctx.fillStyle = '#ff007f'; mgctx.fillRect(-20, armLen + 20, 10, 15); mgctx.fillRect(10, armLen + 20, 10, 15);
                mgctx.restore();
            }

            // Main Body Chassis
            mgctx.fillStyle = '#1c1f24'; mgctx.fillRect(-75, -120 + bossBob, 150, 120);
            mgctx.fillStyle = '#4f5d65'; mgctx.fillRect(-60, -100 + bossBob, 120, 80);
            mgctx.fillStyle = '#2c3e50'; mgctx.fillRect(-45, -180 + bossBob, 90, 60);
            mgctx.fillStyle = '#111'; mgctx.fillRect(-30, -165 + bossBob, 60, 30);
            
            // Glowing Eye
            mgctx.shadowBlur = 25; mgctx.shadowColor = '#ff007f'; mgctx.fillStyle = '#ff007f'; 
            mgctx.fillRect(-15, -160 + bossBob, 30, 20); mgctx.shadowBlur = 0;
            
            // Health Bar
            mgctx.restore();
        }

        // Princess
        if (princess) {
            mgctx.save(); mgctx.translate(princess.x, princess.y);
            let pBob = cinematicState === 'rescue' ? Math.sin(Date.now() * 0.02) * 4 : 0;
            
            mgctx.fillStyle = '#ff69b4'; mgctx.beginPath(); mgctx.moveTo(0, -25 + pBob); mgctx.lineTo(-15, 5 + pBob); mgctx.lineTo(15, 5 + pBob); mgctx.fill();
            mgctx.fillStyle = '#ff1493'; mgctx.fillRect(-15, 5 + pBob, 30, 10);
            mgctx.fillStyle = '#f1c40f'; mgctx.fillRect(-10, -40 + pBob, 20, 20); 
            mgctx.fillStyle = '#f5b041'; mgctx.fillRect(-8, -35 + pBob, 16, 12); 
            mgctx.fillStyle = '#ffea00'; mgctx.beginPath(); mgctx.moveTo(-10, -40 + pBob); mgctx.lineTo(-10, -48 + pBob); mgctx.lineTo(-5, -42 + pBob); mgctx.lineTo(0, -50 + pBob); mgctx.lineTo(5, -42 + pBob); mgctx.lineTo(10, -48 + pBob); mgctx.lineTo(10, -40 + pBob); mgctx.fill();
            mgctx.restore();
        }

        // Player
        mgctx.save(); mgctx.translate(player.x, player.y); mgctx.scale(player.facing, 1);
        mgctx.fillStyle = '#2c3e50'; mgctx.fillRect(-22, -20, 14, 30); 
        mgctx.fillStyle = '#00f0ff'; mgctx.fillRect(-24, -15, 4, 15); 
        
        if (gameState === 'playing' && !cinematicState) {
            mgctx.shadowBlur = 15; mgctx.shadowColor = '#00f0ff'; mgctx.fillStyle = (Math.random() > 0.5) ? '#ffffff' : '#00f0ff';
            mgctx.beginPath(); mgctx.arc(-15, 15, Math.random() * 10 + 5, 0, Math.PI*2); mgctx.fill(); mgctx.shadowBlur = 0;
        }
        
        if (cinematicState === 'flyaway' || cinematicState === 'fadeout') {
            mgctx.fillStyle = '#ffea00'; mgctx.beginPath(); mgctx.moveTo(-10, 10); mgctx.lineTo(0, 30 + Math.random()*20); mgctx.lineTo(10, 10); mgctx.fill();
            mgctx.fillStyle = '#ff007f'; mgctx.beginPath(); mgctx.moveTo(-5, 10); mgctx.lineTo(0, 20 + Math.random()*15); mgctx.lineTo(5, 10); mgctx.fill();
        }
        
        mgctx.fillStyle = '#ecf0f1'; mgctx.fillRect(-12, -25, 24, 35); 
        mgctx.fillStyle = '#bdc3c7'; mgctx.fillRect(-5, -5, 10, 15); 
        mgctx.fillStyle = '#fff'; mgctx.beginPath(); mgctx.arc(0, -30, 16, 0, Math.PI*2); mgctx.fill();
        mgctx.fillStyle = '#111'; mgctx.beginPath(); mgctx.arc(3, -32, 12, 0, Math.PI*2); mgctx.fill(); 
        mgctx.fillStyle = '#00f0ff'; mgctx.beginPath(); mgctx.arc(6, -35, 4, 0, Math.PI*2); mgctx.fill(); 
        mgctx.fillStyle = '#95a5a6'; mgctx.fillRect(0, -15, 25, 8); 
        
        if (cinematicState === 'flyaway' || cinematicState === 'fadeout') {
            mgctx.fillStyle = '#333'; mgctx.fillRect(0, -15, 20, 10); 
        } else {
            mgctx.fillStyle = '#333'; mgctx.fillRect(20, -18, 15, 12); 
            mgctx.fillStyle = '#00f0ff'; mgctx.fillRect(30, -16, 6, 8); 
        }
        mgctx.restore();

        // Particles & Effects
        bullets.forEach(b => {
            mgctx.shadowBlur = 20; mgctx.shadowColor = '#00f0ff'; mgctx.fillStyle = '#ffffff'; mgctx.fillRect(b.x - 30, b.y - 8, 60, 16); 
            mgctx.fillStyle = '#00f0ff'; mgctx.globalCompositeOperation = 'lighter'; mgctx.fillRect(b.x - 40, b.y - 12, 80, 24); 
            mgctx.globalCompositeOperation = 'source-over'; mgctx.shadowBlur = 0;
        });

        flashes.forEach(f => {
            mgctx.globalAlpha = Math.max(0, f.life / 20); mgctx.fillStyle = f.color;
            mgctx.beginPath(); mgctx.arc(f.x, f.y, (20 - f.life) * 10, 0, Math.PI*2); mgctx.fill();
            mgctx.globalAlpha = 1.0; f.life -= timeScale;
        });
        flashes = flashes.filter(f => f.life > 0);

        particles.forEach(p => {
            p.x += p.vx * timeScale; p.y += p.vy * timeScale; p.vy += 0.4 * timeScale; p.life -= timeScale; mgctx.shadowBlur = 10; mgctx.shadowColor = p.color;
            mgctx.fillStyle = p.color; mgctx.fillRect(p.x, p.y, p.s, p.s); mgctx.shadowBlur = 0;
        });
        particles = particles.filter(p => p.life > 0);

        floatingTexts.forEach(ft => {
            if(ft.vx !== undefined) { ft.x += ft.vx * timeScale; ft.y += ft.vy * timeScale; } else { ft.y -= 0.6 * timeScale; }
            ft.life -= timeScale; mgctx.fillStyle = ft.color; mgctx.globalAlpha = Math.max(0, ft.life / 100);
            mgctx.font = "bold 12px 'Press Start 2P', monospace"; mgctx.textAlign = "center";
            mgctx.shadowBlur = 4; mgctx.shadowColor = '#000'; mgctx.fillText(ft.text, ft.x, ft.y);
            mgctx.shadowBlur = 0; mgctx.globalAlpha = 1.0;
        });
        floatingTexts = floatingTexts.filter(ft => ft.life > 0);
        mgctx.restore();

        // Crosshair
        if (gameState === 'playing' && !cinematicState) {
            mgctx.strokeStyle = '#00f0ff'; mgctx.lineWidth = 3; mgctx.shadowBlur = 8; mgctx.shadowColor = '#00f0ff'; mgctx.beginPath();
            mgctx.moveTo(mouse.screenX - 15, mouse.screenY); mgctx.lineTo(mouse.screenX + 15, mouse.screenY);
            mgctx.moveTo(mouse.screenX, mouse.screenY - 15); mgctx.lineTo(mouse.screenX, mouse.screenY + 15); mgctx.stroke(); mgctx.shadowBlur = 0;
        }

// --- BULLETPROOF HUD COUNTER & BOSS METER ---
        if (gameState === 'playing' && !cinematicState) {
            mgctx.setTransform(1, 0, 0, 1, 0, 0);
            
            // 1. Bots Blasted Counter
            mgctx.fillStyle = "rgba(0, 5, 0, 0.8)";
            mgctx.fillRect(10, 10, 240, 36);
            mgctx.strokeStyle = "#39ff14";
            mgctx.lineWidth = 2;
            mgctx.strokeRect(10, 10, 240, 36);
            
            mgctx.fillStyle = "#39ff14";
            mgctx.font = "14px 'Press Start 2P', 'Courier New', monospace";
            mgctx.textAlign = "left";
            mgctx.textBaseline = "middle";
            mgctx.shadowBlur = 0; 
            mgctx.fillText("BOTS BLASTED: " + String(sessionKills).padStart(2, '0'), 20, 28);

            // 2. Boss Health Meter (Only appears when Boss drops in)
            if (boss && boss.hp > 0) {
                mgctx.fillStyle = "rgba(0, 5, 0, 0.8)";
                mgctx.fillRect(10, 56, 240, 36);
                mgctx.strokeStyle = "#ff007f";
                mgctx.strokeRect(10, 56, 240, 36);
                
                mgctx.fillStyle = "#ff007f";
                mgctx.fillText("BOSS HP:", 20, 74);
                
                // The physical health bar fill
                mgctx.fillStyle = '#111';
                mgctx.fillRect(115, 66, 120, 16);
                mgctx.fillStyle = '#ff007f';
                mgctx.fillRect(115, 66, (boss.hp / boss.maxHp) * 120, 16);
            }
        }

        gameLoopId = requestAnimationFrame(gameLoop);
    }

    function createExplosion(x, y, color, giant = false) {
        SFX.explosion(giant); 
        if (giant) flashes.push({ x: x, y: y, color: color, life: 20 });
        let count = giant ? 50 : 15;
        for(let p = 0; p < count; p++) { particles.push({ x: x, y: y, vx: (Math.random() - 0.5) * (giant ? 25 : 10), vy: (Math.random() - 0.5) * (giant ? 25 : 10), life: 20 + Math.random() * 30, color: color, s: Math.random() * 6 + 2 }); }
    }
});

// ========================================================
// SECTION I: INTERACTIVE MARS ALIEN CANVAS
// ========================================================
const fCanvas = document.getElementById('formatLibraryCanvas');
if (fCanvas) {
    fCanvas.width = 1000; fCanvas.height = 350; 
    const fctx = fCanvas.getContext('2d');
    let fFrame = 0;
    
    // Background Elements & Interactive Arrays
    const mStars = Array.from({length: 100}, () => ({ x: Math.random() * 1000, y: Math.random() * 200, s: Math.random() * 2 + 1, t: Math.random() * Math.PI * 2 }));
    let fUfos = [];
    
    // Alien Entities
    const aliens = [
        { type: 'tank', x: -100, y: 220, speed: 0.8, color: '#e74c3c', name: 'ZORGLOX', alive: true },
        { type: 'floater', x: -300, y: 140, speed: 1.2, color: '#9b59b6', name: 'BLIP', alive: true },
        { type: 'walker', x: 1100, y: 240, speed: -1.5, color: '#f1c40f', name: 'GLAX', alive: true }
    ];

    // Subtitle Data
    let activeSubtitle = null; let activeSubTimer = 0;

    // --- INTERACTIVE BUTTON LISTENERS ---
    const btnSpawnUfo = document.getElementById('btnSpawnUfo');
    const btnAlienComms = document.getElementById('btnAlienComms');

    if (btnSpawnUfo) {
        btnSpawnUfo.addEventListener('click', (e) => {
            e.preventDefault();
            // Spawns a super-fast UFO on command
            fUfos.push({ x: 1050, y: Math.random() * 150 + 50, speed: 5 + Math.random() * 6 });
        });
    }

    // Extracted the logic so it can run without a physical mouse click
    function triggerAlienComms() {
        let speaker = aliens[Math.floor(Math.random() * aliens.length)];
        
        let bText = ""; const bChars = "⎍⍙⍜⍀☌⏁⋏⋔⌰⌿⍧⍎⍑";
        for(let i=0; i<6; i++) bText += bChars.charAt(Math.floor(Math.random() * bChars.length));
        
        let sText = ""; const sChars = "ΔΘΛΞΠΣΦΨΩ∇∰∱∲∳∽∾∿⍝⍨⍢";
        for(let i=0; i<12; i++) sText += sChars.charAt(Math.floor(Math.random() * sChars.length));

        activeSubtitle = { alienName: speaker.name, bubbleText: bText, subText: sText };
        activeSubTimer = 240; 
    }

    if (btnAlienComms) {
        btnAlienComms.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Stops physical clicks from bubbling up
            triggerAlienComms();
        });
    }

    function drawAlien(ctx, alien, frame) {
        ctx.save(); ctx.translate(alien.x, alien.y);
        
        // Restore shadows for Chrome/Edge, skip for Firefox
        if (!navigator.userAgent.toLowerCase().includes('firefox')) {
            ctx.shadowBlur = 10; 
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
        }
        
        if (alien.type === 'tank') {
            let bob = Math.sin(frame * 0.1) * 4;
            ctx.fillStyle = alien.color;
            ctx.beginPath(); ctx.roundRect(-30, -40 + bob, 60, 50, 10); ctx.fill();
            ctx.fillStyle = '#c0392b'; ctx.fillRect(-20, -30 + bob, 10, 10); ctx.fillRect(10, -20 + bob, 15, 10);
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -20 + bob, 12, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(0, -20 + bob, 5, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = alien.color; ctx.lineWidth = 12; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(-15, 10 + bob); ctx.lineTo(-20, 30 + Math.sin(frame*0.2)*10); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(15, 10 + bob); ctx.lineTo(20, 30 + Math.cos(frame*0.2)*10); ctx.stroke();
        } 
        else if (alien.type === 'floater') {
            let floatY = Math.sin(frame * 0.05) * 15;
            ctx.translate(0, floatY);
            ctx.fillStyle = alien.color;
            ctx.beginPath(); ctx.ellipse(0, 0, 30, 20, 0, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#8e44ad'; ctx.beginPath(); ctx.ellipse(0, -10, 25, 15, 0, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#39ff14'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#000'; ctx.fillRect(-2, -8, 4, 16);
            ctx.strokeStyle = alien.color; ctx.lineWidth = 6; ctx.lineCap = 'round';
            for(let i=-20; i<=20; i+=10) {
                ctx.beginPath(); ctx.moveTo(i, 15); ctx.lineTo(i + Math.sin(frame*0.1 + i)*10, 40); ctx.stroke();
            }
        }
        else if (alien.type === 'walker') {
            let bob = Math.sin(frame * 0.2) * 5;
            ctx.fillStyle = alien.color;
            ctx.beginPath(); ctx.ellipse(0, -30 + bob, 15, 25, 0, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#00f0ff';
            ctx.beginPath(); ctx.arc(-5, -40 + bob, 4, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(5, -40 + bob, 4, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(0, -30 + bob, 4, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = alien.color; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(-10, -10 + bob); ctx.lineTo(-30, 10 - Math.sin(frame*0.3)*15); ctx.lineTo(-40, 40); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(10, -10 + bob); ctx.lineTo(30, 10 - Math.cos(frame*0.3)*15); ctx.lineTo(40, 40); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, -5 + bob); ctx.lineTo(0, 20 - Math.sin(frame*0.3+1)*10); ctx.lineTo(-10, 40); ctx.stroke();
        }

        if (activeSubtitle && activeSubtitle.alienName === alien.name) {
            ctx.fillStyle = '#fff'; ctx.shadowBlur = 0;
            ctx.beginPath(); ctx.roundRect(-40, -90, 80, 30, 8); ctx.fill();
            ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(-10, -45); ctx.lineTo(10, -60); ctx.fill();
            ctx.fillStyle = '#000'; ctx.font = 'bold 18px monospace'; ctx.textAlign = 'center';
            ctx.fillText(activeSubtitle.bubbleText, 0, -68);
        }
        ctx.restore();
    }

    // MOVED OUTSIDE THE LOOP FOR FIREFOX PERFORMANCE
    let skyGrad = null;

    function drawMarsLandscape() {
        const formatDb = document.getElementById('formatInterface');
        
        // THE BULLETPROOF GATEKEEPER: Is it physically open as a SPA or a Drawer?
        const isVisible = formatDb && (formatDb.classList.contains('active-layer') || formatDb.classList.contains('open'));
        
        // If it is hidden or closed, keep the loop alive but SKIP all heavy rendering
        if (fCanvas.clientWidth === 0 || !isVisible) { 
            requestAnimationFrame(drawMarsLandscape); 
            return; 
        }

        fFrame++; fctx.clearRect(0, 0, 1000, 350);

        // Render Gradient once and cache it
        if (!skyGrad) {
            skyGrad = fctx.createLinearGradient(0, 0, 0, 250);
            skyGrad.addColorStop(0, '#2c0608'); 
            skyGrad.addColorStop(1, '#8e1b1b');
        }
        
        fctx.fillStyle = skyGrad; 
        fctx.fillRect(0, 0, 1000, 350);
        
        mStars.forEach(s => {
            s.t += 0.05; fctx.fillStyle = `rgba(255, 255, 255, ${0.2 + Math.abs(Math.sin(s.t)) * 0.8})`;
            fctx.fillRect(s.x, s.y, s.s, s.s);
        });

        fctx.fillStyle = '#d35400'; fctx.beginPath(); fctx.arc(800, 100, 60, 0, Math.PI*2); fctx.fill();
        fctx.fillStyle = 'rgba(0,0,0,0.2)'; fctx.beginPath(); fctx.arc(770, 80, 15, 0, Math.PI*2); fctx.fill(); fctx.beginPath(); fctx.arc(820, 120, 20, 0, Math.PI*2); fctx.fill();

        fctx.fillStyle = '#641e16';
        fctx.beginPath(); fctx.moveTo(0, 250); fctx.lineTo(200, 100); fctx.lineTo(400, 250); fctx.fill();
        fctx.beginPath(); fctx.moveTo(300, 250); fctx.lineTo(550, 80); fctx.lineTo(850, 250); fctx.fill();
        fctx.beginPath(); fctx.moveTo(700, 250); fctx.lineTo(1000, 120); fctx.lineTo(1000, 250); fctx.fill();

        fctx.fillStyle = '#a04000'; fctx.beginPath(); fctx.ellipse(500, 350, 700, 120, 0, 0, Math.PI*2); fctx.fill();
        fctx.fillStyle = '#873600'; 
        for(let c=0; c<1000; c+=100) { fctx.beginPath(); fctx.arc(c, 260 + Math.sin(c)*20, 30, 0, Math.PI, true); fctx.fill(); }

        // Render Passing Spacecrafts
        for (let i = fUfos.length - 1; i >= 0; i--) {
            let u = fUfos[i]; u.x -= u.speed;
            fctx.save(); fctx.translate(u.x, u.y + Math.sin(fFrame * 0.05) * 10);
            fctx.fillStyle = 'rgba(0, 240, 255, 0.4)'; fctx.beginPath(); fctx.arc(0, -3, 10, Math.PI, 0); fctx.fill();
            fctx.fillStyle = '#95a5a6'; fctx.beginPath(); fctx.ellipse(0, 0, 24, 6, 0, 0, Math.PI * 2); fctx.fill();
            if (fFrame % 20 < 10) { fctx.fillStyle = '#ff007f'; fctx.fillRect(-16, -1, 4, 4); fctx.fillStyle = '#39ff14'; fctx.fillRect(12, -1, 4, 4); }
            fctx.restore();
            if (u.x < -50) fUfos.splice(i, 1);
        }

        aliens.forEach(alien => {
            alien.x += alien.speed;
            if (alien.speed > 0 && alien.x > 1100) alien.x = -150;
            if (alien.speed < 0 && alien.x < -150) alien.x = 1100;
            drawAlien(fctx, alien, fFrame);
        });

        if (activeSubTimer > 0) {
            activeSubTimer--;
            
            fctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            fctx.beginPath(); fctx.roundRect(150, 280, 700, 50, 8); fctx.fill();
            
            fctx.font = '14px "Press Start 2P", monospace';
            let namePart = `- [${activeSubtitle.alienName}]`;
            let subPart = ` ${activeSubtitle.subText}`;
            
            let nameWidth = fctx.measureText(namePart).width;
            let subWidth = fctx.measureText(subPart).width;
            let startX = 500 - ((nameWidth + subWidth) / 2);
            
            fctx.textAlign = 'left';
            fctx.fillStyle = '#ffea00'; 
            fctx.fillText(namePart, startX, 312);
            fctx.fillStyle = '#ffffff';
            fctx.fillText(subPart, startX + nameWidth, 312);
        } else if (Math.random() < 0.003) {
            triggerAlienComms(); // Fires the logic natively without faking a mouse click
        }

        requestAnimationFrame(drawMarsLandscape);
    }
    drawMarsLandscape();
}

// ========================================================
// SECTION J: CARTOON NEON BORDER & FIREWORKS ENGINE
// ========================================================
document.addEventListener("DOMContentLoaded", () => {
    const cards = document.querySelectorAll('.format-card');
    const cardEngines = [];

    // Bright cartoon palette for explosions
    const burstColors = ['#ff007f', '#00f0ff', '#39ff14', '#ffea00', '#ffffff', '#8a2be2'];
    let globalBurstTimer = 180; 

    cards.forEach((card) => {
        const canvas = document.createElement('canvas');
        canvas.className = 'card-border-canvas';
        card.insertBefore(canvas, card.firstChild);
        
        const ctx = canvas.getContext('2d');
        
        let color = '#00f0ff'; 
        if(card.classList.contains('glow-pink')) color = '#ff007f';
        if(card.classList.contains('glow-green')) color = '#39ff14';
        if(card.classList.contains('glow-yellow')) color = '#ffea00';

        cardEngines.push({ 
            canvas, ctx, card, color, 
            pulse: Math.random() * Math.PI * 2,
            particles: []
        });
    });

    // Detect if the user is on Firefox
    const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');

    function renderNeonBorders() {
        const formatDb = document.getElementById('formatInterface');
        const isVisible = formatDb && (formatDb.classList.contains('active-layer') || formatDb.classList.contains('open'));

        // The Gatekeeper: Freeze if the drawer is closed
        if (!isVisible) {
            requestAnimationFrame(renderNeonBorders);
            return;
        }

        // --- GLOBAL CARTOON FIREWORK LOGIC ---
        // Skipped on Firefox, but we also disable it here to save Intel UHDs from particle overload
        if (!isFirefox && Math.random() < 0.005) { // Vastly reduced firework frequency
            const targetEngine = cardEngines[Math.floor(Math.random() * cardEngines.length)];
            const w = targetEngine.card.clientWidth;
            const h = targetEngine.card.clientHeight;
            
            const bx = 60 + Math.random() * (w - 120);
            const by = 60 + Math.random() * (h - 120);
            
            for(let i = 0; i < 8; i++) { // Halved the particle count
                const angle = Math.random() * Math.PI * 2;
                const speed = 10 + Math.random() * 15; 
                
                targetEngine.particles.push({
                    x: bx, y: by, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, 
                    life: 20 + Math.random() * 15, maxLife: 35, type: 'bubble',
                    size: 10 + Math.random() * 15, color: burstColors[Math.floor(Math.random() * burstColors.length)] 
                });
            }
        }

        // --- RENDER EACH CARD (GEOMETRY-BASED GLOW) ---
        cardEngines.forEach(engine => {
            const w = engine.card.clientWidth;
            const h = engine.card.clientHeight;
            
            if(engine.canvas.width !== w || engine.canvas.height !== h) {
                engine.canvas.width = w; engine.canvas.height = h;
            }
            
            const ctx = engine.ctx;
            ctx.clearRect(0, 0, w, h);
            
            engine.pulse += 0.05;
            const bounce = Math.abs(Math.sin(engine.pulse)); 
            const borderThick = 6; 
            const cornerRadius = 14; 

            ctx.lineJoin = 'round';
            ctx.shadowBlur = 0; // ABSOLUTE LOCK: No native blurs allowed

            // 1. Outer Faint Glow (Thickest, highly transparent)
            ctx.strokeStyle = engine.color;
            ctx.lineWidth = borderThick + 12 + (bounce * 8); 
            ctx.globalAlpha = 0.15;
            ctx.beginPath();
            ctx.roundRect(borderThick/2, borderThick/2, w - borderThick, h - borderThick, cornerRadius);
            ctx.stroke();

            // 2. Mid Glow (Medium thickness)
            ctx.lineWidth = borderThick + 4 + (bounce * 4); 
            ctx.globalAlpha = 0.45;
            ctx.beginPath();
            ctx.roundRect(borderThick/2, borderThick/2, w - borderThick, h - borderThick, cornerRadius);
            ctx.stroke();

            // 3. White Hot Inner Core (Thinnest, opaque)
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2 + (bounce * 2);
            ctx.globalAlpha = 0.9;
            ctx.beginPath();
            ctx.roundRect(borderThick/2, borderThick/2, w - borderThick, h - borderThick, cornerRadius);
            ctx.stroke();

            // 4. Render Fireworks
            for (let i = engine.particles.length - 1; i >= 0; i--) {
                let p = engine.particles[i];
                p.life--;
                ctx.globalAlpha = p.life / p.maxLife;
                p.x += p.vx; p.y += p.vy;
                p.vx *= 0.85; p.vy *= 0.85;
                p.size *= 0.92; 
                ctx.fillStyle = p.color;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
                if (p.life <= 0) engine.particles.splice(i, 1);
            }
        });
        
        requestAnimationFrame(renderNeonBorders);
    }
    
    renderNeonBorders();
});

// ========================================================
// SECTION K: SYSTEM SETTINGS HUB CRT BACKGROUND (VHS VIDEO GLITCH)
// ========================================================
const hubCanvas = document.getElementById('hubBgCanvas');
if (hubCanvas) {
    const hCtx = hubCanvas.getContext('2d', { alpha: false }); 
    let trackingY = 0;
    let squiggleX = -100; 

    function syncHubDimensions() {
        if (hubCanvas.clientWidth === 0) return;
        if (hubCanvas.width !== hubCanvas.clientWidth || hubCanvas.height !== hubCanvas.clientHeight) {
            hubCanvas.width = hubCanvas.clientWidth;
            hubCanvas.height = hubCanvas.clientHeight;
        }
    }
    window.addEventListener('resize', syncHubDimensions);

    // 1. Generate Authentic VHS Static Noise
    const noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = 300;
    noiseCanvas.height = 300;
    const nCtx = noiseCanvas.getContext('2d');
    const noiseData = nCtx.createImageData(300, 300);
    
    for (let i = 0; i < noiseData.data.length; i += 4) {
        let rand = Math.random();
        if (rand < 0.15) {
            noiseData.data[i] = 255; noiseData.data[i+1] = 0; noiseData.data[i+2] = 150 + Math.random()*105; 
        } else if (rand < 0.3) {
            noiseData.data[i] = 0; noiseData.data[i+1] = 200 + Math.random()*55; noiseData.data[i+2] = 255; 
        } else if (rand < 0.45) {
            noiseData.data[i] = 0; noiseData.data[i+1] = 200 + Math.random()*55; noiseData.data[i+2] = 0; 
        } else {
            let val = Math.random() * 200; 
            noiseData.data[i] = val; noiseData.data[i+1] = val; noiseData.data[i+2] = val; 
        }
        noiseData.data[i+3] = 255;
    }
    nCtx.putImageData(noiseData, 0, 0);

    const colors = [
        'rgba(255, 0, 127, ',  
        'rgba(0, 240, 255, ',  
        'rgba(57, 255, 20, ',  
        'rgba(255, 234, 0, ',  
        'rgba(255, 0, 0, '     
    ];

    let vhsBands = [];
    for (let i = 0; i < 5; i++) { // Increased number of bands
        vhsBands.push({
            y: Math.random() * 1000,
            height: 60 + Math.random() * 250,
            baseColor: colors[Math.floor(Math.random() * colors.length)],
            opacity: 0.25 + Math.random() * 0.5, // MUCH BRIGHTER base opacity
            speed: 1.5 + Math.random() * 3.5 
        });
    }

    function drawHubScene() {
        if (hubCanvas.clientWidth === 0) { requestAnimationFrame(drawHubScene); return; }
        
        syncHubDimensions();
        const w = hubCanvas.width;
        const h = hubCanvas.height;

        // Base Dark
        hCtx.fillStyle = '#0a0a0a';
        hCtx.fillRect(0, 0, w, h);

        // 2. Smooth Drifting Background Color Bands (Brighter)
        hCtx.globalCompositeOperation = 'screen';
        vhsBands.forEach(band => {
            band.y += band.speed;
            if (band.y > h) {
                band.y = -band.height;
                band.baseColor = colors[Math.floor(Math.random() * colors.length)];
                band.opacity = 0.25 + Math.random() * 0.5; // Brighter respawn
                band.speed = 1.5 + Math.random() * 3.5;
            }
            hCtx.fillStyle = band.baseColor + band.opacity + ')';
            hCtx.fillRect(0, band.y, w, band.height);
        });

        // 3. Flashing Color Overlay Bars (MORE FREQUENT, LESS SUBTLE)
        if (Math.random() < 0.35) { // 35% chance to flash (Up from 25%)
            let flashColor = colors[Math.floor(Math.random() * colors.length)];
            // Opacity boosted significantly so the flashes are very visible
            hCtx.fillStyle = flashColor + (0.25 + Math.random() * 0.35) + ')'; 
            hCtx.fillRect(0, Math.random() * h, w, 30 + Math.random() * 100);
        }
        
        // 4. Tile the Static Noise Layer
        hCtx.globalCompositeOperation = 'overlay';
        hCtx.globalAlpha = 0.3 + (Math.random() * 0.5); 
        const offsetX = (Math.random() * 300) | 0;
        const offsetY = (Math.random() * 300) | 0;
        for(let x = -offsetX; x < w; x += 300) {
            for(let y = -offsetY; y < h; y += 300) {
                hCtx.drawImage(noiseCanvas, x, y);
            }
        }
        hCtx.globalAlpha = 1.0;
        hCtx.globalCompositeOperation = 'source-over';

        // 5. Vertical Color Squiggle
        squiggleX += 5 + (Math.random() * 8); 
        
        if (squiggleX > w + 200 && Math.random() < 0.01) {
            squiggleX = -100;
        }

        if (squiggleX > -100 && squiggleX < w + 100) {
            hCtx.globalCompositeOperation = 'screen';
            
            hCtx.beginPath();
            hCtx.moveTo(squiggleX, 0);
            for (let y = 0; y <= h; y += 30) {
                hCtx.lineTo(squiggleX + ((Math.random() - 0.5) * 80), y);
            }
            
            hCtx.strokeStyle = `rgba(0, 240, 255, ${0.4 + Math.random() * 0.4})`;
            hCtx.lineWidth = 6 + Math.random() * 10;
            hCtx.stroke();
            
            hCtx.beginPath();
            hCtx.moveTo(squiggleX, 0);
            for (let y = 0; y <= h; y += 30) {
                hCtx.lineTo(squiggleX + ((Math.random() - 0.5) * 60), y);
            }
            hCtx.strokeStyle = `rgba(255, 0, 127, ${0.5 + Math.random() * 0.5})`;
            hCtx.lineWidth = 2 + Math.random() * 6;
            hCtx.stroke();
            
            hCtx.globalCompositeOperation = 'source-over';
        }

        // 6. Tracking Tear
        trackingY += 2; 
        if (trackingY > h + 150) trackingY = -150;

        if (trackingY > -50 && trackingY < h) {
            const tearHeight = 60;
            hCtx.fillStyle = `rgba(255, 255, 255, ${0.4 + Math.random() * 0.5})`;
            hCtx.fillRect(0, trackingY, w, 3 + Math.random() * 4);
            hCtx.fillStyle = `rgba(255, 0, 127, ${0.2 + Math.random() * 0.4})`; 
            hCtx.fillRect(0, trackingY - 20, w, tearHeight);
            hCtx.fillStyle = `rgba(0, 240, 255, ${0.2 + Math.random() * 0.4})`; 
            hCtx.fillRect(0, trackingY + 20, w, tearHeight);
        }

        // 7. Thick, Dense Horizontal Scanlines (Slightly lighter so it doesn't crush the colors)
        hCtx.fillStyle = 'rgba(0, 0, 0, 0.55)'; // Was 0.65
        for (let y = 0; y < h; y += 5) { 
            hCtx.fillRect(0, y, w, 3);
        }

        requestAnimationFrame(drawHubScene);
    }
    
    drawHubScene();
}

// ========================================================
// SECTION L: HEAVY INDUSTRIAL TELEMETRY ENGINE
// ========================================================
const uplinkData = {
    // CUSTOM 8-BIT LOGOS
    youtube: {
        logo: " ▄████▄ \n███▶███\n ▀████▀ ",
        color: "#ff0000",
        text: "TARGET: YOUTUBE\nFORMAT REQ: .SRT OR .VTT\n\n[ PROTOCOL ]\n1. YouTube Studio -> Subtitles.\n2. Click video -> 'Add Language'.\n3. Select 'Upload File' -> 'With timing'.\n4. Upload payload."
    },
    facebook: {
        logo: "▄████\n██▀▀▀\n████ \n██   ",
        color: "#00f0ff",
        text: "TARGET: META BUSINESS SUITE\nFORMAT REQ: FACEBOOK SRT\n\n[ PROTOCOL ]\n1. Meta Business Suite -> Upload Video.\n2. Expand 'Show More' -> Toggle 'Captions & Subtitles'.\n3. Upload payload.\n\n[ CRITICAL WARNING ]\nYour file MUST be named 'filename.en_US.srt'. If .en_US is missing, Meta will instantly reject."
    },
    instagram: {
        logo: " ▄████▄ \n██▄██▄██\n██ ██ ██\n▀██████▀",
        color: "#ff007f",
        text: "TARGET: INSTAGRAM REELS\nFORMAT REQ: .SRT OR BURNED-IN\n\n[ PROTOCOL ]\n1. Upload Reel -> 'Advanced Settings'.\n2. 'Accessibility' -> 'Upload Captions'.\n3. Attach .SRT payload.\n\n[ NOTE ]: For maximum stylized compatibility, Burned-In captions are recommended."
    },
    tiktok: {
        logo: "   ▄█ \n   ██ \n ▄███ \n██▀██ \n▀███▀ ",
        color: "#ffffff",
        text: "TARGET: TIKTOK\nFORMAT REQ: .SRT OR BURNED-IN\n\n[ PROTOCOL ]\n1. Access Desktop Web Portal.\n2. Initiate upload -> Locate 'Captions'.\n3. Select .SRT payload.\n\n[ NOTE ]: Mobile app does not currently support custom SRT uploads. Use Burned-In for styling."
    },
    linkedin: {
        logo: "▄█ ▄██▄\n▀▀ ██ ██\n██ ██ ██\n██ ██ ██",
        color: "#00f0ff",
        text: "TARGET: LINKEDIN B2B NETWORK\nFORMAT REQ: .SRT\n\n[ PROTOCOL ]\n1. Initiate video post -> Click 'Edit'.\n2. Click 'Select Caption'.\n3. Attach .SRT file.\n4. Finalize post."
    },
    twitter: {
        logo: "█   █\n █ █ \n  █  \n █ █ \n█   █",
        color: "#ffffff",
        text: "TARGET: X (TWITTER) MEDIA STUDIO\nFORMAT REQ: .SRT\n\n[ PROTOCOL ]\n1. Access X Media Studio.\n2. Upload video -> Click settings.\n3. 'Subtitles' tab -> Select language -> Upload .SRT."
    },
    netflix: {
        logo: "█▄  █\n██▄ █\n█ ▀██\n█  ▀█",
        color: "#ff0000",
        text: "TARGET: NETFLIX BACKLOT\nFORMAT REQ: TTML\n\n[ PROTOCOL ]\n1. Access Netflix Backlot (Partner Clearance Required).\n2. Upload TTML payload to Source Request.\n\n[ CRITICAL ] Strict Timed Text Style Guide enforced. Automated rejection for reading speed/line length violations."
    },
    amazon: {
        logo: "<span style='color:#ff9900'>╰━━━━━➤</span>",
        color: "#ff9900",
        text: "TARGET: AMAZON PRIME VIDEO DIRECT\nFORMAT REQ: TTML OR SRT\n\n[ PROTOCOL ]\n1. Prime Video Direct portal -> Video Assets.\n2. 'Captions' section -> Select language -> Upload payload."
    },
    apple: {
        logo: "  ▄▀  \n▄████▄\n██████\n▀████▀",
        color: "#a0a0a0",
        text: "TARGET: APPLE TV / iTUNES CONNECT\nFORMAT REQ: ITT\n\n[ PROTOCOL ]\n1. Prepare delivery via Apple Transporter/Compressor.\n2. Attach .iTT payload to video asset package.\n3. Transmit to iTunes Connect."
    },
    disney: {
        logo: "████▄ \n█   ██\n█   ██\n████▀ ",
        color: "#0000cc",
        text: "TARGET: DISNEY+ SUPPLY CHAIN\nFORMAT REQ: TTML\n\n[ PROTOCOL ]\n1. Access Disney Media Distribution portal.\n2. Route TTML via Aspera or native UI."
    },
    max: {
        logo: "█▄█▄█ ▄▀▄ ▀▄▀\n█ █ █ █▀█ ▄▀▄",
        color: "#b000ff",
        text: "TARGET: WARNER BROS DISCOVERY (MAX)\nFORMAT REQ: TTML\n\n[ PROTOCOL ]\n1. Package payload via WBD technical delivery specs.\n2. Ensure SMPTE timecode alignment."
    },
    hulu: {
        logo: "█  █\n████\n█  █",
        color: "#39ff14",
        text: "TARGET: HULU AD-SUPPORTED & PREMIUM\nFORMAT REQ: TTML\n\n[ PROTOCOL ]\n1. Upload to Hulu Partner Portal.\n2. Validate TTML payload against Hulu specs."
    },
    peacock: {
        // Multi-colored spans
        logo: "<span style='color:#00f0ff'>▄</span><span style='color:#39ff14'>▄</span><span style='color:#ffea00'>▄</span><span style='color:#ff007f'>▄</span>\n<span style='color:#00f0ff'>█</span><span style='color:#39ff14'>█</span><span style='color:#ffea00'>█</span><span style='color:#ff007f'>█</span>\n<span style='color:#ffffff'> █▀ </span>",
        color: "#ffffff",
        text: "TARGET: NBCUNIVERSAL PEACOCK\nFORMAT REQ: TTML\n\n[ PROTOCOL ]\n1. Route TTML payload to NBCU ingest servers.\n2. Requires strict frame-rate parity."
    },
    paramount: {
        logo: "  ★  \n ▄█▄ \n█████",
        color: "#00f0ff",
        text: "TARGET: PARAMOUNT+ GLOBAL\nFORMAT REQ: TTML\n\n[ PROTOCOL ]\n1. Transmit TTML payload via ViacomCBS portal."
    },
    discovery: {
        logo: "████▄\n█   █\n████▀",
        color: "#00f0ff",
        text: "TARGET: DISCOVERY+ NETWORKS\nFORMAT REQ: TTML\n\n[ PROTOCOL ]\n1. Upload TTML via WBD Supply Chain."
    },
    amc: {
        logo: "  ▄█▄  \n ▄█ █▄ \n █████ \n █   █ ",
        color: "#ffea00",
        text: "TARGET: AMC+ NETWORKS\nFORMAT REQ: TTML\n\n[ PROTOCOL ]\n1. Ingest via AMC Digital Delivery."
    },
    starz: {
        logo: "  ▄█▄  \n▄█████▄\n  ▀█▀  \n ▄▀ ▀▄ ",
        color: "#ffffff",
        text: "TARGET: LIONSGATE / STARZ\nFORMAT REQ: TTML\n\n[ PROTOCOL ]\n1. Upload TTML payload to Starz Media portal."
    },
    premiere: {
        logo: "████\n█▄▄▀\n█   ",
        color: "#b000ff",
        text: "TARGET: ADOBE PREMIERE PRO\nFORMAT REQ: .SRT OR .MCC\n\n[ PROTOCOL ]\n1. File > Import payload.\n2. Drag to timeline above video tracks.\n3. Export -> Captions tab -> 'Create Sidecar' or 'Burn In'."
    },
    resolve: {
        // Multi-colored spans
        logo: "<span style='color:#ff4d4d'> ▄██▄ </span>\n<span style='color:#ffea00'>██</span><span style='color:#39ff14'>██</span>\n<span style='color:#00f0ff'> ▀██▀ </span>",
        color: "#ffffff",
        text: "TARGET: DAVINCI RESOLVE\nFORMAT REQ: .SRT OR .VTT\n\n[ PROTOCOL ]\n1. Media Pool > Import > Subtitles.\n2. Drag to timeline.\n3. Deliver page -> Subtitle Settings -> Export Subtitle."
    }
};

// --- TERMINAL TYPING & BOOT ENGINE ---
const mechBtns = document.querySelectorAll('.mech-btn');
const btnCores = document.querySelectorAll('.btn-core');
const dosOutput = document.getElementById('dosOutput');
const lofiLogoDisplay = document.getElementById('lofiLogoDisplay');
const dosContentArea = document.querySelector('.dos-inner-content');
let typeWriterInterval;
let bootTimeout; // Memory for the boot sequence so we can kill it if a user clicks fast

// Status Lights

// Status Lights
const statPwr = document.getElementById('statusPwr');
const statLnk = document.getElementById('statusLnk');
const statDat = document.getElementById('statusDat');
const statErr = document.getElementById('statusErr');

// De-sync the button standby pulsing so they all blink randomly
btnCores.forEach(core => {
    core.style.animationDelay = `-${Math.random() * 3}s`;
});

function triggerBootSequence(targetId) {
        const data = uplinkData[targetId];
        if(!data) return;

        clearInterval(typeWriterInterval);
        clearTimeout(bootTimeout); 
        
        // THE REFLOW NUKE: Forces the GPU to dump the stranded 'T' texture
        dosOutput.style.display = 'none';
        dosOutput.textContent = "";
        void dosOutput.offsetHeight; 
        dosOutput.style.display = '';
        
        dosContentArea.classList.add('booting-sequence');
        if(statLnk) statLnk.classList.remove('on-green');
        if(statDat) statDat.classList.remove('on-green');
        
        bootTimeout = setTimeout(() => {
            dosContentArea.classList.remove('booting-sequence');
            if(statLnk) statLnk.classList.add('on-green');
            
            lofiLogoDisplay.innerHTML = data.logo;
            lofiLogoDisplay.style.color = data.color;
            lofiLogoDisplay.style.textShadow = `0 0 10px ${data.color}, 0 0 20px ${data.color}`;
            
            let i = 0;
            typeWriterInterval = setInterval(() => {
                // Forces a clean string render
                dosOutput.textContent = data.text.substring(0, i + 1);
                i++;
                if(statDat) statDat.classList.toggle('on-green'); 
                
                dosContentArea.scrollTop = dosContentArea.scrollHeight;
                if (i >= data.text.length) {
                    clearInterval(typeWriterInterval);
                    if(statDat) statDat.classList.add('on-green'); 
                }
            }, 10);
        }, 300); 
    }

mechBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        mechBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        triggerBootSequence(this.getAttribute('data-target'));
    });
});

setInterval(() => {
    if(statPwr && document.getElementById('deploymentInterface').classList.contains('active-layer')) {
        statPwr.classList.add('on-green');
        if(Math.random() < 0.05) statErr.classList.add('on-red');
        else statErr.classList.remove('on-red');
    }
}, 500);

if(document.getElementById('deploymentInterface')) {
    setTimeout(() => { 
        if(statPwr) statPwr.classList.add('on-green');
        
        // THE REFLOW NUKE: Forces the GPU to dump the stranded 'A' texture
        if(dosOutput) {
            dosOutput.style.display = 'none';
            void dosOutput.offsetHeight;
            dosOutput.style.display = '';
        }

        // Load the Idle "Choose Target" Screen
        if(lofiLogoDisplay) lofiLogoDisplay.innerHTML = "<div class='orbiting-logo-container' style='position: relative; width: 60px; height: 60px; margin: 0 auto 20px auto;'><div style='position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 2px dashed #00f0ff; border-radius: 50%; animation: radarSpin 4s linear infinite;'></div><div style='position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #00f0ff; font-size: 24px; text-shadow: 0 0 10px #00f0ff;'>?</div></div>";
        if(dosOutput) dosOutput.innerHTML = "AWAITING TARGET SELECTION...<br><br><span style='color: #fff;'>PLEASE SELECT A DESTINATION FROM THE LEFT OR RIGHT PANEL TO LOAD DEPLOYMENT PROTOCOLS.</span>";
        
    }, 800);
}

// --- HARDWARE CANVAS ENGINES & SPINNING KNOBS ---
const oscCanvas = document.getElementById('oscCanvas');
const vuCanvas = document.getElementById('vuCanvas');
let oscCtx, vuCtx;

if (oscCanvas && vuCanvas) {
    oscCtx = oscCanvas.getContext('2d');
    vuCtx = vuCanvas.getContext('2d');

    let tele = {
        oscFreq: 0.05,
        oscAmp: 30,
        oscColor: '#39ff14',
        vuSpikeMode: false,
        glitchMode: false
    };

    let time = 0;
    const vuLevels = [20, 40, 30, 60, 50, 20, 10, 40];

    function drawHardware() {
        if (!document.getElementById('deploymentInterface').classList.contains('active-layer')) {
            requestAnimationFrame(drawHardware); return;
        }

        oscCtx.fillStyle = '#050a05';
        if (tele.glitchMode && Math.random() < 0.1) oscCtx.fillStyle = '#111'; 
        oscCtx.fillRect(0, 0, oscCanvas.width, oscCanvas.height);
        
        oscCtx.strokeStyle = '#112211'; oscCtx.lineWidth = 1;
        for(let i=0; i<oscCanvas.width; i+=20) { oscCtx.beginPath(); oscCtx.moveTo(i,0); oscCtx.lineTo(i,oscCanvas.height); oscCtx.stroke(); }
        for(let i=0; i<oscCanvas.height; i+=20) { oscCtx.beginPath(); oscCtx.moveTo(0,i); oscCtx.lineTo(oscCanvas.width,i); oscCtx.stroke(); }

        oscCtx.beginPath();
        oscCtx.strokeStyle = tele.oscColor;
        oscCtx.lineWidth = 2;
        oscCtx.shadowBlur = 8;
        oscCtx.shadowColor = tele.oscColor;

        let centerY = oscCanvas.height / 2;
        for(let x=0; x<oscCanvas.width; x++) {
            let actualFreq = tele.oscFreq;
            if(tele.glitchMode) actualFreq += (Math.random() - 0.5) * 0.15; 
            
            let y = centerY + Math.sin(x * actualFreq + time) * tele.oscAmp;
            
            if(tele.glitchMode) {
                y += (Math.random() - 0.5) * 30; 
                oscCtx.strokeStyle = ['#ff0000', '#00f0ff', '#39ff14', '#fff'][Math.floor(Math.random()*4)];
            }
            if(x===0) oscCtx.moveTo(x, y); else oscCtx.lineTo(x, y);
        }
        oscCtx.stroke();
        oscCtx.shadowBlur = 0;

        vuCtx.fillStyle = '#050a05';
        vuCtx.fillRect(0, 0, vuCanvas.width, vuCanvas.height);
        
        let barWidth = (vuCanvas.width / vuLevels.length) - 4;
        
        for(let i=0; i<vuLevels.length; i++) {
            let target = Math.random() * 60;
            if(tele.vuSpikeMode) target = 50 + Math.random() * 50; 
            
            vuLevels[i] += (target - vuLevels[i]) * 0.2;
            let levelHeight = vuLevels[i];
            let x = i * (barWidth + 4) + 2;
            let y = vuCanvas.height - levelHeight;

            for(let sy = vuCanvas.height; sy > y; sy -= 6) {
                if (sy > vuCanvas.height * 0.4) vuCtx.fillStyle = tele.oscColor; 
                else if (sy > vuCanvas.height * 0.15) vuCtx.fillStyle = '#ffea00'; 
                else vuCtx.fillStyle = '#ff0000'; 
                
                if(tele.glitchMode && Math.random() < 0.2) vuCtx.fillStyle = '#fff'; 
                vuCtx.fillRect(x, sy - 4, barWidth, 4);
            }
        }

        time += 0.15;
        requestAnimationFrame(drawHardware);
    }
    drawHardware();

    // --- DRAGGABLE KNOB TRIGONOMETRY ---
    // --- DRAGGABLE KNOB TRIGONOMETRY (Touch + Mouse) ---
    const hKnobs = document.querySelectorAll('.analog-knob');
    const panel = document.querySelector('.heavy-machinery-panel'); 

    hKnobs.forEach(knob => {
        const dial = knob.querySelector('.knob-dial');
        const action = knob.getAttribute('data-action');
        let isDragging = false;

        const startDrag = (e) => { 
            isDragging = true; 
            document.body.style.cursor = 'grabbing'; 
        };
        
        const endDrag = () => { 
            isDragging = false; 
            document.body.style.cursor = ''; 
        };
        
        const drag = (e) => {
            if (!isDragging) return;
            
            // Prevent page scroll on mobile while turning
            if (e.type === 'touchmove') e.preventDefault(); 
            
            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            
            const rect = dial.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            let angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
            angle += 90; 
            
            dial.style.transform = `rotate(${angle}deg)`;
            
            if (action === 'freq-up') {
                tele.oscFreq = 0.01 + (Math.abs(angle / 360) * 0.3); 
            }
            if (action === 'color-shift') {
                const colors = ['#39ff14', '#00f0ff', '#ff007f', '#ffea00', '#ffffff'];
                let index = Math.floor(Math.abs(angle) / (360 / colors.length)) % colors.length;
                tele.oscColor = colors[index];
            }
            if (action === 'glitch') {
                if (Math.abs(angle) % 45 < 8) {
                    tele.glitchMode = true; tele.vuSpikeMode = true;
                    if(panel) panel.classList.add('system-glitch'); 
                    setTimeout(() => { 
                        tele.glitchMode = false; tele.vuSpikeMode = false; 
                        if(panel) panel.classList.remove('system-glitch');
                    }, 200);
                }
            }
        };

        // Mouse Events
        knob.addEventListener('mousedown', startDrag);
        window.addEventListener('mouseup', endDrag);
        window.addEventListener('mousemove', drag);

        // Touch Events
        knob.addEventListener('touchstart', startDrag, { passive: true });
        window.addEventListener('touchend', endDrag);
        window.addEventListener('touchmove', drag, { passive: false });
    });

}

// Close Drawer when clicking outside of it
    document.addEventListener('click', (e) => {
        const drawer = document.getElementById('formatInterface');
        const helpIcon = document.getElementById('formatHelpIcon');
        const formatDbBtn = document.getElementById('btn-format-db');

        if (drawer && drawer.classList.contains('open')) {
            // Check if the click was NOT inside the drawer, the question mark, or the hub monitor
            if (!drawer.contains(e.target) && 
                (!helpIcon || !helpIcon.contains(e.target)) && 
                (!formatDbBtn || !formatDbBtn.contains(e.target))) {
                drawer.classList.remove('open');
            }
        }
    });

// --- AUTONOMOUS RANDOMIZED CRT GLITCH ---
    const crtGlass = document.querySelector('.crt-glass');
    
    function triggerRandomGlitch() {
        if(crtGlass && document.getElementById('deploymentInterface').classList.contains('active-layer')) {
            // Apply the violent CSS animation
            crtGlass.classList.add('random-glitch-active');
            
            // Remove the class right after the animation finishes so it can be re-applied later
            setTimeout(() => {
                crtGlass.classList.remove('random-glitch-active');
            }, 300); 
        }
        
        // Schedule the next glitch at a completely random interval between 2 and 15 seconds
        let nextGlitchTime = 2000 + (Math.random() * 13000);
        setTimeout(triggerRandomGlitch, nextGlitchTime);
    }

    // Kick off the autonomous glitch loop
    setTimeout(triggerRandomGlitch, 4000);

// ========================================================
// SECTION M: INTEL PAGE MINI-ARCADE ANIMATION ENGINES (64-BIT HIGH RES)
// ========================================================
document.addEventListener("DOMContentLoaded", () => {
    
    function isIntelActive() {
        const intel = document.getElementById('intelInterface');
        return intel && intel.classList.contains('active-layer');
    }

    // --- 1. ANTI-AI CRUSADE (Spaceman & Cheering Crowd in Space) ---
    const aiCanvas = document.getElementById('antiAiCanvas');
    if (aiCanvas) {
        const actx = aiCanvas.getContext('2d');
        let frame = 0;
        
        const aiStars = [];
        for(let i=0; i<80; i++) {
            aiStars.push({ x: Math.random()*400, y: Math.random()*150, speed: Math.random()*1+0.5, size: Math.random()*2+1 });
        }

        // Vibrant neon palette so the crowd stands out in deep space
        const crowdColors = ['#ecf0f1', '#f1c40f', '#00f0ff', '#39ff14', '#ff007f', '#bdc3c7'];

        function drawAntiAi() {
            requestAnimationFrame(drawAntiAi);
            if (!isIntelActive()) return;
            frame++; actx.clearRect(0,0,400,300);
            
            let bgGrad = actx.createLinearGradient(0,0,0,300);
            bgGrad.addColorStop(0, '#020510'); bgGrad.addColorStop(1, '#0a1530');
            actx.fillStyle = bgGrad; actx.fillRect(0,0,400,300);
            
            actx.fillStyle = '#fff';
            aiStars.forEach(s => {
                s.x -= s.speed;
                if(s.x < 0) { s.x = 400; s.y = Math.random()*150; }
                actx.fillRect(s.x, s.y, s.size, s.size);
            });

            actx.fillStyle = 'rgba(0,240,255,0.05)';
            actx.beginPath(); actx.ellipse(200, 300, 300, 100, 0, 0, Math.PI*2); actx.fill();

            actx.save(); actx.translate(200, 350); 
            
            // Bright Cheering Crowd
            actx.save();
            for(let c=0; c<6; c++) {
                let cx = -180 + (c * 70);
                let jump = Math.abs(Math.sin(frame * 0.1 + c)) * 25;
                
                actx.fillStyle = crowdColors[c]; 
                actx.beginPath(); actx.roundRect(cx, -120 - jump, 40, 60, 10); actx.fill();
                actx.fillStyle = '#ffffff'; // White helmets
                actx.beginPath(); actx.arc(cx + 20, -135 - jump, 22, 0, Math.PI*2); actx.fill();
                actx.fillStyle = '#111'; // Visors
                actx.beginPath(); actx.ellipse(cx + 20, -135 - jump, 16, 10, 0, 0, Math.PI*2); actx.fill();
                actx.fillStyle = crowdColors[c];
                actx.fillRect(cx - 10, -150 - jump + (Math.sin(frame*0.2+c)*10), 10, 30);
                actx.fillRect(cx + 40, -150 - jump + (Math.cos(frame*0.2+c)*10), 10, 30);
            }
            actx.restore();
            
            // Main Spaceman
            let breath = Math.sin(frame * 0.05) * 5;
            let triumph = Math.abs(Math.sin(frame * 0.08)) * 15;

            let suitGrad = actx.createLinearGradient(-60, -150, 60, 0);
            suitGrad.addColorStop(0, '#ffffff'); suitGrad.addColorStop(1, '#839192');
            actx.fillStyle = suitGrad;
            actx.beginPath(); actx.roundRect(-70, -180 + breath, 140, 180, 40); actx.fill();
            
            actx.fillStyle = '#2c3e50'; actx.fillRect(-40, -130 + breath, 80, 50);
            actx.fillStyle = '#39ff14'; actx.fillRect(-30, -120 + breath, 15, 10);
            actx.fillStyle = '#ff007f'; actx.fillRect(-5, -120 + breath, 10, 10);

            let helmGrad = actx.createRadialGradient(0, -220 + breath, 10, 0, -220 + breath, 60);
            helmGrad.addColorStop(0, '#ffffff'); helmGrad.addColorStop(1, '#bdc3c7');
            actx.fillStyle = helmGrad;
            actx.beginPath(); actx.arc(0, -220 + breath, 65, 0, Math.PI*2); actx.fill();

            let visorGrad = actx.createLinearGradient(-40, -260, 40, -180);
            visorGrad.addColorStop(0, '#f39c12'); visorGrad.addColorStop(0.5, '#d35400'); visorGrad.addColorStop(1, '#111');
            actx.fillStyle = visorGrad;
            actx.beginPath(); actx.ellipse(0, -220 + breath, 50, 35, 0, 0, Math.PI*2); actx.fill();
            actx.fillStyle = 'rgba(255,255,255,0.4)'; actx.beginPath(); actx.ellipse(-15, -235 + breath, 20, 8, Math.PI/8, 0, Math.PI*2); actx.fill();

            // Triumphant Arm & Keyboard
            actx.save(); actx.translate(-60, -140 + breath); actx.rotate(-Math.PI/4 - (triumph * 0.02));
            actx.fillStyle = '#bdc3c7'; actx.beginPath(); actx.roundRect(-25, -120, 50, 140, 25); actx.fill();
            actx.fillStyle = '#7f8c8d'; actx.beginPath(); actx.arc(0, -130, 35, 0, Math.PI*2); actx.fill();
            
            actx.translate(0, -150); actx.rotate(Math.PI/6);
            let kbGrad = actx.createLinearGradient(-100, -30, 100, 30);
            kbGrad.addColorStop(0, '#2c3e50'); kbGrad.addColorStop(1, '#111');
            actx.fillStyle = kbGrad; actx.fillRect(-120, -30, 240, 60);
            actx.strokeStyle = '#00f0ff'; actx.lineWidth = 3; actx.strokeRect(-120, -30, 240, 60);

            for(let kx=-105; kx<105; kx+=20) {
                for(let ky=-20; ky<25; ky+=15) {
                    actx.fillStyle = (Math.random() > 0.8) ? '#ff007f' : ((Math.random() > 0.8) ? '#39ff14' : '#bdc3c7');
                    actx.fillRect(kx, ky, 15, 10);
                }
            }
            actx.restore(); actx.restore();
        }
        drawAntiAi();
    }

    // --- 2. ATMOSPHERICS (Particle Waveform Morph) ---
    const atCanvas = document.getElementById('atmosCanvas');
    if (atCanvas) {
        const atctx = atCanvas.getContext('2d');
        let frame = 0; 
        
        const textCanvas = document.createElement('canvas');
        textCanvas.width = 400; textCanvas.height = 300;
        const txtCtx = textCanvas.getContext('2d', {willReadFrequently: true});
        txtCtx.fillStyle = '#fff';
        txtCtx.font = 'bold 20px "Courier New", monospace';
        txtCtx.textAlign = 'center'; txtCtx.textBaseline = 'middle';
        txtCtx.fillText("(guttural, wet squelching)", 200, 150);

        const imgData = txtCtx.getImageData(0,0,400,300).data;
        const targets = [];
        for(let y=0; y<300; y+=2) {
            for(let x=0; x<400; x+=2) {
                let idx = (y*400 + x)*4;
                if(imgData[idx+3] > 128) targets.push({tx: x, ty: y}); 
            }
        }
        
        const particles = [];
        for(let i=0; i<targets.length; i++) {
            particles.push({ baseX: (i / targets.length) * 400, tx: targets[i].tx, ty: targets[i].ty });
        }

        function drawAtmos() {
            requestAnimationFrame(drawAtmos);
            if (!isIntelActive()) return;
            frame++; atctx.clearRect(0,0,400,300);
            
            let cycle = frame % 600;
            atctx.fillStyle = '#020505'; atctx.fillRect(0,0,400,300);

            let lerpAmt = 0;
            if (cycle < 150) lerpAmt = 0; 
            else if (cycle < 250) lerpAmt = (cycle - 150) / 100; 
            else if (cycle < 450) lerpAmt = 1; 
            else if (cycle < 550) lerpAmt = 1 - ((cycle - 450) / 100); 
            
            lerpAmt = lerpAmt * lerpAmt * (3 - 2 * lerpAmt);

            atctx.shadowBlur = 10;
            atctx.shadowColor = lerpAmt > 0.8 ? '#ffea00' : '#39ff14';

            particles.forEach(p => {
                let waveY = 150 + Math.sin(p.baseX * 0.05 + frame * 0.1) * 60;
                waveY += Math.cos(p.baseX * 0.1 - frame * 0.2) * 20;
                let currX = p.baseX + (p.tx - p.baseX) * lerpAmt;
                let currY = waveY + (p.ty - waveY) * lerpAmt;
                
                atctx.fillStyle = lerpAmt > 0.8 ? '#ffea00' : '#39ff14';
                atctx.fillRect(currX, currY, 2.5, 2.5);
            });
            atctx.shadowBlur = 0;
        }
        drawAtmos();
    }

    // --- 3. CINEMATIC PACING (Girl Reading & Shrugging) ---
    const pcCanvas = document.getElementById('pacingCanvas');
    if (pcCanvas) {
        const pctx = pcCanvas.getContext('2d');
        let frame = 0; let drops = [];
        for(let i=0; i<40; i++) drops.push({x: Math.random()*160, y: Math.random()*200, speed: 10+Math.random()*10});

        function drawPacing() {
            requestAnimationFrame(drawPacing);
            if (!isIntelActive()) return;
            frame++; 
            let cycle = frame % 780; 
            
            pctx.clearRect(0,0,400,300);
            
            let flash = (cycle > 40 && cycle < 50 && cycle % 4 < 2) || (cycle > 650 && cycle < 660 && cycle % 4 < 2);
            
            pctx.fillStyle = flash ? '#ffffff' : '#0a101d'; pctx.fillRect(40, 20, 160, 140);
            pctx.fillStyle = 'rgba(255,255,255,0.4)';
            drops.forEach(d => { d.y += d.speed; if(d.y > 140) d.y = 20; pctx.fillRect(40 + d.x, d.y, 2, 12); });

            pctx.strokeStyle = '#111'; pctx.lineWidth = 8; pctx.strokeRect(40, 20, 160, 140);
            pctx.fillRect(115, 20, 8, 140); pctx.fillRect(40, 85, 160, 8);

            let cabGrad = pctx.createLinearGradient(0, 160, 0, 300);
            cabGrad.addColorStop(0, '#3e2723'); cabGrad.addColorStop(1, '#1a100e');
            pctx.fillStyle = cabGrad; pctx.fillRect(0, 160, 400, 140);
            pctx.fillStyle = '#5d4037'; pctx.fillRect(0, 160, 400, 15); 
            
            pctx.fillStyle = '#271916'; pctx.fillRect(260, 0, 140, 120);
            pctx.fillStyle = '#1a100e'; pctx.fillRect(265, 5, 60, 110); pctx.fillRect(335, 5, 60, 110);

            if (cycle > 120 && cycle < 720) {
                pctx.fillStyle = 'rgba(0,0,0,0.85)';
                pctx.beginPath(); pctx.roundRect(40, 250, 320, 35, 8); pctx.fill();
                pctx.fillStyle = '#fff'; pctx.font = '14px "Press Start 2P", monospace';
                pctx.textAlign = 'center'; pctx.fillText("(cat screeching)", 200, 275);
            }

            let walkingIn = cycle < 100;
            let pointing = cycle >= 150 && cycle < 350;
            let staring = cycle >= 480 && cycle < 520;   
            let shrugging = cycle >= 520 && cycle < 620; 
            let walkingOut = cycle >= 620;
            
            let girlX = 110;
            if (walkingIn) girlX = -50 + (cycle * 1.6);
            else if (walkingOut) girlX = 110 + ((cycle - 620) * 2.5);

            let girlY = 160 + ((walkingIn || walkingOut) ? Math.sin(frame*0.4)*4 : 0);
            
            // Shoulders hike up 8 pixels for the deadpan shrug
            let shrugAmt = shrugging ? 8 : 0; 
            
            pctx.save();
            pctx.translate(girlX, girlY);

            // Legs
            pctx.fillStyle = '#111';
            if (walkingIn || walkingOut) {
                pctx.fillRect(-15, 60, 12, 40 + Math.sin(frame*0.4)*15);
                pctx.fillRect(5, 60, 12, 40 - Math.sin(frame*0.4)*15);
            } else {
                pctx.fillRect(-15, 60, 12, 40); pctx.fillRect(5, 60, 12, 40);
            }

            // Hair (back)
            pctx.fillStyle = '#a04000';
            pctx.beginPath(); pctx.roundRect(-20, -20, 30, 65, 10); pctx.fill();

            // BACK ARM (Hangs naturally)
            pctx.save(); pctx.translate(-25, 10 - shrugAmt);
            pctx.fillStyle = '#2980b9'; pctx.beginPath(); pctx.roundRect(-6, 0, 12, 50, 6); pctx.fill();
            pctx.restore();

            // Torso (Stretches UP to swallow the neck during the shrug)
            pctx.fillStyle = '#3498db'; pctx.beginPath(); pctx.roundRect(-25, -shrugAmt, 50, 70 + shrugAmt, 10); pctx.fill();
            
            // FRONT ARM (Points from Left to Right, NO rotation during shrug)
            pctx.save();
            pctx.translate(25, 10 - shrugAmt); 
            if (pointing) {
                let pointProgress = (cycle - 150) / 200; 
                // Starts angled down-left (PI/4), sweeps to down-right (-PI/4)
                let startAngle = Math.PI / 4; 
                let endAngle = -Math.PI / 4;
                pctx.rotate(startAngle + (pointProgress * (endAngle - startAngle))); 
            }
            pctx.fillStyle = '#2980b9'; pctx.beginPath(); pctx.roundRect(-6, 0, 12, 50, 6); pctx.fill();
            pctx.restore();
            
            // Head Tracking & Panning (Left to Right)
            let headPanX = 0;
            let eyeTrack = 0;
            if (pointing) {
                let pointProgress = (cycle - 150) / 200;
                headPanX = -8 + (pointProgress * 16); // Head pans from left (-8) to right (+8)
                eyeTrack = -4 + (pointProgress * 8);  // Eyes pan from left to right
            }
            pctx.save();
            pctx.translate(headPanX, 0);

            // Head & Face (Remains fixed so the shoulders swallow it during the shrug)
            pctx.fillStyle = '#f39c12'; pctx.beginPath(); pctx.arc(0, -20, 20, 0, Math.PI*2); pctx.fill(); 
            pctx.fillStyle = '#d35400'; pctx.beginPath(); pctx.arc(0, -25, 22, Math.PI, Math.PI*2); pctx.fill(); 
            
            // Eyes
            pctx.fillStyle = '#000';
            if (pointing) { 
                pctx.fillRect(4 + eyeTrack, -16, 5, 5); pctx.fillRect(16 + eyeTrack, -16, 5, 5);
            } else if (staring || shrugging) { 
                pctx.fillRect(-2, -18, 5, 5); pctx.fillRect(10, -18, 5, 5);
            } else if (walkingOut) { 
                pctx.fillRect(10, -20, 5, 5); pctx.fillRect(20, -20, 5, 5);
            } else {
                pctx.fillRect(4, -20, 5, 5); pctx.fillRect(16, -20, 5, 5);
            }
            
            pctx.restore(); // Restore Head
            pctx.restore(); // Restore Girl

            // Cat Jump (Frame 380 to 450)
            if (cycle > 380 && cycle < 450) {
                let t = (cycle - 380) / 70;
                let catX = 290 - (t * 200);
                let catY = 80 - Math.sin(t * Math.PI) * 60 + (t * 100); 
                
                pctx.save(); pctx.translate(catX, catY);
                pctx.fillStyle = '#050505';
                
                pctx.beginPath(); pctx.ellipse(0, 0, 25, 12, Math.PI/4, 0, Math.PI*2); pctx.fill();
                pctx.strokeStyle = '#050505'; pctx.lineWidth = 6; pctx.lineCap = 'round';
                pctx.beginPath(); pctx.moveTo(15, -5); pctx.quadraticCurveTo(30, -20, 40, -10); pctx.stroke();
                
                pctx.beginPath(); pctx.arc(-15, 5, 12, 0, Math.PI*2); pctx.fill();
                pctx.beginPath(); pctx.moveTo(-25, 0); pctx.lineTo(-20, -15); pctx.lineTo(-10, -5); pctx.fill();
                pctx.beginPath(); pctx.moveTo(-10, -5); pctx.lineTo(-5, -15); pctx.lineTo(0, -2); pctx.fill();
                
                pctx.fillStyle = '#ffea00';
                pctx.fillRect(-22, 2, 4, 4); pctx.fillRect(-12, 2, 4, 4);
                pctx.restore();
            }
        }
        drawPacing();
    }
});

// =========================================================================
// 1. TOOLTIP GHOST KILLER (Fixes the frozen bubble on page change/mobile)
// =========================================================================
document.addEventListener('click', function(e) {
    const tooltip = document.querySelector('.pro-arcade-tooltip');
    const helpIcon = document.getElementById('formatHelpIcon');
    
    if (tooltip && tooltip.classList.contains('visible')) {
        // If they tap anywhere outside the icon and tooltip, hide it
        if (helpIcon && !helpIcon.contains(e.target) && !tooltip.contains(e.target)) {
            tooltip.classList.remove('visible');
            tooltip.style.top = '-9999px';
            tooltip.style.left = '-9999px';
        }
    }
});

// Force-kill the tooltip if they click ANY navigation button
const navButtons = document.querySelectorAll('.menu-item, .override-btn-pink');
navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const tooltip = document.querySelector('.pro-arcade-tooltip');
        if(tooltip) {
            tooltip.classList.remove('visible');
            tooltip.style.top = '-9999px';
            tooltip.style.left = '-9999px';
        }
    });
});

// =========================================================================
// 2. INTERACTIVE TACTILE JOYSTICKS
// =========================================================================
const joysticks = document.querySelectorAll('.ma-joy');

joysticks.forEach(joy => {
    const stick = joy.querySelector('.ma-joy-stick');
    const ball = joy.querySelector('.ma-joy-ball');
    let isDragging = false;
    let startX, startY;

    joy.addEventListener('pointerdown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        joy.setPointerCapture(e.pointerId); // Locks the drag even if finger slips off
        
        // Remove transitions so it follows the finger instantly
        ball.style.transition = 'none';
        stick.style.transition = 'none';
    });

    joy.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        
        let dx = e.clientX - startX;
        let dy = e.clientY - startY;
        
        // Math: Limit the physical drag radius to 20 pixels
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxRadius = 20;
        
        if (distance > maxRadius) {
            dx = (dx / distance) * maxRadius;
            dy = (dy / distance) * maxRadius;
        }

        // Move the red ball
        ball.style.transform = `translate(${dx}px, ${dy}px)`;
        
        // Pivot the metal stick based on horizontal drag
        const angle = (dx / maxRadius) * 25; // Max 25 degree tilt
        stick.style.transform = `rotate(${angle}deg)`;
    });

    const snapBack = () => {
        isDragging = false;
        // Restore the spring-loaded CSS transition
        ball.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        stick.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        
        // Snap to center
        ball.style.transform = 'translate(0px, 0px)';
        stick.style.transform = 'rotate(0deg)';
    };

    joy.addEventListener('pointerup', snapBack);
    joy.addEventListener('pointercancel', snapBack);
});

// ========================================================
// FPS PERFORMANCE MONITOR & DYNAMIC DEGRADATION
// ========================================================
let perfFrameCount = 0;
let perfLastTime = performance.now();
let consecutiveLowFPS = 0;
let isLowPowerMode = false;

function monitorPerformance(currentTime) {
    if (isLowPowerMode) return; // Stop monitoring once degraded

    perfFrameCount++;
    if (currentTime - perfLastTime >= 1000) {
        let currentFPS = perfFrameCount;
        perfFrameCount = 0;
        perfLastTime = currentTime;

        // If FPS drops below 35 for 3 consecutive seconds, trigger downgrade
        if (currentFPS < 35) {
            consecutiveLowFPS++;
            if (consecutiveLowFPS >= 3) {
                engageLowPowerMode();
            }
        } else {
            consecutiveLowFPS = 0; // Reset if performance recovers
        }
    }
    requestAnimationFrame(monitorPerformance);
}

// Start the silent monitor
requestAnimationFrame(monitorPerformance);

function engageLowPowerMode() {
    if (isLowPowerMode) return; // Prevent it from firing multiple times
    isLowPowerMode = true;
    document.body.classList.add('low-power-mode');
    console.log("SYSTEM ALERT: Engaging visual degradation. Dropping internal resolution.");

    // SURGICAL RESOLUTION DROP: 
    // This finds every canvas on the site and cuts its internal pixel density in half. 
    // Because your CSS still tells the canvas to be 100% wide, the layout won't shift at all!
    const allCanvases = document.querySelectorAll('canvas');
    allCanvases.forEach(c => {
        // Only drop resolution if it hasn't been dropped already
        if (c.width === c.clientWidth) {
            c.width = c.clientWidth / 2;
            c.height = c.clientHeight / 2;
        }
    });
}

// ========================================================
// DYNAMIC CANVAS OPTIMIZER (Triggers on Page Change)
// ========================================================
document.addEventListener("DOMContentLoaded", () => {
    // Watch all menu buttons and "Back" buttons
    const navButtons = document.querySelectorAll('.menu-item, .override-btn-pink');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Wait 50ms for the new page to become visible, then slash the canvas resolutions
            setTimeout(() => {
                if (typeof syncCanvasDimensions === 'function') {
                    syncCanvasDimensions();
                }
            }, 50);
        });
    });
});