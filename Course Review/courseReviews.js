/* courseReviews.js - JavaScript for Course Review System */
/* Hussain Ali Ahmed Ali, 202208704 */
const courseListingSection = document.getElementById('course-listing');
const searchInput = document.querySelector('#course-listing input[type="text"]');
const searchButton = document.querySelector('#course-listing .btn-primary');
const departmentFilter = document.querySelector('#course-listing select:first-of-type');
const sortFilter = document.querySelector('#course-listing select:last-of-type');
const reviewForm = document.querySelector('#add-review form');

let courses = [];
let filteredCourses = [];
let currentPage = 1;
const coursesPerPage = 6;

document.addEventListener('DOMContentLoaded', () => {
    fetchCourses();
    setupEventListeners();
});

async function fetchCourses() {
    try {
        courseListingSection.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
        
        const response = await fetch('https://raw.githubusercontent.com/Hussain-Ali-Ahmed/course-reviews/main/courses.json');
        
        if (!response.ok) {
            throw new Error('Failed to fetch courses');
        }
        
        courses = await response.json();
        filteredCourses = [...courses];
        renderCourses();
    } catch (error) {
        console.error('Error fetching courses:', error);
        courseListingSection.innerHTML = `<div class="alert alert-danger">Error loading courses. Please try again later.</div>`;
    }
}

// Set up event listeners
function setupEventListeners() {
    // Search functionality
    searchButton.addEventListener('click', filterCourses);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') filterCourses();
    });
    
    // Filter and sort
    departmentFilter.addEventListener('change', filterCourses);
    sortFilter.addEventListener('change', sortCourses);
    
    // Form validation
    reviewForm.addEventListener('submit', handleFormSubmit);
}

// Filter courses based on search and department
function filterCourses() {
    const searchTerm = searchInput.value.toLowerCase();
    const department = departmentFilter.value;
    
    filteredCourses = courses.filter(course => {
        const matchesSearch = course.name.toLowerCase().includes(searchTerm) || 
                             course.code.toLowerCase().includes(searchTerm) ||
                             course.professor.toLowerCase().includes(searchTerm);
        const matchesDepartment = department === 'All Departments' || course.department === department;
        
        return matchesSearch && matchesDepartment;
    });
    
    currentPage = 1;
    sortCourses();
}

