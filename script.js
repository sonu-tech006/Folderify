import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// preloader script............
function hideLoader() {
    const loader = document.getElementById("preloader");
    if (loader) {
        loader.style.display = "none";
        document.body.classList.add('scroll-enable');
    }
}

if (document.readyState === 'complete') {
    hideLoader();
} else {
    window.addEventListener("load", hideLoader);
}

// Visual Mode Light/Dark Toggle
const visualTogglebutton = document.getElementById('visual-toggle-button');
const checkbox = document.getElementById('visual-toggle');

function visualMode() {
    if (checkbox.checked) {
        visualTogglebutton.classList.add('lightmode');
        document.body.classList.add('lightcolors');
    } else {
        visualTogglebutton.classList.remove('lightmode');
        document.body.classList.remove('lightcolors');
    }
}

// Add event listener to checkbox change to handle state correctly
if (checkbox) {
    checkbox.addEventListener('change', visualMode);
}
// Expose function globally in case of inline onclick calls
window.visualMode = visualMode;


// Helper: download single file as blob safely
async function downloadSingleIcon(url, filename) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        saveAs(blob, filename);
    } catch (error) {
        console.error("Fetch download failed, falling back to direct saveAs", error);
        saveAs(url, filename);
    }
}

// Individual icon download buttons
const downloadBtn = document.querySelectorAll('.download-icon');
downloadBtn.forEach((currentBtn) => {
    currentBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // Stop wrapper selection click
        
        let fileFetch = currentBtn.previousElementSibling.querySelector('h5');
        var fileName = fileFetch.textContent.trim();
        var image = currentBtn.previousElementSibling.querySelector('img');
        var imgPath = image.getAttribute('src');

        // Extract correct extension from source URL
        var ext = imgPath.startsWith('data:') ? '.png' : imgPath.substring(imgPath.lastIndexOf('.'));
        var fullFileName = fileName + ext;

        downloadSingleIcon(imgPath, fullFileName);
    });
});


// Inject selection checkboxes to all icon wrappers dynamically
const iconWrappers = document.querySelectorAll('.icon-wrapper');
iconWrappers.forEach((wrapper, index) => {
    // Selection Container
    const label = document.createElement('label');
    label.className = 'icon-select-label';
    label.onclick = (e) => e.stopPropagation(); // Stop click from propagating

    // Checkbox input
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'icon-select-checkbox';
    cb.dataset.index = index;

    // Custom checkbox visual
    const customCb = document.createElement('span');
    customCb.className = 'custom-checkbox';

    label.appendChild(cb);
    label.appendChild(customCb);
    wrapper.appendChild(label);

    // Toggle check on card body click
    wrapper.addEventListener('click', (e) => {
        // Skip if click was on the Download button
        if (e.target.classList.contains('download-icon')) return;

        cb.checked = !cb.checked;
        handleSelectionChange();
    });

    cb.addEventListener('change', () => {
        handleSelectionChange();
    });
});


// Inject Floating Bulk Actions Bar to body
const bar = document.createElement('div');
bar.id = 'bulk-download-bar';
bar.className = 'bulk-download-bar';
bar.innerHTML = `
  <div class="bar-content">
    <span class="selected-count" id="selected-count">0 items selected</span>
    <div class="bar-actions">
      <button id="btn-select-all-global" class="bar-btn secondary">Select All</button>
      <button id="btn-clear-selection" class="bar-btn secondary danger">Clear</button>
      <button id="btn-download-selected" class="bar-btn primary">
        <svg xmlns="http://www.w3.org/2000/svg" height="14" width="16" viewBox="0 0 640 512" fill="currentColor" style="margin-right: 4px;">
            <path d="M144 480C64.5 480 0 415.5 0 336c0-62.8 40.2-116.2 96.2-135.9c-.1-2.7-.2-5.4-.2-8.1c0-88.4 71.6-160 160-160c59.3 0 111 32.2 138.7 80.2C409.9 102 428.3 96 448 96c53 0 96 43 96 96c0 12.2-2.3 23.8-6.4 34.6C596 238.4 640 290.1 640 352c0 70.7-57.3 128-128 128H144zm79-167l80 80c9.4 9.4 24.6 9.4 33.9 0l80-80c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-39 39V184c0-13.3-10.7-24-24-24s-24 10.7-24 24V318.1l-39-39c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9z"/>
        </svg>
        <span id="download-selected-text">Download Selected (ZIP)</span>
      </button>
    </div>
  </div>
`;
document.body.appendChild(bar);


