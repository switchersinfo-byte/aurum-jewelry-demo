/**
 * 🐼 Panda Tag! — Child-Safe 3D Playground Game
 * A fun game of tag with a silly panda friend in a magical playground.
 * Built with Three.js — no frameworks, pure joy.
 */

(function () {
    'use strict';

    /* ============================================
       CONSTANTS & CONFIG
       ============================================ */
    const CONFIG = {
        WORLD_SIZE: 200,
        PLAYER_SPEED: 14,
        PLAYER_JUMP_FORCE: 12,
        PANDA_SPEED: 7.5,
        PANDA_CATCH_DISTANCE: 3.5,
        PANDA_SEARCH_DELAY: 2.5,
        GRAVITY: 28,
        CAMERA_DISTANCE: 18,
        CAMERA_HEIGHT: 10,
        CAMERA_SMOOTHING: 0.08,
        GROUND_Y: 0,
        COLLECTIBLE_COUNT: 30,
        BOUNCE_PAD_FORCE: 18,
        FOG_NEAR: 60,
        FOG_FAR: 180,
    };

    const PASTEL = {
        sky: 0x87CEEB,
        grass: 0x7BC67E,
        grassDark: 0x5DAF60,
        flower1: 0xFFB5C2,
        flower2: 0xD8B5FF,
        flower3: 0xFFF5B5,
        flower4: 0xFFD8B5,
        mushroom1: 0xFF6B6B,
        mushroom2: 0xFFD93D,
        mushroomSpot: 0xFFFFFF,
        mushroomStem: 0xFFF5E6,
        wood: 0xC4956A,
        woodDark: 0x9E7A55,
        water: 0xB5D8FF,
        waterDeep: 0x7BB8E0,
        stone: 0xD4D4D4,
        leaf: 0x5DAF60,
        leafLight: 0x8FD88F,
        trunk: 0x8B6F47,
        pandaWhite: 0xFFFFFF,
        pandaBlack: 0x2D2D2D,
        pandaPink: 0xFFB5C2,
        playerShirt: 0x6BB5FF,
        playerPants: 0x5D8FBF,
        playerSkin: 0xFFDBC4,
        playerHair: 0x8B5E3C,
        star: 0xFFD93D,
        fruit: 0xFF6B6B,
        bouncePad: 0xFFB347,
        slide: 0xD8B5FF,
        tunnel: 0xFFB5C2,
        balloon: 0xFF6B6B,
        rope: 0xC4956A,
    };

    /* ============================================
       STATE
       ============================================ */
    let scene, camera, renderer, clock;
    let player, panda, ground;
    let collectibles = [];
    let particles = [];
    let bouncePads = [];
    let worldObjects = [];
    let hideSpots = [];

    let gameState = 'loading'; // loading, start, playing, tagged
    let starCount = 0;
    let fruitCount = 0;

    // Player state
    let playerVelocity = new THREE.Vector3();
    let playerOnGround = true;
    let playerDirection = new THREE.Vector3();
    let cameraAngleY = 0;
    let cameraAngleX = 0.3;

    // Panda AI state
    let pandaState = 'chasing'; // chasing, searching, tripping
    let pandaSearchTimer = 0;
    let pandaTripTimer = 0;
    let pandaTripDuration = 0;
    let pandaWaddlePhase = 0;
    let pandaAnimTimer = 0;
    let pandaTargetPos = new THREE.Vector3();

    // Input
    let keys = {};
    let mouseDown = false;
    let mouseDelta = { x: 0, y: 0 };
    let isMobile = false;
    let joystickInput = { x: 0, y: 0 };
    let mobileJump = false;

    // DOM
    let loadingBar, starCountEl, fruitCountEl, hudMessage, hudMessageText;
    let tagOverlay, tagStarsCount, tagFruitsCount, tagConfetti;
    let gameHud, mobileControls;

    /* ============================================
       INITIALIZATION
       ============================================ */
    function init() {
        cacheDom();
        detectMobile();
        initThree();
        buildWorld();
        createPlayer();
        createPanda();
        spawnCollectibles();
        setupInput();
        simulateLoading();
        animate();
    }

    function cacheDom() {
        loadingBar = document.getElementById('loading-bar');
        starCountEl = document.getElementById('star-count');
        fruitCountEl = document.getElementById('fruit-count');
        hudMessage = document.getElementById('hud-message');
        hudMessageText = document.getElementById('hud-message-text');
        tagOverlay = document.getElementById('tag-overlay');
        tagStarsCount = document.getElementById('tag-stars-count');
        tagFruitsCount = document.getElementById('tag-fruits-count');
        tagConfetti = document.getElementById('tag-confetti');
        gameHud = document.getElementById('game-hud');
        mobileControls = document.getElementById('mobile-controls');

        document.getElementById('start-button').addEventListener('click', startGame);
        document.getElementById('play-again-button').addEventListener('click', restartGame);
    }

    function detectMobile() {
        isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            || (window.innerWidth <= 800 && 'ontouchstart' in window);
    }

    function initThree() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(PASTEL.sky);
        scene.fog = new THREE.Fog(PASTEL.sky, CONFIG.FOG_NEAR, CONFIG.FOG_FAR);

        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
        camera.position.set(0, CONFIG.CAMERA_HEIGHT, CONFIG.CAMERA_DISTANCE);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        document.body.appendChild(renderer.domElement);

        // Warm morning sunshine lighting
        const ambientLight = new THREE.AmbientLight(0xFFF5E6, 0.6);
        scene.add(ambientLight);

        const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x7BC67E, 0.5);
        scene.add(hemiLight);

        const sunLight = new THREE.DirectionalLight(0xFFF5E6, 1.0);
        sunLight.position.set(50, 80, 30);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 200;
        sunLight.shadow.camera.left = -80;
        sunLight.shadow.camera.right = 80;
        sunLight.shadow.camera.top = 80;
        sunLight.shadow.camera.bottom = -80;
        sunLight.shadow.bias = -0.001;
        scene.add(sunLight);

        const fillLight = new THREE.DirectionalLight(0xFFE4C4, 0.3);
        fillLight.position.set(-30, 40, -20);
        scene.add(fillLight);

        clock = new THREE.Clock();

        window.addEventListener('resize', onResize);
    }

    function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /* ============================================
       MATERIALS HELPER
       ============================================ */
    function mat(color, opts) {
        var params = { color: color };
        if (opts) {
            for (var k in opts) params[k] = opts[k];
        }
        return new THREE.MeshLambertMaterial(params);
    }

    function toonMat(color) {
        return new THREE.MeshPhongMaterial({
            color: color,
            shininess: 5,
            flatShading: false,
        });
    }

    /* ============================================
       WORLD BUILDING
       ============================================ */
    function buildWorld() {
        createGround();
        createHills();
        createTrees();
        createGiantFlowers();
        createGiantMushrooms();
        createPonds();
        createBridges();
        createSlides();
        createTunnels();
        createBouncePads();
        createTreehouses();
        createBalloonLifts();
        createDecorations();
        createClouds();
    }

    function createGround() {
        // Main ground plane
        var groundGeo = new THREE.PlaneGeometry(CONFIG.WORLD_SIZE * 2, CONFIG.WORLD_SIZE * 2, 64, 64);
        groundGeo.rotateX(-Math.PI / 2);

        // Gentle undulation
        var verts = groundGeo.attributes.position;
        for (var i = 0; i < verts.count; i++) {
            var x = verts.getX(i);
            var z = verts.getZ(i);
            var y = Math.sin(x * 0.03) * 0.5 + Math.cos(z * 0.04) * 0.3;
            verts.setY(i, y);
        }
        groundGeo.computeVertexNormals();

        ground = new THREE.Mesh(groundGeo, toonMat(PASTEL.grass));
        ground.receiveShadow = true;
        scene.add(ground);
    }

    function createHills() {
        var hillPositions = [
            { x: -60, z: -50, r: 25, h: 10 },
            { x: 70, z: -40, r: 20, h: 8 },
            { x: -40, z: 60, r: 22, h: 9 },
            { x: 50, z: 55, r: 18, h: 7 },
            { x: 0, z: -70, r: 30, h: 12 },
            { x: -80, z: 0, r: 20, h: 8 },
            { x: 80, z: 20, r: 15, h: 6 },
        ];

        hillPositions.forEach(function (h) {
            var geo = new THREE.SphereGeometry(h.r, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
            var hill = new THREE.Mesh(geo, toonMat(PASTEL.grass));
            hill.position.set(h.x, -1, h.z);
            hill.scale.y = h.h / h.r;
            hill.receiveShadow = true;
            hill.castShadow = true;
            scene.add(hill);
            worldObjects.push({ mesh: hill, radius: h.r * 0.7, pos: new THREE.Vector3(h.x, 0, h.z), type: 'hill' });
        });
    }

    function createTrees() {
        var treePositions = [
            { x: -15, z: -20 }, { x: 20, z: -30 }, { x: -30, z: 15 },
            { x: 35, z: 10 }, { x: -10, z: 35 }, { x: 25, z: -10 },
            { x: -25, z: -35 }, { x: 40, z: 30 }, { x: -45, z: -10 },
            { x: 10, z: 45 }, { x: -35, z: 40 }, { x: 50, z: -20 },
            { x: -50, z: 25 }, { x: 15, z: -50 }, { x: -20, z: 50 },
        ];

        treePositions.forEach(function (pos) {
            var tree = createTree();
            tree.position.set(pos.x, 0, pos.z);
            tree.rotation.y = Math.random() * Math.PI * 2;
            scene.add(tree);
            hideSpots.push({ pos: new THREE.Vector3(pos.x, 0, pos.z), radius: 4 });
            worldObjects.push({ mesh: tree, radius: 2, pos: new THREE.Vector3(pos.x, 0, pos.z), type: 'tree' });
        });
    }

    function createTree() {
        var group = new THREE.Group();

        // Trunk
        var trunkGeo = new THREE.CylinderGeometry(0.6, 0.9, 6, 8);
        var trunk = new THREE.Mesh(trunkGeo, toonMat(PASTEL.trunk));
        trunk.position.y = 3;
        trunk.castShadow = true;
        group.add(trunk);

        // Foliage layers (rounded)
        var colors = [PASTEL.leaf, PASTEL.leafLight, PASTEL.leaf];
        var sizes = [4.5, 3.5, 2.5];
        var heights = [6.5, 8.5, 10];

        for (var i = 0; i < 3; i++) {
            var foliageGeo = new THREE.SphereGeometry(sizes[i], 12, 10);
            var foliage = new THREE.Mesh(foliageGeo, toonMat(colors[i]));
            foliage.position.y = heights[i];
            foliage.castShadow = true;
            group.add(foliage);
        }

        var scale = 0.8 + Math.random() * 0.5;
        group.scale.set(scale, scale, scale);
        return group;
    }

    function createGiantFlowers() {
        var flowerPositions = [
            { x: -8, z: -8 }, { x: 12, z: 5 }, { x: -18, z: 20 },
            { x: 28, z: -15 }, { x: -5, z: -25 }, { x: 18, z: 25 },
            { x: -28, z: -5 }, { x: 8, z: 18 }, { x: -12, z: -18 },
            { x: 22, z: -25 },
        ];

        var flowerColors = [PASTEL.flower1, PASTEL.flower2, PASTEL.flower3, PASTEL.flower4];

        flowerPositions.forEach(function (pos, idx) {
            var flower = createGiantFlower(flowerColors[idx % flowerColors.length]);
            flower.position.set(pos.x, 0, pos.z);
            flower.rotation.y = Math.random() * Math.PI * 2;
            scene.add(flower);
            hideSpots.push({ pos: new THREE.Vector3(pos.x, 0, pos.z), radius: 3 });
            worldObjects.push({ mesh: flower, radius: 2, pos: new THREE.Vector3(pos.x, 0, pos.z), type: 'flower' });
        });
    }

    function createGiantFlower(color) {
        var group = new THREE.Group();

        // Stem
        var stemGeo = new THREE.CylinderGeometry(0.3, 0.4, 5, 8);
        var stem = new THREE.Mesh(stemGeo, toonMat(0x5DAF60));
        stem.position.y = 2.5;
        group.add(stem);

        // Petals
        var petalCount = 6;
        for (var i = 0; i < petalCount; i++) {
            var angle = (i / petalCount) * Math.PI * 2;
            var petalGeo = new THREE.SphereGeometry(1.5, 10, 8);
            petalGeo.scale(1, 0.4, 0.7);
            var petal = new THREE.Mesh(petalGeo, toonMat(color));
            petal.position.set(Math.cos(angle) * 1.5, 5.5, Math.sin(angle) * 1.5);
            petal.rotation.z = angle;
            petal.castShadow = true;
            group.add(petal);
        }

        // Center
        var centerGeo = new THREE.SphereGeometry(1, 10, 8);
        var center = new THREE.Mesh(centerGeo, toonMat(PASTEL.mushroom2));
        center.position.y = 5.5;
        center.castShadow = true;
        group.add(center);

        // Leaves
        for (var j = 0; j < 2; j++) {
            var leafGeo = new THREE.SphereGeometry(1.2, 8, 6);
            leafGeo.scale(1, 0.3, 0.6);
            var leaf = new THREE.Mesh(leafGeo, toonMat(PASTEL.leafLight));
            leaf.position.set(j === 0 ? -1.2 : 1.2, 1.5, j === 0 ? 0.5 : -0.5);
            leaf.rotation.z = j === 0 ? -0.5 : 0.5;
            group.add(leaf);
        }

        var scale = 0.9 + Math.random() * 0.4;
        group.scale.set(scale, scale, scale);
        return group;
    }

    function createGiantMushrooms() {
        var mushroomPositions = [
            { x: -22, z: -12 }, { x: 15, z: -18 }, { x: -8, z: 28 },
            { x: 30, z: 20 }, { x: -35, z: -25 }, { x: 5, z: -35 },
            { x: -15, z: 42 }, { x: 38, z: -8 },
        ];

        mushroomPositions.forEach(function (pos, idx) {
            var mushroom = createGiantMushroom(idx % 2 === 0 ? PASTEL.mushroom1 : PASTEL.mushroom2);
            mushroom.position.set(pos.x, 0, pos.z);
            mushroom.rotation.y = Math.random() * Math.PI * 2;
            scene.add(mushroom);
            hideSpots.push({ pos: new THREE.Vector3(pos.x, 0, pos.z), radius: 3.5 });
            worldObjects.push({ mesh: mushroom, radius: 2.5, pos: new THREE.Vector3(pos.x, 0, pos.z), type: 'mushroom' });
        });
    }

    function createGiantMushroom(capColor) {
        var group = new THREE.Group();

        // Stem
        var stemGeo = new THREE.CylinderGeometry(1.2, 1.5, 4, 12);
        var stem = new THREE.Mesh(stemGeo, toonMat(PASTEL.mushroomStem));
        stem.position.y = 2;
        stem.castShadow = true;
        group.add(stem);

        // Cap
        var capGeo = new THREE.SphereGeometry(3, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        var cap = new THREE.Mesh(capGeo, toonMat(capColor));
        cap.position.y = 4;
        cap.castShadow = true;
        group.add(cap);

        // Spots on cap
        for (var i = 0; i < 5; i++) {
            var spotGeo = new THREE.SphereGeometry(0.4 + Math.random() * 0.3, 8, 6);
            var spot = new THREE.Mesh(spotGeo, toonMat(PASTEL.mushroomSpot));
            var angle = Math.random() * Math.PI * 2;
            var dist = 1 + Math.random() * 1.2;
            spot.position.set(Math.cos(angle) * dist, 4.5 + Math.random() * 0.5, Math.sin(angle) * dist);
            group.add(spot);
        }

        // Under-cap ring
        var ringGeo = new THREE.TorusGeometry(2.2, 0.15, 8, 24);
        var ring = new THREE.Mesh(ringGeo, toonMat(PASTEL.mushroomStem));
        ring.position.y = 3.8;
        ring.rotation.x = Math.PI / 2;
        group.add(ring);

        var scale = 0.7 + Math.random() * 0.5;
        group.scale.set(scale, scale, scale);
        return group;
    }

    function createPonds() {
        var pondPositions = [
            { x: -30, z: -30, r: 10 },
            { x: 35, z: 40, r: 8 },
            { x: 45, z: -35, r: 7 },
        ];

        pondPositions.forEach(function (p) {
            // Water surface
            var waterGeo = new THREE.CircleGeometry(p.r, 32);
            waterGeo.rotateX(-Math.PI / 2);
            var waterMat = new THREE.MeshPhongMaterial({
                color: PASTEL.water,
                transparent: true,
                opacity: 0.7,
                shininess: 80,
            });
            var water = new THREE.Mesh(waterGeo, waterMat);
            water.position.set(p.x, 0.05, p.z);
            water.receiveShadow = true;
            scene.add(water);

            // Pond edge
            var edgeGeo = new THREE.TorusGeometry(p.r, 0.5, 8, 32);
            var edge = new THREE.Mesh(edgeGeo, toonMat(PASTEL.stone));
            edge.position.set(p.x, 0.1, p.z);
            edge.rotation.x = Math.PI / 2;
            scene.add(edge);

            // Stepping stones
            var stoneCount = Math.floor(p.r * 0.8);
            for (var i = 0; i < stoneCount; i++) {
                var t = (i + 0.5) / stoneCount;
                var angle = t * Math.PI;
                var stoneGeo = new THREE.CylinderGeometry(0.7, 0.8, 0.3, 8);
                var stone = new THREE.Mesh(stoneGeo, toonMat(PASTEL.stone));
                stone.position.set(
                    p.x + Math.cos(angle) * (p.r * 0.6),
                    0.15,
                    p.z + Math.sin(angle) * (p.r * 0.6)
                );
                stone.castShadow = true;
                scene.add(stone);
            }

            worldObjects.push({ mesh: water, radius: p.r, pos: new THREE.Vector3(p.x, 0, p.z), type: 'pond' });
        });
    }

    function createBridges() {
        var bridgePositions = [
            { x: -30, z: -20, rot: 0.3 },
            { x: 35, z: 32, rot: 1.2 },
        ];

        bridgePositions.forEach(function (b) {
            var bridge = createWoodenBridge();
            bridge.position.set(b.x, 0.3, b.z);
            bridge.rotation.y = b.rot;
            scene.add(bridge);
        });
    }

    function createWoodenBridge() {
        var group = new THREE.Group();

        // Planks
        for (var i = 0; i < 8; i++) {
            var plankGeo = new THREE.BoxGeometry(3, 0.2, 0.5);
            var plank = new THREE.Mesh(plankGeo, toonMat(PASTEL.wood));
            plank.position.set(0, 0.5, i * 0.6 - 2.1);
            plank.castShadow = true;
            group.add(plank);
        }

        // Rails
        for (var side = -1; side <= 1; side += 2) {
            var railGeo = new THREE.CylinderGeometry(0.1, 0.1, 5, 6);
            var rail = new THREE.Mesh(railGeo, toonMat(PASTEL.woodDark));
            rail.position.set(side * 1.4, 1.5, 0);
            rail.rotation.x = Math.PI / 2;
            group.add(rail);

            // Posts
            for (var p = -2; p <= 2; p += 2) {
                var postGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.5, 6);
                var post = new THREE.Mesh(postGeo, toonMat(PASTEL.woodDark));
                post.position.set(side * 1.4, 1, p);
                group.add(post);
            }
        }

        return group;
    }

    function createSlides() {
        var slidePositions = [
            { x: -12, z: 12, rot: 0 },
            { x: 25, z: -5, rot: Math.PI / 3 },
        ];

        slidePositions.forEach(function (s) {
            var slide = createSlide();
            slide.position.set(s.x, 0, s.z);
            slide.rotation.y = s.rot;
            scene.add(slide);
            worldObjects.push({ mesh: slide, radius: 3, pos: new THREE.Vector3(s.x, 0, s.z), type: 'slide' });
        });
    }

    function createSlide() {
        var group = new THREE.Group();

        // Slide surface (curved)
        var slideShape = new THREE.Shape();
        slideShape.moveTo(-1.2, 0);
        slideShape.lineTo(1.2, 0);
        slideShape.lineTo(1.2, 0.1);
        slideShape.lineTo(1, 0.1);
        slideShape.lineTo(1, 0.5);
        slideShape.lineTo(-1, 0.5);
        slideShape.lineTo(-1, 0.1);
        slideShape.lineTo(-1.2, 0.1);
        slideShape.lineTo(-1.2, 0);

        var extrudeSettings = { depth: 8, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 3 };
        var slideGeo = new THREE.ExtrudeGeometry(slideShape, extrudeSettings);
        var slideMesh = new THREE.Mesh(slideGeo, toonMat(PASTEL.slide));
        slideMesh.rotation.x = -0.35;
        slideMesh.position.y = 2;
        slideMesh.castShadow = true;
        group.add(slideMesh);

        // Ladder
        for (var i = 0; i < 5; i++) {
            var rungGeo = new THREE.CylinderGeometry(0.08, 0.08, 2, 6);
            var rung = new THREE.Mesh(rungGeo, toonMat(PASTEL.wood));
            rung.position.set(0, i * 0.8 + 0.5, -1);
            rung.rotation.z = Math.PI / 2;
            group.add(rung);
        }

        // Ladder sides
        for (var side = -1; side <= 1; side += 2) {
            var sideGeo = new THREE.CylinderGeometry(0.1, 0.1, 4.5, 6);
            var sideMesh = new THREE.Mesh(sideGeo, toonMat(PASTEL.wood));
            sideMesh.position.set(side * 0.9, 2, -1);
            group.add(sideMesh);
        }

        // Platform at top
        var platGeo = new THREE.BoxGeometry(3, 0.3, 2);
        var plat = new THREE.Mesh(platGeo, toonMat(PASTEL.wood));
        plat.position.y = 4.2;
        plat.position.z = 0;
        plat.castShadow = true;
        group.add(plat);

        return group;
    }

    function createTunnels() {
        var tunnelPositions = [
            { x: 0, z: -15, rot: 0.5 },
            { x: -20, z: 30, rot: -0.3 },
        ];

        tunnelPositions.forEach(function (t) {
            var tunnel = createTunnel();
            tunnel.position.set(t.x, 0, t.z);
            tunnel.rotation.y = t.rot;
            scene.add(tunnel);
            hideSpots.push({ pos: new THREE.Vector3(t.x, 0, t.z), radius: 3 });
            worldObjects.push({ mesh: tunnel, radius: 2.5, pos: new THREE.Vector3(t.x, 0, t.z), type: 'tunnel' });
        });
    }

    function createTunnel() {
        var group = new THREE.Group();

        // Tunnel body (half cylinder)
        var tunnelGeo = new THREE.CylinderGeometry(2, 2, 8, 16, 1, true, 0, Math.PI);
        var tunnelMesh = new THREE.Mesh(tunnelGeo, toonMat(PASTEL.tunnel));
        tunnelMesh.rotation.z = Math.PI / 2;
        tunnelMesh.rotation.y = Math.PI / 2;
        tunnelMesh.position.y = 0;
        tunnelMesh.castShadow = true;
        group.add(tunnelMesh);

        // Entrance rings
        for (var end = -1; end <= 1; end += 2) {
            var ringGeo = new THREE.TorusGeometry(2, 0.25, 8, 16, Math.PI);
            var ring = new THREE.Mesh(ringGeo, toonMat(PASTEL.flower1));
            ring.position.set(0, 0, end * 4);
            ring.rotation.y = Math.PI / 2;
            group.add(ring);
        }

        return group;
    }

    function createBouncePads() {
        var padPositions = [
            { x: 8, z: -5 },
            { x: -18, z: -8 },
            { x: 15, z: 15 },
            { x: -5, z: 20 },
            { x: 30, z: -25 },
        ];

        padPositions.forEach(function (p) {
            var pad = createBouncePad();
            pad.position.set(p.x, 0.1, p.z);
            scene.add(pad);
            bouncePads.push({
                mesh: pad,
                pos: new THREE.Vector3(p.x, 0.1, p.z),
                radius: 1.8,
                bouncePhase: 0,
            });
        });
    }

    function createBouncePad() {
        var group = new THREE.Group();

        // Base
        var baseGeo = new THREE.CylinderGeometry(2, 2.2, 0.5, 16);
        var base = new THREE.Mesh(baseGeo, toonMat(PASTEL.bouncePad));
        base.position.y = 0.25;
        base.castShadow = true;
        group.add(base);

        // Top surface
        var topGeo = new THREE.CylinderGeometry(1.8, 1.8, 0.3, 16);
        var top = new THREE.Mesh(topGeo, toonMat(PASTEL.sunshine || 0xFFD93D));
        top.position.y = 0.65;
        group.add(top);

        // Spring coils visual
        var springGeo = new THREE.TorusGeometry(1.2, 0.12, 6, 16);
        var spring = new THREE.Mesh(springGeo, toonMat(PASTEL.bouncePad));
        spring.position.y = 0.5;
        spring.rotation.x = Math.PI / 2;
        group.add(spring);

        // Arrow indicator
        var arrowGeo = new THREE.ConeGeometry(0.5, 0.8, 8);
        var arrow = new THREE.Mesh(arrowGeo, toonMat(0xFFFFFF));
        arrow.position.y = 1.2;
        group.add(arrow);
        group.userData.arrow = arrow;

        return group;
    }

    function createTreehouses() {
        var thPositions = [
            { x: -25, z: -35 },
            { x: 40, z: 30 },
        ];

        thPositions.forEach(function (pos) {
            var treehouse = createTreehouse();
            treehouse.position.set(pos.x, 0, pos.z);
            scene.add(treehouse);
            worldObjects.push({ mesh: treehouse, radius: 5, pos: new THREE.Vector3(pos.x, 0, pos.z), type: 'treehouse' });
        });

        // Rope bridge between treehouses (visual only)
        createRopeBridge(thPositions[0], thPositions[1]);
    }

    function createTreehouse() {
        var group = new THREE.Group();

        // Big tree trunk
        var trunkGeo = new THREE.CylinderGeometry(1.5, 2, 12, 12);
        var trunk = new THREE.Mesh(trunkGeo, toonMat(PASTEL.trunk));
        trunk.position.y = 6;
        trunk.castShadow = true;
        group.add(trunk);

        // Big foliage
        var foliageGeo = new THREE.SphereGeometry(7, 16, 12);
        var foliage = new THREE.Mesh(foliageGeo, toonMat(PASTEL.leaf));
        foliage.position.y = 14;
        foliage.castShadow = true;
        group.add(foliage);

        // Platform
        var platGeo = new THREE.BoxGeometry(5, 0.4, 5);
        var plat = new THREE.Mesh(platGeo, toonMat(PASTEL.wood));
        plat.position.y = 8;
        plat.castShadow = true;
        group.add(plat);

        // Walls (partial)
        var wallGeo = new THREE.BoxGeometry(5, 2.5, 0.3);
        var wall1 = new THREE.Mesh(wallGeo, toonMat(PASTEL.wood));
        wall1.position.set(0, 9.25, -2.35);
        group.add(wall1);

        var wall2 = new THREE.Mesh(wallGeo.clone(), toonMat(PASTEL.wood));
        wall2.position.set(0, 9.25, 2.35);
        group.add(wall2);

        // Roof
        var roofGeo = new THREE.ConeGeometry(4, 3, 4);
        var roof = new THREE.Mesh(roofGeo, toonMat(PASTEL.mushroom1));
        roof.position.y = 12;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        group.add(roof);

        return group;
    }

    function createRopeBridge(from, to) {
        var segments = 20;
        var dx = to.x - from.x;
        var dz = to.z - from.z;

        for (var i = 0; i <= segments; i++) {
            var t = i / segments;
            var x = from.x + dx * t;
            var z = from.z + dz * t;
            var sag = Math.sin(t * Math.PI) * 3;
            var y = 8 - sag;

            var ropeGeo = new THREE.SphereGeometry(0.12, 6, 4);
            var rope = new THREE.Mesh(ropeGeo, toonMat(PASTEL.rope));
            rope.position.set(x, y, z);
            scene.add(rope);

            if (i % 3 === 0) {
                var plankGeo = new THREE.BoxGeometry(1.5, 0.1, 0.4);
                var plank = new THREE.Mesh(plankGeo, toonMat(PASTEL.wood));
                plank.position.set(x, y - 0.2, z);
                var angle = Math.atan2(dz, dx);
                plank.rotation.y = angle;
                scene.add(plank);
            }
        }
    }

    function createBalloonLifts() {
        var liftPositions = [
            { x: -40, z: 10 },
            { x: 30, z: -35 },
            { x: 10, z: 40 },
        ];

        var balloonColors = [PASTEL.balloon, PASTEL.pastelBlue || 0xB5D8FF, PASTEL.flower2];

        liftPositions.forEach(function (pos, idx) {
            var lift = createBalloonLift(balloonColors[idx % balloonColors.length]);
            lift.position.set(pos.x, 0, pos.z);
            scene.add(lift);
            lift.userData.baseY = 2;
            lift.userData.phase = Math.random() * Math.PI * 2;
            worldObjects.push({ mesh: lift, radius: 2, pos: new THREE.Vector3(pos.x, 0, pos.z), type: 'balloon', lift: lift });
        });
    }

    function createBalloonLift(color) {
        var group = new THREE.Group();

        // Platform
        var platGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.3, 12);
        var plat = new THREE.Mesh(platGeo, toonMat(PASTEL.wood));
        plat.position.y = 2;
        plat.castShadow = true;
        group.add(plat);

        // Balloon
        var balloonGeo = new THREE.SphereGeometry(2, 16, 12);
        var balloon = new THREE.Mesh(balloonGeo, toonMat(color));
        balloon.position.y = 6;
        balloon.scale.y = 1.3;
        balloon.castShadow = true;
        group.add(balloon);

        // String
        var stringGeo = new THREE.CylinderGeometry(0.05, 0.05, 3.5, 4);
        var string = new THREE.Mesh(stringGeo, toonMat(PASTEL.rope));
        string.position.y = 4;
        group.add(string);

        // Knot
        var knotGeo = new THREE.SphereGeometry(0.15, 6, 4);
        var knot = new THREE.Mesh(knotGeo, toonMat(color));
        knot.position.y = 4.3;
        group.add(knot);

        // Fence around platform
        for (var i = 0; i < 8; i++) {
            var angle = (i / 8) * Math.PI * 2;
            var postGeo = new THREE.CylinderGeometry(0.06, 0.06, 1, 4);
            var post = new THREE.Mesh(postGeo, toonMat(PASTEL.wood));
            post.position.set(Math.cos(angle) * 1.4, 2.5, Math.sin(angle) * 1.4);
            group.add(post);
        }

        return group;
    }

    function createDecorations() {
        // Small flowers scattered on ground
        for (var i = 0; i < 80; i++) {
            var x = (Math.random() - 0.5) * CONFIG.WORLD_SIZE * 1.5;
            var z = (Math.random() - 0.5) * CONFIG.WORLD_SIZE * 1.5;
            var smallFlower = createSmallFlower();
            smallFlower.position.set(x, 0, z);
            smallFlower.rotation.y = Math.random() * Math.PI * 2;
            scene.add(smallFlower);
        }

        // Butterflies (simple animated shapes)
        for (var j = 0; j < 12; j++) {
            var butterfly = createButterfly();
            butterfly.position.set(
                (Math.random() - 0.5) * 80,
                3 + Math.random() * 5,
                (Math.random() - 0.5) * 80
            );
            butterfly.userData.phase = Math.random() * Math.PI * 2;
            butterfly.userData.basePos = butterfly.position.clone();
            scene.add(butterfly);
            worldObjects.push({ mesh: butterfly, type: 'butterfly' });
        }

        // Musical notes floating
        for (var k = 0; k < 8; k++) {
            var note = createMusicalNote();
            note.position.set(
                (Math.random() - 0.5) * 60,
                5 + Math.random() * 8,
                (Math.random() - 0.5) * 60
            );
            note.userData.phase = Math.random() * Math.PI * 2;
            note.userData.basePos = note.position.clone();
            scene.add(note);
            worldObjects.push({ mesh: note, type: 'note' });
        }
    }

    function createSmallFlower() {
        var group = new THREE.Group();
        var colors = [PASTEL.flower1, PASTEL.flower2, PASTEL.flower3, PASTEL.flower4];
        var color = colors[Math.floor(Math.random() * colors.length)];

        var stemGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.5, 4);
        var stem = new THREE.Mesh(stemGeo, toonMat(0x5DAF60));
        stem.position.y = 0.25;
        group.add(stem);

        for (var i = 0; i < 5; i++) {
            var angle = (i / 5) * Math.PI * 2;
            var petalGeo = new THREE.SphereGeometry(0.12, 6, 4);
            var petal = new THREE.Mesh(petalGeo, toonMat(color));
            petal.position.set(Math.cos(angle) * 0.12, 0.55, Math.sin(angle) * 0.12);
            group.add(petal);
        }

        var centerGeo = new THREE.SphereGeometry(0.08, 6, 4);
        var center = new THREE.Mesh(centerGeo, toonMat(PASTEL.mushroom2));
        center.position.y = 0.55;
        group.add(center);

        return group;
    }

    function createButterfly() {
        var group = new THREE.Group();
        var colors = [PASTEL.flower1, PASTEL.flower2, PASTEL.flower3, PASTEL.flower4];
        var color = colors[Math.floor(Math.random() * colors.length)];

        // Body
        var bodyGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 4);
        var body = new THREE.Mesh(bodyGeo, toonMat(0x333333));
        body.rotation.x = Math.PI / 2;
        group.add(body);

        // Wings
        for (var side = -1; side <= 1; side += 2) {
            var wingGeo = new THREE.SphereGeometry(0.3, 8, 6);
            wingGeo.scale(1, 0.1, 0.7);
            var wing = new THREE.Mesh(wingGeo, toonMat(color));
            wing.position.x = side * 0.25;
            group.add(wing);
        }

        group.scale.set(1.5, 1.5, 1.5);
        return group;
    }

    function createMusicalNote() {
        var group = new THREE.Group();

        // Note head
        var headGeo = new THREE.SphereGeometry(0.25, 8, 6);
        headGeo.scale(1.2, 1, 0.8);
        var head = new THREE.Mesh(headGeo, toonMat(PASTEL.sunshine || 0xFFD93D));
        group.add(head);

        // Stem
        var stemGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 4);
        var stem = new THREE.Mesh(stemGeo, toonMat(PASTEL.sunshine || 0xFFD93D));
        stem.position.set(0.2, 0.4, 0);
        group.add(stem);

        return group;
    }

    function createClouds() {
        for (var i = 0; i < 15; i++) {
            var cloud = createCloud();
            cloud.position.set(
                (Math.random() - 0.5) * CONFIG.WORLD_SIZE * 2,
                30 + Math.random() * 20,
                (Math.random() - 0.5) * CONFIG.WORLD_SIZE * 2
            );
            cloud.userData.speed = 0.5 + Math.random() * 1;
            scene.add(cloud);
            worldObjects.push({ mesh: cloud, type: 'cloud' });
        }
    }

    function createCloud() {
        var group = new THREE.Group();
        var cloudMat = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.85,
            shininess: 0,
        });

        var count = 4 + Math.floor(Math.random() * 3);
        for (var i = 0; i < count; i++) {
            var size = 2 + Math.random() * 3;
            var geo = new THREE.SphereGeometry(size, 10, 8);
            var puff = new THREE.Mesh(geo, cloudMat);
            puff.position.set(
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 3
            );
            puff.scale.y = 0.6;
            group.add(puff);
        }

        return group;
    }

    /* ============================================
       PLAYER CHARACTER
       ============================================ */
    function createPlayer() {
        player = new THREE.Group();

        // Body
        var bodyGeo = new THREE.CylinderGeometry(0.5, 0.45, 1.2, 10);
        var body = new THREE.Mesh(bodyGeo, toonMat(PASTEL.playerShirt));
        body.position.y = 1.6;
        body.castShadow = true;
        player.add(body);

        // Head
        var headGeo = new THREE.SphereGeometry(0.55, 12, 10);
        var head = new THREE.Mesh(headGeo, toonMat(PASTEL.playerSkin));
        head.position.y = 2.7;
        head.castShadow = true;
        player.add(head);

        // Hair
        var hairGeo = new THREE.SphereGeometry(0.58, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2);
        var hair = new THREE.Mesh(hairGeo, toonMat(PASTEL.playerHair));
        hair.position.y = 2.8;
        player.add(hair);

        // Eyes
        for (var side = -1; side <= 1; side += 2) {
            var eyeWhiteGeo = new THREE.SphereGeometry(0.12, 8, 6);
            var eyeWhite = new THREE.Mesh(eyeWhiteGeo, toonMat(0xFFFFFF));
            eyeWhite.position.set(side * 0.2, 2.75, 0.45);
            player.add(eyeWhite);

            var pupilGeo = new THREE.SphereGeometry(0.06, 6, 4);
            var pupil = new THREE.Mesh(pupilGeo, toonMat(0x333333));
            pupil.position.set(side * 0.2, 2.75, 0.52);
            player.add(pupil);
        }

        // Smile
        var smileGeo = new THREE.TorusGeometry(0.12, 0.03, 6, 8, Math.PI);
        var smile = new THREE.Mesh(smileGeo, toonMat(0xCC6666));
        smile.position.set(0, 2.6, 0.48);
        smile.rotation.x = Math.PI;
        player.add(smile);

        // Arms
        for (var a = -1; a <= 1; a += 2) {
            var armGeo = new THREE.CylinderGeometry(0.15, 0.12, 0.9, 6);
            var arm = new THREE.Mesh(armGeo, toonMat(PASTEL.playerSkin));
            arm.position.set(a * 0.65, 1.8, 0);
            arm.rotation.z = a * 0.3;
            arm.castShadow = true;
            player.add(arm);
        }

        // Legs
        for (var l = -1; l <= 1; l += 2) {
            var legGeo = new THREE.CylinderGeometry(0.18, 0.15, 0.8, 6);
            var leg = new THREE.Mesh(legGeo, toonMat(PASTEL.playerPants));
            leg.position.set(l * 0.22, 0.6, 0);
            leg.castShadow = true;
            player.add(leg);
            player.userData['leg' + (l === -1 ? 'L' : 'R')] = leg;
        }

        // Shoes
        for (var s = -1; s <= 1; s += 2) {
            var shoeGeo = new THREE.SphereGeometry(0.2, 8, 6);
            shoeGeo.scale(1, 0.6, 1.3);
            var shoe = new THREE.Mesh(shoeGeo, toonMat(0xFFFFFF));
            shoe.position.set(s * 0.22, 0.15, 0.05);
            player.add(shoe);
        }

        player.position.set(0, 0, 0);
        scene.add(player);
    }

    /* ============================================
       PANDA CHARACTER
       ============================================ */
    function createPanda() {
        panda = new THREE.Group();

        // Body (round and chubby)
        var bodyGeo = new THREE.SphereGeometry(1.2, 16, 12);
        bodyGeo.scale(1, 1.1, 0.9);
        var body = new THREE.Mesh(bodyGeo, toonMat(PASTEL.pandaWhite));
        body.position.y = 1.8;
        body.castShadow = true;
        panda.add(body);

        // Belly patch
        var bellyGeo = new THREE.SphereGeometry(0.8, 12, 10);
        bellyGeo.scale(1, 1, 0.5);
        var belly = new THREE.Mesh(bellyGeo, toonMat(0xF5F5F5));
        belly.position.set(0, 1.7, 0.6);
        panda.add(belly);

        // Head
        var headGeo = new THREE.SphereGeometry(1, 16, 12);
        var head = new THREE.Mesh(headGeo, toonMat(PASTEL.pandaWhite));
        head.position.y = 3.3;
        head.castShadow = true;
        panda.add(head);

        // Ears
        for (var e = -1; e <= 1; e += 2) {
            var earGeo = new THREE.SphereGeometry(0.35, 10, 8);
            var ear = new THREE.Mesh(earGeo, toonMat(PASTEL.pandaBlack));
            ear.position.set(e * 0.7, 4.1, -0.1);
            ear.castShadow = true;
            panda.add(ear);

            // Inner ear
            var innerEarGeo = new THREE.SphereGeometry(0.15, 8, 6);
            var innerEar = new THREE.Mesh(innerEarGeo, toonMat(PASTEL.pandaPink));
            innerEar.position.set(e * 0.7, 4.1, 0.1);
            panda.add(innerEar);
        }

        // Eye patches (black)
        for (var ep = -1; ep <= 1; ep += 2) {
            var patchGeo = new THREE.SphereGeometry(0.38, 10, 8);
            patchGeo.scale(1.1, 0.9, 0.5);
            var patch = new THREE.Mesh(patchGeo, toonMat(PASTEL.pandaBlack));
            patch.position.set(ep * 0.4, 3.4, 0.65);
            panda.add(patch);
        }

        // Eyes (big and cute)
        for (var ey = -1; ey <= 1; ey += 2) {
            var eyeWhiteGeo = new THREE.SphereGeometry(0.22, 10, 8);
            var eyeWhite = new THREE.Mesh(eyeWhiteGeo, toonMat(0xFFFFFF));
            eyeWhite.position.set(ey * 0.4, 3.45, 0.82);
            panda.add(eyeWhite);

            var pupilGeo = new THREE.SphereGeometry(0.12, 8, 6);
            var pupil = new THREE.Mesh(pupilGeo, toonMat(0x111111));
            pupil.position.set(ey * 0.4, 3.45, 0.95);
            panda.add(pupil);

            // Eye shine
            var shineGeo = new THREE.SphereGeometry(0.05, 6, 4);
            var shine = new THREE.Mesh(shineGeo, toonMat(0xFFFFFF));
            shine.position.set(ey * 0.35, 3.5, 1.0);
            panda.add(shine);
        }

        // Nose
        var noseGeo = new THREE.SphereGeometry(0.15, 8, 6);
        noseGeo.scale(1.2, 0.8, 0.8);
        var nose = new THREE.Mesh(noseGeo, toonMat(PASTEL.pandaBlack));
        nose.position.set(0, 3.2, 0.95);
        panda.add(nose);

        // Mouth (happy smile)
        var smileGeo = new THREE.TorusGeometry(0.18, 0.04, 6, 10, Math.PI);
        var smile = new THREE.Mesh(smileGeo, toonMat(PASTEL.pandaBlack));
        smile.position.set(0, 3.05, 0.88);
        smile.rotation.x = Math.PI;
        panda.add(smile);

        // Cheek blush
        for (var c = -1; c <= 1; c += 2) {
            var blushGeo = new THREE.SphereGeometry(0.15, 8, 6);
            blushGeo.scale(1.2, 0.8, 0.3);
            var blush = new THREE.Mesh(blushGeo, toonMat(PASTEL.pandaPink));
            blush.position.set(c * 0.65, 3.15, 0.75);
            panda.add(blush);
        }

        // Arms (black, stubby)
        for (var arm = -1; arm <= 1; arm += 2) {
            var armGeo = new THREE.CylinderGeometry(0.3, 0.25, 1, 8);
            var armMesh = new THREE.Mesh(armGeo, toonMat(PASTEL.pandaBlack));
            armMesh.position.set(arm * 1.2, 1.8, 0);
            armMesh.rotation.z = arm * 0.5;
            armMesh.castShadow = true;
            panda.add(armMesh);
            panda.userData['arm' + (arm === -1 ? 'L' : 'R')] = armMesh;
        }

        // Legs (black, stubby)
        for (var leg = -1; leg <= 1; leg += 2) {
            var legGeo = new THREE.CylinderGeometry(0.35, 0.3, 0.8, 8);
            var legMesh = new THREE.Mesh(legGeo, toonMat(PASTEL.pandaBlack));
            legMesh.position.set(leg * 0.5, 0.5, 0);
            legMesh.castShadow = true;
            panda.add(legMesh);
            panda.userData['leg' + (leg === -1 ? 'L' : 'R')] = legMesh;
        }

        // Tail (tiny round)
        var tailGeo = new THREE.SphereGeometry(0.2, 8, 6);
        var tail = new THREE.Mesh(tailGeo, toonMat(PASTEL.pandaWhite));
        tail.position.set(0, 1.2, -1);
        panda.add(tail);

        panda.position.set(20, 0, 20);
        scene.add(panda);
    }

    /* ============================================
       COLLECTIBLES
       ============================================ */
    function spawnCollectibles() {
        // Clear existing
        collectibles.forEach(function (c) { scene.remove(c.mesh); });
        collectibles = [];

        for (var i = 0; i < CONFIG.COLLECTIBLE_COUNT; i++) {
            var isStar = Math.random() > 0.4;
            var collectible = isStar ? createStar() : createFruit();
            var x = (Math.random() - 0.5) * CONFIG.WORLD_SIZE * 0.8;
            var z = (Math.random() - 0.5) * CONFIG.WORLD_SIZE * 0.8;
            collectible.position.set(x, 2 + Math.random() * 1.5, z);
            collectible.userData.type = isStar ? 'star' : 'fruit';
            collectible.userData.baseY = collectible.position.y;
            collectible.userData.phase = Math.random() * Math.PI * 2;
            collectible.userData.collected = false;
            scene.add(collectible);
            collectibles.push({ mesh: collectible, pos: collectible.position });
        }
    }

    function createStar() {
        var group = new THREE.Group();

        // Star shape from merged spheres
        var centerGeo = new THREE.SphereGeometry(0.35, 10, 8);
        var center = new THREE.Mesh(centerGeo, toonMat(PASTEL.star));
        group.add(center);

        for (var i = 0; i < 5; i++) {
            var angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
            var pointGeo = new THREE.SphereGeometry(0.2, 8, 6);
            var point = new THREE.Mesh(pointGeo, toonMat(PASTEL.star));
            point.position.set(Math.cos(angle) * 0.5, Math.sin(angle) * 0.5, 0);
            group.add(point);
        }

        // Glow
        var glowGeo = new THREE.SphereGeometry(0.6, 10, 8);
        var glowMat = new THREE.MeshBasicMaterial({
            color: PASTEL.star,
            transparent: true,
            opacity: 0.15,
        });
        var glow = new THREE.Mesh(glowGeo, glowMat);
        group.add(glow);

        return group;
    }

    function createFruit() {
        var group = new THREE.Group();

        // Apple body
        var appleGeo = new THREE.SphereGeometry(0.35, 10, 8);
        var apple = new THREE.Mesh(appleGeo, toonMat(PASTEL.fruit));
        apple.scale.y = 0.9;
        group.add(apple);

        // Stem
        var stemGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.2, 4);
        var stem = new THREE.Mesh(stemGeo, toonMat(PASTEL.trunk));
        stem.position.y = 0.35;
        group.add(stem);

        // Leaf
        var leafGeo = new THREE.SphereGeometry(0.1, 6, 4);
        leafGeo.scale(1.5, 0.3, 1);
        var leaf = new THREE.Mesh(leafGeo, toonMat(PASTEL.leaf));
        leaf.position.set(0.1, 0.35, 0);
        group.add(leaf);

        // Glow
        var glowGeo = new THREE.SphereGeometry(0.5, 10, 8);
        var glowMat = new THREE.MeshBasicMaterial({
            color: PASTEL.fruit,
            transparent: true,
            opacity: 0.12,
        });
        var glow = new THREE.Mesh(glowGeo, glowMat);
        group.add(glow);

        return group;
    }

    /* ============================================
       PARTICLES
       ============================================ */
    function spawnParticles(position, color, count) {
        for (var i = 0; i < count; i++) {
            var geo = new THREE.SphereGeometry(0.08 + Math.random() * 0.1, 6, 4);
            var particleMat = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 1,
            });
            var particle = new THREE.Mesh(geo, particleMat);
            particle.position.copy(position);
            particle.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 6,
                2 + Math.random() * 4,
                (Math.random() - 0.5) * 6
            );
            particle.userData.life = 1;
            particle.userData.decay = 0.8 + Math.random() * 0.5;
            scene.add(particle);
            particles.push(particle);
        }
    }

    function spawnHearts(position) {
        for (var i = 0; i < 5; i++) {
            var geo = new THREE.SphereGeometry(0.15, 8, 6);
            var heartMat = new THREE.MeshBasicMaterial({
                color: PASTEL.pandaPink,
                transparent: true,
                opacity: 1,
            });
            var heart = new THREE.Mesh(geo, heartMat);
            heart.position.copy(position);
            heart.position.y += 3;
            heart.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                2 + Math.random() * 2,
                (Math.random() - 0.5) * 2
            );
            heart.userData.life = 1;
            heart.userData.decay = 0.5;
            scene.add(heart);
            particles.push(heart);
        }
    }

    function updateParticles(dt) {
        for (var i = particles.length - 1; i >= 0; i--) {
            var p = particles[i];
            p.userData.velocity.y -= 8 * dt;
            p.position.add(p.userData.velocity.clone().multiplyScalar(dt));
            p.userData.life -= p.userData.decay * dt;
            p.material.opacity = Math.max(0, p.userData.life);
            p.scale.setScalar(Math.max(0.01, p.userData.life));

            if (p.userData.life <= 0) {
                scene.remove(p);
                particles.splice(i, 1);
            }
        }
    }

    /* ============================================
       INPUT HANDLING
       ============================================ */
    function setupInput() {
        // Keyboard
        document.addEventListener('keydown', function (e) {
            keys[e.code] = true;
            if (e.code === 'Space') e.preventDefault();
        });
        document.addEventListener('keyup', function (e) {
            keys[e.code] = false;
        });

        // Mouse for camera
        renderer.domElement.addEventListener('mousedown', function (e) {
            if (gameState === 'playing') {
                mouseDown = true;
                renderer.domElement.requestPointerLock && renderer.domElement.requestPointerLock();
            }
        });

        document.addEventListener('mouseup', function () {
            mouseDown = true; // Keep camera control active
        });

        document.addEventListener('mousemove', function (e) {
            if (gameState === 'playing') {
                mouseDelta.x += e.movementX || 0;
                mouseDelta.y += e.movementY || 0;
            }
        });

        // Pointer lock change
        document.addEventListener('pointerlockchange', function () {
            // No action needed
        });

        // Mobile touch controls
        if (isMobile) {
            setupMobileControls();
        }
    }

    function setupMobileControls() {
        var joystickZone = document.getElementById('joystick-zone');
        var joystickBase = document.getElementById('joystick-base');
        var joystickThumb = document.getElementById('joystick-thumb');
        var jumpBtn = document.getElementById('jump-button');

        var joystickActive = false;
        var joystickCenter = { x: 0, y: 0 };

        joystickZone.addEventListener('touchstart', function (e) {
            e.preventDefault();
            joystickActive = true;
            var touch = e.touches[0];
            var rect = joystickBase.getBoundingClientRect();
            joystickCenter.x = rect.left + rect.width / 2;
            joystickCenter.y = rect.top + rect.height / 2;
        }, { passive: false });

        joystickZone.addEventListener('touchmove', function (e) {
            e.preventDefault();
            if (!joystickActive) return;
            var touch = e.touches[0];
            var dx = touch.clientX - joystickCenter.x;
            var dy = touch.clientY - joystickCenter.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            var maxDist = 40;
            if (dist > maxDist) {
                dx = (dx / dist) * maxDist;
                dy = (dy / dist) * maxDist;
                dist = maxDist;
            }
            joystickThumb.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
            joystickInput.x = dx / maxDist;
            joystickInput.y = dy / maxDist;
        }, { passive: false });

        joystickZone.addEventListener('touchend', function (e) {
            e.preventDefault();
            joystickActive = false;
            joystickThumb.style.transform = 'translate(0, 0)';
            joystickInput.x = 0;
            joystickInput.y = 0;
        }, { passive: false });

        jumpBtn.addEventListener('touchstart', function (e) {
            e.preventDefault();
            mobileJump = true;
        }, { passive: false });

        jumpBtn.addEventListener('touchend', function (e) {
            e.preventDefault();
            mobileJump = false;
        }, { passive: false });

        // Camera control via touch on canvas (right side)
        var lastTouch = null;
        renderer.domElement.addEventListener('touchstart', function (e) {
            if (e.touches.length === 1) {
                var touch = e.touches[0];
                if (touch.clientX > window.innerWidth * 0.4) {
                    lastTouch = { x: touch.clientX, y: touch.clientY };
                }
            }
        }, { passive: true });

        renderer.domElement.addEventListener('touchmove', function (e) {
            if (lastTouch && e.touches.length === 1) {
                var touch = e.touches[0];
                if (touch.clientX > window.innerWidth * 0.4) {
                    mouseDelta.x += (touch.clientX - lastTouch.x) * 0.5;
                    mouseDelta.y += (touch.clientY - lastTouch.y) * 0.5;
                    lastTouch = { x: touch.clientX, y: touch.clientY };
                }
            }
        }, { passive: true });

        renderer.domElement.addEventListener('touchend', function () {
            lastTouch = null;
        }, { passive: true });
    }

    /* ============================================
       GAME STATE MANAGEMENT
       ============================================ */
    function simulateLoading() {
        var progress = 0;
        var interval = setInterval(function () {
            progress += 2 + Math.random() * 5;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(function () {
                    document.getElementById('loading-screen').classList.add('hidden');
                    document.getElementById('start-screen').style.display = 'flex';
                    gameState = 'start';
                }, 400);
            }
            loadingBar.style.width = progress + '%';
        }, 80);
    }

    function startGame() {
        document.getElementById('start-screen').style.display = 'none';
        gameHud.style.display = 'block';
        if (isMobile) {
            mobileControls.style.display = 'block';
        }
        gameState = 'playing';
        starCount = 0;
        fruitCount = 0;
        updateHUD();
        resetPositions();

        // Request pointer lock on desktop
        if (!isMobile) {
            renderer.domElement.requestPointerLock && renderer.domElement.requestPointerLock();
        }
    }

    function restartGame() {
        tagOverlay.style.display = 'none';
        tagConfetti.innerHTML = '';
        gameHud.style.display = 'block';
        if (isMobile) {
            mobileControls.style.display = 'block';
        }
        gameState = 'playing';
        starCount = 0;
        fruitCount = 0;
        updateHUD();
        resetPositions();
        spawnCollectibles();

        if (!isMobile) {
            renderer.domElement.requestPointerLock && renderer.domElement.requestPointerLock();
        }
    }

    function resetPositions() {
        player.position.set(0, 0, 0);
        playerVelocity.set(0, 0, 0);
        panda.position.set(20, 0, 20);
        pandaState = 'chasing';
        pandaSearchTimer = 0;
        pandaTripTimer = 0;
    }

    function triggerTag() {
        gameState = 'tagged';
        gameHud.style.display = 'none';
        if (isMobile) {
            mobileControls.style.display = 'none';
        }

        // Exit pointer lock
        document.exitPointerLock && document.exitPointerLock();

        // Show tag overlay
        tagStarsCount.textContent = starCount;
        tagFruitsCount.textContent = fruitCount;
        tagOverlay.style.display = 'flex';

        // Spawn confetti
        spawnConfetti();

        // Panda celebration particles
        spawnHearts(panda.position);
    }

    function spawnConfetti() {
        tagConfetti.innerHTML = '';
        var colors = ['#FFB5C2', '#B5D8FF', '#FFD93D', '#B5FFB5', '#D8B5FF', '#FFD8B5', '#FF6B6B', '#7BC67E'];
        for (var i = 0; i < 50; i++) {
            var piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + '%';
            piece.style.background = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDuration = (2 + Math.random() * 3) + 's';
            piece.style.animationDelay = Math.random() * 1 + 's';
            piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '3px';
            piece.style.width = (8 + Math.random() * 10) + 'px';
            piece.style.height = (8 + Math.random() * 10) + 'px';
            tagConfetti.appendChild(piece);
        }
    }

    function showMessage(text, duration) {
        hudMessageText.textContent = text;
        hudMessage.style.display = 'block';
        setTimeout(function () {
            hudMessage.style.display = 'none';
        }, duration || 2000);
    }

    function updateHUD() {
        starCountEl.textContent = starCount;
        fruitCountEl.textContent = fruitCount;
    }

    /* ============================================
       GAME LOOP
       ============================================ */
    function animate() {
        requestAnimationFrame(animate);
        var dt = Math.min(clock.getDelta(), 0.05);

        if (gameState === 'playing') {
            updateCamera(dt);
            updatePlayer(dt);
            updatePanda(dt);
            updateCollectibles(dt);
            updateBouncePadAnimations(dt);
            checkCollisions();
        }

        updateWorldAnimations(dt);
        updateParticles(dt);

        renderer.render(scene, camera);
    }

    /* ============================================
       CAMERA
       ============================================ */
    function updateCamera(dt) {
        // Process mouse delta
        cameraAngleY -= mouseDelta.x * 0.003;
        cameraAngleX -= mouseDelta.y * 0.002;
        cameraAngleX = Math.max(0.05, Math.min(1.2, cameraAngleX));
        mouseDelta.x = 0;
        mouseDelta.y = 0;

        // Calculate camera position
        var targetX = player.position.x - Math.sin(cameraAngleY) * CONFIG.CAMERA_DISTANCE * Math.cos(cameraAngleX);
        var targetY = player.position.y + CONFIG.CAMERA_HEIGHT + Math.sin(cameraAngleX) * CONFIG.CAMERA_DISTANCE * 0.5;
        var targetZ = player.position.z - Math.cos(cameraAngleY) * CONFIG.CAMERA_DISTANCE * Math.cos(cameraAngleX);

        camera.position.x += (targetX - camera.position.x) * CONFIG.CAMERA_SMOOTHING;
        camera.position.y += (targetY - camera.position.y) * CONFIG.CAMERA_SMOOTHING;
        camera.position.z += (targetZ - camera.position.z) * CONFIG.CAMERA_SMOOTHING;

        camera.lookAt(
            player.position.x,
            player.position.y + 2,
            player.position.z
        );
    }

    /* ============================================
       PLAYER UPDATE
       ============================================ */
    function updatePlayer(dt) {
        // Input direction
        var inputX = 0;
        var inputZ = 0;

        if (isMobile) {
            inputX = joystickInput.x;
            inputZ = joystickInput.y;
        } else {
            if (keys['KeyW'] || keys['ArrowUp']) inputZ = -1;
            if (keys['KeyS'] || keys['ArrowDown']) inputZ = 1;
            if (keys['KeyA'] || keys['ArrowLeft']) inputX = -1;
            if (keys['KeyD'] || keys['ArrowRight']) inputX = 1;
        }

        // Normalize
        var inputLen = Math.sqrt(inputX * inputX + inputZ * inputZ);
        if (inputLen > 1) {
            inputX /= inputLen;
            inputZ /= inputLen;
        }

        // Transform input relative to camera
        var forward = new THREE.Vector3(-Math.sin(cameraAngleY), 0, -Math.cos(cameraAngleY));
        var right = new THREE.Vector3(Math.cos(cameraAngleY), 0, -Math.sin(cameraAngleY));

        playerDirection.set(0, 0, 0);
        playerDirection.addScaledVector(right, inputX);
        playerDirection.addScaledVector(forward, -inputZ);

        if (playerDirection.length() > 0.01) {
            playerDirection.normalize();
            playerVelocity.x = playerDirection.x * CONFIG.PLAYER_SPEED;
            playerVelocity.z = playerDirection.z * CONFIG.PLAYER_SPEED;

            // Rotate player to face movement direction
            var targetAngle = Math.atan2(playerDirection.x, playerDirection.z);
            var currentAngle = player.rotation.y;
            var angleDiff = targetAngle - currentAngle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            player.rotation.y += angleDiff * 0.15;
        } else {
            playerVelocity.x *= 0.85;
            playerVelocity.z *= 0.85;
        }

        // Jump
        var wantJump = keys['Space'] || mobileJump;
        if (wantJump && playerOnGround) {
            playerVelocity.y = CONFIG.PLAYER_JUMP_FORCE;
            playerOnGround = false;
        }

        // Gravity
        playerVelocity.y -= CONFIG.GRAVITY * dt;

        // Apply velocity
        player.position.x += playerVelocity.x * dt;
        player.position.y += playerVelocity.y * dt;
        player.position.z += playerVelocity.z * dt;

        // Ground collision
        var groundY = getGroundHeight(player.position.x, player.position.z);
        if (player.position.y <= groundY) {
            player.position.y = groundY;
            playerVelocity.y = 0;
            playerOnGround = true;
        }

        // World bounds
        var bound = CONFIG.WORLD_SIZE * 0.9;
        player.position.x = Math.max(-bound, Math.min(bound, player.position.x));
        player.position.z = Math.max(-bound, Math.min(bound, player.position.z));

        // Walking animation
        var speed = Math.sqrt(playerVelocity.x * playerVelocity.x + playerVelocity.z * playerVelocity.z);
        if (speed > 1 && playerOnGround) {
            var walkPhase = Date.now() * 0.008;
            if (player.userData.legL) {
                player.userData.legL.rotation.x = Math.sin(walkPhase) * 0.4;
                player.userData.legR.rotation.x = Math.sin(walkPhase + Math.PI) * 0.4;
            }
            // Slight bob
            player.position.y += Math.abs(Math.sin(walkPhase * 2)) * 0.05;
        } else {
            if (player.userData.legL) {
                player.userData.legL.rotation.x *= 0.9;
                player.userData.legR.rotation.x *= 0.9;
            }
        }

        // Bounce pad check
        bouncePads.forEach(function (pad) {
            var dx = player.position.x - pad.pos.x;
            var dz = player.position.z - pad.pos.z;
            var dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < pad.radius && playerOnGround) {
                playerVelocity.y = CONFIG.BOUNCE_PAD_FORCE;
                playerOnGround = false;
                pad.bouncePhase = 1;
                spawnParticles(player.position, PASTEL.bouncePad, 8);
                showMessage('Boing! 🎈', 1500);
            }
        });
    }

    function getGroundHeight(x, z) {
        // Simple ground height based on terrain undulation
        return Math.sin(x * 0.03) * 0.5 + Math.cos(z * 0.04) * 0.3;
    }

    /* ============================================
       PANDA AI
       ============================================ */
    function updatePanda(dt) {
        pandaAnimTimer += dt;
        pandaWaddlePhase += dt * 4;

        var toPlayer = new THREE.Vector3();
        toPlayer.subVectors(player.position, panda.position);
        toPlayer.y = 0;
        var distToPlayer = toPlayer.length();

        // Check if player is hiding
        var playerHiding = isPlayerHiding();

        switch (pandaState) {
            case 'chasing':
                if (playerHiding && distToPlayer > 10) {
                    pandaState = 'searching';
                    pandaSearchTimer = CONFIG.PANDA_SEARCH_DELAY;
                    showMessage('🐼 Where did you go?', 2000);
                    break;
                }

                // Random trip
                pandaTripTimer -= dt;
                if (pandaTripTimer <= 0) {
                    pandaTripTimer = 5 + Math.random() * 8;
                    if (Math.random() < 0.3) {
                        pandaState = 'tripping';
                        pandaTripDuration = 1.5;
                        showMessage('🐼 Oops! Silly panda!', 1500);
                        spawnParticles(panda.position, PASTEL.pandaPink, 6);
                        break;
                    }
                }

                // Move toward player
                if (distToPlayer > CONFIG.PANDA_CATCH_DISTANCE) {
                    var moveDir = toPlayer.normalize();
                    var speed = CONFIG.PANDA_SPEED;

                    // Slow down when far away (less threatening)
                    if (distToPlayer > 30) speed *= 0.6;

                    panda.position.x += moveDir.x * speed * dt;
                    panda.position.z += moveDir.z * speed * dt;

                    // Face player
                    var angle = Math.atan2(moveDir.x, moveDir.z);
                    panda.rotation.y += (angle - panda.rotation.y) * 0.1;
                }

                // Check catch
                if (distToPlayer < CONFIG.PANDA_CATCH_DISTANCE) {
                    triggerTag();
                }
                break;

            case 'searching':
                pandaSearchTimer -= dt;

                // Look around animation
                panda.rotation.y += Math.sin(pandaAnimTimer * 2) * 0.02;

                if (pandaSearchTimer <= 0) {
                    pandaState = 'chasing';
                    showMessage('🐼 Found you!', 1500);
                }

                // If player leaves hiding, resume chase sooner
                if (!playerHiding) {
                    pandaSearchTimer = Math.min(pandaSearchTimer, 0.5);
                }
                break;

            case 'tripping':
                pandaTripDuration -= dt;

                // Silly rolling animation
                panda.rotation.z = Math.sin(pandaAnimTimer * 8) * 0.5;
                panda.rotation.x = Math.sin(pandaAnimTimer * 6) * 0.3;

                if (pandaTripDuration <= 0) {
                    panda.rotation.z = 0;
                    panda.rotation.x = 0;
                    pandaState = 'chasing';
                }
                break;
        }

        // Ground height
        var pandaGroundY = getGroundHeight(panda.position.x, panda.position.z);
        panda.position.y = pandaGroundY;

        // Waddle animation
        if (pandaState === 'chasing') {
            var waddleAmount = 0.08;
            panda.position.y += Math.abs(Math.sin(pandaWaddlePhase)) * 0.15;
            panda.rotation.z = Math.sin(pandaWaddlePhase) * waddleAmount;

            // Leg animation
            if (panda.userData.legL) {
                panda.userData.legL.rotation.x = Math.sin(pandaWaddlePhase) * 0.3;
                panda.userData.legR.rotation.x = Math.sin(pandaWaddlePhase + Math.PI) * 0.3;
            }
            if (panda.userData.armL) {
                panda.userData.armL.rotation.x = Math.sin(pandaWaddlePhase + Math.PI) * 0.2;
                panda.userData.armR.rotation.x = Math.sin(pandaWaddlePhase) * 0.2;
            }

            // Occasional happy particles
            if (Math.random() < 0.01) {
                spawnHearts(panda.position);
            }
        }

        // World bounds for panda
        var bound = CONFIG.WORLD_SIZE * 0.9;
        panda.position.x = Math.max(-bound, Math.min(bound, panda.position.x));
        panda.position.z = Math.max(-bound, Math.min(bound, panda.position.z));
    }

    function isPlayerHiding() {
        for (var i = 0; i < hideSpots.length; i++) {
            var spot = hideSpots[i];
            var dx = player.position.x - spot.pos.x;
            var dz = player.position.z - spot.pos.z;
            var dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < spot.radius) {
                // Check if the hide spot is between player and panda
                var pandaDx = panda.position.x - spot.pos.x;
                var pandaDz = panda.position.z - spot.pos.z;
                var pandaDist = Math.sqrt(pandaDx * pandaDx + pandaDz * pandaDz);
                if (pandaDist > spot.radius * 1.5) {
                    return true;
                }
            }
        }
        return false;
    }

    /* ============================================
       COLLECTIBLES UPDATE
       ============================================ */
    function updateCollectibles(dt) {
        var time = Date.now() * 0.001;

        collectibles.forEach(function (c) {
            if (c.mesh.userData.collected) return;

            // Float and spin
            c.mesh.position.y = c.mesh.userData.baseY + Math.sin(time * 2 + c.mesh.userData.phase) * 0.3;
            c.mesh.rotation.y += dt * 2;
        });
    }

    function checkCollisions() {
        collectibles.forEach(function (c) {
            if (c.mesh.userData.collected) return;

            var dx = player.position.x - c.mesh.position.x;
            var dy = (player.position.y + 1.5) - c.mesh.position.y;
            var dz = player.position.z - c.mesh.position.z;
            var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < 2) {
                c.mesh.userData.collected = true;
                c.mesh.visible = false;

                if (c.mesh.userData.type === 'star') {
                    starCount++;
                    spawnParticles(c.mesh.position, PASTEL.star, 10);
                    showMessage('⭐ Star!', 1000);
                } else {
                    fruitCount++;
                    spawnParticles(c.mesh.position, PASTEL.fruit, 10);
                    showMessage('🍎 Yummy!', 1000);
                }

                updateHUD();
            }
        });
    }

    /* ============================================
       WORLD ANIMATIONS
       ============================================ */
    function updateWorldAnimations(dt) {
        var time = Date.now() * 0.001;

        worldObjects.forEach(function (obj) {
            if (obj.type === 'butterfly' && obj.mesh.userData.basePos) {
                var bp = obj.mesh.userData.basePos;
                var phase = obj.mesh.userData.phase;
                obj.mesh.position.x = bp.x + Math.sin(time * 0.5 + phase) * 5;
                obj.mesh.position.y = bp.y + Math.sin(time * 0.8 + phase) * 1;
                obj.mesh.position.z = bp.z + Math.cos(time * 0.4 + phase) * 5;
                obj.mesh.rotation.y = time * 2;
                // Wing flap
                if (obj.mesh.children[1]) {
                    obj.mesh.children[1].rotation.z = Math.sin(time * 12) * 0.5;
                }
                if (obj.mesh.children[2]) {
                    obj.mesh.children[2].rotation.z = -Math.sin(time * 12) * 0.5;
                }
            }

            if (obj.type === 'note' && obj.mesh.userData.basePos) {
                var np = obj.mesh.userData.basePos;
                var nPhase = obj.mesh.userData.phase;
                obj.mesh.position.y = np.y + Math.sin(time + nPhase) * 1.5;
                obj.mesh.rotation.z = Math.sin(time * 0.5 + nPhase) * 0.3;
            }

            if (obj.type === 'cloud') {
                obj.mesh.position.x += obj.mesh.userData.speed * dt;
                if (obj.mesh.position.x > CONFIG.WORLD_SIZE * 1.5) {
                    obj.mesh.position.x = -CONFIG.WORLD_SIZE * 1.5;
                }
            }

            if (obj.type === 'balloon' && obj.lift) {
                var lift = obj.lift;
                var bPhase = lift.userData.phase;
                lift.position.y = lift.userData.baseY + Math.sin(time * 0.3 + bPhase) * 3;
            }
        });
    }

    function updateBouncePadAnimations(dt) {
        bouncePads.forEach(function (pad) {
            if (pad.bouncePhase > 0) {
                pad.bouncePhase -= dt * 3;
                var squash = 1 - pad.bouncePhase * 0.3;
                pad.mesh.scale.y = squash;
                pad.mesh.scale.x = 1 + pad.bouncePhase * 0.15;
                pad.mesh.scale.z = 1 + pad.bouncePhase * 0.15;
            } else {
                pad.mesh.scale.set(1, 1, 1);
            }

            // Arrow bob
            if (pad.mesh.userData.arrow) {
                pad.mesh.userData.arrow.position.y = 1.2 + Math.sin(Date.now() * 0.004) * 0.2;
            }
        });
    }

    /* ============================================
       START
       ============================================ */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
