// ============ GESTION DE L'AUTHENTIFICATION ============

const CURRENT_USER_KEY = 'studygroup_current_user';
const API_BASE = '/api';
let currentCourses = [];

function initUsers() {
    return;
}

// Vérifier si l'utilisateur est connecté
function isLoggedIn() {
    return localStorage.getItem(CURRENT_USER_KEY) !== null;
}

// Obtenir l'utilisateur connecté
function getCurrentUser() {
    const userJson = localStorage.getItem(CURRENT_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
}

async function fetchJson(url, options = {}) {
    const fetchOptions = {
        headers: {
            'Content-Type': 'application/json'
        },
        ...options
    };

    if (fetchOptions.body && typeof fetchOptions.body !== 'string') {
        fetchOptions.body = JSON.stringify(fetchOptions.body);
    }

    const response = await fetch(url, fetchOptions);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || 'Erreur serveur');
    }

    return data;
}

// Mettre à jour la navbar selon l'état de connexion
function updateAuthNavbar() {
    const authLinks = document.getElementById('authNavLinks');
    const coursesAuthLinks = document.getElementById('coursesAuthLinks');
    const user = getCurrentUser();
    
    if (authLinks) {
        if (user) {
            authLinks.innerHTML = `
                <div class="dropdown">
                    <button class="btn btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                        <i class="fas fa-user-circle me-1"></i> ${user.firstname}
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item" href="dashboard.html"><i class="fas fa-tachometer-alt me-2"></i>Tableau de bord</a></li>
                        <li><a class="dropdown-item" href="courses.html"><i class="fas fa-book me-2"></i>Mes cours</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger" href="#" onclick="logout()"><i class="fas fa-sign-out-alt me-2"></i>Déconnexion</a></li>
                    </ul>
                </div>
            `;
        } else {
            authLinks.innerHTML = `
                <a href="login.html" class="btn btn-outline-primary me-2">Connexion</a>
                <a href="register.html" class="btn btn-primary">Inscription</a>
            `;
        }
    }
    
    if (coursesAuthLinks) {
        if (user) {
            coursesAuthLinks.innerHTML = `
                <div class="dropdown">
                    <button class="btn btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                        <i class="fas fa-user-circle me-1"></i> ${user.firstname}
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item" href="dashboard.html"><i class="fas fa-tachometer-alt me-2"></i>Dashboard</a></li>
                        <li><a class="dropdown-item" href="#" onclick="logout()"><i class="fas fa-sign-out-alt me-2"></i>Déconnexion</a></li>
                    </ul>
                </div>
            `;
        } else {
            coursesAuthLinks.innerHTML = `
                <a href="login.html" class="btn btn-outline-primary me-2">Connexion</a>
                <a href="register.html" class="btn btn-primary">Inscription</a>
            `;
        }
    }
}

// Inscription
async function register(event) {
    event.preventDefault();
    
    const firstname = document.getElementById('regFirstname')?.value;
    const lastname = document.getElementById('regLastname')?.value;
    const email = document.getElementById('regEmail')?.value;
    const level = document.getElementById('regLevel')?.value;
    const role = document.getElementById('regRole')?.value;
    const password = document.getElementById('regPassword')?.value;
    const confirmPassword = document.getElementById('regConfirmPassword')?.value;
    const errorDiv = document.getElementById('registerError');
    
    if (!firstname || !lastname || !email || !password || !role) {
        showError(errorDiv, 'Veuillez remplir tous les champs et choisir un rôle');
        return;
    }
    
    if (password !== confirmPassword) {
        showError(errorDiv, 'Les mots de passe ne correspondent pas');
        return;
    }
    
    if (password.length < 6) {
        showError(errorDiv, 'Le mot de passe doit contenir au moins 6 caractères');
        return;
    }

    try {
        const response = await fetchJson(`${API_BASE}/users/register`, {
            method: 'POST',
            body: {
                firstname,
                lastname,
                email,
                level: level || 'Non spécifié',
                role,
                password
            }
        });

        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(response.user));
        window.location.href = 'dashboard.html';
    } catch (error) {
        showError(errorDiv, error.message);
    }
}

