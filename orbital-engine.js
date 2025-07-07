// Orbital Mechanics Engine
class OrbitalEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        
        // Physics constants
        this.G = 6.67430e-11; // Gravitational constant (scaled for simulation)
        this.AU = 150; // Astronomical Unit in pixels (Earth-Sun distance)
        this.timeScale = 1; // Time scaling factor
        this.isPaused = false;
        this.showTrails = true;
        this.speedMultiplier = 1;
        
        // Central star
        this.star = {
            x: this.centerX,
            y: this.centerY,
            mass: 1.989e30, // Solar mass
            radius: 20,
            color: '#FFD700'
        };
        
        // Initialize planets
        this.planets = this.createPlanets();
        this.trails = new Map(); // Store orbital trails for each planet
        
        // Start animation
        this.animate();
    }
    
    createPlanets() {
        return [
            {
                name: 'Mercury',
                mass: 3.301e23,
                radius: 4,
                color: '#8C7853',
                // Orbital elements
                semiMajorAxis: 0.39 * this.AU,
                eccentricity: 0.205,
                inclination: 0,
                argumentOfPeriapsis: 0,
                longitudeOfAscendingNode: 0,
                meanAnomalyAtEpoch: 0,
                // Current position
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                angle: 0,
                period: 88 // days
            },
            {
                name: 'Venus',
                mass: 4.867e24,
                radius: 6,
                color: '#FFC649',
                semiMajorAxis: 0.72 * this.AU,
                eccentricity: 0.007,
                inclination: 0,
                argumentOfPeriapsis: 0,
                longitudeOfAscendingNode: 0,
                meanAnomalyAtEpoch: Math.PI / 2,
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                angle: Math.PI / 2,
                period: 225
            },
            {
                name: 'Earth',
                mass: 5.972e24,
                radius: 6,
                color: '#6B93D6',
                semiMajorAxis: 1.0 * this.AU,
                eccentricity: 0.017,
                inclination: 0,
                argumentOfPeriapsis: 0,
                longitudeOfAscendingNode: 0,
                meanAnomalyAtEpoch: Math.PI,
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                angle: Math.PI,
                period: 365
            },
            {
                name: 'Mars',
                mass: 6.39e23,
                radius: 5,
                color: '#CD5C5C',
                semiMajorAxis: 1.52 * this.AU,
                eccentricity: 0.093,
                inclination: 0,
                argumentOfPeriapsis: 0,
                longitudeOfAscendingNode: 0,
                meanAnomalyAtEpoch: 3 * Math.PI / 2,
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                angle: 3 * Math.PI / 2,
                period: 687
            },
            {
                name: 'Jupiter',
                mass: 1.898e27,
                radius: 12,
                color: '#D8CA9D',
                semiMajorAxis: 2.5 * this.AU,
                eccentricity: 0.048,
                inclination: 0,
                argumentOfPeriapsis: 0,
                longitudeOfAscendingNode: 0,
                meanAnomalyAtEpoch: 0,
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                angle: 0,
                period: 4333
            }
        ];
    }
    
    // Calculate orbital position using Kepler's laws
    calculateOrbitalPosition(planet, time) {
        const a = planet.semiMajorAxis;
        const e = planet.eccentricity;
        const period = planet.period;
        
        // Mean motion (radians per day)
        const n = (2 * Math.PI) / period;
        
        // Mean anomaly
        const M = planet.meanAnomalyAtEpoch + n * time * this.speedMultiplier;
        
        // Solve Kepler's equation for eccentric anomaly (E)
        let E = M;
        for (let i = 0; i < 10; i++) {
            E = M + e * Math.sin(E);
        }
        
        // True anomaly
        const nu = 2 * Math.atan2(
            Math.sqrt(1 + e) * Math.sin(E / 2),
            Math.sqrt(1 - e) * Math.cos(E / 2)
        );
        
        // Distance from focus
        const r = a * (1 - e * Math.cos(E));
        
        // Position in orbital plane
        const x = r * Math.cos(nu);
        const y = r * Math.sin(nu);
        
        // Convert to screen coordinates (centered on star)
        planet.x = this.star.x + x;
        planet.y = this.star.y + y;
        
        // Store angle for reference
        planet.angle = nu;
        
        return { x: planet.x, y: planet.y };
    }
    
    updatePlanets(deltaTime) {
        if (this.isPaused) return;
        
        const time = Date.now() * 0.001 * this.timeScale; // Convert to seconds
        
        this.planets.forEach(planet => {
            const oldPos = { x: planet.x, y: planet.y };
            this.calculateOrbitalPosition(planet, time);
            
            // Store trail points
            if (this.showTrails) {
                if (!this.trails.has(planet.name)) {
                    this.trails.set(planet.name, []);
                }
                const trail = this.trails.get(planet.name);
                trail.push({ x: planet.x, y: planet.y });
                
                // Limit trail length
                if (trail.length > 500) {
                    trail.shift();
                }
            }
        });
    }
    
    draw() {
        // Clear canvas with slight fade for trails
        if (this.showTrails) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            this.ctx.fillRect(0, 0, this.width, this.height);
        } else {
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
        
        // Draw orbital paths (ellipses)
        this.drawOrbitalPaths();
        
        // Draw trails
        if (this.showTrails) {
            this.drawTrails();
        }
        
        // Draw central star
        this.drawStar();
        
        // Draw planets
        this.drawPlanets();
        
        // Draw labels
        this.drawLabels();
    }
    
    drawOrbitalPaths() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        
        this.planets.forEach(planet => {
            const a = planet.semiMajorAxis;
            const e = planet.eccentricity;
            const b = a * Math.sqrt(1 - e * e); // Semi-minor axis
            
            this.ctx.beginPath();
            this.ctx.ellipse(
                this.star.x + a * e, // Center x (offset by focal distance)
                this.star.y,         // Center y
                a,                   // Semi-major axis
                b,                   // Semi-minor axis
                0,                   // Rotation
                0,                   // Start angle
                2 * Math.PI         // End angle
            );
            this.ctx.stroke();
        });
    }
    
    drawTrails() {
        this.trails.forEach((trail, planetName) => {
            if (trail.length < 2) return;
            
            const planet = this.planets.find(p => p.name === planetName);
            this.ctx.strokeStyle = planet.color + '40'; // Semi-transparent
            this.ctx.lineWidth = 2;
            
            this.ctx.beginPath();
            this.ctx.moveTo(trail[0].x, trail[0].y);
            for (let i = 1; i < trail.length; i++) {
                this.ctx.lineTo(trail[i].x, trail[i].y);
            }
            this.ctx.stroke();
        });
    }
    
    drawStar() {
        // Draw star with glow effect
        const gradient = this.ctx.createRadialGradient(
            this.star.x, this.star.y, 0,
            this.star.x, this.star.y, this.star.radius * 2
        );
        gradient.addColorStop(0, this.star.color);
        gradient.addColorStop(0.5, this.star.color + '80');
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.star.x, this.star.y, this.star.radius * 2, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Draw star core
        this.ctx.fillStyle = this.star.color;
        this.ctx.beginPath();
        this.ctx.arc(this.star.x, this.star.y, this.star.radius, 0, 2 * Math.PI);
        this.ctx.fill();
    }
    
    drawPlanets() {
        this.planets.forEach(planet => {
            // Draw planet with slight glow
            const gradient = this.ctx.createRadialGradient(
                planet.x, planet.y, 0,
                planet.x, planet.y, planet.radius * 1.5
            );
            gradient.addColorStop(0, planet.color);
            gradient.addColorStop(1, planet.color + '40');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(planet.x, planet.y, planet.radius * 1.5, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Draw planet core
            this.ctx.fillStyle = planet.color;
            this.ctx.beginPath();
            this.ctx.arc(planet.x, planet.y, planet.radius, 0, 2 * Math.PI);
            this.ctx.fill();
        });
    }
    
    drawLabels() {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        
        // Star label
        this.ctx.fillText('Sun', this.star.x, this.star.y - this.star.radius - 10);
        
        // Planet labels
        this.planets.forEach(planet => {
            this.ctx.fillText(planet.name, planet.x, planet.y - planet.radius - 10);
        });
    }
    
    animate() {
        this.updatePlanets();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
    
    // Control methods
    togglePause() {
        this.isPaused = !this.isPaused;
    }
    
    toggleTrails() {
        this.showTrails = !this.showTrails;
        if (!this.showTrails) {
            this.trails.clear();
        }
    }
    
    reset() {
        this.trails.clear();
        this.planets = this.createPlanets();
    }
    
    changeSpeed(direction) {
        if (direction > 0) {
            this.speedMultiplier = Math.min(this.speedMultiplier * 2, 16);
        } else {
            this.speedMultiplier = Math.max(this.speedMultiplier / 2, 0.125);
        }
        document.getElementById('speedInfo').textContent = `Speed: ${this.speedMultiplier}x`;
    }
}

// Initialize the engine when page loads
let engine;
window.addEventListener('load', () => {
    engine = new OrbitalEngine('canvas');
});

// Control functions
function togglePause() {
    if (engine) engine.togglePause();
}

function toggleTrails() {
    if (engine) engine.toggleTrails();
}

function resetSimulation() {
    if (engine) engine.reset();
}

function changeSpeed(direction) {
    if (engine) engine.changeSpeed(direction);
}
