import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water2.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { gsap } from 'gsap';

class ShipScene {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.clock = new THREE.Clock();
    this.shipWheel = null;
    this.ship = null;
    this.water = null;
    this.currentRotation = 0;
    this.targetRotation = 0;
    this.isAnimating = false;

    this.init();
    this.setupLights();
    this.createWater();
    this.createSky();
    this.loadModels();
    this.setupControls();
    this.animate();
  }

  init() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(this.renderer.domElement);

    this.camera.position.set(0, 10, 20);
    this.camera.lookAt(0, 0, 0);

    window.addEventListener('resize', () => this.onWindowResize(), false);
  }

  setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(100, 100, 50);
    this.scene.add(directionalLight);
  }

  createWater() {
    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
    this.water = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/waternormals.jpg', function(texture) {
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
  }

  createSky() {
    const sky = new Sky();
    sky.scale.setScalar(10000);
    this.scene.add(sky);

    const sun = new THREE.Vector3();
    const uniforms = sky.material.uniforms;
    uniforms['turbidity'].value = 10;
    uniforms['rayleigh'].value = 2;
    uniforms['mieCoefficient'].value = 0.005;
    uniforms['mieDirectionalG'].value = 0.8;

    const phi = THREE.MathUtils.degToRad(90 - 2);
    const theta = THREE.MathUtils.degToRad(180);
    sun.setFromSphericalCoords(1, phi, theta);
    uniforms['sunPosition'].value.copy(sun);
  }

  loadModels() {
    const loader = new GLTFLoader();
    
    // Load ship wheel
    loader.load('https://threejs.org/examples/models/gltf/ship/scene.gltf', (gltf) => {
      this.ship = gltf.scene;
      this.ship.scale.set(0.1, 0.1, 0.1);
      this.scene.add(this.ship);
    });

    // Create a simple wheel geometry
    const wheelGeometry = new THREE.TorusGeometry(2, 0.2, 16, 50);
    const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    this.shipWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    
    // Add spokes to the wheel
    for (let i = 0; i < 8; i++) {
      const spoke = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 1.8),
        wheelMaterial
      );
      spoke.rotation.z = (i * Math.PI) / 4;
      this.shipWheel.add(spoke);
    }

    this.shipWheel.position.set(0, 5, 10);
    this.scene.add(this.shipWheel);
  }

  setupControls() {
    document.getElementById('turnLeft').addEventListener('click', () => this.turn('left'));
    document.getElementById('turnRight').addEventListener('click', () => this.turn('right'));
  }

  turn(direction) {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    const rotationAmount = direction === 'left' ? -Math.PI : Math.PI;
    
    // Animate the wheel
    gsap.to(this.shipWheel.rotation, {
      y: this.shipWheel.rotation.y + rotationAmount * 2,
      duration: 2,
      ease: "power2.inOut"
    });

    // Animate the ship
    if (this.ship) {
      gsap.to(this.ship.rotation, {
        y: this.ship.rotation.y + rotationAmount / 2,
        duration: 2,
        ease: "power2.inOut",
        onComplete: () => {
          this.isAnimating = false;
          this.updateCompass();
        }
      });
    }
  }

  updateCompass() {
    const directions = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];
    const angle = (this.ship.rotation.y * (180 / Math.PI)) % 360;
    const index = Math.round(((angle + 360) % 360) / 45) % 8;
    document.getElementById('compass').textContent = `Current Heading: ${directions[index]}`;
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    this.water.material.uniforms['time'].value += delta;

    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize the scene
new ShipScene();