// script.js
const API_BASE_URL = 'http://localhost:8080/api';

// Common functions
function showLoading(elementId = 'loading-spinner') {
    document.getElementById(elementId).style.display = 'block';
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

function hideLoading(elementId = 'loading-spinner') {
    document.getElementById(elementId).style.display = 'none';
}

function showError(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function formatStatus(status) {
    return status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatPriority(priority) {
    return priority.charAt(0).toUpperCase() + priority.slice(1) + ' priority';
}

function formatDate(dateString) {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function isOverdue(dateString) {
    if (!dateString) return false;
    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
}

// Auth page functionality
function setupAuthPage() {
    // Form toggling
    const showSignup = document.getElementById('show-signup');
    const showLogin = document.getElementById('show-login');

    if (showSignup && showLogin) {
        showSignup.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-card').style.display = 'none';
            document.getElementById('signup-card').style.display = 'block';
        });

        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('signup-card').style.display = 'none';
            document.getElementById('login-card').style.display = 'block';
        });

        // Login handler
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                showLoading();
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                if (!response.ok) throw new Error(await response.text());

                const { token } = await response.json();
                localStorage.setItem('token', token);

                // Store email if "remember me" is checked
                if (document.getElementById('remember-me').checked) {
                    localStorage.setItem('rememberedEmail', email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }

                window.location.href = 'task-manager.html';
            } catch (error) {
                showError(error.message);
            } finally {
                hideLoading();
            }
        });

        // Signup handler
        document.getElementById('signup-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm-password').value;

            if (password !== confirmPassword) {
                showError("Passwords don't match");
                return;
            }

            try {
                showLoading();
                const response = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fullName: name,
                        email,
                        password
                    })
                });

                if (!response.ok) throw new Error(await response.text());

                const { token } = await response.json();
                localStorage.setItem('token', token);
                window.location.href = 'task-manager.html';
            } catch (error) {
                showError(error.message);
            } finally {
                hideLoading();
            }
        });

        // Check for remembered email
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            document.getElementById('login-email').value = rememberedEmail;
            document.getElementById('remember-me').checked = true;
        }
    }
}

// Task Manager functionality
let tasks = [];

async function loadTasks() {
    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Failed to load tasks');

        tasks = await response.json();
        renderTasks();
    } catch (error) {
        alert(error.message);
        if (error.message.includes('Unauthorized')) {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        }
    } finally {
        hideLoading();
    }
}

function renderTasks(filterStatus = 'all', filterPriority = 'all') {
    const taskList = document.getElementById('task-list');
    if (!taskList) return;

    taskList.innerHTML = '';

    const filteredTasks = tasks.filter(task => {
        const statusMatch = filterStatus === 'all' || task.status === filterStatus;
        const priorityMatch = filterPriority === 'all' || task.priority === filterPriority;
        return statusMatch && priorityMatch;
    });

    filteredTasks.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = 'task-card';
        taskCard.dataset.status = task.status;
        taskCard.dataset.priority = task.priority;
        taskCard.dataset.id = task.id;

        taskCard.innerHTML = `
            <div class="task-header">
                <h3>${task.title}</h3>
                <div class="task-meta">
                    <div class="status-dropdown">
                        <span class="status ${task.status}">
                            ${formatStatus(task.status)} <i class="fas fa-caret-down"></i>
                        </span>
                        <ul class="dropdown-options">
                            <li data-status="todo">To Do</li>
                            <li data-status="in-progress">In Progress</li>
                            <li data-status="completed">Completed</li>
                        </ul>
                    </div>
                    <span class="priority ${task.priority}">
                        ${formatPriority(task.priority)}
                    </span>
                </div>
            </div>
            <p>${task.description || 'No description'}</p>
            <div class="task-footer">
                <div class="due-date ${isOverdue(task.dueDate) ? 'overdue' : ''}">
                    <input type="checkbox" id="task-${task.id}" ${task.status === 'completed' ? 'checked' : ''}>
                    <label for="task-${task.id}">
                        Due ${formatDate(task.dueDate)}
                        ${isOverdue(task.dueDate) ? '<a href="#">Overdue</a>' : ''}
                    </label>
                </div>
                <div class="created-date">Created ${formatDate(task.createdAt)}</div>
            </div>
            <button class="delete-task-btn" data-id="${task.id}">
                <i class="fas fa-trash"></i>
            </button>
        `;

        taskList.appendChild(taskCard);
    });

    // Add event listeners to new elements
    addTaskEventListeners();
}

function addTaskEventListeners() {
    // Status dropdown
    document.querySelectorAll('.status-dropdown').forEach(dropdown => {
        dropdown.addEventListener('click', async (e) => {
            const option = e.target.closest('.dropdown-options li');
            if (!option) return;

            const newStatus = option.dataset.status;
            const taskCard = dropdown.closest('.task-card');
            const taskId = taskCard.dataset.id;

            try {
                const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ status: newStatus })
                });

                if (!response.ok) throw new Error('Failed to update task');

                await loadTasks();
            } catch (error) {
                alert(error.message);
            }
        });
    });

    // Checkbox completion
    document.querySelectorAll('.due-date input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', async function() {
            const taskCard = this.closest('.task-card');
            const taskId = taskCard.dataset.id;
            const newStatus = this.checked ? 'completed' : 'todo';

            try {
                const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ status: newStatus })
                });

                if (!response.ok) throw new Error('Failed to update task');

                await loadTasks();
            } catch (error) {
                alert(error.message);
            }
        });
    });

    // Delete task
    document.querySelectorAll('.delete-task-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            if (!confirm('Are you sure you want to delete this task?')) return;

            const taskId = this.dataset.id;
            try {
                const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!response.ok) throw new Error('Failed to delete task');

                await loadTasks();
            } catch (error) {
                alert(error.message);
            }
        });
    });
}

function setupTaskManagerPage() {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Load tasks
    loadTasks();

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        });
    }

    // Add Task Modal
    const addTaskBtn = document.getElementById('add-task-btn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => {
            document.getElementById('task-modal').style.display = 'flex';
        });
    }

    const cancelBtn = document.querySelector('.cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            document.getElementById('task-modal').style.display = 'none';
        });
    }

    // Filter tasks
    document.querySelectorAll('.filter-section li').forEach(item => {
        item.addEventListener('click', function() {
            const parentSection = this.closest('.filter-section');
            parentSection.querySelectorAll('li').forEach(li => li.classList.remove('active'));
            this.classList.add('active');

            const statusFilter = document.querySelector('.filter-section:nth-child(1) li.active').dataset.status;
            const priorityFilter = document.querySelector('.filter-section:nth-child(2) li.active').dataset.priority;
            renderTasks(statusFilter, priorityFilter);
        });
    });

    // Task form submission
    const taskForm = document.getElementById('task-form');
    if (taskForm) {
        taskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newTask = {
                title: document.getElementById('task-title').value,
                description: document.getElementById('task-description').value,
                status: document.getElementById('task-status').value,
                priority: document.getElementById('task-priority').value,
                dueDate: document.getElementById('task-due-date').value
            };

            try {
                showLoading();
                const response = await fetch(`${API_BASE_URL}/tasks`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(newTask),
                    credentials: 'include'
                });

                if (!response.ok) throw new Error('Failed to create task');

                document.getElementById('task-modal').style.display = 'none';
                document.getElementById('task-form').reset();
                await loadTasks();
            } catch (error) {
                alert(error.message);
            } finally {
                hideLoading();
            }
        });
    }
}

// Initialize the appropriate page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('login-form')) {
        setupAuthPage();
    } else if (document.getElementById('task-list')) {
        setupTaskManagerPage();
    }
});