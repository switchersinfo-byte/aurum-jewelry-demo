/**
 * PANDA TAG ADVENTURE
 * A child-safe 3D game featuring a friendly panda chase game
 */

// Game state
const gameState = {
    isPlaying: false,
    score: 0,
    fruits: 0,
    isPaused: false
};

// Three.js core objects
let scene, camera, renderer;
let player, panda;
let terrain, playground = [];
let collectibles = [];

// Player controls
const keys = {};
const playerVelocity = { x: 0, y: 0, z: 0 };
const PLAYER_SPEED = 0.15;
const JUMP_FORCE = 0.3;
const GRAVITY = 0.015;

// Panda AI
let pandaState = 'idle';
let pandaWaitTime = 0;
const PANDA_SPEED = 0.08; // Slower than player

// Animation
let clock;
let animationFrame = 0;

/**
 * Initialize the game
 */
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Bright sky blue
    scene.fog = new THREE.Fog(0x87CEEB, 50, 100);

    // Create camera
    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 15, 20);
    camera.lookAt(0, 0, 0);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Add lighting - bright and warm
    createLighting();

    // Create terrain
    createTerrain();

    // Create playground elements
    createPlaygroundElements();

    // Create collectibles
    createCollectibles();

    // Create player
    createPlayer();

    // Create panda
    createPanda();

    // Clock for animations
    clock = new THREE.Clock();

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.getElementById('start-game-btn').addEventListener('click', startGame);
    document.getElementById('play-again-btn').addEventListener('click', restartGame);

    // Start render loop
    animate();
}

/**
 * Create bright, warm lighting
 */
function createLighting() {
    // Ambient light - bright and soft
    const ambientLight = new THREE.AmbientLight(0xfff5e1, 0.8);
    scene.add(ambientLight);

    // Sun-like directional light
    const sunLight = new THREE.DirectionalLight(0xfffacd, 1.2);
    sunLight.position.set(20, 30, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    scene.add(sunLight);

    // Hemisphere light for natural-looking illumination
    const hemiLight = new THREE.HemisphereLight(0xffffbb, 0x90d890, 0.5);
    scene.add(hemiLight);
}

/**
 * Create colorful terrain with soft grassy hills
 */
function createTerrain() {
    // Ground plane with soft green color
    const groundGeometry = new THREE.PlaneGeometry(100, 100, 20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x90EE90,
        roughness: 0.8,
        metalness: 0.2
    });

    // Add gentle hills to the terrain
    const vertices = groundGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const y = vertices[i + 1];
        vertices[i + 2] = Math.sin(x * 0.2) * Math.cos(y * 0.2) * 1.5;
    }
    groundGeometry.computeVertexNormals();

    terrain = new THREE.Mesh(groundGeometry, groundMaterial);
    terrain.rotation.x = -Math.PI / 2;
    terrain.receiveShadow = true;
    scene.add(terrain);

    // Add decorative grass patches
    for (let i = 0; i < 30; i++) {
        const grassPatch = new THREE.Mesh(
            new THREE.CircleGeometry(Math.random() * 1.5 + 0.5, 8),
            new THREE.MeshStandardMaterial({ color: 0x7CFC00, roughness: 1 })
        );
        grassPatch.rotation.x = -Math.PI / 2;
        grassPatch.position.set(
            Math.random() * 80 - 40,
            0.01,
            Math.random() * 80 - 40
        );
        grassPatch.receiveShadow = true;
        scene.add(grassPatch);
    }
}

/**
 * Create playground elements
 */
function createPlaygroundElements() {
    // Giant Flowers
    createGiantFlowers();

    // Giant Mushrooms
    createGiantMushrooms();

    // Slides
    createSlides();

    // Tunnels
    createTunnels();

    // Bounce Pads
    createBouncePads();

    // Wooden Bridges
    createBridges();

    // Trees with rounded shapes
    createTrees();
}

/**
 * Create giant colorful flowers
 */
