// Cake Tower Game - Main Script
document.addEventListener('DOMContentLoaded', () => {
    // Canvas setup
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const tapButton = document.getElementById('tapButton');
    const scoreDisplay = document.getElementById('score');

    // Game variables
    let score = 0;
    let gameOver = false;
    let animationId;
    let direction = 1; // 1 for right, -1 for left
    let speed = 2; // Speed of block movement
    let blockHeight = 30; // Height of each cake layer
    let currentStackHeight = 0; // Current height of the stack
    let gameStarted = false;

    // Cake flavors with gradients
    const cakeFlavors = [
        { 
            name: 'strawberry', 
            mainColor: '#FF9AA2',
            gradientColor: '#FF5A67',
            frostingColor: '#FFFFFF',
            dotColor: '#FF0033'
        },
        { 
            name: 'blueberry', 
            mainColor: '#A0C4FF',
            gradientColor: '#4A86E8',
            frostingColor: '#E6F0FF',
            dotColor: '#0047AB'
        },
        { 
            name: 'lemon', 
            mainColor: '#FDFFB6',
            gradientColor: '#FFEE58',
            frostingColor: '#FFFDE7',
            dotColor: '#FFD700'
        },
        { 
            name: 'matcha', 
            mainColor: '#CAFFBF',
            gradientColor: '#66BB6A',
            frostingColor: '#F1F8E9',
            dotColor: '#2E7D32'
        },
        { 
            name: 'chocolate', 
            mainColor: '#A68064',
            gradientColor: '#6D4C41',
            frostingColor: '#D7CCC8',
            dotColor: '#3E2723'
        },
        { 
            name: 'watermelon', 
            mainColor: '#FFB7D5',
            gradientColor: '#FF4081',
            frostingColor: '#FCE4EC',
            dotColor: '#2E7D32'
        },
        { 
            name: 'vanilla', 
            mainColor: '#FFF5E1',
            gradientColor: '#FFE0B2',
            frostingColor: '#FFFFFF',
            dotColor: '#FFD54F'
        }
    ];

    // Block class
    class Block {
        constructor(y, width, height, isBase = false) {
            this.width = width;
            this.height = height;
            this.y = y;
            
            if (isBase) {
                // Base block is centered
                this.x = canvas.width / 2 - width / 2;
                this.isBase = true;
                // Base is wooden plate
                this.basePlate = true;
            } else {
                // Moving blocks start from left or right edge
                this.x = direction > 0 ? -width : canvas.width;
                // Randomly select a cake flavor
                this.flavor = cakeFlavors[Math.floor(Math.random() * cakeFlavors.length)];
                this.isBase = false;
            }
            
            this.moving = !isBase;
        }

        draw() {
            if (this.isBase && this.basePlate) {
                // Draw wooden base plate with more detail
                const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
                gradient.addColorStop(0, '#8B4513');
                gradient.addColorStop(0.5, '#A0522D');
                gradient.addColorStop(1, '#8B4513');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                
                // Add wood grain effect
                ctx.strokeStyle = '#6B3E26';
                ctx.lineWidth = 0.5;
                for (let i = 0; i < this.width; i += 10) {
                    ctx.beginPath();
                    ctx.moveTo(this.x + i, this.y);
                    ctx.lineTo(this.x + i, this.y + this.height);
                    ctx.stroke();
                }
            } else if (!this.isBase) {
                // Draw cake layer with gradient representing flavor
                const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
                gradient.addColorStop(0, this.flavor.mainColor);
                gradient.addColorStop(1, this.flavor.gradientColor);
                
                ctx.fillStyle = gradient;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                
                // Draw frosting on top (white layer with slight transparency)
                ctx.fillStyle = this.flavor.frostingColor;
                ctx.globalAlpha = 0.85;
                ctx.fillRect(this.x, this.y, this.width, 3);
                ctx.globalAlpha = 1.0;
                
                // Draw decorative dots with flavor-specific color
                const dotsCount = Math.floor(this.width / 20);
                ctx.fillStyle = this.flavor.dotColor;
                
                for (let i = 0; i < dotsCount; i++) {
                    ctx.beginPath();
                    ctx.arc(this.x + 10 + (i * 20), this.y + this.height/2, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Add a subtle border around the cake layer
                ctx.strokeStyle = this.flavor.gradientColor;
                ctx.lineWidth = 0.5;
                ctx.strokeRect(this.x, this.y, this.width, this.height);
            }
        }

        update() {
            if (this.moving) {
                this.x += speed * direction;
                
                // Change direction when hitting screen edges
                if (this.x + this.width > canvas.width) {
                    direction = -1;
                } else if (this.x < 0) {
                    direction = 1;
                }
            }
        }
    }
    
    // Class for falling cake pieces (overhang pieces that fall down)
    class FallingPiece {
        constructor(x, y, width, height, flavor) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.flavor = flavor;
            
            // Physics properties for falling
            this.velocityY = 1 + Math.random() * 2; // Random initial falling speed
            this.velocityX = (Math.random() - 0.5) * 3; // Small random X movement
            this.rotation = 0;
            this.rotationSpeed = (Math.random() - 0.5) * 0.2; // Random rotation speed
            this.gravity = 0.2 + Math.random() * 0.1; // Acceleration
        }
        
        update() {
            // Apply gravity
            this.velocityY += this.gravity;
            
            // Update position
            this.y += this.velocityY;
            this.x += this.velocityX;
            
            // Update rotation
            this.rotation += this.rotationSpeed;
            
            // Return false if piece is off-screen (for removal)
            return this.y < canvas.height + 100;
        }
        
        draw() {
            // Save the current context state
            ctx.save();
            
            // Translate to the center of the piece for rotation
            ctx.translate(this.x + this.width/2, this.y + this.height/2);
            ctx.rotate(this.rotation);
            
            // Draw the cake piece with gradient
            const gradient = ctx.createLinearGradient(-this.width/2, -this.height/2, -this.width/2, this.height/2);
            gradient.addColorStop(0, this.flavor.mainColor);
            gradient.addColorStop(1, this.flavor.gradientColor);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
            
            // Draw frosting on top
            ctx.fillStyle = this.flavor.frostingColor;
            ctx.globalAlpha = 0.85;
            ctx.fillRect(-this.width/2, -this.height/2, this.width, 3);
            ctx.globalAlpha = 1.0;
            
            // Draw decorative dot if the piece is big enough
            if (this.width > 15) {
                ctx.fillStyle = this.flavor.dotColor;
                ctx.beginPath();
                ctx.arc(0, 0, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Restore the context state
            ctx.restore();
        }
    }

    // Arrays to store blocks and falling pieces
    const blocks = [];
    const fallingPieces = [];

    // Function to resize the canvas
    function resizeCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        // Recalculate positions when canvas is resized
        if (blocks.length > 0) {
            redrawBlocks();
        } else {
            initGame();
        }
    }

    // Initialize the game
    function initGame() {
        // Reset game variables
        blocks.length = 0;
        fallingPieces.length = 0;
        score = 0;
        scoreDisplay.textContent = score;
        gameOver = false;
        currentStackHeight = 0;
        gameStarted = false;
        
        // Create base platform
        const baseHeight = blockHeight;
        const baseWidth = canvas.width * 0.4;
        const baseY = canvas.height - baseHeight;
        
        const baseBlock = new Block(baseY, baseWidth, baseHeight, true);
        blocks.push(baseBlock);
        
        // Create first moving block
        currentStackHeight = baseHeight;
        createNewBlock();
        
        // Start animation
        animate();
    }

    // Function to create a new moving block
    function createNewBlock() {
        const prevBlock = blocks[blocks.length - 1];
        const newY = canvas.height - currentStackHeight - blockHeight;
        const newBlock = new Block(newY, prevBlock.width, blockHeight);
        blocks.push(newBlock);
    }

    // Handle block placement
    function placeBlock() {
        if (gameOver || !gameStarted) {
            gameStarted = true;
            return;
        }
        
        const currentBlock = blocks[blocks.length - 1];
        const prevBlock = blocks[blocks.length - 2];
        
        currentBlock.moving = false;
        
        // Calculate overlap
        let overlap = true;
        let newWidth = currentBlock.width;
        let offset = 0;
        
        // Block is completely off the stack
        if (currentBlock.x + currentBlock.width < prevBlock.x || 
            currentBlock.x > prevBlock.x + prevBlock.width) {
            gameOver = true;
            tapButton.textContent = "GAME OVER - TAP TO RESTART";
            return;
        }
        
        // Calculate new width and position based on overlap
        if (currentBlock.x < prevBlock.x) {
            const overhang = prevBlock.x - currentBlock.x;
            
            // Create falling piece for left overhang
            const fallingPiece = new FallingPiece(
                currentBlock.x,
                currentBlock.y,
                overhang,
                blockHeight,
                currentBlock.flavor
            );
            fallingPieces.push(fallingPiece);
            
            // Update block dimensions
            newWidth = currentBlock.width - overhang;
            offset = overhang;
        } 
        
        if (currentBlock.x + currentBlock.width > prevBlock.x + prevBlock.width) {
            const rightOverhangWidth = currentBlock.x + currentBlock.width - (prevBlock.x + prevBlock.width);
            const rightOverhangX = prevBlock.x + prevBlock.width;
            
            // Create falling piece for right overhang
            const fallingPiece = new FallingPiece(
                rightOverhangX,
                currentBlock.y,
                rightOverhangWidth,
                blockHeight,
                currentBlock.flavor
            );
            fallingPieces.push(fallingPiece);
            
            // Update block dimensions if not already updated (could have both left and right overhangs)
            if (offset === 0) {
                newWidth = prevBlock.x + prevBlock.width - currentBlock.x;
            } else {
                // We already had a left overhang, adjust width accordingly
                newWidth = prevBlock.width;
            }
        }
        
        // Update block dimensions
        currentBlock.width = newWidth;
        currentBlock.x += offset;
        
        // Update score
        score++;
        scoreDisplay.textContent = score;
        
        // Increase height and create new block
        currentStackHeight += blockHeight;
        
        // Scroll view if stack gets too high
        if (currentStackHeight > canvas.height * 0.6) {
            scrollBlocks();
        } else {
            createNewBlock();
        }
        
        // Increase difficulty
        if (score % 5 === 0 && speed < 5) {
            speed += 0.5;
        }
    }

    // Scroll blocks down when tower gets too high
    function scrollBlocks() {
        const scrollAmount = blockHeight;
        blocks.forEach(block => {
            block.y += scrollAmount;
        });
        currentStackHeight -= scrollAmount;
        createNewBlock();
    }

    // Redraw all blocks (used after resize)
    function redrawBlocks() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        blocks.forEach(block => block.draw());
    }

    // Animation loop
    function animate() {
        animationId = requestAnimationFrame(animate);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw and update all blocks
        blocks.forEach(block => {
            block.draw();
            block.update();
        });
        
        // Update falling pieces and remove ones that are off screen
        for (let i = fallingPieces.length - 1; i >= 0; i--) {
            fallingPieces[i].draw();
            const stillVisible = fallingPieces[i].update();
            
            if (!stillVisible) {
                fallingPieces.splice(i, 1);
            }
        }
        
        if (gameOver) {
            cancelAnimationFrame(animationId);
        }
    }

    // Event listeners
    tapButton.addEventListener('click', placeBlock);
    window.addEventListener('resize', resizeCanvas);
    
    // Touch events for mobile
    document.addEventListener('touchstart', function(e) {
        if (e.target === canvas || e.target === tapButton) {
            e.preventDefault();
            placeBlock();
        }
    }, {passive: false});
    
    // Also allow spacebar to place blocks
    document.addEventListener('keydown', function(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            placeBlock();
        }
    });
    
    // Initialize the game on load
    resizeCanvas();
});