document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const missionName = urlParams.get('mission');
    const fileName = urlParams.get('file');
    const displayEl = document.getElementById('missionNameDisplay');
    const downloadBtn = document.getElementById('downloadBtn');

    if (missionName) {
        displayEl.innerText = missionName.replace(/-/g, ' '); 
    }

    if (fileName) {
        const backblazeVaultUrl = "https://f005.backblazeb2.com/file/arcade-deliverables/";
        downloadBtn.href = backblazeVaultUrl + fileName;
        downloadBtn.setAttribute('download', fileName); 
    } else {
        downloadBtn.innerText = "DATA CORRUPTED";
        downloadBtn.style.pointerEvents = "none";
        downloadBtn.style.borderColor = "var(--neon-pink)";
        downloadBtn.style.color = "var(--neon-pink)";
    }
});

// ========================================================
// BACKGROUND CRT GLITCH TERMINAL (MAXIMUM CORRUPTION)
// ========================================================
const canvas = document.getElementById('glitchCanvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let cols, rows;
    
    // MASSIVE Blocky Grid
    const fontSize = 28; 
    const cellWidth = 32;
    const cellHeight = 36;

    const chars = '0123456789ABCDEF█▓▒░▄▀-_+=';
    const grid = [];
    let scanlineY = 0; // Sweeping raster line tracker

    function resize() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        cols = Math.floor(canvas.width / cellWidth);
        rows = Math.floor(canvas.height / cellHeight) + 1;
        initGrid();
    }
    window.addEventListener('resize', resize);

    function initGrid() {
        grid.length = 0; 
        for (let y = 0; y < rows; y++) {
            const row = [];
            let inBlock = false;
            for (let x = 0; x < cols; x++) {
                if (Math.random() < 0.3) inBlock = !inBlock; 
                row.push({
                    char: inBlock ? chars[Math.floor(Math.random() * chars.length)] : '',
                    active: inBlock && Math.random() > 0.4
                });
            }
            grid.push(row);
        }
    }

    resize();

    function draw() {
        // Heavy phosphor decay for thick motion trails
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#020604';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = `bold ${fontSize}px "Press Start 2P", monospace`;
        ctx.textBaseline = 'top';

        // 1. Determine "Glitch Spike" (Violent occasional flickering)
        const isGlitchSpike = Math.random() < 0.08; 
        
        // 2. Global screen tracking drift (Toned down)
        const globalDrift = Math.random() < 0.05 ? (Math.random() * 10 - 5) : 0;

        for (let y = 0; y < rows; y++) {
            
            // Subdued Horizontal Tearing
            let rowOffset = globalDrift;
            if (isGlitchSpike && Math.random() < 0.2) {
                rowOffset += (Math.random() * 30 - 15); 
            } else if (Math.random() < 0.05) {
                rowOffset += (Math.random() * 10 - 5);
            }

            const scrambleRow = Math.random() < 0.1;

            for (let x = 0; x < cols; x++) {
                if (grid[y][x].active) {
                    
                    if (scrambleRow || Math.random() < 0.05) {
                        grid[y][x].char = chars[Math.floor(Math.random() * chars.length)];
                    }

                    const char = grid[y][x].char;
                    const drawX = x * cellWidth + rowOffset;
                    const drawY = y * cellHeight;

                    // Heavy Phosphor Bloom
                    ctx.shadowBlur = isGlitchSpike ? 20 : 10;
                    ctx.shadowColor = '#00f0ff';

                    // Extreme RGB Chromatic Aberration during spikes
                    if (isGlitchSpike && Math.random() < 0.4) {
                        // Red Channel
                        ctx.fillStyle = 'rgba(255, 0, 85, 0.9)';
                        ctx.shadowColor = 'rgba(255, 0, 85, 1)';
                        ctx.fillText(char, drawX - (Math.random() * 12 + 4), drawY);
                        
                        // Green Channel
                        ctx.fillStyle = 'rgba(57, 255, 20, 0.9)';
                        ctx.shadowColor = 'rgba(57, 255, 20, 1)';
                        ctx.fillText(char, drawX, drawY - (Math.random() * 6));

                        // Blue Channel
                        ctx.fillStyle = 'rgba(0, 240, 255, 0.9)';
                        ctx.shadowColor = 'rgba(0, 240, 255, 1)';
                        ctx.fillText(char, drawX + (Math.random() * 12 + 4), drawY);
                    } else {
                        // Standard block
                        ctx.globalAlpha = Math.random() > 0.1 ? 0.9 : 0.2;
                        ctx.fillStyle = (Math.random() < 0.01) ? '#ffffff' : '#00f0ff';
                        ctx.fillText(char, drawX, drawY);
                    }
                }
            }
        }
        
        // 3. Sweeping Generating Line (Vertical Raster)
        scanlineY += 15;
        if (scanlineY > canvas.height) scanlineY = -50;
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#39ff14';
        ctx.fillStyle = 'rgba(57, 255, 20, 0.15)'; // Faint green sweeping bar
        ctx.fillRect(0, scanlineY, canvas.width, 40);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // Bright leading edge
        ctx.fillRect(0, scanlineY + 38, canvas.width, 2);

        // 4. Static CRT Interlaced Lines
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#000000';
        for (let i = 0; i < canvas.height; i += 6) {
            ctx.fillRect(0, i, canvas.width, 3);
        }
    }
    
    // FPS Set to 75ms for that heavy, lagging arcade monitor feel
    setInterval(draw, 75); 
}

// ========================================================
// HELP SYSTEM & DRAWER LOGIC
// ========================================================
document.addEventListener("DOMContentLoaded", () => {
    const helpTrigger = document.getElementById('helpSystemTrigger');
    const helpSmoke = document.getElementById('helpSmokeBurst');
    const helpBubble = document.getElementById('helpSpeechBubble');
    
    const drawer = document.getElementById('deploymentDrawer');
    const overlay = document.getElementById('drawerOverlay');
    const closeBtn = document.getElementById('closeDrawerBtn');

    if(helpTrigger) {
        // Step 1: Wait 2.5 seconds after page load, then show the ? and trigger smoke
        setTimeout(() => {
            helpTrigger.classList.add('visible');
            helpSmoke.classList.add('fire-smoke-anim');
            
            // Step 2: Wait 1.5 seconds after the smoke clears, then pop the text bubble
            setTimeout(() => {
                helpBubble.classList.add('show-bubble');
            }, 1500);

        }, 2500);

        // Drawer Open Function
        const openDrawer = () => {
            drawer.classList.add('drawer-open');
            overlay.classList.add('drawer-open');
        };

        // Drawer Close Function
        const closeDrawer = () => {
            drawer.classList.remove('drawer-open');
            overlay.classList.remove('drawer-open');
        };

        // Click Events
        helpTrigger.addEventListener('click', openDrawer);
        closeBtn.addEventListener('click', closeDrawer);
        overlay.addEventListener('click', closeDrawer); // Clicking the dark background closes it
    }
});