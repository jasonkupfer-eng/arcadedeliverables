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