// Handle Selection State change
function handleSelectionChange() {
    const selectedFiles = [];
    const checkboxes = document.querySelectorAll('.icon-select-checkbox');
    
    checkboxes.forEach(cb => {
        const wrapper = cb.closest('.icon-wrapper');
        if (cb.checked) {
            wrapper.classList.add('selected');
            const img = wrapper.querySelector('.icon-image');
            const nameEl = wrapper.querySelector('.icon-name');
            selectedFiles.push({
                url: img.getAttribute('src'),
                name: nameEl.textContent.trim()
            });
        } else {
            wrapper.classList.remove('selected');
        }
    });

    const count = selectedFiles.length;
    const selectedCountEl = document.getElementById('selected-count');
    const barEl = document.getElementById('bulk-download-bar');

    selectedCountEl.textContent = `${count} icon${count !== 1 ? 's' : ''} selected`;

    if (count > 0) {
        barEl.classList.add('active');
    } else {
        barEl.classList.remove('active');
    }

    updateThemeSelectButtonTexts();
}


// Update Select All / Deselect All texts for themes dynamically
function updateThemeSelectButtonTexts() {
    const selectThemeBtns = document.querySelectorAll('.select-theme-btn');
    selectThemeBtns.forEach(btn => {
        const theme = btn.dataset.theme;
        const section = btn.closest('.content-container');
        const checkboxes = section.querySelectorAll('.icon-select-checkbox');
        const allSelected = Array.from(checkboxes).every(cb => cb.checked);

        btn.textContent = allSelected ? `Deselect All ${theme}` : `Select All ${theme}`;
    });
}


// Event: Select Theme Pack Buttons (Select/Deselect all in section)
const themeSelectButtons = document.querySelectorAll('.select-theme-btn');
themeSelectButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        const section = btn.closest('.content-container');
        const checkboxes = section.querySelectorAll('.icon-select-checkbox');

        const allSelected = Array.from(checkboxes).every(cb => cb.checked);
        checkboxes.forEach(cb => {
            cb.checked = !allSelected;
        });

        handleSelectionChange();
    });
});


// Event: Download Theme Pack Buttons (Zip category)
const themeDownloadButtons = document.querySelectorAll('.download-theme-btn');
themeDownloadButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
        const themeName = btn.dataset.theme;
        const section = btn.closest('.content-container');
        const wrappers = section.querySelectorAll('.icon-wrapper');

        const originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `
            <svg class="animate-spin" style="margin-right: 8px; width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" style="opacity: 0.25;"></circle>
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Zipping... 0%</span>
        `;

        try {
            const zip = new JSZip();
            let loaded = 0;

            const promises = Array.from(wrappers).map(async (wrapper) => {
                const img = wrapper.querySelector('.icon-image');
                const url = img.getAttribute('src');
                const name = wrapper.querySelector('.icon-name').textContent.trim();
                const ext = url.startsWith('data:') ? '.png' : url.substring(url.lastIndexOf('.'));

                const response = await fetch(url);
                const blob = await response.blob();
                zip.file(`${name}${ext}`, blob);

                loaded++;
                const pct = Math.round((loaded / wrappers.length) * 100);
                btn.querySelector('span').textContent = `Zipping... ${pct}%`;
            });

            await Promise.all(promises);
            btn.querySelector('span').textContent = `Saving ZIP...`;

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `folderify-${themeName.toLowerCase()}-theme-pack.zip`);
        } catch (error) {
            console.error("ZIP creation error:", error);
            alert("Error generating theme zip file. Please download individually.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        }
    });
});