// Connexion
async function login(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;
    const errorDiv = document.getElementById('loginError');

    try {
        const response = await fetchJson(`${API_BASE}/users/login`, {
            method: 'POST',
            body: {
                email,
                password
            }
        });

        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(response.user));
        window.location.href = 'dashboard.html';
    } catch (error) {
        showError(errorDiv, error.message);
    }
}

// Déconnexion
function logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
    window.location.href = 'index.html';
}

// Afficher erreur
function showError(element, message) {
    if (element) {
        element.textContent = message;
        element.classList.remove('d-none');
        setTimeout(() => {
            element.classList.add('d-none');
        }, 3000);
    }
}

function showDemoVideo() {
    const demoVideoModalEl = document.getElementById('demoVideoModal');
    const demoVideo = document.getElementById('demoVideo');
    if (!demoVideoModalEl || !demoVideo) return;

    const demoModal = new bootstrap.Modal(demoVideoModalEl, { keyboard: true });
    demoModal.show();

    // try to play (autoplay may be blocked by browser)
    demoVideo.currentTime = 0;
    demoVideo.play().catch(() => {});

    // stop and reset when modal is closed
    demoVideoModalEl.addEventListener('hidden.bs.modal', () => {
        demoVideo.pause();
        demoVideo.currentTime = 0;
    }, { once: true });
}

// Initialiser le dashboard
async function initDashboard() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    const welcomeName = document.getElementById('welcomeName');
    const userNameSidebar = document.getElementById('userNameSidebar');
    const teacherSection = document.getElementById('teacherSection');
    const studentSection = document.getElementById('studentSection');
    
    if (welcomeName) welcomeName.textContent = `${user.firstname} ${user.lastname}`;
    if (userNameSidebar) userNameSidebar.textContent = `${user.firstname} ${user.lastname}`;

    if (user.role === 'professeur') {
        if (teacherSection) teacherSection.style.display = 'block';
        if (studentSection) studentSection.style.display = 'none';
        await loadTeacherLessons(user.id);
    } else {
        if (teacherSection) teacherSection.style.display = 'none';
        if (studentSection) studentSection.style.display = 'block';
        await loadStudentCourses(user.id);
    }
}

async function saveLesson(lesson) {
    return await fetchJson(`${API_BASE}/lessons`, {
        method: 'POST',
        body: lesson
    });
}

async function saveEnrollment(enrollment) {
    return await fetchJson(`${API_BASE}/enrollments`, {
        method: 'POST',
        body: enrollment
    });
}

function getAllCourses() {
    return currentCourses.length ? currentCourses : courses;
}

async function getUserEnrollments(userId) {
    return await fetchJson(`${API_BASE}/enrollments?userId=${encodeURIComponent(userId)}`);
}

async function loadStudentCourses(userId) {
    const container = document.getElementById('enrolledCoursesContainer');
    if (!container) return;

    const enrollments = await getUserEnrollments(userId);
    if (!enrollments || enrollments.length === 0) {
        container.innerHTML = '<p class="text-secondary mb-0">Vous n’êtes inscrit à aucun cours pour l’instant. Retournez sur la page <a href="courses.html">Cours</a> pour vous inscrire.</p>';
        return;
    }

    const enrolledCourses = enrollments
        .map(enrollment => getAllCourses().find(course => course.id.toString() === enrollment.courseId.toString()))
        .filter(Boolean);

    container.innerHTML = enrolledCourses.map(course => `
        <div class="course-item">
            <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                <div>
                    <h6 class="font-weight-bold mb-2">${course.title}</h6>
                    <p class="text-secondary mb-1">${course.description || ''}</p>
                    <small class="text-secondary">Professeur : ${course.teacher || course.teacherName || 'Professeur'} • Durée : ${course.duration || 'N/A'}</small>
                </div>
                <span class="badge badge-pill badge-primary mt-1">Inscrit</span>
            </div>
        </div>
    `).join('');
}