function createGiantFlowers() {
    const flowerPositions = [
        { x: -15, z: -15 },
        { x: 15, z: -15 },
        { x: -15, z: 15 },
        { x: 20, z: 20 }
    ];

    flowerPositions.forEach(pos => {
        // Stem
        const stemGeometry = new THREE.CylinderGeometry(0.3, 0.4, 5, 8);
        const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x90EE90 });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.set(pos.x, 2.5, pos.z);
        stem.castShadow = true;
        scene.add(stem);

        // Flower petals
        const petalColors = [0xFF69B4, 0xFFB6C1, 0xFF1493, 0xFFC0CB];
        const petalColor = petalColors[Math.floor(Math.random() * petalColors.length)];

        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const petalGeometry = new THREE.SphereGeometry(1.5, 16, 16);
            const petalMaterial = new THREE.MeshStandardMaterial({ color: petalColor });
            const petal = new THREE.Mesh(petalGeometry, petalMaterial);
            petal.scale.set(1, 0.3, 0.7);
            petal.position.set(
                pos.x + Math.cos(angle) * 2,
                5.5,
                pos.z + Math.sin(angle) * 2
            );
            petal.castShadow = true;
            scene.add(petal);
        }

        // Flower center
        const centerGeometry = new THREE.SphereGeometry(1.2, 16, 16);
        const centerMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        center.position.set(pos.x, 5.5, pos.z);
        center.castShadow = true;
        scene.add(center);

        playground.push({ mesh: stem, type: 'flower' });
    });
}

/**
 * Create giant mushrooms
 */