// Global Action Bar: Clear Selection
document.getElementById('btn-clear-selection').addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('.icon-select-checkbox');
    checkboxes.forEach(cb => cb.checked = false);
    handleSelectionChange();
});


// Global Action Bar: Select All
document.getElementById('btn-select-all-global').addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('.icon-select-checkbox');
    checkboxes.forEach(cb => cb.checked = true);
    handleSelectionChange();
});


// Global Action Bar: Download Selected ZIP
document.getElementById('btn-download-selected').addEventListener('click', async () => {
    const checkboxes = document.querySelectorAll('.icon-select-checkbox');
    const selectedIcons = [];

    checkboxes.forEach(cb => {
        if (cb.checked) {
            const wrapper = cb.closest('.icon-wrapper');
            const img = wrapper.querySelector('.icon-image');
            const nameEl = wrapper.querySelector('.icon-name');
            selectedIcons.push({
                url: img.getAttribute('src'),
                name: nameEl.textContent.trim()
            });
        }
    });

    if (selectedIcons.length === 0) return;

    const btn = document.getElementById('btn-download-selected');
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `
        <svg class="animate-spin" style="margin-right: 8px; width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" style="opacity: 0.25;"></circle>
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Zipping... 0%</span>
    `;

    try {
        const zip = new JSZip();
        let loaded = 0;

        const promises = selectedIcons.map(async (icon) => {
            const response = await fetch(icon.url);
            const blob = await response.blob();
            const ext = icon.url.startsWith('data:') ? '.png' : icon.url.substring(icon.url.lastIndexOf('.'));
            zip.file(`${icon.name}${ext}`, blob);

            loaded++;
            const pct = Math.round((loaded / selectedIcons.length) * 100);
            btn.querySelector('span').textContent = `Zipping... ${pct}%`;
        });

        await Promise.all(promises);
        btn.querySelector('span').textContent = `Saving ZIP...`;

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `folderify-custom-pack.zip`);

        // Deselect all after success
        checkboxes.forEach(cb => cb.checked = false);
        handleSelectionChange();
    } catch (error) {
        console.error("ZIP selection error:", error);
        alert("Error generating selection zip file.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
});

// ==========================================
// FOLDERIFY STUDIO SCRIPT
// ==========================================

// State Variables
let selectedHue = 265;
let selectedSat = 100;
let selectedLight = 100;
let selectedEmblem = 'none';
let emojiOverlay = '';
let uploadedImage = null;
let labelText = '';
let labelFont = 'Minecraft';
let labelColor = '#ffffff';
let labelSize = 14;

// Cache maps
const imageCache = {};
const emblemCache = {};
let baseFolderHslCache = null;
let baseFolderWidth = 256;
let baseFolderHeight = 256;

// Elements
const canvas = document.getElementById('studio-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const statusText = document.getElementById('studio-status-text');

// HSL Conversions
function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h * 360, s, l];
}

function hslToRgb(h, s, l) {
    h /= 360;
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Load Image Helper (promisified)
function loadImage(src) {
    if (imageCache[src]) return Promise.resolve(imageCache[src]);
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            imageCache[src] = img;
            resolve(img);
        };
        img.onerror = (err) => {
            console.error(`Failed to load: ${src}`, err);
            reject(err);
        };
        img.src = src;
    });
}

// Process Base Folder and Cache HSL Data
async function initBaseFolder() {
    try {
        const img = await loadImage('./assets/Icons/Purple/Default.ico');
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 256;
        tempCanvas.height = 256;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(img, 0, 0, 256, 256);
        
        const imgData = tempCtx.getImageData(0, 0, 256, 256);
        const pixels = imgData.data;
        baseFolderHslCache = new Array(256 * 256);
        
        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i+1];
            const b = pixels[i+2];
            const a = pixels[i+3];
            
            if (a > 0) {
                const [h, s, l] = rgbToHsl(r, g, b);
                baseFolderHslCache[i/4] = { h, s, l, a };
            } else {
                baseFolderHslCache[i/4] = null;
            }
        }
        if (statusText) statusText.textContent = "Studio Ready";
        renderStudio();
    } catch (e) {
        console.error("Error initializing base folder", e);
        if (statusText) statusText.textContent = "Error loading base folder";
    }
}

