var coursesList = document.querySelector('#course-listing .row');
var searchInput = document.querySelector('.input-group input');
var searchButton = document.querySelector('.input-group .btn-primary');
var departmentFilter = document.querySelector('.form-select:first-of-type');
var sortSelect = document.querySelector('.form-select:last-of-type');
var reviewForm = document.querySelector('form');
var allCourses = [];
var currentPage = 1;
var coursesPerPage = 6;
window.onload = function() {
    saveOriginalCourses();
        setupEvents();
        fetchMoreCourses();
        addPagination();
};

function saveOriginalCourses() {
    var cards = document.querySelectorAll('.col-md-6.col-lg-4');
    cards.forEach(function(card) {
        var course = {
            id: Math.floor(Math.random() * 1000),
            courseName: card.querySelector('.card-title').textContent,
            courseCode: card.querySelector('.badge').textContent,
            professor: card.querySelector('.text-muted').textContent.replace('Professor: ', '').replace('Instructor: ', ''),
            department: card.querySelector('.badge').textContent.match(/[A-Z]+/)[0],
            rating: parseFloat(card.querySelector('small').textContent.split('/')[0]),
            reviewCount: parseInt(card.querySelector('small').textContent.match(/\((\d+) reviews\)/)[1]),
            description: card.querySelector('.card-text').textContent
        };
        allCourses.push(course);
    });
}
function setupEvents() {
    searchButton.addEventListener('click', function() {
        searchCourses();
    });
    
    departmentFilter.addEventListener('change', function() {
        searchCourses();
    });
    
    sortSelect.addEventListener('change', function() {
        sortCourses();
        showCourses();
    });
    
    reviewForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (validateForm()) {
            alert('Review submitted successfully!');
            reviewForm.reset();
        }
    });
}
function fetchMoreCourses() {
    var loadingMsg = document.createElement('div');
    loadingMsg.className = 'col-12 text-center';
    loadingMsg.innerHTML = '<p>Loading more courses...</p>';
    coursesList.appendChild(loadingMsg);
    fetch('https://jsonplaceholder.typicode.com/posts')
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            for (var i = 0; i < 5; i++) {
                var newCourse = {
                    id: 1000 + i,
                    courseName: getRandomName(),
                    courseCode: getRandomDept() + Math.floor(Math.random() * 300 + 100),
                    professor: getRandomProf(),
                    department: getRandomDept(),
                    rating: (Math.random() * 4 + 1).toFixed(1),
                    reviewCount: Math.floor(Math.random() * 30),
                    description: data[i].body.substring(0, 100) + '...'
                };
                allCourses.push(newCourse);
            }
            
            loadingMsg.remove();
            
            showCourses();
        })
        .catch(function(error) {
            loadingMsg.innerHTML = '<p>Error loading courses</p>';
        });
}
function getRandomName() {
    var names = ["Web Development", "Data Structures", "Operating Systems", 
                "Artificial Intelligence", "Networks", "Mobile Development"];
    return names[Math.floor(Math.random() * names.length)];
}
function getRandomDept() {
    var depts = ["IT", "MATHS", "ENG", "LIT", "BUS", "SCE"];
    return depts[Math.floor(Math.random() * depts.length)];
}
function getRandomProf() {
    var profs = ["Dr. Ahmed", "Dr. Sarah", "Dr. Ali", "Dr. John", "Dr. Fatima"];
    return profs[Math.floor(Math.random() * profs.length)];
}