function createGiantMushrooms() {
    const mushroomPositions = [
        { x: -25, z: -10 },
        { x: 25, z: -5 },
        { x: -20, z: 25 },
        { x: 10, z: -25 }
    ];

    mushroomPositions.forEach(pos => {
        // Stem
        const stemGeometry = new THREE.CylinderGeometry(1.2, 1, 4, 16);
        const stemMaterial = new THREE.MeshStandardMaterial({ color: 0xFFF8DC });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.set(pos.x, 2, pos.z);
        stem.castShadow = true;
        scene.add(stem);

        // Cap
        const capGeometry = new THREE.SphereGeometry(3, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const capMaterial = new THREE.MeshStandardMaterial({ color: 0xFF6347 });
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.set(pos.x, 4.5, pos.z);
        cap.castShadow = true;
        scene.add(cap);

        // White spots on cap
        for (let i = 0; i < 8; i++) {
            const spotGeometry = new THREE.SphereGeometry(0.3, 8, 8);
            const spotMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
            const spot = new THREE.Mesh(spotGeometry, spotMaterial);
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 2;
            spot.position.set(
                pos.x + Math.cos(angle) * radius,
                4.5 + Math.random() * 0.5,
                pos.z + Math.sin(angle) * radius
            );
            scene.add(spot);
        }

        playground.push({ mesh: stem, type: 'mushroom' });
    });
}

/**
 * Create colorful slides
 */
function createSlides() {
    const slidePositions = [
        { x: -30, z: 0, rotation: Math.PI / 4 },
        { x: 30, z: 10, rotation: -Math.PI / 4 }
    ];

    slidePositions.forEach(pos => {
        // Slide base
        const baseGeometry = new THREE.CylinderGeometry(0.5, 0.5, 6, 16);
        const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x4169E1 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(pos.x, 3, pos.z);
        base.castShadow = true;
        scene.add(base);

        // Slide surface
        const slideGeometry = new THREE.BoxGeometry(3, 0.3, 8);
        const slideMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
        const slide = new THREE.Mesh(slideGeometry, slideMaterial);
        slide.position.set(pos.x, 4, pos.z);
        slide.rotation.z = Math.PI / 6;
        slide.castShadow = true;
        scene.add(slide);

        playground.push({ mesh: base, type: 'slide' });
    });
}

/**
 * Create tunnels
 */
function createTunnels() {
    const tunnelPositions = [
        { x: 0, z: -30 },
        { x: 0, z: 30 }
    ];

    tunnelPositions.forEach(pos => {
        const tunnelGeometry = new THREE.TorusGeometry(2, 1, 16, 32, Math.PI);
        const tunnelMaterial = new THREE.MeshStandardMaterial({ color: 0xFF69B4 });
        const tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
        tunnel.rotation.z = Math.PI / 2;
        tunnel.position.set(pos.x, 1, pos.z);
        tunnel.castShadow = true;
        scene.add(tunnel);

        playground.push({ mesh: tunnel, type: 'tunnel' });
    });
}

/**
 * Create bounce pads
 */
function createBouncePads() {
    const padPositions = [
        { x: -10, z: -20 },
        { x: 10, z: 20 },
        { x: -20, z: 10 },
        { x: 20, z: -10 }
    ];

    padPositions.forEach(pos => {
        const padGeometry = new THREE.CylinderGeometry(2, 2, 0.5, 16);
        const padMaterial = new THREE.MeshStandardMaterial({
            color: 0x00CED1,
            emissive: 0x00CED1,
            emissiveIntensity: 0.2
        });
        const pad = new THREE.Mesh(padGeometry, padMaterial);
        pad.position.set(pos.x, 0.25, pos.z);
        pad.castShadow = true;
        scene.add(pad);

        playground.push({ mesh: pad, type: 'bouncePad', position: pos });
    });
}

/**
 * Create wooden bridges
 */
function createBridges() {
    const bridgePositions = [
        { x: -15, z: 0, rotation: 0 },
        { x: 15, z: 0, rotation: Math.PI / 2 }
    ];

    bridgePositions.forEach(pos => {
        // Bridge planks
        const plankGeometry = new THREE.BoxGeometry(8, 0.3, 2);
        const plankMaterial = new THREE.MeshStandardMaterial({ color: 0xD2691E });
        const plank = new THREE.Mesh(plankGeometry, plankMaterial);
        plank.position.set(pos.x, 1.5, pos.z);
        plank.rotation.y = pos.rotation;
        plank.castShadow = true;
        scene.add(plank);

        // Support posts
        for (let i = -1; i <= 1; i += 2) {
            const postGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
            const postMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            const post = new THREE.Mesh(postGeometry, postMaterial);
            post.position.set(
                pos.x + (pos.rotation === 0 ? i * 3 : 0),
                0.75,
                pos.z + (pos.rotation === 0 ? 0 : i * 3)
            );
            post.castShadow = true;
            scene.add(post);
        }

        playground.push({ mesh: plank, type: 'bridge' });
    });
}

/**
 * Create trees with rounded shapes
 */
function createTrees() {
    const treePositions = [
        { x: -35, z: -35 },
        { x: 35, z: -35 },
        { x: -35, z: 35 },
        { x: 35, z: 35 }
    ];

    treePositions.forEach(pos => {
        // Trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.8, 1, 5, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(pos.x, 2.5, pos.z);
        trunk.castShadow = true;
        scene.add(trunk);

        // Foliage (rounded spheres)
        const foliageColors = [0x228B22, 0x32CD32, 0x00FF00];
        for (let i = 0; i < 3; i++) {
            const foliageGeometry = new THREE.SphereGeometry(2 + Math.random(), 16, 16);
            const foliageMaterial = new THREE.MeshStandardMaterial({
                color: foliageColors[i % foliageColors.length]
            });
            const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
            foliage.position.set(
                pos.x + (Math.random() - 0.5) * 2,
                5.5 + i * 1.5,
                pos.z + (Math.random() - 0.5) * 2
            );
            foliage.castShadow = true;
            scene.add(foliage);
        }

        playground.push({ mesh: trunk, type: 'tree' });
    });
}

/**
 * Create collectibles (stars and fruits)
 */
function createCollectibles() {
    // Create stars
    for (let i = 0; i < 15; i++) {
        const starGeometry = createStarGeometry();
        const starMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            emissive: 0xFFD700,
            emissiveIntensity: 0.5
        });
        const star = new THREE.Mesh(starGeometry, starMaterial);
        star.position.set(
            Math.random() * 60 - 30,
            2 + Math.random() * 3,
            Math.random() * 60 - 30
        );
        star.castShadow = true;
        scene.add(star);
        collectibles.push({ mesh: star, type: 'star', collected: false });
    }

    // Create fruits
    for (let i = 0; i < 10; i++) {
        const fruitGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const fruitMaterial = new THREE.MeshStandardMaterial({ color: 0xFF4500 });
        const fruit = new THREE.Mesh(fruitGeometry, fruitMaterial);
        fruit.position.set(
            Math.random() * 60 - 30,
            1,
            Math.random() * 60 - 30
        );
        fruit.castShadow = true;
        scene.add(fruit);
        collectibles.push({ mesh: fruit, type: 'fruit', collected: false });
    }
}