// Extract Emblem by Subtraction
async function getExtractedEmblem(emblemName) {
    if (emblemCache[emblemName]) return emblemCache[emblemName];
    
    // Choose correct icon path and correct base folder to compare
    let emblemPath = '';
    let isYellowTheme = false;
    
    if (emblemName.endsWith('Yellow')) {
        isYellowTheme = true;
        emblemPath = `./assets/Icons/Yellow/${emblemName.replace('Yellow', '')}Yellow.ico`;
    } else if (emblemName === 'RecycleBinEmpty') {
        emblemPath = `./assets/Icons/Purple/Recycle Bin Empty.ico`;
    } else if (emblemName === 'RecycleBinFull') {
        emblemPath = `./assets/Icons/Purple/Recyle Bin Full.ico`;
    } else if (emblemName === 'ThisPC') {
        emblemPath = `./assets/Icons/Purple/This PC.ico`;
    } else if (emblemName === 'ThisPC3') {
        emblemPath = `./assets/Icons/Purple/This PC 3.ico`;
    } else {
        emblemPath = `./assets/Icons/Purple/${emblemName}.ico`;
    }
    
    try {
        const emblemImg = await loadImage(emblemPath);
        
        // Setup canvases for pixel comparison
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 256;
        tempCanvas.height = 256;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw emblem image
        tempCtx.drawImage(emblemImg, 0, 0, 256, 256);
        const emblemData = tempCtx.getImageData(0, 0, 256, 256);
        
        // Generate base folder data (Yellow or Purple) to compare against
        const baseCanvas = document.createElement('canvas');
        baseCanvas.width = 256;
        baseCanvas.height = 256;
        const baseCtx = baseCanvas.getContext('2d');
        
        const baseImg = await loadImage('./assets/Icons/Purple/Default.ico');
        baseCtx.drawImage(baseImg, 0, 0, 256, 256);
        const baseData = baseCtx.getImageData(0, 0, 256, 256);
        
        // If it is a yellow theme emblem, we must recolor base comparison folder to yellow (Hue 45)
        if (isYellowTheme) {
            const basePixels = baseData.data;
            for (let i = 0; i < basePixels.length; i += 4) {
                if (basePixels[i+3] > 0) {
                    const [h, s, l] = rgbToHsl(basePixels[i], basePixels[i+1], basePixels[i+2]);
                    const yellowHue = 45;
                    const shift = yellowHue - 265;
                    const newHue = (h + shift + 360) % 360;
                    const [r, g, b] = hslToRgb(newHue, s * 1.1, l * 0.9);
                    basePixels[i] = r;
                    basePixels[i+1] = g;
                    basePixels[i+2] = b;
                }
            }
        }
        
        // Compute difference
        const resultData = tempCtx.createImageData(256, 256);
        const threshold = 35; // RGB distance threshold
        
        for (let i = 0; i < emblemData.data.length; i += 4) {
            const r1 = baseData.data[i];
            const g1 = baseData.data[i+1];
            const b1 = baseData.data[i+2];
            const a1 = baseData.data[i+3];
            
            const r2 = emblemData.data[i];
            const g2 = emblemData.data[i+1];
            const b2 = emblemData.data[i+2];
            const a2 = emblemData.data[i+3];
            
            const dist = Math.sqrt((r1 - r2)**2 + (g1 - g2)**2 + (b1 - b2)**2);
            
            if (dist < threshold || a2 === 0) {
                // Same base color, discard
                resultData.data[i] = 0;
                resultData.data[i+1] = 0;
                resultData.data[i+2] = 0;
                resultData.data[i+3] = 0;
            } else {
                // Emblem detail, keep
                resultData.data[i] = r2;
                resultData.data[i+1] = g2;
                resultData.data[i+2] = b2;
                resultData.data[i+3] = a2;
            }
        }
        
        // Write back to canvas
        const emblemCanvas = document.createElement('canvas');
        emblemCanvas.width = 256;
        emblemCanvas.height = 256;
        emblemCanvas.getContext('2d').putImageData(resultData, 0, 0);
        
        emblemCache[emblemName] = emblemCanvas;
        return emblemCanvas;
    } catch (err) {
        console.error(`Error extracting emblem: ${emblemName}`, err);
        return null;
    }
}

