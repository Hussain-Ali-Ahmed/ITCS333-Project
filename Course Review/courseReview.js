/**
 * Course Review Application
 * Main controller for the course review functionality
 */
class CourseReviewApp {
    constructor() {
        // Configuration - REPLACE WITH YOUR ACTUAL API ENDPOINT
        this.config = {
            apiUrl: 'https://github.com/Hussain-Ali-Ahmed/demo/edit/Hussain-Ali-Ahmed-patch-1/db.json',
            endpoints: {
                courses: '/courses',
                reviews: '/reviews'
            }
        };

        // DOM Elements
        this.elements = {
            coursesContainer: document.getElementById('coursesContainer'),
            loadingState: document.getElementById('loadingState'),
            errorState: document.getElementById('errorState'),
            retryButton: document.getElementById('retryButton'),
            searchInput: document.getElementById('searchInput'),
            searchButton: document.getElementById('searchButton'),
            departmentFilter: document.getElementById('departmentFilter'),
            sortBy: document.getElementById('sortBy'),
            reviewForm: document.getElementById('reviewForm')
        };

        // Application state
        this.state = {
            courses: [],
            filteredCourses: [],
            isLoading: false,
            error: null,
            filters: {
                searchQuery: '',
                department: 'all',
                sortBy: 'newest'
            }
        };

        // Initialize the application
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.loadCourses();
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Search and filter controls
        this.elements.searchButton.addEventListener('click', () => this.handleSearch());
        this.elements.searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        this.elements.departmentFilter.addEventListener('change', (e) => {
            this.state.filters.department = e.target.value;
            this.applyFilters();
        });
        this.elements.sortBy.addEventListener('change', (e) => {
            this.state.filters.sortBy = e.target.value;
            this.applyFilters();
        });

        // Error handling
        this.elements.retryButton.addEventListener('click', () => this.loadCourses());

        // Form submission
        if (this.elements.reviewForm) {
            this.elements.reviewForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }
    }