async function loadTeacherLessons(userId) {
    const lessonList = document.getElementById('lessonList');
    if (!lessonList) return;

    const lessons = await fetchJson(`${API_BASE}/teacher-lessons?teacherId=${encodeURIComponent(userId)}`);
    if (!lessons || lessons.length === 0) {
        lessonList.innerHTML = '<p class="text-secondary">Aucune leçon publiée pour l’instant.</p>';
        return;
    }

    lessonList.innerHTML = lessons.map(lesson => `
        <div class="course-item">
            <h6 class="font-weight-bold mb-2">${lesson.title}</h6>
            <p class="text-secondary mb-1">${lesson.description || 'Pas de description'}</p>
            <small class="text-secondary">Vidéo: ${lesson.videoUrl || 'Non défini'} | PDF: ${lesson.pdfUrl || 'Non défini'}</small>
        </div>
    `).join('');
}

function handleLessonForm() {
    const form = document.getElementById('createLessonForm');
    if (!form) return;

    form.addEventListener('submit', async event => {
        event.preventDefault();
        const user = getCurrentUser();
        if (!user || user.role !== 'professeur') return;

        const title = document.getElementById('lessonTitle')?.value.trim();
        const description = document.getElementById('lessonDescription')?.value.trim();
        const videoUrl = document.getElementById('lessonVideo')?.value.trim();
        const pdfUrl = document.getElementById('lessonPdf')?.value.trim();
        const message = document.getElementById('lessonMessage');

        if (!title) {
            if (message) {
                message.className = 'alert alert-danger mt-3';
                message.textContent = 'Le titre de la leçon est requis.';
                message.style.display = 'block';
            }
            return;
        }

        const newLesson = {
            teacherId: user.id,
            teacherName: `${user.firstname} ${user.lastname}`,
            title,
            description,
            videoUrl,
            pdfUrl,
            category: 'autre',
            duration: 'N/A',
            students: 0,
            image: '📘'
        };

        try {
            await saveLesson(newLesson);
            if (message) {
                message.className = 'alert alert-success mt-3';
                message.textContent = 'Leçon publiée avec succès !';
                message.style.display = 'block';
            }
            form.reset();
            await loadTeacherLessons(user.id);
        } catch (error) {
            if (message) {
                message.className = 'alert alert-danger mt-3';
                message.textContent = error.message;
                message.style.display = 'block';
            }
        }
    });
}

// ============ DONNÉES DES COURS ============

const courses = [
    { id: 1, title: "Mathématiques - Algèbre", category: "math", level: "Lycée", duration: "12h", students: 1245, image: "📐", teacher: "M. Karim", description: "Maîtrisez l'algèbre linéaire et les équations complexes" },
    { id: 2, title: "Mathématiques - Géométrie", category: "math", level: "Lycée", duration: "10h", students: 980, image: "📏", teacher: "Mme Leila", description: "Géométrie dans l'espace et vecteurs" },
    { id: 3, title: "Physique - Mécanique", category: "physics", level: "Lycée", duration: "15h", students: 2100, image: "⚙️", teacher: "M. Houssem", description: "Les lois de Newton et mouvement" },
    { id: 4, title: "Physique - Électricité", category: "physics", level: "Lycée", duration: "8h", students: 1560, image: "⚡", teacher: "Mme Sonia", description: "Circuits électriques et lois d'Ohm" },
    { id: 5, title: "Python - Débutant", category: "cs", level: "Université", duration: "20h", students: 3450, image: "🐍", teacher: "M. Ahmed", description: "Apprenez la programmation avec Python" },
    { id: 6, title: "Développement Web", category: "cs", level: "Université", duration: "25h", students: 2890, image: "🌐", teacher: "M. Skander", description: "HTML, CSS, JavaScript et frameworks" },
    { id: 7, title: "Anglais - TOEFL", category: "langues", level: "Tous", duration: "30h", students: 4100, image: "🇬🇧", teacher: "Mme Sarah", description: "Préparez-vous au TOEFL efficacement" },
    { id: 8, title: "Français - Méthodologie", category: "langues", level: "Lycée", duration: "12h", students: 890, image: "🇫🇷", teacher: "M. Pierre", description: "Techniques de dissertation et commentaire" }
];