// Main Render Function
async function renderStudio() {
    if (!ctx || !baseFolderHslCache) return;
    
    if (statusText) statusText.textContent = "Rendering...";
    
    // 1. Draw and Recolor Base Folder
    const folderData = ctx.createImageData(256, 256);
    const pixels = folderData.data;
    
    const hueShift = selectedHue - 265;
    const satFactor = selectedSat / 100;
    const lightFactor = selectedLight / 100;
    
    for (let i = 0; i < baseFolderHslCache.length; i++) {
        const hsl = baseFolderHslCache[i];
        const idx = i * 4;
        if (hsl) {
            let h = (hsl.h + hueShift + 360) % 360;
            let s = Math.max(0, Math.min(1, hsl.s * satFactor));
            let l = Math.max(0, Math.min(1, hsl.l * lightFactor));
            const [r, g, b] = hslToRgb(h, s, l);
            pixels[idx] = r;
            pixels[idx+1] = g;
            pixels[idx+2] = b;
            pixels[idx+3] = hsl.a;
        } else {
            pixels[idx] = 0;
            pixels[idx+1] = 0;
            pixels[idx+2] = 0;
            pixels[idx+3] = 0;
        }
    }
    
    ctx.clearRect(0, 0, 256, 256);
    
    // Draw recolored base folder
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 256;
    tempCanvas.height = 256;
    tempCanvas.getContext('2d').putImageData(folderData, 0, 0);
    ctx.drawImage(tempCanvas, 0, 0);
    
    // 2. Draw Emblem
    if (selectedEmblem !== 'none') {
        if (selectedEmblem === 'uploaded' && uploadedImage) {
            // Draw custom uploaded image in center front flap (centered at x:128, y:140)
            const size = 72;
            ctx.drawImage(uploadedImage, 128 - size/2, 140 - size/2, size, size);
        } else {
            const emblemCanvas = await getExtractedEmblem(selectedEmblem);
            if (emblemCanvas) {
                ctx.drawImage(emblemCanvas, 0, 0);
            }
        }
    }
    
    // 3. Draw Emoji
    if (emojiOverlay) {
        ctx.font = '64px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emojiOverlay, 128, 140);
    }
    
    // 4. Draw Label Text
    if (labelText) {
        ctx.font = `bold ${labelSize}px ${labelFont}`;
        ctx.fillStyle = labelColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Label position is at the lower front folder flap
        ctx.fillText(labelText, 128, 205);
    }
    
    if (statusText) statusText.textContent = "Studio Updated";
}

// Convert PNG ArrayBuffer to ICO Blob
function pngToIco(pngArrayBuffer) {
    const pngSize = pngArrayBuffer.byteLength;
    const icoHeaderSize = 6;
    const directoryEntrySize = 16;
    const totalSize = icoHeaderSize + directoryEntrySize + pngSize;
    
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    
    // Header
    view.setUint16(0, 0, true);       // Reserved (0)
    view.setUint16(2, 1, true);       // Type (1 = ICO)
    view.setUint16(4, 1, true);       // Count (1 image)
    
    // Directory Entry
    view.setUint8(6, 0);              // Width (0 = 256)
    view.setUint8(7, 0);              // Height (0 = 256)
    view.setUint8(8, 0);              // Colors (0)
    view.setUint8(9, 0);              // Reserved (0)
    view.setUint16(10, 1, true);      // Color planes (1)
    view.setUint16(12, 32, true);     // Bits per pixel (32)
    view.setUint32(14, pngSize, true); // Image size in bytes
    view.setUint32(18, icoHeaderSize + directoryEntrySize, true); // Image data offset
    
    // Image Data
    const pngBytes = new Uint8Array(pngArrayBuffer);
    const icoBytes = new Uint8Array(buffer);
    icoBytes.set(pngBytes, icoHeaderSize + directoryEntrySize);
    
    return new Blob([buffer], { type: 'image/x-icon' });
}

