// List of mirror images
const mirrorImages = [
    'mirror1.png',
    'mirror2.png'
];

// Get elements
const mirrorMask = document.getElementById('mirror-mask');
const cameraVideo = document.getElementById('camera');
const cameraPiecesContainer = document.getElementById('camera-pieces');
const shatterSound = document.getElementById('shatter-sound');
const mirrorContainer = document.querySelector('.mirror-container');

// Track which cracks have been revealed (by index, not by object reference)
const revealedCrackIndices = new Set();

// Define custom crack boundaries (multiple shapes)
const CRACK_SHAPES = [
    {
        bounds: { minX: 100, maxX: 400, minY: 90, maxY: 450 },
        maskImage: 'crack1.png'
    },
    {
        bounds: { minX: 100, maxX: 400, minY: 90, maxY: 450 },  
        maskImage: 'crack2.png'
    },
    {
        bounds: { minX: 100, maxX: 400, minY: 90, maxY: 450 }, 
        maskImage: 'crack2.png'
    },
    {
        bounds: { minX: 100, maxX: 400, minY: 90, maxY: 450 },
        maskImage: 'crack2.png'
    },
    {
        bounds: { minX: 100, maxX: 400, minY: 90, maxY: 450 },
        maskImage: 'crack2.png'
    },
    {
        bounds: { minX: 100, maxX: 400, minY: 90, maxY: 450 },
        maskImage: 'crack2.png'
    },
    {
        bounds: { minX: 100, maxX: 400, minY: 90, maxY: 450 },
        maskImage: 'crack2.png'
    },
    {
        bounds: { minX: 100, maxX: 400, minY: 90, maxY: 450 },
        maskImage: 'crack2.png'
    },
    {
        bounds: { minX: 100, maxX: 400, minY: 90, maxY: 450 },
        maskImage: 'crack2.png'
    },
    {
        bounds: { minX: 100, maxX: 400, minY: 90, maxY: 450 },
        maskImage: 'crack2.png'
    }
];

// Pick random mirror image on page load
function loadRandomMirror() {
    const randomIndex = Math.floor(Math.random() * mirrorImages.length);
    mirrorMask.src = mirrorImages[randomIndex];
    console.log('Loaded mirror:', mirrorImages[randomIndex]);
}

// Calculate crop dimensions to fit camera in mirror bounds
function getCameraCropDimensions() {
    const mirrorWidth = mirrorMask.naturalWidth || mirrorMask.width;
    const mirrorHeight = mirrorMask.naturalHeight || mirrorMask.height;
    const mirrorAspect = mirrorWidth / mirrorHeight;
    
    const camWidth = cameraVideo.videoWidth;
    const camHeight = cameraVideo.videoHeight;
    const camAspect = camWidth / camHeight;
    
    let sourceX, sourceY, sourceWidth, sourceHeight;
    
    if (camAspect > mirrorAspect) {
        sourceHeight = camHeight;
        sourceWidth = camHeight * mirrorAspect;
        sourceX = (camWidth - sourceWidth) / 2;
        sourceY = 0;
    } else {
        sourceWidth = camWidth;
        sourceHeight = camWidth / mirrorAspect;
        sourceX = 0;
        sourceY = (camHeight - sourceHeight) / 2;
    }
    
    return { sourceX, sourceY, sourceWidth, sourceHeight };
}

// Initialize camera
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: 1280,
                height: 720
            } 
        });
        cameraVideo.srcObject = stream;
        console.log('Camera started successfully');
    } catch (error) {
        console.error('Camera access denied:', error);
        alert('Please allow camera access for the full experience!');
    }
}

// Find which crack was clicked (returns INDEX, not the object)
function getClickedCrackIndex(localX, localY) {
    for (let i = 0; i < CRACK_SHAPES.length; i++) {
        const crack = CRACK_SHAPES[i];
        if (localX >= crack.bounds.minX && 
            localX <= crack.bounds.maxX && 
            localY >= crack.bounds.minY && 
            localY <= crack.bounds.maxY) {
            return i; // Return the index
        }
    }
    return -1; // Click outside any crack area
}

