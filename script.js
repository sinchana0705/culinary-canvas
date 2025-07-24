class CulinaryCanvas {
    constructor() {
        this.recipes = this.loadRecipes();
        this.currentRecipe = null;
        this.editingRecipe = null;
        this.recipeToDelete = null;
        this.filters = {
            search: '',
            cuisine: '',
            subsection: '',
            category: '',
            rating: '',
            status: ''
        };
        this.sortBy = 'date';
        this.init();
    }

    init() {
        this.showSplashScreen();
        this.setupEventListeners();
    }

    showSplashScreen() {
        setTimeout(() => {
            document.getElementById('splashScreen').classList.add('hidden');
            document.getElementById('mainApp').classList.remove('hidden');
            this.displayRecipes();
        }, 5000);
    }

    setupEventListeners() {
        // Filter toggle
        document.getElementById('filterToggle').addEventListener('click', () => {
            const filters = document.getElementById('advancedFilters');
            filters.classList.toggle('hidden');
        });

        // Search functionality - now works with Enter key and real-time
        const searchInput = document.getElementById('searchInput');
        
        // Real-time search as user types
        searchInput.addEventListener('input', (e) => {
            this.filters.search = e.target.value.toLowerCase();
            this.displayRecipes();
        });
        
        // Search on Enter key press
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.filters.search = e.target.value.toLowerCase();
                this.displayRecipes();
            }
        });

        // Filter selects
        ['cuisineFilter', 'subsectionFilter', 'categoryFilter', 'ratingFilter', 'statusFilter'].forEach(filterId => {
            document.getElementById(filterId).addEventListener('change', (e) => {
                const filterType = filterId.replace('Filter', '');
                this.filters[filterType] = e.target.value;
                this.displayRecipes();
            });
        });

        // Sort options
        document.getElementById('sortOptions').addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.displayRecipes();
        });

        // Category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                e.target.closest('.category-btn').classList.add('active');
                this.filters.category = e.target.closest('.category-btn').dataset.category === 'all' ? '' : e.target.closest('.category-btn').dataset.category;
                this.displayRecipes();
            });
        });

        // Add recipe button
        document.getElementById('addRecipeBtn').addEventListener('click', () => {
            this.openAddRecipeModal();
        });

        // Form submissions
        document.getElementById('recipeForm1').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleStep1Submit();
        });

        document.getElementById('recipeForm2').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleStep2Submit();
        });

        // Recipe status change
        document.getElementById('recipeStatus').addEventListener('change', (e) => {
            const ratingSection = document.getElementById('ratingSection');
            if (e.target.value === 'mastered') {
                ratingSection.classList.remove('hidden');
            } else {
                ratingSection.classList.add('hidden');
            }
        });

        // Modal controls
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modalId = e.target.dataset.modal;
                this.closeModal(modalId);
            });
        });

        // Cancel buttons
        document.querySelectorAll('[data-action="cancel"]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });

        // Back button
        document.querySelector('[data-action="back"]').addEventListener('click', () => {
            this.closeModal('addRecipeModal2');
            this.openModal('addRecipeModal1');
        });

        // Save confirmation
        document.getElementById('confirmSave').addEventListener('click', () => {
            this.confirmSaveRecipe();
        });

        document.getElementById('cancelSave').addEventListener('click', () => {
            this.closeModal('saveConfirmModal');
        });

        // Delete confirmation
        document.getElementById('confirmDelete').addEventListener('click', () => {
            this.confirmDeleteRecipe();
        });

        document.getElementById('cancelDelete').addEventListener('click', () => {
            this.closeModal('deleteConfirmModal');
        });

        // File input for images
        document.getElementById('recipePictures').addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });

        // Close modals on backdrop click
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    this.closeModal(e.target.parentElement.id);
                }
            });
        });
    }

    loadRecipes() {
        const stored = localStorage.getItem('culinaryCanvasRecipes');
        return stored ? JSON.parse(stored) : [];
    }

    saveRecipes() {
        localStorage.setItem('culinaryCanvasRecipes', JSON.stringify(this.recipes));
    }

    openAddRecipeModal() {
        this.currentRecipe = {};
        this.editingRecipe = null;
        this.clearForms();
        this.openModal('addRecipeModal1');
    }

    openModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeModal(modalId) {
        if (modalId) {
            document.getElementById(modalId).style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = 'auto';
    }

    clearForms() {
        document.getElementById('recipeForm1').reset();
        document.getElementById('recipeForm2').reset();
        document.getElementById('imagePreview').innerHTML = '';
        document.getElementById('ratingSection').classList.add('hidden');
    }

    handleStep1Submit() {
        const formData = new FormData(document.getElementById('recipeForm1'));
        
        this.currentRecipe = {
            name: document.getElementById('recipeName').value,
            category: document.getElementById('recipeCategory').value,
            cuisine: document.getElementById('recipeCuisine').value,
            subsection: document.getElementById('recipeSubsection').value
        };

        // Update preview
        document.getElementById('previewName').textContent = this.currentRecipe.name;
        document.getElementById('previewCategory').textContent = 
            this.currentRecipe.category === 'veg' ? '🌱 Vegetarian' : '🥩 Non-Vegetarian';
        document.getElementById('previewCategory').className = 
            `category-badge ${this.currentRecipe.category}`;

        this.closeModal('addRecipeModal1');
        this.openModal('addRecipeModal2');
    }

    handleStep2Submit() {
        const status = document.getElementById('recipeStatus').value;
        
        if (status === 'mastered') {
            const rating = document.querySelector('input[name="rating"]:checked');
            if (!rating) {
                this.showMessage('Please provide a rating for mastered recipes.', 'error');
                return;
            }
            this.currentRecipe.rating = parseInt(rating.value);
        }

        // Collect all form data
        this.currentRecipe = {
            ...this.currentRecipe,
            ingredients: document.getElementById('recipeIngredients').value,
            steps: document.getElementById('recipeSteps').value,
            result: document.getElementById('recipeResult').value,
            status: status,
            notes: {
                wentWrong: document.getElementById('noteWentWrong').value,
                toAdd: document.getElementById('noteToAdd').value,
                turnedOut: document.getElementById('noteTurnedOut').value,
                improvement: document.getElementById('noteImprovement').value,
                extra: document.getElementById('noteExtra').value
            },
            images: this.getCurrentImages(),
            dateAdded: this.editingRecipe ? this.editingRecipe.dateAdded : new Date().toISOString(),
            dateModified: new Date().toISOString(),
            id: this.editingRecipe ? this.editingRecipe.id : Date.now().toString()
        };

        if (this.editingRecipe) {
            this.openModal('saveConfirmModal');
        } else {
            this.saveNewRecipe();
        }
    }

    saveNewRecipe() {
        this.recipes.push(this.currentRecipe);
        this.saveRecipes();
        this.displayRecipes();
        this.closeAllModals();
        this.showMessage(`Recipe "${this.currentRecipe.name}" saved successfully! 🎉`, 'success');
    }

    confirmSaveRecipe() {
        const index = this.recipes.findIndex(r => r.id === this.editingRecipe.id);
        if (index !== -1) {
            this.recipes[index] = this.currentRecipe;
            this.saveRecipes();
            this.displayRecipes();
            this.closeAllModals();
            this.showMessage(`Recipe "${this.currentRecipe.name}" updated successfully! ✨`, 'success');
        }
    }

    // Delete recipe functionality
    openDeleteModal(recipeId) {
        const recipe = this.recipes.find(r => r.id === recipeId);
        if (!recipe) return;

        this.recipeToDelete = recipe;
        document.getElementById('deleteRecipeName').textContent = recipe.name;
        this.openModal('deleteConfirmModal');
    }

    confirmDeleteRecipe() {
        if (!this.recipeToDelete) return;

        const index = this.recipes.findIndex(r => r.id === this.recipeToDelete.id);
        if (index !== -1) {
            const recipeName = this.recipeToDelete.name;
            this.recipes.splice(index, 1);
            this.saveRecipes();
            this.displayRecipes();
            this.closeAllModals();
            this.showMessage(`Recipe "${recipeName}" deleted successfully! 🗑️`, 'success');
            this.recipeToDelete = null;
        }
    }

    getCurrentImages() {
        const images = [];
        document.querySelectorAll('#imagePreview img').forEach(img => {
            images.push(img.src);
        });
        return images;
    }

    handleImageUpload(e) {
        const files = e.target.files;
        const preview = document.getElementById('imagePreview');
        
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    }

    displayRecipes() {
        const grid = document.getElementById('recipeGrid');
        const filteredRecipes = this.filterAndSortRecipes();

        if (filteredRecipes.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-utensils"></i>
                    <h3>No recipes found</h3>
                    <p>Try adjusting your search terms or filters, or add your first delicious recipe to get started!</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filteredRecipes.map(recipe => this.createRecipeCard(recipe)).join('');

        // Add click listeners to recipe cards - now opens in new window
        document.querySelectorAll('.recipe-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't open recipe if clicking on action buttons
                if (e.target.closest('.action-btn')) {
                    return;
                }
                const recipeId = e.currentTarget.dataset.recipeId;
                this.openRecipeInNewWindow(recipeId);
            });
        });

        // Add listeners for edit and delete buttons
        document.querySelectorAll('.edit-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const recipeId = e.target.closest('.recipe-card').dataset.recipeId;
                this.editRecipeById(recipeId);
            });
        });

        document.querySelectorAll('.delete-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const recipeId = e.target.closest('.recipe-card').dataset.recipeId;
                this.openDeleteModal(recipeId);
            });
        });
    }

    // Opens recipe in new browser window instead of popup
    openRecipeInNewWindow(recipeId) {
        const recipe = this.recipes.find(r => r.id === recipeId);
        if (!recipe) return;

        // Create complete recipe HTML for new window
        const recipeHTML = this.generateFullRecipeHTML(recipe);
        
        // Open in new window
        const newWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
        newWindow.document.write(recipeHTML);
        newWindow.document.close();
        
        // Add edit functionality to the new window
        newWindow.editRecipe = () => {
            newWindow.close();
            this.editRecipeById(recipeId);
        };

        // Add delete functionality to the new window
        newWindow.deleteRecipe = () => {
            newWindow.close();
            this.openDeleteModal(recipeId);
        };
    }

    generateFullRecipeHTML(recipe) {
        const ratingStars = recipe.rating ? '★'.repeat(recipe.rating) : 'Not rated';
        const dateAdded = new Date(recipe.dateAdded).toLocaleDateString();
        const dateModified = new Date(recipe.dateModified).toLocaleDateString();

        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${recipe.name} - Culinary Canvas</title>
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
            <link href="https://fonts.googleapis.com/css2?family=Georgia:wght@400;700&family=Inter:wght@300;400;500;600&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet">
            <style>
                :root {
                    --primary-white: #ffffff;
                    --soft-pink: #f3ccd1;
                    --primary-pink: #d97a89;
                    --brown: #6b4c3b;
                    --accent-brown: #b57f65;
                    --text-dark: #3b2f2f;
                    --text-gray: #555555;
                    --text-light: #888888;
                    --border-light: #e8e8e8;
                    --shadow-light: rgba(107, 76, 59, 0.1);
                    --gradient-1: linear-gradient(135deg, var(--soft-pink) 0%, var(--primary-pink) 100%);
                    --gradient-3: linear-gradient(135deg, var(--brown) 0%, var(--accent-brown) 100%);
                    --gradient-danger: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%);
                }
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Inter', sans-serif;
                    background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
                    color: var(--text-dark);
                    line-height: 1.6;
                    padding: 20px;
                }
                
                .recipe-container {
                    max-width: 900px;
                    margin: 0 auto;
                    background: var(--primary-white);
                    border-radius: 25px;
                    box-shadow: 0 15px 50px var(--shadow-light);
                    overflow: hidden;
                }
                
                .recipe-header {
                    background: var(--gradient-1);
                    color: white;
                    padding: 4rem 3rem 3rem;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }
                
                .recipe-header::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    right: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
                    animation: rotate 25s linear infinite;
                }
                
                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                .recipe-header h1 {
                    font-family: 'Playfair Display', serif;
                    font-size: 3rem;
                    margin-bottom: 1.5rem;
                    position: relative;
                    z-index: 2;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
                }
                
                .recipe-meta {
                    display: flex;
                    justify-content: center;
                    gap: 2rem;
                    flex-wrap: wrap;
                    margin-top: 1.5rem;
                    position: relative;
                    z-index: 2;
                }
                
                .meta-item {
                    background: rgba(255, 255, 255, 0.2);
                    padding: 0.8rem 1.5rem;
                    border-radius: 25px;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    font-weight: 500;
                }
                
                .recipe-content {
                    padding: 4rem 3rem;
                }
                
                .content-section {
                    margin-bottom: 3.5rem;
                }
                
                .content-section h2 {
                    color: var(--brown);
                    font-size: 1.8rem;
                    margin-bottom: 1.5rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 3px solid var(--soft-pink);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-family: 'Playfair Display', serif;
                }
                
                .content-text {
                    background: linear-gradient(135deg, #fafafa 0%, #f8f8f8 100%);
                    padding: 2rem;
                    border-radius: 15px;
                    border-left: 5px solid var(--primary-pink);
                    white-space: pre-line;
                    line-height: 1.8;
                    font-size: 1.05rem;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                }
                
                .notes-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 1.5rem;
                }
                
                .note-item {
                    background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 50%);
                    padding: 1.5rem;
                    border-radius: 12px;
                    border-left: 4px solid #ffc107;
                    box-shadow: 0 4px 15px rgba(255, 193, 7, 0.1);
                }
                
                .note-item h4 {
                    color: var(--brown);
                    margin-bottom: 0.8rem;
                    font-size: 1rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    font-weight: 700;
                }
                
                .images-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1.5rem;
                    margin-top: 1.5rem;
                }
                
                .images-grid img {
                    width: 100%;
                    height: 200px;
                    object-fit: cover;
                    border-radius: 15px;
                    border: 3px solid var(--border-light);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.1);
                    transition: transform 0.3s ease;
                }
                
                .images-grid img:hover {
                    transform: scale(1.05);
                }
                
                .action-buttons {
                    position: fixed;
                    bottom: 30px;
                    right: 30px;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    z-index: 1000;
                }
                
                .action-btn {
                    padding: 15px 25px;
                    border: none;
                    border-radius: 50px;
                    cursor: pointer;
                    font-weight: 700;
                    box-shadow: 0 6px 20px rgba(0,0,0,0.2);
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: white;
                }
                
                .edit-btn {
                    background: var(--gradient-3);
                }
                
                .delete-btn {
                    background: var(--gradient-danger);
                }
                
                .action-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.3);
                }
                
                .status-badge {
                    padding: 10px 20px;
                    border-radius: 30px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    font-size: 0.9rem;
                }
                
                .status-learning {
                    background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
                    color: #856404;
                }
                
                .status-mastered {
                    background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
                    color: #155724;
                }
                
                .status-to-be-learnt {
                    background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
                    color: #0c5460;
                }
                
                @media (max-width: 768px) {
                    body {
                        padding: 10px;
                    }
                    
                    .recipe-header h1 {
                        font-size: 2.2rem;
                    }
                    
                    .recipe-header {
                        padding: 3rem 2rem 2rem;
                    }
                    
                    .recipe-content {
                        padding: 3rem 2rem;
                    }
                    
                    .recipe-meta {
                        gap: 1rem;
                    }
                    
                    .notes-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .action-buttons {
                        position: relative;
                        bottom: auto;
                        right: auto;
                        flex-direction: row;
                        justify-content: center;
                        margin-top: 2rem;
                    }
                }
            </style>
        </head>
        <body>
            <div class="recipe-container">
                <div class="recipe-header">
                    <h1>${recipe.name}</h1>
                    <div class="recipe-meta">
                        <div class="meta-item">
                            <i class="fas fa-tag"></i> ${recipe.category === 'veg' ? '🌱 Vegetarian' : '🥩 Non-Vegetarian'}
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-globe"></i> ${recipe.cuisine}
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-list"></i> ${recipe.subsection}
                        </div>
                        <div class="meta-item">
                            <span class="status-badge status-${recipe.status.replace(' ', '-')}">${recipe.status}</span>
                        </div>
                        ${recipe.rating ? `
                        <div class="meta-item">
                            <i class="fas fa-star"></i> ${ratingStars}
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="recipe-content">
                    ${recipe.ingredients ? `
                    <div class="content-section">
                        <h2><i class="fas fa-shopping-cart"></i> Ingredients
                    </h2>
                        <div class="content-text">${recipe.ingredients}</div>
                    </div>
                    ` : ''}
                    
                    ${recipe.steps ? `
                    <div class="content-section">
                        <h2><i class="fas fa-list-ol"></i> Cooking Steps</h2>
                        <div class="content-text">${recipe.steps}</div>
                    </div>
                    ` : ''}
                    
                    ${recipe.result ? `
                    <div class="content-section">
                        <h2><i class="fas fa-star"></i> Result & Outcome</h2>
                        <div class="content-text">${recipe.result}</div>
                    </div>
                    ` : ''}
                    
                    ${this.hasNotes(recipe.notes) ? `
                    <div class="content-section">
                        <h2><i class="fas fa-sticky-note"></i> Personal Notes</h2>
                        <div class="notes-grid">
                            ${recipe.notes.wentWrong ? `
                            <div class="note-item">
                                <h4>What went wrong</h4>
                                <p>${recipe.notes.wentWrong}</p>
                            </div>
                            ` : ''}
                            ${recipe.notes.toAdd ? `
                            <div class="note-item">
                                <h4>What has to be added</h4>
                                <p>${recipe.notes.toAdd}</p>
                            </div>
                            ` : ''}
                            ${recipe.notes.turnedOut ? `
                            <div class="note-item">
                                <h4>How did it turn out</h4>
                                <p>${recipe.notes.turnedOut}</p>
                            </div>
                            ` : ''}
                            ${recipe.notes.improvement ? `
                            <div class="note-item">
                                <h4>How to improve in future</h4>
                                <p>${recipe.notes.improvement}</p>
                            </div>
                            ` : ''}
                            ${recipe.notes.extra ? `
                            <div class="note-item">
                                <h4>Additional notes</h4>
                                <p>${recipe.notes.extra}</p>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    ` : ''}
                    
                    ${recipe.images && recipe.images.length > 0 ? `
                    <div class="content-section">
                        <h2><i class="fas fa-camera"></i> Recipe Images</h2>
                        <div class="images-grid">
                            ${recipe.images.map(img => `<img src="${img}" alt="Recipe image">`).join('')}
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="content-section">
                        <h2><i class="fas fa-calendar"></i> Recipe Timeline</h2>
                        <div class="content-text">
                            <strong>Added:</strong> ${dateAdded}<br>
                            <strong>Last Modified:</strong> ${dateModified}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="action-buttons">
                <button class="action-btn edit-btn" onclick="editRecipe()">
                    <i class="fas fa-edit"></i> Edit Recipe
                </button>
                <button class="action-btn delete-btn" onclick="deleteRecipe()">
                    <i class="fas fa-trash"></i> Delete Recipe
                </button>
            </div>
        </body>
        </html>
        `;
    }

    hasNotes(notes) {
        if (!notes) return false;
        return Object.values(notes).some(note => note && note.trim());
    }

    editRecipeById(recipeId) {
        const recipe = this.recipes.find(r => r.id === recipeId);
        if (!recipe) return;
        
        this.editingRecipe = recipe;
        this.currentRecipe = recipe;
        
        // Populate forms with current data
        document.getElementById('recipeName').value = recipe.name;
        document.getElementById('recipeCategory').value = recipe.category;
        document.getElementById('recipeCuisine').value = recipe.cuisine;
        document.getElementById('recipeSubsection').value = recipe.subsection;
        
        // Update preview
        document.getElementById('previewName').textContent = recipe.name;
        document.getElementById('previewCategory').textContent = 
            recipe.category === 'veg' ? '🌱 Vegetarian' : '🥩 Non-Vegetarian';
        
        document.getElementById('recipeIngredients').value = recipe.ingredients;
        document.getElementById('recipeSteps').value = recipe.steps;
        document.getElementById('recipeResult').value = recipe.result || '';
        document.getElementById('recipeStatus').value = recipe.status;
        
        // Populate notes
        if (recipe.notes) {
            document.getElementById('noteWentWrong').value = recipe.notes.wentWrong || '';
            document.getElementById('noteToAdd').value = recipe.notes.toAdd || '';
            document.getElementById('noteTurnedOut').value = recipe.notes.turnedOut || '';
            document.getElementById('noteImprovement').value = recipe.notes.improvement || '';
            document.getElementById('noteExtra').value = recipe.notes.extra || '';
        }
        
        // Handle rating
        if (recipe.status === 'mastered') {
            document.getElementById('ratingSection').classList.remove('hidden');
            if (recipe.rating) {
                document.querySelector(`input[name="rating"][value="${recipe.rating}"]`).checked = true;
            }
        }
        
        // Show images
        if (recipe.images) {
            const preview = document.getElementById('imagePreview');
            preview.innerHTML = recipe.images.map(img => 
                `<img src="${img}" alt="Recipe image">`
            ).join('');
        }
        
        this.openModal('addRecipeModal2');
    }

    filterAndSortRecipes() {
        let filtered = this.recipes.filter(recipe => {
            const matchesSearch = !this.filters.search || 
                recipe.name.toLowerCase().includes(this.filters.search) ||
                recipe.ingredients.toLowerCase().includes(this.filters.search) ||
                recipe.cuisine.toLowerCase().includes(this.filters.search) ||
                (recipe.notes && Object.values(recipe.notes).some(note => 
                    note.toLowerCase().includes(this.filters.search)));
            
            const matchesCuisine = !this.filters.cuisine || 
                recipe.cuisine.toLowerCase() === this.filters.cuisine.toLowerCase();
            
            const matchesSubsection = !this.filters.subsection || 
                recipe.subsection === this.filters.subsection;
            
            const matchesCategory = !this.filters.category || 
                recipe.category === this.filters.category;
            
            const matchesRating = !this.filters.rating || 
                (recipe.rating && recipe.rating >= parseInt(this.filters.rating));
            
            const matchesStatus = !this.filters.status || 
                recipe.status === this.filters.status;

            return matchesSearch && matchesCuisine && matchesSubsection && 
                   matchesCategory && matchesRating && matchesStatus;
        });

        // Sort recipes
        filtered.sort((a, b) => {
            switch (this.sortBy) {
                case 'alphabetical':
                    return a.name.localeCompare(b.name);
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                case 'date':
                default:
                    return new Date(b.dateModified) - new Date(a.dateModified);
            }
        });

        return filtered;
    }

    createRecipeCard(recipe) {
        const ratingStars = recipe.rating ? '★'.repeat(recipe.rating) : '';
        
        return `
            <div class="recipe-card" data-recipe-id="${recipe.id}">
                <div class="recipe-card-name">${recipe.name}</div>
                <div class="recipe-card-meta">
                    <span class="recipe-status status-${recipe.status.replace(' ', '-')}">${recipe.status}</span>
                    <span class="recipe-rating">${ratingStars || 'No rating'}</span>
                </div>
                <div class="recipe-card-actions">
                    <button class="action-btn edit-action" title="Edit Recipe">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-action" title="Delete Recipe">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    showMessage(text, type) {
        // Enhanced toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
            <span>${text}</span>
        `;
        toast.style.cssText = `
            position: fixed;
            top: 30px;
            right: 30px;
            background: ${type === 'success' ? 'linear-gradient(135deg, #28a745, #20c997)' : 'linear-gradient(135deg, #dc3545, #e74c3c)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 500;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize the app
const app = new CulinaryCanvas();

// Add CSS for enhanced toast notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
