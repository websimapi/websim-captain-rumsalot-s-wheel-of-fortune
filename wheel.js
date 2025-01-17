import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

class WheelOfFortune {
  constructor() {
    this.categories = ['Rum', 'More Rum', 'Even More Rum', 'Lots of Rum'];
    this.isSpinning = false;
    this.spinButton = document.getElementById('spinButton');
    this.categoryInput = document.getElementById('categoryInput');
    this.addCategoryButton = document.getElementById('addCategory');
    this.categoriesList = document.getElementById('categoriesList');
    
    this.initThreeJS();
    this.initializeEvents();
    this.createWheel();
    this.updateCategoriesList();
    this.animate();
  }

  initThreeJS() {
    const container = document.getElementById('wheel-canvas');
    
    // Scene setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.camera.position.z = 5;
    
    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    // Group for the wheel
    this.wheelGroup = new THREE.Group();
    this.scene.add(this.wheelGroup);
  }

  createWheel() {
    // Create the main wheel structure
    const wheelGeometry = new THREE.CylinderGeometry(2, 2, 0.2, 32);
    const woodTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/wood.jpg');
    const wheelMaterial = new THREE.MeshPhongMaterial({ 
      map: woodTexture,
      color: 0x593d1b
    });
    this.wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    this.wheel.rotation.x = Math.PI / 2;
    this.wheelGroup.add(this.wheel);

    // Add spokes
    const spokeGeometry = new THREE.BoxGeometry(0.1, 4, 0.1);
    const spokeMaterial = new THREE.MeshPhongMaterial({ color: 0x593d1b });
    
    for (let i = 0; i < 8; i++) {
      const spoke = new THREE.Mesh(spokeGeometry, spokeMaterial);
      spoke.rotation.z = (i / 8) * Math.PI * 2;
      this.wheelGroup.add(spoke);
    }

    // Add center hub
    const hubGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.3, 16);
    const hub = new THREE.Mesh(hubGeometry, spokeMaterial);
    hub.rotation.x = Math.PI / 2;
    this.wheelGroup.add(hub);

    // Add section dividers
    const sectionAngle = (Math.PI * 2) / this.categories.length;
    for (let i = 0; i < this.categories.length; i++) {
      const dividerGeometry = new THREE.BoxGeometry(0.05, 2, 0.05);
      const divider = new THREE.Mesh(dividerGeometry, spokeMaterial);
      divider.rotation.z = i * sectionAngle;
      this.wheelGroup.add(divider);
    }

    // Add text labels
    const fontLoader = new FontLoader();
    fontLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/fonts/helvetiker_bold.typeface.json', (font) => {
      for (let i = 0; i < this.categories.length; i++) {
        const geometry = new TextGeometry(this.categories[i], {
          font: font,
          size: 0.2,
          height: 0.1,
          curveSegments: 12,
        });
        const material = new THREE.MeshPhongMaterial({ color: 0xffffff });
        const text = new THREE.Mesh(geometry, material);
        text.position.x = 1.5 * Math.cos(i * sectionAngle);
        text.position.y = 1.5 * Math.sin(i * sectionAngle);
        text.rotation.z = i * sectionAngle;
        text.rotation.x = Math.PI / 2;
        this.wheelGroup.add(text);
      }
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    if (!this.isSpinning) {
      this.wheelGroup.rotation.z += 0.001; // Slow continuous rotation when not spinning
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  spin() {
    if (this.isSpinning) return;
    this.isSpinning = true;
    this.spinButton.disabled = true;

    const currentRotation = this.wheelGroup.rotation.z;
    const spins = 5 + Math.random() * 5;
    const targetRotation = currentRotation + (spins * Math.PI * 2);

    gsap.to(this.wheelGroup.rotation, {
      z: targetRotation,
      duration: 5,
      ease: "power2.out",
      onComplete: () => {
        this.isSpinning = false;
        this.spinButton.disabled = false;
        this.announceWinner();
      }
    });
  }

  announceWinner() {
    const rotation = this.wheelGroup.rotation.z % (Math.PI * 2);
    const sectionAngle = (Math.PI * 2) / this.categories.length;
    const winningIndex = Math.floor((rotation / sectionAngle) % this.categories.length);
    const winner = this.categories[winningIndex];
    
    alert(`Yarr! The wheel has chosen: ${winner}!`);
  }

  initializeEvents() {
    this.spinButton.addEventListener('click', () => this.spin());
    this.addCategoryButton.addEventListener('click', () => this.addCategory());
    this.categoryInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addCategory();
    });
  }

  addCategory() {
    const category = this.categoryInput.value.trim();
    if (category && this.categories.length < 12) {
      this.categories.push(category);
      this.categoryInput.value = '';
      this.wheelGroup.clear();
      this.createWheel();
      this.updateCategoriesList();
    } else if (this.categories.length >= 12) {
      alert("Yarr! The wheel can't hold more than 12 categories, matey!");
    }
  }

  removeCategory(index) {
    if (this.categories.length > 2) {
      this.categories.splice(index, 1);
      this.wheelGroup.clear();
      this.createWheel();
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
}

// Initialize the wheel
document.addEventListener('DOMContentLoaded', () => {
  new WheelOfFortune();
});