class RainbowScene {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        // Scene state
        this.timeOfDay = 12; // 0-24 hours
        this.weather = 'sunny'; // sunny, rainy, cloudy, stormy
        this.rainbowIntensity = 0.8;
        this.rainbowVerticalPosition = 0.9; // 0-1, controls vertical position
        this.hilliness = 0.5; // 0-1, controls how hilly the landscape is
        this.windSpeed = 3;
        this.zoom = 1;
        
        // Storm effects
        this.lightning = { active: false, intensity: 0, timer: 0 };
        this.thunder = { timer: 0, volume: 0 };
        
        // Click mode for interactive elements
        this.clickMode = 'bird'; // bird, tree, star, rain, cloud
        this.clickModes = ['bird', 'tree', 'star', 'rain', 'cloud'];
        
        // Element visibility toggles
        this.showSky = true;
        this.showSun = true;
        this.showMoon = true;
        this.showStars = true;
        this.showClouds = true;
        this.showRain = true;
        this.showRainbow = true;
        this.showBirds = true;
        this.showHills = true;
        this.showTrees = true;
        
        // Interactive elements
        this.birds = [];
        this.clouds = [];
        this.raindrops = [];
        this.particles = [];
        this.leaves = []; // For stormy weather
        this.stars = []; // For manually added stars
        this.treePositions = []; // For dynamically added trees
        
        // Mouse interaction
        this.mouse = { x: 0, y: 0, isDown: false };
        this.draggedCloud = null;
        
