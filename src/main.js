import './style.css'

// State Management
let tasks = JSON.parse(localStorage.getItem('tracker_tasks')) || [];
let currentSteps = parseInt(localStorage.getItem('tracker_steps')) || 0;
let maxSteps = parseInt(localStorage.getItem('tracker_max_steps')) || 10000;
let currentFilter = 'all';

// DOM Elements
const taskForm = document.getElementById('task-form');
const taskTitleInput = document.getElementById('task-title');
const taskCategorySelect = document.getElementById('task-category');
const taskPrioritySelect = document.getElementById('task-priority');
const taskListContainer = document.getElementById('task-list');
const filterButtons = document.querySelectorAll('.filter-btn');

const statTotal = document.getElementById('stat-total');
const statCompleted = document.getElementById('stat-completed');
const statPending = document.getElementById('stat-pending');

const stepCountDisplay = document.getElementById('step-count-display');
const stepProgressBar = document.getElementById('step-progress-bar');
const stepInput = document.getElementById('step-input');
const addStepsBtn = document.getElementById('add-steps-btn');
const liveClock = document.getElementById('live-clock');

// User-Defined Goal Elements
const editGoalBtn = document.getElementById('edit-goal-btn');
const goalContainer = document.getElementById('goal-container');
const goalInput = document.getElementById('goal-input');
const saveGoalBtn = document.getElementById('save-goal-btn');

// Initialize App
function init() {
    renderTasks();
    updateStats();
    updateStepTracker();
    startClock();
    setupEventListeners();
}

// Live Clock
function startClock() {
    setInterval(() => {
        const now = new Date();
        liveClock.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' | ' + now.toLocaleTimeString();
    }, 1000);
}

// Event Listeners setup
function setupEventListeners() {
    // Add Task Handler
    if (taskForm && taskTitleInput && taskCategorySelect && taskPrioritySelect) {
        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = taskTitleInput.value.trim();
            if (!title) return;

            const newTask = {
                id: Date.now(),
                title: title,
                category: taskCategorySelect.value,
                priority: taskPrioritySelect.value,
                completed: false
            };

            tasks.push(newTask);
            saveAndRender();
            taskForm.reset();
        });
    }

    // Step Tracker Goal Toggles
    if (editGoalBtn && goalContainer && goalInput) {
        editGoalBtn.addEventListener('click', () => {
            goalContainer.classList.toggle('hidden');
            if(!goalContainer.classList.contains('hidden')) {
                goalContainer.classList.add('flex');
                goalInput.value = maxSteps;
                goalInput.focus();
            } else {
                goalContainer.classList.remove('flex');
            }
        });
    }

    if (saveGoalBtn && goalContainer && goalInput) {
        saveGoalBtn.addEventListener('click', () => {
            const newGoal = parseInt(goalInput.value);
            if (!isNaN(newGoal) && newGoal > 0) {
                maxSteps = newGoal;
                localStorage.setItem('tracker_max_steps', maxSteps);
                updateStepTracker();
                goalContainer.classList.add('hidden');
                goalContainer.classList.remove('flex');
            }
        });
    }

    // Add Steps Handler
    if (addStepsBtn && stepInput) {
        addStepsBtn.addEventListener('click', () => {
            const stepsVal = parseInt(stepInput.value);
            if (isNaN(stepsVal) || stepsVal <= 0) return;

            currentSteps += stepsVal;
            localStorage.setItem('tracker_steps', currentSteps);
            stepInput.value = '';
            updateStepTracker();
        });
    }

    // Reset Step Tracker Handler
    const resetStepsBtn = document.getElementById('reset-steps-btn');
    if (resetStepsBtn) {
        resetStepsBtn.addEventListener('click', () => {
            currentSteps = 0;
            localStorage.setItem('tracker_steps', currentSteps);
            if (typeof updateStepTracker === 'function') {
                updateStepTracker();
            }
        });
    }

    // Filter Buttons Handlers
    if (filterButtons && filterButtons.length > 0) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => {
                    b.classList.remove('bg-indigo-600', 'text-white');
                    b.classList.add('bg-slate-800', 'text-slate-300');
                });
                btn.classList.remove('bg-slate-800', 'text-slate-300');
                btn.classList.add('bg-indigo-600', 'text-white');

                currentFilter = btn.getAttribute('data-filter');
                renderTasks();
            });
        });
    }
}
// Global actions exposed for inline HTML event handlers
window.toggleTask = function(id) {
    tasks = tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
    saveAndRender();
};

window.deleteTask = function(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveAndRender();
};

// Render Tasks
function renderTasks() {
    let filteredTasks = tasks;
    if (currentFilter !== 'all') {
        filteredTasks = tasks.filter(task => task.category === currentFilter);
    }

    if (filteredTasks.length === 0) {
        taskListContainer.innerHTML = `
            <div class="text-center py-10 text-slate-500 text-sm">
                No tasks found in this category.
            </div>
        `;
        return;
    }

    taskListContainer.innerHTML = filteredTasks.map(task => `
        <div class="flex items-center justify-between bg-slate-950 border border-slate-800 p-4 rounded-xl transition-all hover:border-slate-700">
            <div class="flex items-center gap-3">
                <input type="checkbox" ${task.completed ? 'checked' : ''} onclick="toggleTask(${task.id})"
                    class="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer">
                <div>
                    <h3 class="text-sm font-medium ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}">${escapeHtml(task.title)}</h3>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-indigo-400 font-medium border border-slate-800">${task.category}</span>
                        <span class="text-[10px] px-2 py-0.5 rounded font-medium ${getPriorityColor(task.priority)}">${task.priority} Priority</span>
                    </div>
                </div>
            </div>
            <button onclick="deleteTask(${task.id})" class="text-slate-500 hover:text-red-400 transition-colors p-1">
                🗑️
            </button>
        </div>
    `).join('');
}

// Priority Badge Styling Helper
function getPriorityColor(priority) {
    switch(priority) {
        case 'High': return 'bg-red-500/10 text-red-400 border border-red-500/20';
        case 'Medium': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
        case 'Low': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
        default: return 'bg-slate-800 text-slate-400';
    }
}

// Step Tracker Logic
function updateStepTracker() {
    let percentage = Math.min(Math.round((currentSteps / maxSteps) * 100), 100);
    stepCountDisplay.textContent = `${currentSteps.toLocaleString()} / ${maxSteps.toLocaleString()}`;
    stepProgressBar.style.width = `${percentage}%`;
}

// Update Dashboard Statistics
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;

    statTotal.textContent = total;
    statCompleted.textContent = completed;
    statPending.textContent = pending;
}

// Save & Re-render wrapper
function saveAndRender() {
    localStorage.setItem('tracker_tasks', JSON.stringify(tasks));
    renderTasks();
    updateStats();
}

// HTML Escape Security Helper
function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Run on load
init();