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
// BACKGROUND CRT GLITCH TERMINAL ENGINE
// ========================================================
const canvas = document.getElementById('glitchCanvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let cols, rows;
    const fontSize = 18;
    // Mix of numbers, letters, and terminal symbols
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_-$#@!<>[]';
    const grid = [];

    // Sync canvas size to the window
    function resize() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        cols = Math.floor(canvas.width / fontSize);
        rows = Math.floor(canvas.height / fontSize);
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
                // Randomly start and stop "blocks" of data
                if (Math.random() < 0.15) inBlock = !inBlock; 
                if (inBlock && Math.random() > 0.2) {
                    row.push({ char: chars[Math.floor(Math.random() * chars.length)], active: true });
                } else {
                    row.push({ char: '', active: false });
                }
            }
            grid.push(row);
        }
    }

    // Start the engine
    resize();

    // The Render Loop
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = `bold ${fontSize}px "VT323", monospace`;
        ctx.textBaseline = 'top';

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (grid[y][x].active) {
                    // Glitch Effect 1: Randomly scramble the character
                    if (Math.random() < 0.05) {
                        grid[y][x].char = chars[Math.floor(Math.random() * chars.length)];
                    }
                    
                    // Glitch Effect 2: Flicker the opacity
                    ctx.globalAlpha = Math.random() > 0.1 ? 0.3 : 0.6;
                    ctx.fillStyle = '#00f0ff'; // Matches your var(--neon-cyan)
                    
                    // Glitch Effect 3: Occasional bright white sector failure
                    if (Math.random() < 0.005) {
                        ctx.fillStyle = '#ffffff';
                        ctx.globalAlpha = 0.8;
                    }
                    
                    ctx.fillText(grid[y][x].char, x * fontSize, y * fontSize);
                }
            }
        }
        
        // Glitch Effect 4: Periodically overwrite an entire row to simulate tracking errors
        if (Math.random() < 0.15) {
            const y = Math.floor(Math.random() * rows);
            let inBlock = false;
            for (let x = 0; x < cols; x++) {
                if (Math.random() < 0.15) inBlock = !inBlock;
                grid[y][x] = { 
                    char: inBlock && Math.random() > 0.2 ? chars[Math.floor(Math.random() * chars.length)] : '', 
                    active: inBlock && Math.random() > 0.2 
                };
            }
        }
    }
    
    // Run the loop at 15 FPS for that chunky, retro hardware feel
    setInterval(draw, 65); 
}