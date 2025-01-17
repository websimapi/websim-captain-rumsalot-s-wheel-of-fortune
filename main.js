import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';

class ShipWheel {
  constructor() {
    this.categories = ['Rum', 'More Rum', 'Even More Rum', 'Lots of Rum'];
    this.isSpinning = false;
    this.currentRotation = 0;
    
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

    // Initialize
    this.initializeScene();
    this.initializeEvents();
    this.createWheel();
    this.updateCategoriesList();
    this.animate();
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
    this.wheel.position.y = 3;
    
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

    this.scene.add(this.wheel);
  }

  initializeEvents() {
    this.spinButton.addEventListener('click', () => this.spin());
    this.addCategoryButton.addEventListener('click', () => this.addCategory());
    this.categoryInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addCategory();
    });
    window.addEventListener('resize', () => this.onWindowResize());
  }

  spin() {
    if (this.isSpinning) return;
    this.isSpinning = true;
    this.spinButton.disabled = true;
    
    const spins = 5 + Math.random() * 5;
    const targetRotation = this.currentRotation + (spins * Math.PI * 2);
    
    gsap.to(this.wheel.rotation, {
      y: targetRotation,
      duration: 5,
      ease: "power2.out",
      onComplete: () => {
        this.isSpinning = false;
        this.spinButton.disabled = false;
        this.currentRotation = targetRotation;
        this.announceWinner();
      }
    });
  }

  announceWinner() {
    const rotation = (this.wheel.rotation.y % (Math.PI * 2)) / (Math.PI * 2);
    const sectionAngle = 1 / this.categories.length;
    const winningIndex = Math.floor(rotation / sectionAngle);
    const winner = this.categories[winningIndex];
    
    alert(`Yarr! The wheel has chosen: ${winner}! 🏴‍☠️`);
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

  animate() {
    requestAnimationFrame(() => this.animate());
    this.water.material.uniforms['time'].value += 1.0 / 60.0;
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  new ShipWheel();
});