/**
 * Create star geometry
 */
function createStarGeometry() {
    const shape = new THREE.Shape();
    const outerRadius = 0.7;
    const innerRadius = 0.3;
    const points = 5;

    for (let i = 0; i < points * 2; i++) {
        const angle = (i / (points * 2)) * Math.PI * 2;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
    }
    shape.closePath();

    const extrudeSettings = { depth: 0.2, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1 };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}

/**
 * Create player character (child)
 */
function createPlayer() {
    player = new THREE.Group();

    // Body (rounded)
    const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1, 8, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x87CEEB });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    player.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xFFDBAC });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.2;
    head.castShadow = true;
    player.add(head);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.2, 1.3, 0.4);
    player.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.2, 1.3, 0.4);
    player.add(rightEye);

    // Smile
    const smileGeometry = new THREE.TorusGeometry(0.2, 0.05, 8, 16, Math.PI);
    const smileMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const smile = new THREE.Mesh(smileGeometry, smileMaterial);
    smile.position.set(0, 1.1, 0.45);
    smile.rotation.x = Math.PI;
    player.add(smile);

    player.position.set(0, 2, 0);
    scene.add(player);
}

/**
 * Create panda character (cute and friendly)
 */
function createPanda() {
    panda = new THREE.Group();

    // Body (rounded, chubby)
    const bodyGeometry = new THREE.SphereGeometry(1, 16, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.scale.set(1, 1.2, 1);
    body.castShadow = true;
    panda.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.5;
    head.castShadow = true;
    panda.add(head);

    // Ears (rounded)
    const earGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const earMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.position.set(-0.5, 2, 0);
    panda.add(leftEar);
    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.position.set(0.5, 2, 0);
    panda.add(rightEar);

    // Eye patches (black)
    const eyePatchGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const eyePatchMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const leftPatch = new THREE.Mesh(eyePatchGeometry, eyePatchMaterial);
    leftPatch.position.set(-0.3, 1.6, 0.6);
    panda.add(leftPatch);
    const rightPatch = new THREE.Mesh(eyePatchGeometry, eyePatchMaterial);
    rightPatch.position.set(0.3, 1.6, 0.6);
    panda.add(rightPatch);

    // Eyes (big and friendly)
    const eyeGeometry = new THREE.SphereGeometry(0.12, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.3, 1.65, 0.7);
    panda.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.3, 1.65, 0.7);
    panda.add(rightEye);

    // Nose
    const noseGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const noseMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0, 1.4, 0.75);
    panda.add(nose);

    // Smile
    const smileGeometry = new THREE.TorusGeometry(0.25, 0.05, 8, 16, Math.PI);
    const smileMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const smile = new THREE.Mesh(smileGeometry, smileMaterial);
    smile.position.set(0, 1.3, 0.7);
    smile.rotation.x = Math.PI;
    panda.add(smile);

    // Arms (short and stubby)
    const armGeometry = new THREE.CapsuleGeometry(0.2, 0.6, 8, 16);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.9, 0.5, 0);
    leftArm.rotation.z = Math.PI / 4;
    panda.add(leftArm);
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.9, 0.5, 0);
    rightArm.rotation.z = -Math.PI / 4;
    panda.add(rightArm);

    // Legs
    const legGeometry = new THREE.CapsuleGeometry(0.25, 0.5, 8, 16);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.4, -0.8, 0);
    panda.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.4, -0.8, 0);
    panda.add(rightLeg);

    panda.position.set(-10, 2, -10);
    scene.add(panda);
}

/**
 * Start the game
 */
function startGame() {
    document.getElementById('welcome-screen').classList.remove('active');
    document.getElementById('game-hud').classList.add('active');
    gameState.isPlaying = true;
    showMessage('Run and collect stars! Watch out for the friendly panda!', 3000);
}

/**
 * Restart the game
 */
function restartGame() {
    document.getElementById('caught-screen').classList.remove('active');
    document.getElementById('game-hud').classList.add('active');

    // Reset player position
    player.position.set(0, 2, 0);
    playerVelocity.x = 0;
    playerVelocity.y = 0;
    playerVelocity.z = 0;

    // Reset panda
    panda.position.set(-10, 2, -10);
    pandaState = 'idle';
    pandaWaitTime = 0;

    gameState.isPlaying = true;
    showMessage('Let\'s play again!', 2000);
}

