import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

class ShipWheel {
  constructor() {
    this.categories = ['Rum', 'More Rum', 'Even More Rum', 'Lots of Rum'];
    this.isSpinning = false;
    this.currentRotation = 0;
    this.steeringAngle = 0;
    this.boatTargetRotation = 0;
    this.wheelInteractionEnabled = true;
    this.tooltipTimeout = null;
    
    // UI Elements
    this.spinButton = document.getElementById('spinButton');
    this.categoryInput = document.getElementById('categoryInput');
    this.addCategoryButton = document.getElementById('addCategory');
    this.categoriesList = document.getElementById('categoriesList');

    // Scene Setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    document.getElementById('scene-container').appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.maxPolarAngle = Math.PI * 0.495;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 15;
    
    this.camera.position.set(0, 5, 10);
    this.controls.update();

    // Add physics properties
    this.time = 0;
    this.shipRotation = {
      x: 0,
      y: 0,
      z: 0
    };
    
    this.boatGroup = new THREE.Group(); // Group to hold boat and wheel
    this.scene.add(this.boatGroup);

    // Initialize with additional components
    this.initializeScene();
    this.createBoat();
    this.createWheel();
    this.setupTooltip();
    this.showInitialTooltip();
    this.initializeEvents();
    this.updateCategoriesList();
    this.animate();
  }