// Add Custom Creation Selection Card
function addCustomCreationCard(pngDataUrl, name) {
    let grid = document.getElementById('custom-creations-grid');
    if (!grid) {
        const container = document.createElement('div');
        container.className = 'content-container';
        container.id = 'custom-creations-section';
        container.innerHTML = `
          <h1 class="content-container-heading" data-aos="fade-up" data-aos-once="true">Custom Creations</h1>
          <p class="content-container-subheading" data-aos="fade-up" data-aos-once="true">Your dynamically generated folder icons.</p>
          <div class="all-icons-wrapper" id="custom-creations-grid"></div>
        `;
        document.getElementById('studio-container').after(container);
        grid = document.getElementById('custom-creations-grid');
    }
    
    const wrapper = document.createElement('div');
    wrapper.className = 'icon-wrapper selected';
    
    const label = document.createElement('label');
    label.className = 'icon-select-label';
    label.onclick = (e) => e.stopPropagation();
    
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'icon-select-checkbox';
    cb.checked = true;
    cb.addEventListener('change', () => {
        handleSelectionChange();
    });
    
    const customCb = document.createElement('span');
    customCb.className = 'custom-checkbox';
    
    label.appendChild(cb);
    label.appendChild(customCb);
    
    const displayContainer = document.createElement('div');
    displayContainer.className = 'display-container';
    
    const img = document.createElement('img');
    img.className = 'icon-image';
    img.src = pngDataUrl;
    
    const h5 = document.createElement('h5');
    h5.className = 'icon-name';
    h5.textContent = name;
    
    displayContainer.appendChild(img);
    displayContainer.appendChild(h5);
    
    const dlBtn = document.createElement('button');
    dlBtn.className = 'download-icon';
    dlBtn.textContent = 'Download';
    dlBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const response = await fetch(pngDataUrl);
        const arrayBuffer = await response.arrayBuffer();
        const icoBlob = pngToIco(arrayBuffer);
        saveAs(icoBlob, `${name.toLowerCase().replace(/\s+/g, '-')}.ico`);
    });
    
    wrapper.appendChild(label);
    wrapper.appendChild(displayContainer);
    wrapper.appendChild(dlBtn);
    
    wrapper.addEventListener('click', (e) => {
        if (e.target.classList.contains('download-icon')) return;
        cb.checked = !cb.checked;
        handleSelectionChange();
    });
    
    grid.appendChild(wrapper);
    handleSelectionChange();
    
    // Smooth scroll to Creations section
    document.getElementById('custom-creations-section').scrollIntoView({ behavior: 'smooth' });
}