// Charger les cours sur la page courses.html
async function loadCourses() {
    const container = document.getElementById('coursesContainer');
    if (!container) return;

    try {
        currentCourses = await fetchJson(`${API_BASE}/courses`);
    } catch (error) {
        currentCourses = courses;
    }
    
    function renderCourses(filter = 'all', search = '') {
        let filtered = getAllCourses();
        if (filter !== 'all') {
            filtered = filtered.filter(c => c.category === filter);
        }
        if (search) {
            const searchTerm = search.toLowerCase();
            filtered = filtered.filter(c =>
                c.title.toLowerCase().includes(searchTerm) ||
                (c.description && c.description.toLowerCase().includes(searchTerm))
            );
        }
        
        if (filtered.length === 0) {
            container.innerHTML = `<div class="col-12 text-center py-5"><i class="fas fa-book-open fa-3x text-secondary mb-3"></i><p class="text-secondary">Aucun cours trouvé</p></div>`;
            return;
        }
        
        container.innerHTML = filtered.map(course => `
            <div class="col-md-6 col-lg-3">
                <div class="course-card position-relative">
                    <div class="bg-gradient-primary p-4 text-center" style="background: linear-gradient(135deg, #6366f1, #818cf8);">
                        <span class="display-1">${course.image || '📘'}</span>
                    </div>
                    <div class="p-3">
                        <span class="badge bg-light text-dark mb-2">${course.duration || 'N/A'} • ${course.students || 0} étudiants</span>
                        <h5 class="fw-bold">${course.title}</h5>
                        <p class="small text-secondary">${(course.description || '').substring(0, 60)}...</p>
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <small class="text-secondary"><i class="fas fa-chalkboard-user me-1"></i> ${course.teacher || course.teacherName || 'Professeur'}</small>
                            <button class="btn btn-sm btn-primary rounded-pill" onclick="enrollCourse('${course.id}')">S'inscrire</button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    renderCourses();
    
    // Filtres
    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const filter = this.dataset.filter;
            const search = document.getElementById('searchCourse')?.value || '';
            renderCourses(filter, search);
        });
    });
    
    // Recherche
    const searchInput = document.getElementById('searchCourse');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const activeFilter = document.querySelector('.btn-filter.active')?.dataset.filter || 'all';
            renderCourses(activeFilter, this.value);
        });
    }
}

// Inscription à un cours
async function enrollCourse(courseId) {
    if (!isLoggedIn()) {
        if (confirm('Vous devez être connecté pour vous inscrire. Aller à la page de connexion ?')) {
            window.location.href = 'login.html';
        }
        return;
    }

    const user = getCurrentUser();
    if (!user) return;

    try {
        const existing = await getUserEnrollments(user.id);
        if (existing.find(enrollment => enrollment.courseId.toString() === courseId.toString())) {
            alert('Vous êtes déjà inscrit à ce cours. Il se trouve déjà dans votre tableau de bord.');
            return;
        }

        await saveEnrollment({
            userId: user.id,
            courseId: courseId.toString()
        });
        alert('✅ Inscription réussie ! Le cours est maintenant visible dans votre tableau de bord.');
    } catch (error) {
        alert(error.message);
    }
}

// ============ INITIALISATION ============

document.addEventListener('DOMContentLoaded', async () => {
    initUsers();
    updateAuthNavbar();
    await loadCourses();
    
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    
    if (registerForm) {
        registerForm.addEventListener('submit', register);
    }
    if (loginForm) {
        loginForm.addEventListener('submit', login);
    }
    
    const user = getCurrentUser();
    if (window.location.pathname.includes('dashboard.html') && !user) {
        window.location.href = 'login.html';
    }
    if (window.location.pathname.includes('dashboard.html') && user) {
        await initDashboard();
        handleLessonForm();
    }
    // Notification toast
function showNotification(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : 'primary'} border-0 show`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    document.getElementById('toastContainer').appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}
});