/**
 * Show message to player
 */
function showMessage(text, duration = 2000) {
    const messageDisplay = document.getElementById('message-display');
    messageDisplay.textContent = text;
    messageDisplay.style.display = 'block';

    setTimeout(() => {
        messageDisplay.style.display = 'none';
    }, duration);
}

/**
 * Update game logic
 */
function update() {
    if (!gameState.isPlaying) return;

    const delta = clock.getDelta();
    animationFrame++;

    // Update player
    updatePlayer(delta);

    // Update panda
    updatePanda(delta);

    // Update collectibles
    updateCollectibles();

    // Update camera to follow player
    updateCamera();

    // Check if panda caught player
    checkPandaCatch();
}

/**
 * Update player movement
 */
function updatePlayer(delta) {
    // Horizontal movement
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        playerVelocity.x = -PLAYER_SPEED;
    } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        playerVelocity.x = PLAYER_SPEED;
    } else {
        playerVelocity.x *= 0.9; // Friction
    }

    if (keys['ArrowUp'] || keys['w'] || keys['W']) {
        playerVelocity.z = -PLAYER_SPEED;
    } else if (keys['ArrowDown'] || keys['s'] || keys['S']) {
        playerVelocity.z = PLAYER_SPEED;
    } else {
        playerVelocity.z *= 0.9; // Friction
    }

    // Jump
    if ((keys[' '] || keys['Space']) && player.position.y <= 2.1) {
        playerVelocity.y = JUMP_FORCE;
        playSound('jump');
    }

    // Apply gravity
    playerVelocity.y -= GRAVITY;

    // Update position
    player.position.x += playerVelocity.x;
    player.position.z += playerVelocity.z;
    player.position.y += playerVelocity.y;

    // Ground collision
    if (player.position.y < 2) {
        player.position.y = 2;
        playerVelocity.y = 0;
    }

    // Check bounce pad collision
    checkBouncePad();

    // Boundaries
    player.position.x = Math.max(-45, Math.min(45, player.position.x));
    player.position.z = Math.max(-45, Math.min(45, player.position.z));

    // Player rotation based on movement
    if (Math.abs(playerVelocity.x) > 0.01 || Math.abs(playerVelocity.z) > 0.01) {
        const targetRotation = Math.atan2(playerVelocity.x, playerVelocity.z);
        player.rotation.y = targetRotation;
    }

    // Gentle bobbing animation
    player.children[0].position.y = Math.sin(animationFrame * 0.1) * 0.05;
}

/**
 * Check bounce pad collision
 */
function checkBouncePad() {
    playground.forEach(item => {
        if (item.type === 'bouncePad') {
            const distance = Math.sqrt(
                Math.pow(player.position.x - item.mesh.position.x, 2) +
                Math.pow(player.position.z - item.mesh.position.z, 2)
            );

            if (distance < 2.5 && player.position.y < 3) {
                playerVelocity.y = 0.5; // Gentle bounce
                playSound('bounce');
                showMessage('Boing!', 1000);
            }
        }
    });
}

/**
 * Update panda AI (playful and friendly)
 */
function updatePanda(delta) {
    // Calculate distance to player
    const distanceToPlayer = Math.sqrt(
        Math.pow(panda.position.x - player.position.x, 2) +
        Math.pow(panda.position.z - player.position.z, 2)
    );

    if (pandaState === 'idle') {
        pandaWaitTime++;

        // Idle animation - gentle swaying
        panda.rotation.y = Math.sin(animationFrame * 0.05) * 0.2;

        if (pandaWaitTime > 60 || distanceToPlayer < 15) {
            pandaState = 'chasing';
            pandaWaitTime = 0;
        }
    } else if (pandaState === 'chasing') {
        // Chase player slowly
        const directionX = player.position.x - panda.position.x;
        const directionZ = player.position.z - panda.position.z;
        const length = Math.sqrt(directionX * directionX + directionZ * directionZ);

        if (length > 0) {
            const normalizedX = directionX / length;
            const normalizedZ = directionZ / length;

            panda.position.x += normalizedX * PANDA_SPEED;
            panda.position.z += normalizedZ * PANDA_SPEED;

            // Panda looks at player
            panda.rotation.y = Math.atan2(directionX, directionZ);
        }

        // Waddle animation
        panda.rotation.z = Math.sin(animationFrame * 0.2) * 0.1;
        panda.children[0].position.y = Math.sin(animationFrame * 0.15) * 0.1;

        // Random chance to "trip" playfully
        if (Math.random() < 0.001) {
            pandaState = 'silly';
            pandaWaitTime = 0;
        }

        // If player is far, take a break
        if (distanceToPlayer > 30) {
            pandaState = 'idle';
            pandaWaitTime = 0;
        }
    } else if (pandaState === 'silly') {
        // Panda does a silly spin
        pandaWaitTime++;
        panda.rotation.y += 0.1;

        if (pandaWaitTime > 30) {
            pandaState = 'chasing';
            pandaWaitTime = 0;
        }
    }
}