// Create camera piece with custom shape
function createCameraPiece(crack, localX, localY) {
    console.log('Creating camera piece for crack at:', localX, localY);
    
    // Play shatter sound
    if (shatterSound) {
        shatterSound.currentTime = 0;
        shatterSound.play().catch(e => console.log('Sound failed:', e));
    }
    
    // Create container for camera piece
    const piece = document.createElement('div');
    piece.className = 'camera-piece';
    
    // Use crack bounds ONLY for size, not position
    const width = crack.bounds.maxX - crack.bounds.minX;
    const height = crack.bounds.maxY - crack.bounds.minY;
    
    // CENTER the crack at click position
    const crackLeft = localX - (width / 4);
    const crackTop = localY - (height / 4);
    
    piece.style.left = crackLeft + 'px';
    piece.style.top = crackTop + 'px';
    piece.style.width = width + 'px';
    piece.style.height = height + 'px';
    piece.style.background = 'transparent';
    
    // Create canvas to show camera feed
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    piece.appendChild(canvas);
    
    // Draw the corresponding part of video
    const ctx = canvas.getContext('2d', { alpha: true });
    
    const containerWidth = mirrorContainer.offsetWidth;
    const containerHeight = mirrorContainer.offsetHeight;
    
    // Get cropped camera dimensions
    const crop = getCameraCropDimensions();
    
    // Calculate camera feed centered on CLICK position
    const centerRatioX = localX / containerWidth;
    const centerRatioY = localY / containerHeight;
    
    const crackWidthRatio = width / containerWidth;
    const crackHeightRatio = height / containerHeight;
    
    // Center the camera extraction on the click point
    const sourceCenterX = crop.sourceX + (centerRatioX * crop.sourceWidth);
    const sourceCenterY = crop.sourceY + (centerRatioY * crop.sourceHeight);
    
    const sourceWidth = crackWidthRatio * crop.sourceWidth;
    const sourceHeight = crackHeightRatio * crop.sourceHeight;
    
    const sourceX = sourceCenterX - (sourceWidth / 2);
    const sourceY = sourceCenterY - (sourceHeight / 2);
    
    
    console.log('Drawing from video:', sourceX, sourceY, sourceWidth, sourceHeight);
    console.log('Crack positioned at:', crackLeft, crackTop);
    
    // Apply custom mask shape if provided
    if (crack.maskImage) {
        const maskImg = new Image();
        maskImg.onload = function() {
            // Draw video
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(
                cameraVideo,
                sourceX, sourceY, sourceWidth, sourceHeight,
                -width, 0, width, height
            );
            ctx.restore();
            
            // Apply mask
            ctx.globalCompositeOperation = 'destination-in';
            ctx.drawImage(maskImg, 0, 0, width, height);
        };
        maskImg.onerror = function() {
            console.error('Failed to load mask image:', crack.maskImage);
        };
        maskImg.src = crack.maskImage;
    } else {
        // No mask - just draw video directly
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(
            cameraVideo,
            sourceX, sourceY, sourceWidth, sourceHeight,
            -width, 0, width, height
        );
        ctx.restore();
    }
    
    // Add piece to container
    cameraPiecesContainer.appendChild(piece);
    console.log('Camera piece added');
}

// Handle clicks on mirror
mirrorMask.addEventListener('click', (event) => {
    console.log('Mirror clicked!');
    
    // Get click position relative to mirror container
    const rect = mirrorContainer.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    
    console.log('Local position - X:', localX, 'Y:', localY);
    
    // Find ALL cracks that contain this click point
    const matchingCrackIndices = [];
    for (let i = 0; i < CRACK_SHAPES.length; i++) {
        const crack = CRACK_SHAPES[i];
        if (localX >= crack.bounds.minX && 
            localX <= crack.bounds.maxX && 
            localY >= crack.bounds.minY && 
            localY <= crack.bounds.maxY) {
            matchingCrackIndices.push(i);
        }
    }
    
    if (matchingCrackIndices.length === 0) {
        console.log('Click outside crack areas');
        return;
    }
    
    // Find the first unrevealed crack at this location
    let crackToReveal = null;
    let crackIndexToReveal = -1;
    
    for (let index of matchingCrackIndices) {
        if (!revealedCrackIndices.has(index)) {
            crackToReveal = CRACK_SHAPES[index];
            crackIndexToReveal = index;
            break;
        }
    }
    
    // If all cracks at this location are revealed, do nothing
    if (crackToReveal === null) {
        console.log('All cracks at this location already revealed');
        return;
    }
    
    // Mark this crack as revealed
    revealedCrackIndices.add(crackIndexToReveal);
    console.log('Revealing crack #' + crackIndexToReveal);
    
    // Create the camera piece
    createCameraPiece(crackToReveal, localX, localY);
});

// Initialize on page load
window.addEventListener('load', () => {
    console.log('Page loaded, initializing...');
    loadRandomMirror();
    startCamera();
});