// Sort courses based on selected option
function sortCourses() {
    const sortBy = sortFilter.value;
    
    switch(sortBy) {
        case 'Highest Rated':
            filteredCourses.sort((a, b) => b.rating - a.rating);
            break;
        case 'Lowest Rated':
            filteredCourses.sort((a, b) => a.rating - b.rating);
            break;
        case 'Newest':
        default:
            filteredCourses.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    renderCourses();
}

// Render courses to the DOM
function renderCourses() {
    if (filteredCourses.length === 0) {
        courseListingSection.innerHTML = '<div class="alert alert-info">No courses found matching your criteria.</div>';
        return;
    }
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * coursesPerPage;
    const endIndex = startIndex + coursesPerPage;
    const coursesToShow = filteredCourses.slice(startIndex, endIndex);
    
    // Generate HTML for courses
    const coursesHTML = coursesToShow.map(course => `
        <div class="col-md-6 col-lg-4 mb-3">
            <div class="card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between">
                        <h3 class="card-title h5">${course.name}</h3>
                        <span class="badge bg-primary">${course.code}</span>
                    </div>
                    <p class="text-muted">Instructor: ${course.professor}</p>
                    <div class="mb-2">
                        <div class="stars large-stars">
                            ${renderStars(course.rating)}
                        </div>
                        <small class="text-muted">${course.rating.toFixed(1)}/5.0 (${course.reviews} reviews)</small>
                    </div>
                    <p class="card-text">${course.description}</p>
                    <button class="btn btn-outline-primary btn-sm view-details" data-id="${course.id}">View Details</button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Generate pagination controls
    const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);
    const paginationHTML = totalPages > 1 ? `
        <div class="row mt-4">
            <div class="col-12">
                <nav aria-label="Course pagination">
                    <ul class="pagination justify-content-center">
                        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                            <button class="page-link" id="prev-page">Previous</button>
                        </li>
                        ${Array.from({length: totalPages}, (_, i) => `
                            <li class="page-item ${i + 1 === currentPage ? 'active' : ''}">
                                <button class="page-link page-number">${i + 1}</button>
                            </li>
                        `).join('')}
                        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                            <button class="page-link" id="next-page">Next</button>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    ` : '';
    
    // Update the DOM
    courseListingSection.innerHTML = `
        <h2 class="mb-3">Course Listings</h2>
        <div class="row" id="courses-container">
            ${coursesHTML}
        </div>
        ${paginationHTML}
    `;
    
    // Add event listeners to pagination buttons
    document.getElementById('prev-page')?.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderCourses();
        }
    });
    
    document.getElementById('next-page')?.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderCourses();
        }
    });
    
    // Add event listeners to page number buttons
    document.querySelectorAll('.page-number').forEach(button => {
        button.addEventListener('click', (e) => {
            currentPage = parseInt(e.target.textContent);
            renderCourses();
        });
    });
    
    // Add event listeners to view details buttons
    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', (e) => {
            const courseId = e.target.dataset.id;
            showCourseDetails(courseId);
        });
    });
}

// Render star rating
function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let starsHTML = '';
    
    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            starsHTML += '<span class="star filled">★</span>';
        } else if (i === fullStars + 1 && hasHalfStar) {
            starsHTML += '<span class="star half">★</span>';
        } else {
            starsHTML += '<span class="star">★</span>';
        }
    }
    
    return starsHTML;
}

// Show course details (would be expanded in a real implementation)
function showCourseDetails(courseId) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    
    alert(`Course Details:\n\nName: ${course.name}\nCode: ${course.code}\nProfessor: ${course.professor}\nRating: ${course.rating}\nDescription: ${course.description}`);
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    // In a real app, we would send this data to a server
    alert('Thank you for your review! It has been submitted successfully.');
    reviewForm.reset();
}

// Validate form inputs
function validateForm() {
    let isValid = true;
    
    // Reset error states
    document.querySelectorAll('.is-invalid').forEach(el => {
        el.classList.remove('is-invalid');
    });
    document.querySelectorAll('.invalid-feedback').forEach(el => {
        el.remove();
    });
    
    // Validate course name
    const courseName = document.getElementById('courseName');
    if (!courseName.value.trim()) {
        showError(courseName, 'Course name is required');
        isValid = false;
    }
    
    // Validate course code
    const courseCode = document.getElementById('courseCode');
    if (!courseCode.value.trim()) {
        showError(courseCode, 'Course code is required');
        isValid = false;
    }
    
    // Validate professor name
    const professor = document.getElementById('professor');
    if (!professor.value.trim()) {
        showError(professor, 'Professor name is required');
        isValid = false;
    }
    
    // Validate department
    const department = document.getElementById('department');
    if (!department.value) {
        showError(department, 'Please select a department');
        isValid = false;
    }
    
    // Validate rating
    const rating = document.querySelector('input[name="rating"]:checked');
    if (!rating) {
        const ratingContainer = document.querySelector('.rating-input');
        const errorElement = document.createElement('div');
        errorElement.className = 'invalid-feedback d-block';
        errorElement.textContent = 'Please select a rating';
        ratingContainer.appendChild(errorElement);
        isValid = false;
    }
    
    // Validate review title
    const reviewTitle = document.getElementById('reviewTitle');
    if (!reviewTitle.value.trim()) {
        showError(reviewTitle, 'Review title is required');
        isValid = false;
    }
    
    // Validate review text
    const reviewText = document.getElementById('reviewText');
    if (!reviewText.value.trim()) {
        showError(reviewText, 'Review details are required');
        isValid = false;
    } else if (reviewText.value.trim().length < 20) {
        showError(reviewText, 'Review must be at least 20 characters');
        isValid = false;
    }
    
    return isValid;
}

// Show error message for a form field
function showError(field, message) {
    field.classList.add('is-invalid');
    const errorElement = document.createElement('div');
    errorElement.className = 'invalid-feedback';
    errorElement.textContent = message;
    field.parentNode.appendChild(errorElement);
}