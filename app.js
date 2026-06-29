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
// DELIVERABLES PAGE: DEPLOYMENT DRAWER & HELP SYSTEM
// ========================================================
document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. THE HELP SYSTEM AUTOMATION ---
    const helpWrapper = document.getElementById('deliverablesHelpWrapper');
    const helpIcon = document.getElementById('deliverablesHelpIcon');
    const smokeBurst = document.getElementById('deliverablesSmokeBurst');
    const tooltip = document.getElementById('deliverablesTooltip');
    
    const drawer = document.getElementById('deliverablesDeploymentDrawer');
    const closeBtn = document.getElementById('closeDeliverablesDrawerBtn');

    if (helpWrapper) {
        // Step 1: Wait 2.5 seconds, then trigger smoke and pop the icon
        setTimeout(() => {
            if(smokeBurst) smokeBurst.classList.add('active');
            
            // Wait 400ms for smoke to billow, then pop icon
            setTimeout(() => {
                if(helpIcon) helpIcon.classList.add('active');
            }, 400);

            // Step 2: Wait an additional 1.5 seconds, then pop the speech bubble
            setTimeout(() => {
                if(tooltip) tooltip.classList.add('visible');
            }, 1900);

        }, 2500);

        // Open Drawer Function
        const openDrawer = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if(drawer) drawer.classList.add('open');
            if(tooltip) tooltip.classList.remove('visible'); // Hide bubble when opened
        };

        // Close Drawer Function
        const closeDrawer = (e) => {
            if(e) e.preventDefault();
            if(drawer) drawer.classList.remove('open');
        };

        // Click Listeners (The wrapper encompasses both the ? and the bubble)
        if(helpWrapper) helpWrapper.addEventListener('click', openDrawer);
        if(closeBtn) closeBtn.addEventListener('click', closeDrawer);

        // Click outside the console to close it
        document.addEventListener('click', (e) => {
            if (drawer && drawer.classList.contains('open')) {
                const panel = document.querySelector('#deliverablesDeploymentDrawer .heavy-machinery-panel');
                if (panel && !panel.contains(e.target) && !helpWrapper.contains(e.target)) {
                    closeDrawer();
                }
            }
        });
    }

    // --- 2. DEPLOYMENT CONSOLE LOGIC ---
    
    const uplinkData = {
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
            text: "TARGET: INSTAGRAM REELS\nFORMAT REQ: .SRT OR BURNED-IN\n\n[ PROTOCOL ]\n1. Upload Reel -> 'Advanced Settings'.\n2. 'Accessibility' -> 'Upload Captions'.\n3. Attach .SRT payload."
        },
        tiktok: {
            logo: "   ▄█ \n   ██ \n ▄███ \n██▀██ \n▀███▀ ",
            color: "#ffffff",
            text: "TARGET: TIKTOK\nFORMAT REQ: .SRT OR BURNED-IN\n\n[ PROTOCOL ]\n1. Access Desktop Web Portal.\n2. Initiate upload -> Locate 'Captions'.\n3. Select .SRT payload."
        },
        linkedin: {
            logo: "▄█ ▄██▄\n▀▀ ██ ██\n██ ██ ██\n██ ██ ██",
            color: "#00f0ff",
            text: "TARGET: LINKEDIN B2B NETWORK\nFORMAT REQ: .SRT\n\n[ PROTOCOL ]\n1. Initiate video post -> Click 'Edit'.\n2. Click 'Select Caption'.\n3. Attach .SRT file."
        },
        twitter: {
            logo: "█   █\n █ █ \n  █  \n █ █ \n█   █",
            color: "#ffffff",
            text: "TARGET: X (TWITTER) MEDIA STUDIO\nFORMAT REQ: .SRT\n\n[ PROTOCOL ]\n1. Access X Media Studio.\n2. Upload video -> Click settings.\n3. 'Subtitles' tab -> Select language -> Upload .SRT."
        },
        netflix: {
            logo: "█▄  █\n██▄ █\n█ ▀██\n█  ▀█",
            color: "#ff0000",
            text: "TARGET: NETFLIX BACKLOT\nFORMAT REQ: TTML\n\n[ PROTOCOL ]\n1. Access Netflix Backlot (Partner Clearance Required).\n2. Upload TTML payload to Source Request."
        },
        amazon: {
            logo: "<span style='color:#ff9900'>╰━━━━━➤</span>",
            color: "#ff9900",
            text: "TARGET: AMAZON PRIME VIDEO DIRECT\nFORMAT REQ: TTML OR SRT\n\n[ PROTOCOL ]\n1. Prime Video Direct portal -> Video Assets.\n2. 'Captions' section -> Select language -> Upload payload."
        },
        apple: {
            logo: "  ▄▀  \n▄████▄\n██████\n▀████▀",
            color: "#a0a0a0",
            text: "TARGET: APPLE TV / iTUNES CONNECT\nFORMAT REQ: ITT\n\n[ PROTOCOL ]\n1. Prepare delivery via Apple Transporter/Compressor.\n2. Attach .iTT payload to video asset package."
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
            logo: "<span style='color:#00f0ff'>▄</span><span style='color:#39ff14'>▄</span><span style='color:#ffea00'>▄</span><span style='color:#ff007f'>▄</span>\n<span style='color:#00f0ff'>█</span><span style='color:#39ff14'>█</span><span style='color:#ffea00'>█</span><span style='color:#ff007f'>█</span>\n<span style='color:#ffffff'> █▀ </span>",
            color: "#ffffff",
            text: "TARGET: NBCUNIVERSAL PEACOCK\nFORMAT REQ: TTML\n\n[ PROTOCOL ]\n1. Route TTML payload to NBCU ingest servers."
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
            logo: "<span style='color:#ff4d4d'> ▄██▄ </span>\n<span style='color:#ffea00'>██</span><span style='color:#39ff14'>██</span>\n<span style='color:#00f0ff'> ▀██▀ </span>",
            color: "#ffffff",
            text: "TARGET: DAVINCI RESOLVE\nFORMAT REQ: .SRT OR .VTT\n\n[ PROTOCOL ]\n1. Media Pool > Import > Subtitles.\n2. Drag to timeline.\n3. Deliver page -> Subtitle Settings -> Export Subtitle."
        }
    };

    const mechBtns = document.querySelectorAll('#deliverablesDeploymentDrawer .mech-btn');
    const dosOutput = document.getElementById('dosOutput');
    const lofiLogoDisplay = document.getElementById('lofiLogoDisplay');
    const dosContentArea = document.querySelector('#deliverablesDeploymentDrawer .dos-inner-content');
    
    const statPwr = document.getElementById('statusPwr');
    const statLnk = document.getElementById('statusLnk');
    const statDat = document.getElementById('statusDat');
    const statErr = document.getElementById('statusErr');

    let typeWriterInterval;
    let bootTimeout;

    function triggerBootSequence(targetId) {
        const data = uplinkData[targetId];
        if(!data) return;

        clearInterval(typeWriterInterval);
        clearTimeout(bootTimeout); 
        
        dosOutput.textContent = "";
        if(statLnk) statLnk.classList.remove('on-green');
        if(statDat) statDat.classList.remove('on-green');
        
        bootTimeout = setTimeout(() => {
            if(statLnk) statLnk.classList.add('on-green');
            
            lofiLogoDisplay.innerHTML = data.logo;
            lofiLogoDisplay.style.color = data.color;
            lofiLogoDisplay.style.textShadow = `0 0 10px ${data.color}, 0 0 20px ${data.color}`;
            
            let i = 0;
            typeWriterInterval = setInterval(() => {
                dosOutput.textContent += data.text.charAt(i);
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

    const oscCanvas = document.getElementById('oscCanvas');
    const vuCanvas = document.getElementById('vuCanvas');
    
    if (oscCanvas && vuCanvas) {
        const oscCtx = oscCanvas.getContext('2d');
        const vuCtx = vuCanvas.getContext('2d');

        let tele = { oscFreq: 0.05, oscAmp: 30, oscColor: '#39ff14', vuSpikeMode: false, glitchMode: false };
        let time = 0;
        const vuLevels = [20, 40, 30, 60, 50, 20, 10, 40];

        function drawHardware() {
            if (!drawer || !drawer.classList.contains('open')) {
                requestAnimationFrame(drawHardware); 
                return;
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

        // Knobs Logic (Mouse & Touch Enabled)
        const hKnobs = document.querySelectorAll('#deliverablesDeploymentDrawer .analog-knob, #deliverablesDeploymentModal .analog-knob');
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
                
                // Prevent page scrolling while turning the knob on mobile
                if (e.type === 'touchmove') {
                    e.preventDefault(); 
                }
                
                // Get correct coordinates depending on mouse vs touch
                const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
                const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
                
                const rect = dial.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                let angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI) + 90; 
                dial.style.transform = `rotate(${angle}deg)`;
                
                if (action === 'freq-up') tele.oscFreq = 0.01 + (Math.abs(angle / 360) * 0.3); 
                if (action === 'color-shift') {
                    const colors = ['#39ff14', '#00f0ff', '#ff007f', '#ffea00', '#ffffff'];
                    tele.oscColor = colors[Math.floor(Math.abs(angle) / (360 / colors.length)) % colors.length];
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

    setTimeout(() => {
        if(statPwr) statPwr.classList.add('on-green');
        if(lofiLogoDisplay) lofiLogoDisplay.innerHTML = "<div class='orbiting-logo-container' style='position: relative; width: 60px; height: 60px; margin: 0 auto 20px auto;'><div style='position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 2px dashed #00f0ff; border-radius: 50%; animation: radarSpin 4s linear infinite;'></div><div style='position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #00f0ff; font-size: 24px; text-shadow: 0 0 10px #00f0ff;'>?</div></div>";
        if(dosOutput) dosOutput.innerHTML = "AWAITING TARGET SELECTION...<br><br><span style='color: #fff;'>PLEASE SELECT A DESTINATION TO LOAD DEPLOYMENT PROTOCOLS.</span>";
    }, 800);
});