    /**
     * Load courses from API
     */
    async loadCourses() {
        try {
            this.setLoadingState(true);
            this.state.error = null;

            const response = await fetch(`${this.config.apiUrl}${this.config.endpoints.courses}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.state.courses = await response.json();
            this.applyFilters();
            
        } catch (error) {
            console.error('Failed to load courses:', error);
            this.state.error = error;
            this.showErrorState();
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Handle search functionality
     */
    handleSearch() {
        this.state.filters.searchQuery = this.elements.searchInput.value.trim().toLowerCase();
        this.applyFilters();
    }

    /**
     * Apply all active filters and sorting
     */
    applyFilters() {
        // Start with all courses
        let filteredCourses = [...this.state.courses];

        // Apply department filter
        if (this.state.filters.department !== 'all') {
            filteredCourses = filteredCourses.filter(course => 
                course.department.toLowerCase() === this.state.filters.department.toLowerCase()
            );
        }

        // Apply search filter
        if (this.state.filters.searchQuery) {
            filteredCourses = filteredCourses.filter(course => 
                course.name.toLowerCase().includes(this.state.filters.searchQuery) || 
                course.code.toLowerCase().includes(this.state.filters.searchQuery) ||
                course.instructor.toLowerCase().includes(this.state.filters.searchQuery)
            );
        }

        // Apply sorting
        switch(this.state.filters.sortBy) {
            case 'highest':
                filteredCourses.sort((a, b) => b.rating - a.rating);
                break;
            case 'lowest':
                filteredCourses.sort((a, b) => a.rating - b.rating);
                break;
            case 'newest':
            default:
                filteredCourses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
        }

        this.state.filteredCourses = filteredCourses;
        this.renderCourses();
    }

    /**
     * Render courses to the DOM
     */
    renderCourses() {
        // Clear previous results
        this.elements.coursesContainer.innerHTML = '';

        // Show message if no courses found
        if (this.state.filteredCourses.length === 0) {
            this.elements.coursesContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info">No courses found matching your criteria.</div>
                </div>
            `;
            return;
        }

        // Render each course card
        this.state.filteredCourses.forEach(course => {
            const courseElement = document.createElement('div');
            courseElement.className = 'col-md-6 col-lg-4 mb-3';
            courseElement.innerHTML = this.generateCourseCardHTML(course);
            this.elements.coursesContainer.appendChild(courseElement);
        });
    }

    /**
     * Generate HTML for a course card
     */
    generateCourseCardHTML(course) {
        return `
            <div class="card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between">
                        <h3 class="card-title h5">${course.name}</h3>
                        <span class="badge bg-primary">${course.code}</span>
                    </div>
                    <p class="text-muted">Instructor: ${course.instructor}</p>
                    <div class="mb-2">
                        <div class="stars">
                            ${this.renderStars(course.rating)}
                        </div>
                        <small class="text-muted">${course.rating.toFixed(1)}/5.0 (${course.reviewCount || 0} reviews)</small>
                    </div>
                    ${course.difficulty ? `
                    <div class="mb-2">
                        <span class="badge badge-difficulty ${this.getDifficultyClass(course.difficulty)}">
                            ${this.getDifficultyText(course.difficulty)}
                        </span>
                    </div>` : ''}
                    <p class="card-text">${course.description}</p>
                    <button class="btn btn-sm btn-outline-primary view-details" data-course-id="${course.id}">
                        View Details
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Handle form submission
     */
    async handleFormSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(this.elements.reviewForm);
        const reviewData = {
            courseName: formData.get('courseName'),
            courseCode: formData.get('courseCode'),
            instructor: formData.get('professor'),
            department: formData.get('department'),
            rating: parseInt(formData.get('rating')),
            reviewTitle: formData.get('reviewTitle'),
            reviewText: formData.get('reviewText'),
            difficulty: formData.get('difficulty'),
            createdAt: new Date().toISOString()
        };

        // Basic validation
        if (!this.validateReviewData(reviewData)) {
            return;
        }

        try {
            this.setLoadingState(true);
            
            // In a real app, you would send this to your API
            // const response = await fetch(`${this.config.apiUrl}${this.config.endpoints.reviews}`, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(reviewData)
            // });
            
            // For demo purposes, we'll just add it to the local state
            this.state.courses.unshift({
                ...reviewData,
                id: `temp-${Date.now()}`,
                name: reviewData.courseName,
                code: reviewData.courseCode,
                description: reviewData.reviewText,
                reviewCount: 1
            });

            // Reset form and refresh view
            this.elements.reviewForm.reset();
            this.applyFilters();
            
            // Show success message
            this.showToast('Review submitted successfully!');
            
        } catch (error) {
            console.error('Failed to submit review:', error);
            this.showToast('Failed to submit review. Please try again.', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Validate review data before submission
     */
    validateReviewData(data) {
        // Add your validation logic here
        if (!data.courseName || !data.courseCode || !data.rating) {
            this.showToast('Please fill in all required fields', 'error');
            return false;
        }
        return true;
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'success') {
        // In a real app, you would use a proper toast library
        alert(`${type.toUpperCase()}: ${message}`);
    }

    /**
     * Set loading state
     */
    setLoadingState(isLoading) {
        this.state.isLoading = isLoading;
        if (isLoading) {
            this.elements.loadingState.classList.remove('d-none');
            this.elements.errorState.classList.add('d-none');
        } else {
            this.elements.loadingState.classList.add('d-none');
        }
    }

    /**
     * Show error state
     */
    showErrorState() {
        this.elements.errorState.classList.remove('d-none');
    }

    /**
     * Render star rating HTML
     */
    renderStars(rating) {
        let stars = '';
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                stars += '<span class="star filled">★</span>';
            } else if (i === fullStars + 1 && hasHalfStar) {
                stars += '<span class="star half-filled">★</span>';
            } else {
                stars += '<span class="star">★</span>';
            }
        }
        
        return stars;
    }

    /**
     * Get difficulty class for styling
     */
    getDifficultyClass(difficulty) {
        const classes = {
            'very_easy': 'badge-very-easy',
            'easy': 'badge-easy',
            'moderate': 'badge-moderate',
            'difficult': 'badge-difficult',
            'very_difficult': 'badge-very-difficult'
        };
        return classes[difficulty] || '';
    }

    /**
     * Get difficulty text for display
     */
    getDifficultyText(difficulty) {
        const texts = {
            'very_easy': 'Very Easy',
            'easy': 'Easy',
            'moderate': 'Moderate',
            'difficult': 'Hard',
            'very_difficult': 'Very Hard'
        };
        return texts[difficulty] || '';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CourseReviewApp();
});
class CourseReviewApp {
    constructor() {
        this.config = {
            apiUrl: 'https://65f5ee0c41d90c1c5e0a66da.mockapi.io/api/v1/courses',
            itemsPerPage: 6
        };

        this.elements = {
            // Existing elements
            coursesContainer: document.getElementById('coursesContainer'),
            loadingState: document.getElementById('loadingState'),
            errorState: document.getElementById('errorState'),
            retryButton: document.getElementById('retryButton'),
            searchInput: document.getElementById('searchInput'),
            searchButton: document.getElementById('searchButton'),
            departmentFilter: document.getElementById('departmentFilter'),
            sortBy: document.getElementById('sortBy'),
            reviewForm: document.getElementById('reviewForm'),
            
            // New elements for pagination
            paginationContainer: document.createElement('div'),
            
            // New elements for detail view
            courseModal: this.createModalElement(),
            modalTitle: null,
            modalBody: null
        };

        this.state = {
            courses: [],
            filteredCourses: [],
            currentPage: 1,
            isLoading: false,
            error: null,
            filters: {
                searchQuery: '',
                department: 'all',
                sortBy: 'newest'
            }
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupPagination();
        this.loadCourses();
        document.body.appendChild(this.elements.courseModal);
    }

    setupEventListeners() {
        // Existing event listeners
        this.elements.searchButton.addEventListener('click', () => this.handleSearch());
        this.elements.searchInput.addEventListener('input', () => this.handleSearch());
        this.elements.departmentFilter.addEventListener('change', (e) => {
            this.state.filters.department = e.target.value;
            this.applyFilters();
        });
        this.elements.sortBy.addEventListener('change', (e) => {
            this.state.filters.sortBy = e.target.value;
            this.applyFilters();
        });
        this.elements.retryButton.addEventListener('click', () => this.loadCourses());

        // Form validation on input
        if (this.elements.reviewForm) {
            this.elements.reviewForm.addEventListener('input', (e) => {
                this.validateField(e.target);
            });
            
            this.elements.reviewForm.addEventListener('submit', (e) => {
                if (!this.validateForm()) {
                    e.preventDefault();
                }
            });
        }
    }

    setupPagination() {
        this.elements.paginationContainer.className = 'pagination-container mt-4 d-flex justify-content-center';
        document.querySelector('main').appendChild(this.elements.paginationContainer);
    }

    createModalElement() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'courseModal';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="modalTitle"></h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="modalBody"></div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        `;
        this.elements.modalTitle = modal.querySelector('#modalTitle');
        this.elements.modalBody = modal.querySelector('#modalBody');
        return modal;
    }

    async loadCourses() {
        try {
            this.setLoadingState(true);
            this.state.error = null;

            const response = await fetch(this.config.apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.state.courses = await response.json();
            this.state.currentPage = 1;
            this.applyFilters();
            
        } catch (error) {
            console.error('Failed to load courses:', error);
            this.state.error = error;
            this.showErrorState();
        } finally {
            this.setLoadingState(false);
        }
    }

    handleSearch() {
        this.state.filters.searchQuery = this.elements.searchInput.value.trim().toLowerCase();
        this.state.currentPage = 1;
        this.applyFilters();
    }

    applyFilters() {
        let filteredCourses = [...this.state.courses];

        // Apply department filter
        if (this.state.filters.department !== 'all') {
            filteredCourses = filteredCourses.filter(course => 
                course.department.toLowerCase() === this.state.filters.department.toLowerCase()
            );
        }

        // Apply search filter
        if (this.state.filters.searchQuery) {
            filteredCourses = filteredCourses.filter(course => 
                course.name.toLowerCase().includes(this.state.filters.searchQuery) || 
                course.code.toLowerCase().includes(this.state.filters.searchQuery) ||
                course.instructor.toLowerCase().includes(this.state.filters.searchQuery)
            );
        }

        // Apply sorting
        switch(this.state.filters.sortBy) {
            case 'highest':
                filteredCourses.sort((a, b) => b.rating - a.rating);
                break;
            case 'lowest':
                filteredCourses.sort((a, b) => a.rating - b.rating);
                break;
            case 'newest':
            default:
                filteredCourses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
        }

        this.state.filteredCourses = filteredCourses;
        this.renderCourses();
        this.renderPagination();
    }

    renderCourses() {
        this.elements.coursesContainer.innerHTML = '';

        if (this.state.filteredCourses.length === 0) {
            this.elements.coursesContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info">No courses found matching your criteria.</div>
                </div>
            `;
            return;
        }

        // Calculate paginated courses
        const startIndex = (this.state.currentPage - 1) * this.config.itemsPerPage;
        const paginatedCourses = this.state.filteredCourses.slice(
            startIndex, 
            startIndex + this.config.itemsPerPage
        );

        paginatedCourses.forEach(course => {
            const courseElement = document.createElement('div');
            courseElement.className = 'col-md-6 col-lg-4 mb-3';
            courseElement.innerHTML = this.generateCourseCardHTML(course);
            this.elements.coursesContainer.appendChild(courseElement);
            
            // Add click event for detail view
            courseElement.querySelector('.view-details').addEventListener('click', () => {
                this.showCourseDetails(course);
            });
        });
    }

    renderPagination() {
        this.elements.paginationContainer.innerHTML = '';
        
        const totalPages = Math.ceil(this.state.filteredCourses.length / this.config.itemsPerPage);
        if (totalPages <= 1) return;

        const pagination = document.createElement('ul');
        pagination.className = 'pagination';

        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${this.state.currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<a class="page-link" href="#">&laquo;</a>`;
        prevLi.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.state.currentPage > 1) {
                this.state.currentPage--;
                this.renderCourses();
                this.renderPagination();
            }
        });
        pagination.appendChild(prevLi);

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            const pageLi = document.createElement('li');
            pageLi.className = `page-item ${i === this.state.currentPage ? 'active' : ''}`;
            pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            pageLi.addEventListener('click', (e) => {
                e.preventDefault();
                this.state.currentPage = i;
                this.renderCourses();
                this.renderPagination();
            });
            pagination.appendChild(pageLi);
        }

        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${this.state.currentPage === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `<a class="page-link" href="#">&raquo;</a>`;
        nextLi.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.state.currentPage < totalPages) {
                this.state.currentPage++;
                this.renderCourses();
                this.renderPagination();
            }
        });
        pagination.appendChild(nextLi);

        this.elements.paginationContainer.appendChild(pagination);
    }

    showCourseDetails(course) {
        this.elements.modalTitle.textContent = `${course.code} - ${course.name}`;
        
        this.elements.modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <p><strong>Instructor:</strong> ${course.instructor}</p>
                    <p><strong>Department:</strong> ${course.department}</p>
                    <div class="mb-3">
                        <strong>Rating:</strong>
                        <div class="stars large-stars">
                            ${this.renderStars(course.rating)}
                        </div>
                        <span>${course.rating.toFixed(1)}/5.0 (${course.reviewCount || 0} reviews)</span>
                    </div>
                    ${course.difficulty ? `
                    <p><strong>Difficulty:</strong>
                        <span class="badge ${this.getDifficultyClass(course.difficulty)}">
                            ${this.getDifficultyText(course.difficulty)}
                        </span>
                    </p>` : ''}
                </div>
                <div class="col-md-6">
                    <h5>Course Description</h5>
                    <p>${course.description}</p>
                    
                    <h5 class="mt-4">Recent Reviews</h5>
                    ${this.generateRecentReviewsHTML(course.reviews || [])}
                </div>
            </div>
        `;

        // Initialize Bootstrap modal
        const modal = new bootstrap.Modal(this.elements.courseModal);
        modal.show();
    }

    generateRecentReviewsHTML(reviews) {
        if (reviews.length === 0) {
            return '<p>No reviews yet. Be the first to review!</p>';
        }

        return `
            <div class="list-group">
                ${reviews.slice(0, 3).map(review => `
                    <div class="list-group-item">
                        <div class="d-flex justify-content-between">
                            <strong>${review.title}</strong>
                            <small class="text-muted">${new Date(review.date).toLocaleDateString()}</small>
                        </div>
                        <div class="stars">
                            ${this.renderStars(review.rating)}
                        </div>
                        <p class="mb-1">${review.text}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }

    validateField(field) {
        const errorElement = field.nextElementSibling;
        
        if (field.validity.valid) {
            field.classList.remove('is-invalid');
            if (errorElement) errorElement.remove();
            return true;
        }

        field.classList.add('is-invalid');
        
        if (!errorElement || !errorElement.classList.contains('invalid-feedback')) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'invalid-feedback';
            field.parentNode.insertBefore(errorDiv, field.nextSibling);
        }

        let message = '';
        if (field.validity.valueMissing) {
            message = 'This field is required';
        } else if (field.validity.typeMismatch) {
            message = 'Please enter a valid value';
        } else if (field.validity.tooShort) {
            message = `Should be at least ${field.minLength} characters`;
        }

        field.nextElementSibling.textContent = message;
        return false;
    }

    validateForm() {
        let isValid = true;
        const requiredFields = this.elements.reviewForm.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        // Custom rating validation
        const ratingSelected = this.elements.reviewForm.querySelector('[name="rating"]:checked');
        if (!ratingSelected) {
            const ratingContainer = this.elements.reviewForm.querySelector('.rating-input');
            if (!ratingContainer.querySelector('.invalid-feedback')) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'invalid-feedback';
                errorDiv.textContent = 'Please select a rating';
                ratingContainer.appendChild(errorDiv);
            }
            isValid = false;
        } else {
            const errorDiv = ratingContainer.querySelector('.invalid-feedback');
            if (errorDiv) errorDiv.remove();
        }

        return isValid;
    }

    // ... (keep all existing helper methods like renderStars, getDifficultyClass, etc.)
}

document.addEventListener('DOMContentLoaded', () => {
    new CourseReviewApp();
});