import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';

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
    
    // Main hull body
    const baseHull = new THREE.Mesh(
      new THREE.CapsuleGeometry(2, 8, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x5c3a21 })
    );
    baseHull.rotation.z = Math.PI / 2;
    baseHull.scale.set(1, 1, 0.7);
    hullGeometry.add(baseHull);

    // Deck
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.2, 3),
      new THREE.MeshStandardMaterial({ color: 0x8b4513 })
    );
    deck.position.y = 1;
    hullGeometry.add(deck);

    // Cabin
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2, 2),
      new THREE.MeshStandardMaterial({ color: 0x8b4513 })
    );
    cabin.position.set(-1, 2, 0);
    hullGeometry.add(cabin);

    // Mast
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 8),
      new THREE.MeshStandardMaterial({ color: 0x8b4513 })
    );
    mast.position.set(1, 5, 0);
    hullGeometry.add(mast);

    // Sail
    const sailGeometry = new THREE.PlaneGeometry(3, 6);
    const sailMaterial = new THREE.MeshStandardMaterial({
      color: 0xf0f0f0,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    const sail = new THREE.Mesh(sailGeometry, sailMaterial);
    sail.position.set(2, 4, 0);
    sail.rotation.y = Math.PI / 2;
    this.sail = sail;
    hullGeometry.add(sail);

    // Add ropes
    this.createRopes(hullGeometry, mast);

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

  createWheel() {
    // Create wheel geometry
    const wheelGeometry = new THREE.CylinderGeometry(2, 2, 0.2, 32);
    const wheelMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x5c3a21,
      roughness: 0.7,
      metalness: 0.3
    });
    this.wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    this.wheel.rotation.x = Math.PI / 2;
    
    // Add spokes
    const spokesCount = 8;
    for (let i = 0; i < spokesCount; i++) {
      const spoke = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8),
        wheelMaterial
      );
      spoke.position.y = 0;
      spoke.rotation.z = (i / spokesCount) * Math.PI * 2;
      spoke.position.x = Math.cos(spoke.rotation.z) * 1;
      spoke.position.z = Math.sin(spoke.rotation.z) * 1;
      this.wheel.add(spoke);
    }

    // Position wheel relative to boat
    this.wheel.position.set(-1, 4, 0); // Positioned on the cabin
    this.boatGroup.add(this.wheel);
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
    
    // Add wheel interaction
    const wheelMesh = this.wheel;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isDragging = false;
    let previousMouseX = 0;

    document.addEventListener('mousedown', (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);
      const intersects = raycaster.intersectObject(wheelMesh, true);

      if (intersects.length > 0 && this.wheelInteractionEnabled) {
        isDragging = true;
        previousMouseX = event.clientX;
        document.body.style.cursor = 'grabbing';
      }
    });

    document.addEventListener('mousemove', (event) => {
      if (isDragging) {
        const deltaX = event.clientX - previousMouseX;
        const rotationSpeed = 0.01;
        this.wheel.rotation.y += deltaX * rotationSpeed;
        
        // Update boat steering
        this.steeringAngle += deltaX * rotationSpeed;
        this.boatTargetRotation = this.steeringAngle * 0.5;
        
        previousMouseX = event.clientX;
        
        // Trigger winner check if wheel spins enough
        if (Math.abs(deltaX) > 10) {
          this.checkForWinner();
        }
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      document.body.style.cursor = 'default';
    });
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
    const rotation = (this.wheel.rotation.y % (Math.PI * 2)) / (Math.PI * 2);
    const sectionAngle = 1 / this.categories.length;
    const winningIndex = Math.floor(rotation / sectionAngle);
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