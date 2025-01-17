class WheelOfFortune {
  constructor() {
    this.categories = ['Rum', 'More Rum', 'Even More Rum', 'Lots of Rum'];
    this.isSpinning = false;
    this.wheel = document.querySelector('.wheel');
    this.wheelSections = document.querySelector('.wheel-sections');
    this.spinButton = document.getElementById('spinButton');
    this.categoryInput = document.getElementById('categoryInput');
    this.addCategoryButton = document.getElementById('addCategory');
    this.categoriesList = document.getElementById('categoriesList');

    this.initializeEvents();
    this.drawWheel();
    this.updateCategoriesList();
    this.setupWheelAppearance();
  }

  initializeEvents() {
    this.spinButton.addEventListener('click', () => this.spin());
    this.addCategoryButton.addEventListener('click', () => this.addCategory());
    this.categoryInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addCategory();
    });
  }

  drawWheel() {
    this.wheelSections.innerHTML = '';
    const sectionAngle = 360 / this.categories.length;
    const colors = ['#E74C3C', '#3498DB', '#2ECC71', '#F1C40F', '#9B59B6', '#1ABC9C'];

    this.categories.forEach((category, index) => {
      const startAngle = index * sectionAngle;
      const endAngle = (index + 1) * sectionAngle;
      const section = this.createWheelSection(
        250, 250, 240, startAngle, endAngle,
        colors[index % colors.length], category
      );
      this.wheelSections.appendChild(section);
    });
  }

  createWheelSection(cx, cy, r, startAngle, endAngle, fill, text) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // Create section path with wood-like appearance
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M${cx},${cy} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`);
    path.setAttribute('fill', fill);
    path.setAttribute('stroke', '#593d1b');
    path.setAttribute('stroke-width', '3');
    
    // Add wood grain effect
    path.setAttribute('filter', 'url(#wood-texture)');
    
    // Add text with improved styling
    const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    const middleAngle = (startAngle + endAngle) / 2;
    const textRadius = r * 0.7;
    const textX = cx + textRadius * Math.cos((middleAngle - 90) * Math.PI / 180);
    const textY = cy + textRadius * Math.sin((middleAngle - 90) * Math.PI / 180);
    
    textElement.setAttribute('x', textX);
    textElement.setAttribute('y', textY);
    textElement.setAttribute('text-anchor', 'middle');
    textElement.setAttribute('fill', 'white');
    textElement.setAttribute('transform', `rotate(${middleAngle},${textX},${textY})`);
    textElement.style.fontSize = '16px';
    textElement.style.fontWeight = 'bold';
    textElement.style.textShadow = '2px 2px 2px rgba(0,0,0,0.5)';
    textElement.textContent = text;
    
    group.appendChild(path);
    group.appendChild(textElement);
    return group;
  }

  setupWheelAppearance() {
    this.wheel.style.transform = "rotateX(10deg)";
    gsap.to(this.wheel, {
      rotationY: 360,
      duration: 30,
      repeat: -1,
      ease: "none"
    });
  }

  spin() {
    if (this.isSpinning) return;
    this.isSpinning = true;
    this.spinButton.disabled = true;
    
    const currentRotation = this.getRotation(this.wheel);
    const spins = 5 + Math.random() * 5;
    const targetRotation = currentRotation + (spins * 360);
    
    gsap.to(this.wheel, {
      rotation: targetRotation,
      duration: 5,
      ease: "power2.out",
      onComplete: () => {
        this.isSpinning = false;
        this.spinButton.disabled = false;
        this.announceWinner();
      }
    });
  }

  getRotation(element) {
    const style = window.getComputedStyle(element);
    const matrix = new WebKitCSSMatrix(style.transform);
    return Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
  }

  announceWinner() {
    const rotation = this.getRotation(this.wheel) % 360;
    const sectionAngle = 360 / this.categories.length;
    const winningIndex = Math.floor(((360 - rotation) % 360) / sectionAngle);
    const winner = this.categories[winningIndex];
    
    alert(`Yarr! The wheel has chosen: ${winner}! `);
  }

  addCategory() {
    const category = this.categoryInput.value.trim();
    if (category && this.categories.length < 12) {
      this.categories.push(category);
      this.categoryInput.value = '';
      this.drawWheel();
      this.updateCategoriesList();
    } else if (this.categories.length >= 12) {
      alert("Yarr! The wheel can't hold more than 12 categories, matey!");
    }
  }

  removeCategory(index) {
    if (this.categories.length > 2) {
      this.categories.splice(index, 1);
      this.drawWheel();
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