  createBoat() {
    // Create ship hull
    const hullGeometry = new THREE.Group();
    
    // Main hull body - made more detailed with better curves
    const baseHull = new THREE.Mesh(
      new THREE.CapsuleGeometry(2.2, 9, 8, 16),
      new THREE.MeshStandardMaterial({ 
        color: 0x5c3a21,
        roughness: 0.8,
        metalness: 0.2
      })
    );
    baseHull.rotation.z = Math.PI / 2;
    baseHull.scale.set(1, 1, 0.7);
    hullGeometry.add(baseHull);

    // Enhanced deck with planks
    const deckGroup = new THREE.Group();
    const plankCount = 20;
    const plankWidth = 8 / plankCount;
    
    for (let i = 0; i < plankCount; i++) {
      const plank = new THREE.Mesh(
        new THREE.BoxGeometry(plankWidth * 0.95, 0.1, 3),
        new THREE.MeshStandardMaterial({ 
          color: 0x8b4513,
          roughness: 0.9,
          metalness: 0.1
        })
      );
      plank.position.x = (i - plankCount/2) * plankWidth + plankWidth/2;
      plank.position.y = 1;
      deckGroup.add(plank);
    }
    hullGeometry.add(deckGroup);

    // Enhanced cabin with windows
    const cabin = new THREE.Group();
    
    // Main cabin structure
    const cabinBody = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2, 2),
      new THREE.MeshStandardMaterial({ 
        color: 0x8b4513,
        roughness: 0.7,
        metalness: 0.2
      })
    );
    cabin.add(cabinBody);

    // Windows
    const windowMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x88ccff,
      transparent: true,
      opacity: 0.6,
      shininess: 90
    });

    for (let i = 0; i < 2; i++) {
      const window = new THREE.Mesh(
        new THREE.CircleGeometry(0.2, 16),
        windowMaterial
      );
      window.position.set(0.5, 0, (-0.5 + i) * 1);
      window.rotation.y = Math.PI / 2;
      cabin.add(window);
    }

    cabin.position.set(-1, 2, 0);
    hullGeometry.add(cabin);

    // Enhanced mast with more detail
    const mastGroup = new THREE.Group();
    
    // Main mast
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.15, 8),
      new THREE.MeshStandardMaterial({ 
        color: 0x8b4513,
        roughness: 0.8,
        metalness: 0.2
      })
    );
    mastGroup.add(mast);

    // Crow's nest
    const crowsNest = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8),
      new THREE.MeshStandardMaterial({ color: 0x8b4513 })
    );
    crowsNest.position.y = 3;
    mastGroup.add(crowsNest);

    mastGroup.position.set(1, 5, 0);
    hullGeometry.add(mastGroup);

    // Enhanced sail with better material and rigging
    const sailGeometry = new THREE.PlaneGeometry(3, 6, 10, 10);
    const sailMaterial = new THREE.MeshStandardMaterial({
      color: 0xf0f0f0,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      roughness: 0.5
    });
    const sail = new THREE.Mesh(sailGeometry, sailMaterial);
    sail.position.set(2, 4, 0);
    sail.rotation.y = Math.PI / 2;
    
    // Add slight wave deformation to sail vertices
    const sailPositions = sail.geometry.attributes.position.array;
    for (let i = 0; i < sailPositions.length; i += 3) {
      sailPositions[i + 2] += Math.sin(sailPositions[i + 1] * 0.5) * 0.1;
    }
    sail.geometry.attributes.position.needsUpdate = true;
    
    this.sail = sail;
    hullGeometry.add(sail);

    // Enhanced ropes system
    this.createRopes(hullGeometry, mastGroup);

    // Add railings
    this.createRailings(hullGeometry);

    // Position the entire boat
    hullGeometry.position.y = 0;
    this.boatGroup.add(hullGeometry);
    this.hull = hullGeometry;
  }

  createRopes(hullGeometry, mast) {
    const ropeGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1);
    const ropeMaterial = new THREE.MeshStandardMaterial({ color: 0x463020 });
    
    // Create multiple ropes
    for (let i = 0; i < 3; i++) {
      const rope = new THREE.Mesh(ropeGeometry, ropeMaterial);
      rope.position.set(
        1 + Math.cos(i * Math.PI / 2) * 1.5,
        4,
        Math.sin(i * Math.PI / 2) * 1.5
      );
      hullGeometry.add(rope);
    }
  }

  createRailings(hullGeometry) {
    const railingMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8b4513,
      roughness: 0.7
    });

    const railingGroup = new THREE.Group();
    
    // Create posts
    for (let i = -4; i <= 4; i += 0.8) {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6),
        railingMaterial
      );
      post.position.set(i, 1.4, 1.4);
      railingGroup.add(post);
      
      const postMirror = post.clone();
      postMirror.position.z = -1.4;
      railingGroup.add(postMirror);
    }

    // Add horizontal railings
    const horizontalRailing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 8.2, 6),
      railingMaterial
    );
    horizontalRailing.rotation.z = Math.PI / 2;
    horizontalRailing.position.y = 1.7;
    horizontalRailing.position.z = 1.4;
    railingGroup.add(horizontalRailing);

    const backRailing = horizontalRailing.clone();
    backRailing.position.z = -1.4;
    railingGroup.add(backRailing);

    hullGeometry.add(railingGroup);
  }

  createWheel() {
    const wheelGroup = new THREE.Group();
    
    // Main wheel rim
    const rimGeometry = new THREE.TorusGeometry(0.8, 0.08, 16, 32);
    const wheelMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x5c3a21,
      roughness: 0.7,
      metalness: 0.3
    });
    const rim = new THREE.Mesh(rimGeometry, wheelMaterial);
    wheelGroup.add(rim);

    // Add category markers with larger text panels
    const categories = this.categories;
    const angleStep = (Math.PI * 2) / categories.length;

    categories.forEach((category, index) => {
      const markerGroup = new THREE.Group();

      // Create a larger background panel for each category
      const panelGeometry = new THREE.PlaneGeometry(0.8, 0.4);
      const panelMaterial = new THREE.MeshStandardMaterial({
        color: index % 2 === 0 ? 0xffd700 : 0xe6b800,
        side: THREE.DoubleSide
      });
      const panel = new THREE.Mesh(panelGeometry, panelMaterial);
      markerGroup.add(panel);

      // Create text using merged geometry for better performance
      const textGeometry = new THREE.TextGeometry(category, {
        size: 0.1,
        height: 0.02,
        curveSegments: 4,
        bevelEnabled: false
      });
      const textMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      
      // Center the text on the panel
      textGeometry.computeBoundingBox();
      const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
      textMesh.position.x = -textWidth / 2;
      textMesh.position.y = -0.05;
      markerGroup.add(textMesh);

      // Position the entire marker group
      const angle = index * angleStep;
      const radius = 1.2;
      markerGroup.position.x = Math.cos(angle) * radius;
      markerGroup.position.y = Math.sin(angle) * radius;
      markerGroup.rotation.z = angle + Math.PI / 2;
      
      wheelGroup.add(markerGroup);

      // Add section separators
      const separator = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.05, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x3d2412 })
      );
      separator.position.x = 0;
      separator.position.y = 0;
      separator.rotation.z = index * angleStep;
      wheelGroup.add(separator);
    });

    // Center hub
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.2, 16),
      wheelMaterial
    );
    wheelGroup.add(hub);

    // Enhanced spokes with decorative elements
    const spokesCount = 8;
    for (let i = 0; i < spokesCount; i++) {
      const spokeGroup = new THREE.Group();
      
      // Main spoke
      const spoke = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08, 0.7),
        wheelMaterial
      );
      spokeGroup.add(spoke);

      // Decorative ring around spoke base
      const ringGeometry = new THREE.TorusGeometry(0.06, 0.02, 8, 16);
      const ring = new THREE.Mesh(ringGeometry, new THREE.MeshStandardMaterial({ color: 0x3d2412 }));
      ring.position.z = 0.1;
      spokeGroup.add(ring);

      // Handle grip with improved shape
      const grip = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.06, 0.15, 4, 8),
        new THREE.MeshStandardMaterial({ 
          color: 0x3d2412,
          roughness: 0.5,
          metalness: 0.3
        })
      );
      grip.position.z = 0.35;
      spokeGroup.add(grip);

      // Position the spoke group
      const angle = (i / spokesCount) * Math.PI * 2;
      spokeGroup.position.x = Math.cos(angle) * 0.4;
      spokeGroup.position.y = Math.sin(angle) * 0.4;
      spokeGroup.rotation.x = angle;
      wheelGroup.add(spokeGroup);
    }

    // Add decorative center cap
    const centerCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 0.05, 16),
      new THREE.MeshStandardMaterial({ 
        color: 0x3d2412,
        metalness: 0.5,
        roughness: 0.2
      })
    );
    centerCap.position.z = 0.1;
    wheelGroup.add(centerCap);

    wheelGroup.rotation.x = Math.PI / 2; 
    wheelGroup.position.set(-1, 4, 0);
    this.wheel = wheelGroup;
    this.boatGroup.add(wheelGroup);
  }

  initializeScene() {
    // Water
    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
    this.water = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg', function(texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }),
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: false
    });
    this.water.rotation.x = -Math.PI / 2;
    this.scene.add(this.water);

    // Sky
    this.sky = new Sky();
    this.sky.scale.setScalar(10000);
    this.scene.add(this.sky);

    const skyUniforms = this.sky.material.uniforms;
    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;

    const sun = new THREE.Vector3();
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    
    const phi = THREE.MathUtils.degToRad(90 - 2);
    const theta = THREE.MathUtils.degToRad(180);
    sun.setFromSphericalCoords(1, phi, theta);

    this.sky.material.uniforms['sunPosition'].value.copy(sun);
    this.water.material.uniforms['sunDirection'].value.copy(sun).normalize();

    this.scene.environment = pmremGenerator.fromScene(this.sky).texture;
  }

  initializeEvents() {
    this.addCategoryButton.addEventListener('click', () => this.addCategory());
    this.categoryInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addCategory();
    });
    window.addEventListener('resize', () => this.onWindowResize());
    
    let isDragging = false;
    let startX = 0;
    let startAngle = 0;

    const mouse = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();

    document.addEventListener('mousedown', (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);
      const intersects = raycaster.intersectObject(this.wheel, true);

      if (intersects.length > 0 && !this.isSpinning) {
        isDragging = true;
        startX = event.clientX;
        startAngle = this.wheel.rotation.x;
        document.body.style.cursor = 'grabbing';
      }
    });

    document.addEventListener('mousemove', (event) => {
      if (isDragging && !this.isSpinning) {
        const deltaX = event.clientX - startX;
        const rotationSpeed = 0.01;
        
        this.wheel.rotation.x = startAngle + (deltaX * rotationSpeed);
        this.steeringAngle = this.wheel.rotation.x;
        this.boatTargetRotation = this.steeringAngle * 0.5;
        
        // If movement is fast enough, trigger a spin
        if (Math.abs(deltaX * rotationSpeed) > 0.1) {
          this.spinWheel(deltaX * rotationSpeed * 0.1);
          isDragging = false;
        }
      }
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        const finalDelta = (event.clientX - startX) * 0.01;
        if (Math.abs(finalDelta) > 0.05) {
          this.spinWheel(finalDelta);
        }
      }
      isDragging = false;
      document.body.style.cursor = 'default';
    });
  }

  spinWheel(initialVelocity) {
    this.isSpinning = true;
    let velocity = initialVelocity;
    const friction = 0.98;
    const minVelocity = 0.001;

    const animate = () => {
      if (Math.abs(velocity) > minVelocity) {
        this.wheel.rotation.x += velocity;
        this.steeringAngle = this.wheel.rotation.x;
        this.boatTargetRotation = this.steeringAngle * 0.5;
        velocity *= friction;
        
        this.checkForWinner();
        requestAnimationFrame(animate);
      } else {
        this.isSpinning = false;
      }
    };

    animate();
  }

  setupTooltip() {
    const tooltip = document.createElement('div');
    tooltip.id = 'tooltip';
    tooltip.textContent = 'Click and drag the ship wheel to steer!';
    document.body.appendChild(tooltip);
    this.tooltip = tooltip;
  }

  showInitialTooltip() {
    this.tooltip.style.display = 'block';
    setTimeout(() => {
      this.tooltip.style.display = 'none';
    }, 3000);
  }

  checkForWinner() {
    const rotation = (this.wheel.rotation.x % (Math.PI * 2));
    const normalizedRotation = rotation < 0 ? rotation + Math.PI * 2 : rotation;
    const sectionAngle = (Math.PI * 2) / this.categories.length;
    const winningIndex = Math.floor(normalizedRotation / sectionAngle);
    const winner = this.categories[winningIndex];
    
    this.tooltip.textContent = `Current selection: ${winner}`;
    this.tooltip.style.display = 'block';
    clearTimeout(this.tooltipTimeout);
    this.tooltipTimeout = setTimeout(() => {
      this.tooltip.style.display = 'none';
    }, 2000);
  }

  addCategory() {
    const category = this.categoryInput.value.trim();
    if (category && this.categories.length < 12) {
      this.categories.push(category);
      this.categoryInput.value = '';
      this.updateCategoriesList();
    } else if (this.categories.length >= 12) {
      alert("Yarr! The wheel can't hold more than 12 categories, matey!");
    }
  }

  removeCategory(index) {
    if (this.categories.length > 2) {
      this.categories.splice(index, 1);
      this.updateCategoriesList();
    } else {
      alert("Yarr! Ye need at least 2 categories to spin the wheel!");
    }
  }

  updateCategoriesList() {
    this.categoriesList.innerHTML = '';
    this.categories.forEach((category, index) => {
      const li = document.createElement('li');
      li.textContent = category;
      
      const deleteBtn = document.createElement('button');
      deleteBtn.innerHTML = '×';
      deleteBtn.className = 'delete-btn';
      deleteBtn.addEventListener('click', () => this.removeCategory(index));
      
      li.appendChild(deleteBtn);
      this.categoriesList.appendChild(li);
    });
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  updateBoatPhysics() {
    this.time += 0.01;
    
    // Simulate wave motion
    const waveHeight = Math.sin(this.time) * 0.2;
    const wavePitch = Math.sin(this.time * 0.5) * 0.05;
    const waveRoll = Math.cos(this.time * 0.7) * 0.05;

    // Apply physics to boat group
    this.boatGroup.position.y = waveHeight + 2;
    this.boatGroup.rotation.x = wavePitch;
    this.boatGroup.rotation.z = waveRoll;

    // Smooth boat steering
    this.boatGroup.rotation.y += (this.boatTargetRotation - this.boatGroup.rotation.y) * 0.02;

    // Animate sail
    if (this.sail) {
      this.sail.position.z = Math.sin(this.time) * 0.1;
    }

    // Update water movement
    if (this.water) {
      this.water.material.uniforms['time'].value += 1.0 / 60.0;
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    this.updateBoatPhysics();
    
    // Update controls
    if (this.controls) {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  new ShipWheel();
});