/**
 * Update collectibles
 */
function updateCollectibles() {
    collectibles.forEach(item => {
        if (!item.collected) {
            // Rotate collectibles
            item.mesh.rotation.y += 0.02;

            // Gentle floating animation
            item.mesh.position.y += Math.sin(animationFrame * 0.05 + item.mesh.position.x) * 0.01;

            // Check collision with player
            const distance = Math.sqrt(
                Math.pow(player.position.x - item.mesh.position.x, 2) +
                Math.pow(player.position.y - item.mesh.position.y, 2) +
                Math.pow(player.position.z - item.mesh.position.z, 2)
            );

            if (distance < 1.5) {
                item.collected = true;
                scene.remove(item.mesh);

                if (item.type === 'star') {
                    gameState.score++;
                    document.getElementById('score').textContent = gameState.score;
                    playSound('collect');
                    showMessage('⭐ Star collected!', 1000);
                } else if (item.type === 'fruit') {
                    gameState.fruits++;
                    document.getElementById('fruits').textContent = gameState.fruits;
                    playSound('collect');
                    showMessage('🍎 Yummy fruit!', 1000);
                }
            }
        }
    });
}

/**
 * Update camera to follow player
 */
function updateCamera() {
    const idealOffset = new THREE.Vector3(0, 12, 15);
    const idealLookat = new THREE.Vector3(
        player.position.x,
        player.position.y + 2,
        player.position.z
    );

    const targetPosition = new THREE.Vector3(
        player.position.x + idealOffset.x,
        player.position.y + idealOffset.y,
        player.position.z + idealOffset.z
    );

    camera.position.lerp(targetPosition, 0.05);
    camera.lookAt(idealLookat);
}

/**
 * Check if panda caught the player
 */
function checkPandaCatch() {
    const distance = Math.sqrt(
        Math.pow(panda.position.x - player.position.x, 2) +
        Math.pow(panda.position.z - player.position.z, 2)
    );

    if (distance < 2) {
        onPandaCatch();
    }
}

/**
 * When panda catches player (fun, not scary)
 */
function onPandaCatch() {
    gameState.isPlaying = false;
    document.getElementById('game-hud').classList.remove('active');
    document.getElementById('caught-screen').classList.add('active');

    const messages = [
        'The panda caught you! Time for a hug!',
        'Tag! The panda got you! You\'re doing great!',
        'Caught! The panda is so happy to play with you!',
        'The panda caught up! What a fun game!'
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    document.getElementById('caught-message').textContent = randomMessage;

    // Panda celebration animation
    pandaState = 'celebrate';
    playSound('catch');

    // Spin panda happily
    let spinCount = 0;
    const spinInterval = setInterval(() => {
        panda.rotation.y += 0.2;
        spinCount++;
        if (spinCount > 30) {
            clearInterval(spinInterval);
        }
    }, 50);
}

/**
 * Play sound effect (placeholder)
 */
function playSound(type) {
    // Audio would be added here
    // For now, this is a placeholder for the audio system
    console.log('Sound:', type);
}

/**
 * Animation loop
 */
function animate() {
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
}

/**
 * Handle window resize
 */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Keyboard event handlers
 */
function onKeyDown(event) {
    keys[event.key] = true;
}

function onKeyUp(event) {
    keys[event.key] = false;
}

// Initialize game when page loads
window.addEventListener('load', init);