// Attach Event Listeners for Folderify Studio
function setupStudioEvents() {
    if (!canvas) return;
    
    // 1. Tab Switching
    const tabButtons = document.querySelectorAll('.studio-tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.studio-tab-content').forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const tabId = btn.dataset.tab;
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // 2. Preset Colors Click
    const presetBtns = document.querySelectorAll('.preset-btn');
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            presetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            selectedHue = parseInt(btn.dataset.hue);
            selectedSat = parseInt(btn.dataset.sat);
            selectedLight = parseInt(btn.dataset.light);
            
            // Update Sliders
            document.getElementById('slider-hue').value = selectedHue;
            document.getElementById('slider-sat').value = selectedSat;
            document.getElementById('slider-light').value = selectedLight;
            
            document.getElementById('val-hue').textContent = `${selectedHue}°`;
            document.getElementById('val-sat').textContent = `${selectedSat}%`;
            document.getElementById('val-light').textContent = `${selectedLight}%`;
            
            renderStudio();
        });
    });
    
    // 3. Color Sliders Input
    document.getElementById('slider-hue').addEventListener('input', (e) => {
        selectedHue = parseInt(e.target.value);
        document.getElementById('val-hue').textContent = `${selectedHue}°`;
        // Remove active preset highlight
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        renderStudio();
    });
    
    document.getElementById('slider-sat').addEventListener('input', (e) => {
        selectedSat = parseInt(e.target.value);
        document.getElementById('val-sat').textContent = `${selectedSat}%`;
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        renderStudio();
    });
    
    document.getElementById('slider-light').addEventListener('input', (e) => {
        selectedLight = parseInt(e.target.value);
        document.getElementById('val-light').textContent = `${selectedLight}%`;
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        renderStudio();
    });
    
    // 4. Emblem Selector Click
    const emblemBtns = document.querySelectorAll('.emblem-btn');
    emblemBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            emblemBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            selectedEmblem = btn.dataset.emblem;
            
            // Clear custom overlay/uploads if built-in emblem chosen
            if (selectedEmblem !== 'none') {
                emojiOverlay = '';
                document.getElementById('studio-emoji-input').value = '';
                uploadedImage = null;
                document.getElementById('studio-file-input').value = '';
            }
            
            renderStudio();
        });
    });
    
    // 5. Custom Emoji Input
    document.getElementById('studio-emoji-input').addEventListener('input', (e) => {
        emojiOverlay = e.target.value.trim();
        if (emojiOverlay) {
            selectedEmblem = 'none';
            emblemBtns.forEach(b => b.classList.remove('active'));
            document.querySelector('.emblem-btn[data-emblem="none"]').classList.add('active');
            uploadedImage = null;
            document.getElementById('studio-file-input').value = '';
        }
        renderStudio();
    });
    
    // 6. Custom Image Upload
    document.getElementById('studio-file-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    uploadedImage = img;
                    selectedEmblem = 'uploaded';
                    emblemBtns.forEach(b => b.classList.remove('active'));
                    emojiOverlay = '';
                    document.getElementById('studio-emoji-input').value = '';
                    renderStudio();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // 7. Text Label Inputs
    document.getElementById('studio-text-input').addEventListener('input', (e) => {
        labelText = e.target.value.trim();
        renderStudio();
    });
    
    document.getElementById('studio-font-select').addEventListener('change', (e) => {
        labelFont = e.target.value;
        renderStudio();
    });
    
    document.getElementById('studio-color-input').addEventListener('input', (e) => {
        labelColor = e.target.value;
        document.getElementById('studio-color-hex').textContent = labelColor.toUpperCase();
        renderStudio();
    });
    
    document.getElementById('slider-font-size').addEventListener('input', (e) => {
        labelSize = parseInt(e.target.value);
        document.getElementById('val-font-size').textContent = `${labelSize}px`;
        renderStudio();
    });
    
    // 8. Actions Click
    document.getElementById('btn-studio-download-png').addEventListener('click', () => {
        canvas.toBlob((blob) => {
            saveAs(blob, `custom-folder-${selectedHue}.png`);
        }, 'image/png');
    });
    
    document.getElementById('btn-studio-download-ico').addEventListener('click', () => {
        canvas.toBlob(async (blob) => {
            const arrayBuffer = await blob.arrayBuffer();
            const icoBlob = pngToIco(arrayBuffer);
            saveAs(icoBlob, `custom-folder-${selectedHue}.ico`);
        }, 'image/png');
    });
    
    document.getElementById('btn-studio-add-selection').addEventListener('click', () => {
        const pngUrl = canvas.toDataURL('image/png');
        // Construct descriptive name
        let name = "Custom";
        if (selectedEmblem !== 'none') name = selectedEmblem === 'uploaded' ? "Upload Folder" : `${selectedEmblem} Folder`;
        else if (emojiOverlay) name = `${emojiOverlay} Folder`;
        else if (labelText) name = `${labelText} Folder`;
        else name = `Folder ${selectedHue}`;
        
        addCustomCreationCard(pngUrl, name);
    });
}

// Start Studio
initBaseFolder();
setupStudioEvents();