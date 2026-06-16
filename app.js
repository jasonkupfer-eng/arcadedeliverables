document.addEventListener("DOMContentLoaded", () => {
    // Grab the variables from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const missionName = urlParams.get('mission');
    const fileName = urlParams.get('file');

    const displayEl = document.getElementById('missionNameDisplay');
    const downloadBtn = document.getElementById('downloadBtn');

    // Update the screen text if a mission name was provided
    if (missionName) {
        displayEl.innerText = missionName.replace(/-/g, ' '); 
    }

    // Set the download link if a file was provided
    if (fileName) {
        // NOTE: Replace this URL with your actual public Backblaze Bucket URL
        const backblazeVaultUrl = "https://f005.backblazeb2.com/file/arcade-deliverables/";
        
        // Assemble the final extraction link
        downloadBtn.href = backblazeVaultUrl + fileName;
        
        // Tells the browser to download the file instead of trying to play/open it
        downloadBtn.setAttribute('download', fileName); 
    } else {
        // Failsafe if the URL is broken or missing the file parameter
        downloadBtn.innerText = "DATA CORRUPTED";
        downloadBtn.style.pointerEvents = "none";
        downloadBtn.style.borderColor = "var(--neon-pink)";
        downloadBtn.style.color = "var(--neon-pink)";
    }
});

// ========================================================
// BACKGROUND CRT GLITCH TERMINAL ENGINE (HEAVY RETRO)
// ========================================================
const canvas = document.getElementById('glitchCanvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let cols, rows;
    
    // Using a chunkier grid system
    const fontSize = 14; 
    const cellWidth = 16;
    const cellHeight = 20;

    // A mix of Hex codes and solid corrupted memory blocks
    const chars = '0123456789ABCDEF█▓▒░▄▀-_+=';
    const grid = [];

    // Sync canvas size to the window
    function resize() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        cols = Math.floor(canvas.width / cellWidth);
        rows = Math.floor(canvas.height / cellHeight);
        initGrid();
    }
    window.addEventListener('resize', resize);

    // Build the initial clusters of text blocks
    function initGrid() {
        grid.length = 0; 
        for (let y = 0; y < rows; y++) {
            const row = [];
            let inBlock = false;
            for (let x = 0; x < cols; x++) {
                // Creates dense clusters of text with empty spaces between them
                if (Math.random() < 0.2) inBlock = !inBlock; 
                row.push({
                    char: inBlock ? chars[Math.floor(Math.random() * chars.length)] : '',
                    active: inBlock && Math.random() > 0.3
                });
            }
            grid.push(row);
        }
    }

    // Start the engine
    resize();

    // The Render Loop
    function draw() {
        // Phosphor decay: Leaves a slight trail instead of instantly clearing the screen
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#020604';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Switch to the chunky arcade font
        ctx.font = `bold ${fontSize}px "Press Start 2P", monospace`;
        ctx.textBaseline = 'top';

        // Global CRT tracking drift (the whole screen slightly shakes occasionally)
        const globalDrift = Math.random() < 0.05 ? (Math.random() * 16 - 8) : 0;

        for (let y = 0; y < rows; y++) {
            
            // Horizontal Tearing: Random rows shift aggressively left or right
            let rowOffset = globalDrift;
            if (Math.random() < 0.08) {
                rowOffset += (Math.random() * 40 - 20); 
            }

            // Chance to instantly scramble an entire row's characters
            const scrambleRow = Math.random() < 0.05;

            for (let x = 0; x < cols; x++) {
                if (grid[y][x].active) {
                    
                    // Randomly flip characters to keep the screen alive
                    if (scrambleRow || Math.random() < 0.02) {
                        grid[y][x].char = chars[Math.floor(Math.random() * chars.length)];
                    }

                    const char = grid[y][x].char;
                    const drawX = x * cellWidth + rowOffset;
                    const drawY = y * cellHeight;

                    // Phosphor Bloom (Glow Effect)
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = '#00f0ff';

                    // Chromatic Aberration (RGB shift / Color Separation glitch)
                    if (Math.random() < 0.02) {
                        // Red ghost
                        ctx.fillStyle = 'rgba(255, 0, 85, 0.9)';
                        ctx.shadowColor = 'rgba(255, 0, 85, 1)';
                        ctx.fillText(char, drawX - 4, drawY);
                        
                        // Blue ghost
                        ctx.fillStyle = 'rgba(0, 240, 255, 0.9)';
                        ctx.shadowColor = 'rgba(0, 240, 255, 1)';
                        ctx.fillText(char, drawX + 4, drawY);
                    } else {
                        // Standard Cyan terminal block
                        ctx.globalAlpha = Math.random() > 0.1 ? 0.85 : 0.3;
                        ctx.fillStyle = '#00f0ff';
                        ctx.fillText(char, drawX, drawY);
                    }
                }
            }
        }
        
        // Draw aggressive, thick scanlines cutting through the text
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#000000';
        for (let i = 0; i < canvas.height; i += 4) {
            ctx.fillRect(0, i, canvas.width, 2);
        }
    }
    
    // Run the loop slower (80ms = ~12 FPS) for a sluggish, old-hardware feel
    setInterval(draw, 80); 
}