function searchCourses() {
    var searchText = searchInput.value.toLowerCase();
    var selectedDept = departmentFilter.value;
    var filteredCourses = [];
    for (var i = 0; i < allCourses.length; i++) {
        var course = allCourses[i];
        var matchesSearch = course.courseName.toLowerCase().includes(searchText) ||
                            course.courseCode.toLowerCase().includes(searchText) ||
                            course.professor.toLowerCase().includes(searchText);
        var matchesDept = selectedDept === "All Departments" || 
                          course.department.includes(selectedDept);
        if (matchesSearch && matchesDept) {
            filteredCourses.push(course);
        }
    }
    allCourses = filteredCourses;
    currentPage = 1;
    showCourses();
    updatePagination();
}
function sortCourses() {
    var sortBy = sortSelect.value;
    
    if (sortBy === "Highest Rated") {
        allCourses.sort(function(a, b) {
            return b.rating - a.rating;
        });
    } else if (sortBy === "Lowest Rated") {
        allCourses.sort(function(a, b) {
            return a.rating - b.rating;
        });
    }
}
function showCourses() {
    coursesList.innerHTML = '';
    var start = (currentPage - 1) * coursesPerPage;
    var end = Math.min(start + coursesPerPage, allCourses.length);
    if (allCourses.length === 0) {
        coursesList.innerHTML = '<div class="col-12 text-center"><p>No courses found</p></div>';
        return;
    }
    for (var i = start; i < end; i++) {
        var course = allCourses[i];
        var starsHtml = '';
        for (var s = 1; s <= 5; s++) {
            if (s <= course.rating) {
                starsHtml += '<span class="star filled">★</span>';
            } else {
                starsHtml += '<span class="star">★</span>';
            }
        }
        var courseCard = document.createElement('div');
        courseCard.className = 'col-md-6 col-lg-4 mb-3';
        courseCard.innerHTML = 
            '<div class="card h-100">' +
                '<div class="card-body">' +
                    '<div class="d-flex justify-content-between">' +
                        '<h3 class="card-title h5">' + course.courseName + '</h3>' +
                        '<span class="badge bg-primary">' + course.courseCode + '</span>' +
                    '</div>' +
                    '<p class="text-muted">Professor: ' + course.professor + '</p>' +
                    '<div class="mb-2">' +
                        '<div class="stars">' + starsHtml + '</div>' +
                        '<small class="text-muted">' + course.rating + '/5.0 (' + course.reviewCount + ' reviews)</small>' +
                    '</div>' +
                    '<p class="card-text">' + course.description + '</p>' +
                '</div>' +
            '</div>';
        
        coursesList.appendChild(courseCard);
    }
}
function addPagination() {
    var paginationNav = document.createElement('nav');
    paginationNav.setAttribute('aria-label', 'Course pagination');
    paginationNav.className = 'my-4';
    var paginationList = document.createElement('ul');
    paginationList.className = 'pagination justify-content-center';
    paginationList.id = 'pagination';
    paginationNav.appendChild(paginationList);
    coursesList.parentNode.appendChild(paginationNav);
    updatePagination();
}
function updatePagination() {
    var pagination = document.getElementById('pagination');
    if (!pagination) return;
    pagination.innerHTML = '';
    var totalPages = Math.ceil(allCourses.length / coursesPerPage);
    if (totalPages <= 1) return;
    var prevButton = document.createElement('li');
    prevButton.className = 'page-item' + (currentPage === 1 ? ' disabled' : '');
    prevButton.innerHTML = '<a class="page-link" href="#">Previous</a>';
    if (currentPage > 1) {
        prevButton.onclick = function(e) {
            e.preventDefault();
            currentPage--;
            showCourses();
            updatePagination();
        };
    }
    pagination.appendChild(prevButton);
    for (var i = 1; i <= totalPages; i++) {
        var pageButton = document.createElement('li');
        pageButton.className = 'page-item' + (i === currentPage ? ' active' : '');
        pageButton.innerHTML = '<a class="page-link" href="#">' + i + '</a>';
        (function(pageNum) {
            pageButton.onclick = function(e) {
                e.preventDefault();
                currentPage = pageNum;
                showCourses();
                updatePagination();
            };
        })(i);
        
        pagination.appendChild(pageButton);
    }
    var nextButton = document.createElement('li');
    nextButton.className = 'page-item' + (currentPage === totalPages ? ' disabled' : '');
    nextButton.innerHTML = '<a class="page-link" href="#">Next</a>';
    if (currentPage < totalPages) {
        nextButton.onclick = function(e) {
            e.preventDefault();
            currentPage++;
            showCourses();
            updatePagination();
        };
    }
    
    pagination.appendChild(nextButton);
}
function validateForm() {
    var isValid = true;
    var requiredFields = ['courseName', 'courseCode', 'professor', 'reviewTitle', 'reviewText'];
    
    for (var i = 0; i < requiredFields.length; i++) {
        var field = document.getElementById(requiredFields[i]);
        if (!field.value.trim()) {
            field.classList.add('is-invalid');
            isValid = false;
        } else {
            field.classList.remove('is-invalid');
        }
    }
    var department = document.getElementById('department');
    if (department.value === '') {
        department.classList.add('is-invalid');
        isValid = false;
    } else {
        department.classList.remove('is-invalid');
    }
    var ratingSelected = false;
    var ratings = document.getElementsByName('rating');
    for (var i = 0; i < ratings.length; i++) {
        if (ratings[i].checked) {
            ratingSelected = true;
            break;
        }
    }
    if (!ratingSelected) {
        alert('Please select a rating');
        isValid = false;
    }
    return isValid;
}