        this.setupEventListeners();
        this.initializeScene();
        this.animate();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.isDown = true;
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            
            // Check if clicking on a cloud
            const clickedCloud = this.clouds.find(cloud => 
                Math.abs(cloud.x - e.clientX) < 100 && 
                Math.abs(cloud.y - e.clientY) < 50
            );
            if (clickedCloud) {
                this.draggedCloud = clickedCloud;
            } else {
                // Handle click mode actions
                switch (this.clickMode) {
                    case 'bird':
                        if (this.timeOfDay >= 6 && this.timeOfDay <= 18) {
                            this.addBird(e.clientX, e.clientY);
                        }
                        break;
                    case 'tree':
                        this.addTree(e.clientX, e.clientY);
                        break;
                    case 'star':
                        this.addStar(e.clientX, e.clientY);
                        break;
                    case 'rain':
                        this.addRaindrop(e.clientX, e.clientY);
                        break;
                    case 'cloud':
                        this.addCloud(e.clientX, e.clientY);
                        break;
                }
            }
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            
            if (this.draggedCloud && this.mouse.isDown) {
                this.draggedCloud.x = e.clientX;
                this.draggedCloud.y = e.clientY;
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.mouse.isDown = false;
            this.draggedCloud = null;
        });
        
        // Wheel for zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.zoom = Math.max(0.5, Math.min(2, this.zoom + e.deltaY * 0.001));
        });
        
        // Control listeners
        document.getElementById('timeSlider').addEventListener('input', (e) => {
            this.timeOfDay = parseFloat(e.target.value);
            document.getElementById('timeDisplay').textContent = 
                `${Math.floor(this.timeOfDay)}:${Math.floor((this.timeOfDay % 1) * 60).toString().padStart(2, '0')}`;
        });
        
        document.getElementById('rainbowSlider').addEventListener('input', (e) => {
            this.rainbowIntensity = parseFloat(e.target.value);
        });
        
        document.getElementById('rainbowPositionSlider').addEventListener('input', (e) => {
            this.rainbowVerticalPosition = parseFloat(e.target.value);
        });
        
        document.getElementById('windSlider').addEventListener('input', (e) => {
            this.windSpeed = parseFloat(e.target.value);
        });
        
        document.getElementById('hillinessSlider').addEventListener('input', (e) => {
            this.hilliness = parseFloat(e.target.value);
        });
        
        document.getElementById('sunny').addEventListener('click', () => {
            this.setWeather('sunny');
            console.log('Weather set to sunny');
        });
        document.getElementById('rainy').addEventListener('click', () => {
            this.setWeather('rainy');
            console.log('Weather set to rainy');
        });
        document.getElementById('cloudy').addEventListener('click', () => {
            this.setWeather('cloudy');
            console.log('Weather set to cloudy');
        });
        
        document.getElementById('stormy').addEventListener('click', () => {
            this.setWeather('stormy');
            console.log('Weather set to stormy');
        });
        
        // Click mode button
        document.getElementById('clickModeBtn').addEventListener('click', () => {
            const currentIndex = this.clickModes.indexOf(this.clickMode);
            const nextIndex = (currentIndex + 1) % this.clickModes.length;
            this.clickMode = this.clickModes[nextIndex];
            
            const modeLabels = {
                'bird': '🐦 Bird Mode',
                'tree': '🌳 Tree Mode', 
                'star': '⭐ Star Mode',
                'rain': '🌧️ Rain Mode',
                'cloud': '☁️ Cloud Mode'
            };
            
            document.getElementById('clickModeBtn').textContent = modeLabels[this.clickMode];
        });
        
        // Element toggle listeners
        document.getElementById('toggleSky').addEventListener('click', () => {
            this.showSky = !this.showSky;
            this.updateToggleButton('toggleSky', this.showSky);
        });
        
        document.getElementById('toggleSun').addEventListener('click', () => {
            this.showSun = !this.showSun;
            this.updateToggleButton('toggleSun', this.showSun);
        });
        
        document.getElementById('toggleMoon').addEventListener('click', () => {
            this.showMoon = !this.showMoon;
            this.updateToggleButton('toggleMoon', this.showMoon);
        });
        
        document.getElementById('toggleStars').addEventListener('click', () => {
            this.showStars = !this.showStars;
            this.updateToggleButton('toggleStars', this.showStars);
        });
        
        document.getElementById('toggleClouds').addEventListener('click', () => {
            this.showClouds = !this.showClouds;
            this.updateToggleButton('toggleClouds', this.showClouds);
        });
        
        document.getElementById('toggleRain').addEventListener('click', () => {
            this.showRain = !this.showRain;
            this.updateToggleButton('toggleRain', this.showRain);
        });
        
        document.getElementById('toggleRainbow').addEventListener('click', () => {
            this.showRainbow = !this.showRainbow;
            this.updateToggleButton('toggleRainbow', this.showRainbow);
        });
        
        document.getElementById('toggleBirds').addEventListener('click', () => {
            this.showBirds = !this.showBirds;
            this.updateToggleButton('toggleBirds', this.showBirds);
        });
        
        document.getElementById('toggleHills').addEventListener('click', () => {
            this.showHills = !this.showHills;
            this.updateToggleButton('toggleHills', this.showHills);
        });
        
        document.getElementById('toggleTrees').addEventListener('click', () => {
            this.showTrees = !this.showTrees;
            this.updateToggleButton('toggleTrees', this.showTrees);
        });
        
        // Controls panel toggle
        document.getElementById('toggleControls').addEventListener('click', () => {
            const controlsPanel = document.getElementById('controlsPanel');
            const toggleBtn = document.getElementById('toggleControls');
            const isCollapsed = controlsPanel.classList.contains('collapsed');
            
            if (isCollapsed) {
                controlsPanel.classList.remove('collapsed');
                toggleBtn.textContent = '▼';
                toggleBtn.style.transform = 'rotate(0deg)';
            } else {
                controlsPanel.classList.add('collapsed');
                toggleBtn.textContent = '▲';
                toggleBtn.style.transform = 'rotate(180deg)';
            }
        });
    }
    
    setWeather(weather) {
        this.weather = weather;
        this.raindrops = []; // Clear raindrops for all weather types
        this.leaves = []; // Clear leaves for all weather types
        
        // Update button styles to show active weather
        document.getElementById('sunny').style.background = weather === 'sunny' ? '#FFD700' : '#4CAF50';
        document.getElementById('rainy').style.background = weather === 'rainy' ? '#FFD700' : '#4CAF50';
        document.getElementById('cloudy').style.background = weather === 'cloudy' ? '#FFD700' : '#4CAF50';
        document.getElementById('stormy').style.background = weather === 'stormy' ? '#FFD700' : '#4CAF50';
        
        console.log('Weather changed to:', weather);
        
        if (weather === 'rainy' || weather === 'stormy') {
            for (let i = 0; i < 200; i++) {
                this.raindrops.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height - this.canvas.height,
                    speed: 3 + Math.random() * 5,
                    length: 10 + Math.random() * 20
                });
            }
        }
        
        if (weather === 'stormy') {
            // Add blowing leaves for stormy weather
            for (let i = 0; i < 50; i++) {
                this.leaves.push({
                    x: Math.random() * this.canvas.width,
                    y: this.canvas.height * 0.5 + Math.random() * (this.canvas.height * 0.5),
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 2,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.1,
                    size: 5 + Math.random() * 10
                });
            }
        }
    }
    
    updateToggleButton(buttonId, isVisible) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.style.background = isVisible ? '#4CAF50' : '#FF4444';
            button.style.color = 'white';
        }
    }
    
    initializeScene() {
        // Initialize clouds
        for (let i = 0; i < 8; i++) {
            this.clouds.push({
                x: Math.random() * this.canvas.width,
                y: 50 + Math.random() * 150,
                size: 50 + Math.random() * 100,
                speed: 0.5 + Math.random() * 1,
                opacity: 0.3 + Math.random() * 0.4
            });
        }
        
        // Initialize birds
        for (let i = 0; i < 5; i++) {
            this.addBird(
                Math.random() * this.canvas.width,
                Math.random() * this.canvas.height * 0.6
            );
        }
    }
    
    addBird(x, y) {
        this.birds.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4, // Increased from 2 to 4
            vy: (Math.random() - 0.5) * 2,
            wingPhase: Math.random() * Math.PI * 2,
            wingSpeed: 0.2 + Math.random() * 0.3 // Increased wing speed
        });
    }
    
    addTree(x, y) {
        // Add a tree at the clicked position (adjusted to ground level)
        const groundY = this.canvas.height * 0.8; // Approximate ground level
        this.treePositions.push({ x: x, y: groundY });
    }
    
    addStar(x, y) {
        this.stars.push({
            x: x,
            y: y,
            size: 1 + Math.random() * 2,
            twinklePhase: Math.random() * Math.PI * 2
        });
    }
    
    addRaindrop(x, y) {
        this.raindrops.push({
            x: x,
            y: y,
            speed: 3 + Math.random() * 5,
            length: 10 + Math.random() * 20
        });
    }
    
    addCloud(x, y) {
        this.clouds.push({
            x: x,
            y: y,
            size: 50 + Math.random() * 100,
            speed: 0.5 + Math.random() * 1,
            opacity: 0.3 + Math.random() * 0.4
        });
    }
    
    drawSky() {
        if (!this.showSky) return;
        
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        
        // Stormy weather overrides normal sky
        if (this.weather === 'stormy') {
            const stormGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            stormGradient.addColorStop(0, '#2F4F4F'); // Dark grey
            stormGradient.addColorStop(0.3, '#4A4A4A'); // Medium grey
            stormGradient.addColorStop(0.7, '#696969'); // Light grey
            stormGradient.addColorStop(1, '#808080'); // Very light grey
            
            // Add lightning flash effect
            if (this.lightning.active) {
                this.ctx.fillStyle = `rgba(255, 255, 255, ${this.lightning.intensity})`;
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
            
            this.ctx.fillStyle = stormGradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            return;
        }
        
        // Smooth transitions between day and night
        let dayProgress, nightProgress;
        
        if (this.timeOfDay >= 6 && this.timeOfDay <= 18) {
            // Day time
            dayProgress = (this.timeOfDay - 6) / 12;
            const skyBlue = this.lerpColor('#87CEEB', '#FFB347', dayProgress);
            const skyLight = this.lerpColor('#98D8E8', '#FFD700', dayProgress);
            gradient.addColorStop(0, skyBlue);
            gradient.addColorStop(0.5, skyLight);
            gradient.addColorStop(1, '#B0E0E6');
        } else {
            // Night time with slower transitions
            if (this.timeOfDay < 6) {
                nightProgress = this.timeOfDay / 6; // 0 to 1 (dawn)
            } else {
                nightProgress = (this.timeOfDay - 18) / 6; // 0 to 1 (dusk)
            }
            
            // Slower, more gradual transition colors
            const transitionFactor = Math.pow(nightProgress, 0.7); // Slower transition
            const nightBlue = this.lerpColor('#191970', '#000033', transitionFactor);
            const nightLight = this.lerpColor('#4169E1', '#000080', transitionFactor);
            gradient.addColorStop(0, nightBlue);
            gradient.addColorStop(0.5, nightLight);
            gradient.addColorStop(1, '#000033');
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawSun() {
        if (!this.showSun) return;
        
        if (this.timeOfDay >= 6 && this.timeOfDay <= 18) {
            // Calculate sun position - rises from horizon, sets to horizon
            const sunProgress = (this.timeOfDay - 6) / 12; // 0 to 1
            const sunX = this.canvas.width * 0.5 + (sunProgress - 0.5) * this.canvas.width * 0.8;
            const sunY = this.canvas.height * 0.8 - Math.sin(sunProgress * Math.PI) * this.canvas.height * 0.5; // Starts from horizon
            
            // Sun glow
            const gradient = this.ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 80);
            gradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 0, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(sunX, sunY, 80, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Sun core
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(sunX, sunY, 30, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawMoon() {
        if (!this.showMoon) return;
        
        if (this.timeOfDay < 6 || this.timeOfDay > 18) {
            // Calculate moon position - rises from horizon, sets to horizon
            let moonProgress;
            if (this.timeOfDay < 6) {
                moonProgress = this.timeOfDay / 6; // 0 to 1 (rising)
            } else {
                moonProgress = (this.timeOfDay - 18) / 6; // 0 to 1 (setting)
            }
            
            const moonX = this.canvas.width * 0.5 + (moonProgress - 0.5) * this.canvas.width * 0.8;
            const moonY = this.canvas.height * 0.8 - Math.sin(moonProgress * Math.PI) * this.canvas.height * 0.5; // Starts from horizon
            
            // Moon glow
            const gradient = this.ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 60);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(moonX, moonY, 60, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Moon core
            this.ctx.fillStyle = '#F0F8FF';
            this.ctx.beginPath();
            this.ctx.arc(moonX, moonY, 20, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawRainbow() {
        if (!this.showRainbow) return;
        
        // Only show rainbow during day time
        if (this.weather === 'rainy' && this.rainbowIntensity > 0 && this.timeOfDay >= 6 && this.timeOfDay <= 18) {
            const centerX = this.canvas.width * 0.5;
            const centerY = this.canvas.height * this.rainbowVerticalPosition;
            const radius = Math.min(this.canvas.width, this.canvas.height) * 0.5;
            
            const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
            
            console.log('Drawing rainbow with intensity:', this.rainbowIntensity, 'position:', this.rainbowVerticalPosition);
            
            for (let i = 0; i < colors.length; i++) {
                const currentRadius = radius - i * 20;
                const alpha = this.rainbowIntensity * (0.8 + 0.2 * Math.sin(Date.now() * 0.001 + i));
                
                this.ctx.strokeStyle = colors[i];
                this.ctx.globalAlpha = alpha;
                this.ctx.lineWidth = 20;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, currentRadius, 0, Math.PI, true); // Fixed: true for counterclockwise (frown)
                this.ctx.stroke();
            }
            
            this.ctx.globalAlpha = 1;
        }
    }
    
    drawClouds() {
        if (!this.showClouds) return;
        
        // Hide clouds in sunny weather
        if (this.weather === 'sunny') return;
        
        // Stormy weather gets complete cloud cover
        if (this.weather === 'stormy') {
            // Draw storm clouds covering the entire sky
            for (let i = 0; i < 20; i++) {
                const x = (i * 200) % this.canvas.width;
                const y = 50 + Math.sin(i * 0.5) * 30;
                const size = 80 + Math.random() * 120;
                
                this.ctx.fillStyle = `rgba(100, 100, 100, 0.8)`;
                
                // Draw storm cloud
                this.ctx.beginPath();
                this.ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.beginPath();
                this.ctx.arc(x + size * 0.3, y, size * 0.4, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.beginPath();
                this.ctx.arc(x + size * 0.6, y, size * 0.3, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.beginPath();
                this.ctx.arc(x + size * 0.2, y - size * 0.2, size * 0.3, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.beginPath();
                this.ctx.arc(x + size * 0.5, y - size * 0.2, size * 0.3, 0, Math.PI * 2);
                this.ctx.fill();
            }
            return;
        }
        
        this.clouds.forEach(cloud => {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;
            
            // Draw cloud shape with proper layering
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, cloud.size * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.arc(cloud.x + cloud.size * 0.3, cloud.y, cloud.size * 0.4, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.arc(cloud.x + cloud.size * 0.6, cloud.y, cloud.size * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.arc(cloud.x + cloud.size * 0.2, cloud.y - cloud.size * 0.2, cloud.size * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.arc(cloud.x + cloud.size * 0.5, cloud.y - cloud.size * 0.2, cloud.size * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Move cloud
            cloud.x += cloud.speed + this.windSpeed * 0.1;
            if (cloud.x > this.canvas.width + cloud.size) {
                cloud.x = -cloud.size;
            }
        });
    }
    
    drawRain() {
        if (!this.showRain) return;
        
        if (this.weather === 'rainy' || this.weather === 'stormy') {
            // Darker rain at night
            const isNight = this.timeOfDay < 6 || this.timeOfDay > 18;
            const rainColor = isNight ? 'rgba(100, 120, 150, 0.9)' : 'rgba(174, 194, 224, 0.9)';
            this.ctx.strokeStyle = rainColor;
            this.ctx.lineWidth = 3; // Increased line width from 2 to 3
            
            this.raindrops.forEach(drop => {
                this.ctx.beginPath();
                this.ctx.moveTo(drop.x, drop.y);
                this.ctx.lineTo(drop.x, drop.y + drop.length);
                this.ctx.stroke();
                
                drop.y += drop.speed;
                if (drop.y > this.canvas.height) {
                    drop.y = -drop.length;
                    drop.x = Math.random() * this.canvas.width;
                }
            });
        }
    }
    
    drawLeaves() {
        if (this.weather === 'stormy') {
            this.ctx.fillStyle = 'rgba(139, 69, 19, 0.8)'; // Brown leaves
            
            this.leaves.forEach(leaf => {
                this.ctx.save();
                this.ctx.translate(leaf.x, leaf.y);
                this.ctx.rotate(leaf.rotation);
                
                // Draw leaf shape
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, leaf.size, leaf.size * 0.3, 0, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.restore();
                
                // Update leaf position with wind effect
                leaf.x += leaf.vx + this.windSpeed * 0.5;
                leaf.y += leaf.vy;
                leaf.rotation += leaf.rotationSpeed + this.windSpeed * 0.01;
                
                // Keep leaves in bounds
                if (leaf.x < -leaf.size) leaf.x = this.canvas.width + leaf.size;
                if (leaf.x > this.canvas.width + leaf.size) leaf.x = -leaf.size;
                if (leaf.y < -leaf.size) leaf.y = this.canvas.height + leaf.size;
                if (leaf.y > this.canvas.height + leaf.size) leaf.y = -leaf.size;
            });
        }
    }
    
    drawBirds() {
        if (!this.showBirds) return;
        
        // Only show birds during day time
        if (this.timeOfDay >= 6 && this.timeOfDay <= 18) {
            this.birds.forEach(bird => {
                // Update bird position
                bird.x += bird.vx;
                bird.y += bird.vy;
                bird.wingPhase += bird.wingSpeed;
                
                // Keep birds in bounds
                if (bird.x < 0 || bird.x > this.canvas.width) bird.vx *= -1;
                if (bird.y < 50 || bird.y > this.canvas.height * 0.7) bird.vy *= -1;
                
                // Draw bird
                this.ctx.save();
                this.ctx.translate(bird.x, bird.y);
                this.ctx.scale(bird.vx > 0 ? 1 : -1, 1);
                
                this.ctx.fillStyle = '#2F2F2F';
                this.ctx.strokeStyle = '#1A1A1A';
                this.ctx.lineWidth = 1;
                
                // Bird body (more streamlined)
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, 6, 3, 0, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                
                // Wings (more bird-like)
                const wingY = Math.sin(bird.wingPhase) * 4;
                this.ctx.beginPath();
                this.ctx.ellipse(-3, wingY, 8, 1.5, 0, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                
                this.ctx.beginPath();
                this.ctx.ellipse(-3, -wingY, 8, 1.5, 0, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                
                // Head (smaller and more pointed)
                this.ctx.beginPath();
                this.ctx.arc(6, 0, 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                
                // Beak
                this.ctx.fillStyle = '#FFA500';
                this.ctx.beginPath();
                this.ctx.moveTo(8, 0);
                this.ctx.lineTo(10, -1);
                this.ctx.lineTo(10, 1);
                this.ctx.closePath();
                this.ctx.fill();
                
                this.ctx.restore();
            });
        }
    }
    
    drawHills() {
        if (!this.showHills) return;
        
        // Multiple layers of hills for depth
        const hillLayers = [
            { y: this.canvas.height * 0.7, height: 200, color: '#2D5016' },
            { y: this.canvas.height * 0.75, height: 150, color: '#3A5F23' },
            { y: this.canvas.height * 0.8, height: 100, color: '#4A6B2A' }
        ];
        
        hillLayers.forEach((hill, index) => {
            this.ctx.fillStyle = hill.color;
            this.ctx.beginPath();
            this.ctx.moveTo(0, this.canvas.height);
            
            // Create rolling hill effect with hilliness control
            for (let x = 0; x <= this.canvas.width; x += 20) {
                const hillX = x + Math.sin(x * 0.01 + index * 0.5) * 30 * this.hilliness;
                const hillY = hill.y + Math.sin(x * 0.005) * 20 * this.hilliness;
                this.ctx.lineTo(hillX, hillY);
            }
            
            this.ctx.lineTo(this.canvas.width, this.canvas.height);
            this.ctx.closePath();
            this.ctx.fill();
        });
    }
    
    drawTrees() {
        if (!this.showTrees) return;
        
        // Draw trees on hills with better positioning
        const treePositions = [
            { x: 100, y: this.canvas.height * 0.68 },
            { x: 200, y: this.canvas.height * 0.72 },
            { x: 350, y: this.canvas.height * 0.70 },
            { x: 500, y: this.canvas.height * 0.75 },
            { x: 650, y: this.canvas.height * 0.73 },
            { x: 800, y: this.canvas.height * 0.71 },
            { x: 950, y: this.canvas.height * 0.74 },
            { x: 1100, y: this.canvas.height * 0.69 },
            { x: 1250, y: this.canvas.height * 0.72 },
            { x: 1400, y: this.canvas.height * 0.70 },
            { x: 1550, y: this.canvas.height * 0.73 },
            { x: 1700, y: this.canvas.height * 0.71 },
            { x: 1850, y: this.canvas.height * 0.75 },
            { x: 2000, y: this.canvas.height * 0.70 },
            { x: 2150, y: this.canvas.height * 0.72 }
        ];
        
        // Add dynamic trees if they exist
        if (this.treePositions) {
            treePositions.push(...this.treePositions);
        }
        
        treePositions.forEach((pos, index) => {
            if (pos.x < this.canvas.width + 100) { // Only draw trees that are visible
                const x = pos.x;
                const y = pos.y;
                
                // Tree trunk - make it touch the ground
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(x - 4, y, 8, 50);
                
                // Tree foliage with multiple layers for more realistic look
                this.ctx.fillStyle = '#228B22';
                
                // Main foliage
                this.ctx.beginPath();
                this.ctx.arc(x, y - 15, 30, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Additional foliage layers
                this.ctx.beginPath();
                this.ctx.arc(x - 15, y - 25, 25, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.beginPath();
                this.ctx.arc(x + 15, y - 25, 25, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.beginPath();
                this.ctx.arc(x, y - 35, 20, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }
    
    drawStars() {
        if (this.timeOfDay < 6 || this.timeOfDay > 18) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            
            for (let i = 0; i < 100; i++) {
                const x = (i * 37) % this.canvas.width;
                const y = (i * 73) % (this.canvas.height * 0.6);
                const size = Math.sin(Date.now() * 0.001 + i) * 0.5 + 1;
                
                this.ctx.beginPath();
                this.ctx.arc(x, y, size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }
    
    lerpColor(color1, color2, factor) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        
        const r = Math.round(c1.r + (c2.r - c1.r) * factor);
        const g = Math.round(c1.g + (c2.g - c1.g) * factor);
        const b = Math.round(c1.b + (c2.b - c1.b) * factor);
        
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply zoom transformation
        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2);
        
        this.drawSky();
        this.drawStars();
        this.drawSun();
        this.drawMoon();
        this.drawClouds();
        this.drawRain();
        this.drawLeaves();
        this.drawHills();
        this.drawRainbow(); // Draw rainbow behind hills but in front of trees
        this.drawTrees();
        this.drawBirds();
        
        this.ctx.restore();
        
        // Update storm effects
        this.updateStormEffects();
        
        // Update debug info
        this.updateDebugInfo();
        
        requestAnimationFrame(() => this.animate());
    }
    
    updateStormEffects() {
        if (this.weather === 'stormy') {
            // Random lightning strikes
            if (Math.random() < 0.02) { // 2% chance per frame
                this.lightning.active = true;
                this.lightning.intensity = 0.8;
                this.lightning.timer = 5;
                
                // Trigger thunder after lightning
                this.thunder.timer = 30;
                this.thunder.volume = 0.8;
            }
            
            // Update lightning effect
            if (this.lightning.active) {
                this.lightning.timer--;
                this.lightning.intensity = Math.max(0, this.lightning.intensity - 0.1);
                
                if (this.lightning.timer <= 0) {
                    this.lightning.active = false;
                    this.lightning.intensity = 0;
                }
            }
            
            // Update thunder effect
            if (this.thunder.timer > 0) {
                this.thunder.timer--;
                this.thunder.volume = Math.max(0, this.thunder.volume - 0.02);
            }
        }
    }
    
    updateDebugInfo() {
        const debugElement = document.getElementById('debugInfo');
        if (debugElement) {
            debugElement.innerHTML = `
                Weather: ${this.weather}<br>
                Rainbow Intensity: ${this.rainbowIntensity}<br>
                Rainbow Position: ${this.rainbowVerticalPosition.toFixed(2)}<br>
                Hilliness: ${this.hilliness.toFixed(1)}<br>
                Click Mode: ${this.clickMode}<br>
                Time: ${this.timeOfDay.toFixed(1)}<br>
                Raindrops: ${this.raindrops.length}<br>
                Leaves: ${this.leaves.length}<br>
                Lightning: ${this.lightning.active ? '⚡' : '⚪'}<br>
                Thunder: ${this.thunder.timer > 0 ? '🔊' : '🔇'}
            `;
        }
    }
}

// Initialize the scene when the page loads
window.addEventListener('load', () => {
    new RainbowScene();
});
