/**
 * STUDY BALANCE - CORE JAVASCRIPT ENGINE
 */

let appState = {
    timeAllocation: { hocTap: 0, nghiNgoi: 0, giaiTri: 0 },
    goals: [],
    schedule: [],
    habits: [],
    streak: 0,
    lastCheckInDate: null
};

const BADGES_CONFIG = [
    { id: 'b1', name: 'Chiến binh Kỷ luật', desc: 'Đạt chuỗi 3 ngày check-in liên tiếp', icon: 'zap', color: 'text-amber-500 bg-amber-50 border-amber-200' },
    { id: 'b2', name: 'Đại sứ SMART', desc: 'Tạo và hoàn thành ít nhất 1 mục tiêu SMART', icon: 'target', color: 'text-blue-500 bg-blue-50 border-blue-200' },
    { id: 'b3', name: 'Bậc thầy Cân bằng', desc: 'Đạt tỷ lệ vàng (Học tập >= 50% và Nghỉ ngơi >= 15%)', icon: 'scale', color: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
    { id: 'b4', name: 'Siêu năng lực 100', desc: 'Đạt Chỉ số tự giác cá nhân tối đa 100 điểm', icon: 'crown', color: 'text-indigo-500 bg-indigo-50 border-indigo-200' }
];

const MOTIVATION_QUOTES = [
    "\"Học tập hết mình, nghỉ ngơi thông minh là chìa khóa của sự cân bằng bền vững.\"",
    "\"Kỷ luật là cầu nối giữa mục tiêu và thành tựu. Hãy bắt đầu ngay hôm nay.\"",
    "\"Đừng để sự trì hoãn đánh cắp tương lai của bạn. Từng bước nhỏ làm nên đại sự.\"",
    "\"Thành công không phải là ngẫu nhiên, đó là sự lựa chọn của thói quen hằng ngày.\""
];

let pomodoroInterval = null;
let isFocusMode = false;
let focusTimeRemaining = 25 * 60; 

document.addEventListener("DOMContentLoaded", () => {
    loadDataFromLocalStorage();
    initializeDateTime();
    switchTab('trang-chu'); 
    renderAll();
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isFocusMode) toggleFocusMode();
    });
});

function initializeDateTime() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    const formattedDate = today.toLocaleDateString('vi-VN', options);
    
    document.getElementById('current-date').innerText = formattedDate;
    document.getElementById('report-date').innerText = today.toLocaleDateString('vi-VN');
    
    const randomQuote = MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)];
    document.getElementById('motivation-quote').innerText = randomQuote;

    checkStreakLogic(today);
}

function checkStreakLogic(today) {
    const todayStr = today.toISOString().split('T')[0];
    if (!appState.lastCheckInDate) {
        appState.streak = 0;
    } else {
        const lastDate = new Date(appState.lastCheckInDate);
        const diffTime = Math.abs(today - lastDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 1) {
            appState.streak = 0; 
        }
    }
    saveDataToLocalStorage();
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    
    const activeTab = document.getElementById(`tab-${tabId}`);
    if (activeTab) activeTab.classList.remove('hidden');
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-blue-50', 'text-blue-600', 'shadow-sm');
        btn.classList.add('text-slate-600', 'hover:bg-slate-100');
    });
    
    const activeNav = document.getElementById(`nav-${tabId}`);
    if (activeNav) {
        activeNav.classList.remove('text-slate-600', 'hover:bg-slate-100');
        activeNav.classList.add('bg-blue-50', 'text-blue-600', 'shadow-sm');
    }
}

function modifyTime(type, minutes) {
    if (appState.timeAllocation[type] !== undefined) {
        appState.timeAllocation[type] += minutes;
        if (appState.timeAllocation[type] < 0) appState.timeAllocation[type] = 0;
        
        appState.lastCheckInDate = new Date().toISOString().split('T')[0];
        if (appState.streak === 0) appState.streak = 1;

        saveDataToLocalStorage();
        renderTimeAllocation();
        renderAIAlerts();
        renderDisciplineScore();
        showToast(`Đã thêm ${minutes} phút vào hoạt động!`, 'success');
    }
}

function renderTimeAllocation() {
    const { hocTap, nghiNgoi, giaiTri } = appState.timeAllocation;
    const total = hocTap + nghiNgoi + giaiTri;
    
    const studyPct = total ? Math.round((hocTap / total) * 100) : 0;
    const restPct = total ? Math.round((nghiNgoi / total) * 100) : 0;
    const relaxPct = total ? Math.round((giaiTri / total) * 100) : 0;
    
    document.getElementById('study-ratio-text').innerText = `${studyPct}% (${hocTap}p)`;
    document.getElementById('rest-ratio-text').innerText = `${restPct}% (${nghiNgoi}p)`;
    document.getElementById('relax-ratio-text').innerText = `${relaxPct}% (${giaiTri}p)`;
    
    document.getElementById('study-bar').style.width = `${studyPct}%`;
    document.getElementById('rest-bar').style.width = `${restPct}%`;
    document.getElementById('relax-bar').style.width = `${relaxPct}%`;

    const reportSummaryBox = document.querySelector('#report-view .grid');
    if (reportSummaryBox) {
        reportSummaryBox.innerHTML = `
            <div class="p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                <p class="text-xs text-slate-500 font-bold uppercase">Tổng thời gian học tập</p>
                <p class="text-2xl font-black text-blue-600 mt-1">${hocTap} phút</p>
                <p class="text-[10px] text-slate-400 mt-1">Chiếm tỷ lệ: ${studyPct}%</p>
            </div>
            <div class="p-5 bg-green-50/50 rounded-2xl border border-green-100">
                <p class="text-xs text-slate-500 font-bold uppercase">Tổng thời gian phục hồi</p>
                <p class="text-2xl font-black text-green-600 mt-1">${nghiNgoi} phút</p>
                <p class="text-[10px] text-slate-400 mt-1">Chiếm tỷ lệ: ${restPct}%</p>
            </div>
            <div class="p-5 bg-amber-50/50 rounded-2xl border border-amber-100">
                <p class="text-xs text-slate-500 font-bold uppercase">Tổng thời gian giải trí</p>
                <p class="text-2xl font-black text-amber-600 mt-1">${giaiTri} phút</p>
                <p class="text-[10px] text-slate-400 mt-1">Chiếm tỷ lệ: ${relaxPct}%</p>
            </div>
        `;
    }
}

function renderAIAlerts() {
    const alertBox = document.getElementById('balance-alert-box');
    const { hocTap, nghiNgoi, giaiTri } = appState.timeAllocation;
    const total = hocTap + nghiNgoi + giaiTri;
    
    if (total === 0) {
        alertBox.className = "p-4 rounded-xl border border-blue-100 bg-blue-50 text-blue-700 text-xs font-semibold";
        alertBox.innerHTML = `Chưa có dữ liệu sinh hoạt hôm nay. Hãy bắt đầu tích lũy thời gian.`;
        return;
    }
    
    const studyPct = (hocTap / total) * 100;
    const restPct = (nghiNgoi / total) * 100;
    
    let alertTitle = "Trạng thái lý tưởng";
    let alertMsg = "Tuyệt vời! Bạn đang duy trì phân bổ thời gian cực kỳ khoa học và điều độ.";
    let alertClass = "border-green-100 bg-green-50 text-green-700";
    let alertIcon = "check-circle";

    if (studyPct > 70) {
        alertTitle = "Cảnh báo quá tải (Burnout)";
        alertMsg = "Bạn đang học tập cường độ quá cao (>70%). Hãy nghỉ ngơi để bảo vệ sức khỏe.";
        alertClass = "border-red-100 bg-red-50 text-red-700";
        alertIcon = "alert-octagon";
    } else if (studyPct > 0 && restPct < 10) {
        alertTitle = "Thiếu thời gian hồi sức";
        alertMsg = "Thời gian nghỉ ngơi quá thấp. Cứ 50 phút học nên nghỉ 10 phút nhé.";
        alertClass = "border-amber-100 bg-amber-50 text-amber-700";
        alertIcon = "battery-warning";
    }

    alertBox.className = `p-4 rounded-xl border ${alertClass} text-xs font-semibold space-y-1`;
    alertBox.innerHTML = `<strong>${alertTitle}</strong><p class="font-normal">${alertMsg}</p>`;
    lucide.createIcons();
}

function renderDisciplineScore() {
    let score = 30; 
    const { hocTap, nghiNgoi } = appState.timeAllocation;
    if (hocTap > 0) score += Math.min(20, Math.floor(hocTap / 20));
    if (hocTap >= 90 && nghiNgoi >= 15) score += 10; 

    const totalHabits = appState.habits.length;
    const completedHabits = appState.habits.filter(h => h.completed).length;
    if (totalHabits > 0) score += Math.round((completedHabits / totalHabits) * 20);

    const totalGoals = appState.goals.length;
    if (totalGoals > 0) {
        const completedGoals = appState.goals.filter(g => g.progress === 100).length;
        score += Math.round((completedGoals / totalGoals) * 20);
    }

    score = Math.max(0, Math.min(100, score));
    document.getElementById('discipline-score').innerText = score;
}

function createGoal(event) {
    event.preventDefault();
    const title = document.getElementById('g-title').value.trim();
    const specific = document.getElementById('g-specific').value.trim();
    const measurable = document.getElementById('g-measurable').value.trim();
    const achievable = document.getElementById('g-achievable').value.trim();
    const relevant = document.getElementById('g-relevant').value.trim();
    const timebound = document.getElementById('g-timebound').value;

    appState.goals.push({
        id: 'goal_' + Date.now(),
        title, specific, measurable, achievable, relevant, timebound,
        progress: 0, subTasks: []
    });

    saveDataToLocalStorage();
    renderAll();
    document.getElementById('goal-form').reset();
    showToast("Đã kích hoạt kế hoạch mục tiêu SMART!", "success");
}

function addSubTask(goalId) {
    const inputField = document.getElementById(`input-subtask-${goalId}`);
    const taskText = inputField.value.trim();
    if (!taskText) return;

    const goal = appState.goals.find(g => g.id === goalId);
    if (goal) {
        goal.subTasks.push({ id: 'sub_' + Date.now(), text: taskText, completed: false });
        updateGoalProgress(goal);
        saveDataToLocalStorage();
        renderAll();
    }
}

function toggleSubTask(goalId, subTaskId) {
    const goal = appState.goals.find(g => g.id === goalId);
    if (goal) {
        const sub = goal.subTasks.find(s => s.id === subTaskId);
        if (sub) {
            sub.completed = !sub.completed;
            updateGoalProgress(goal);
            saveDataToLocalStorage();
            renderAll();
        }
    }
}

function deleteGoal(goalId) {
    if (confirm("Xóa mục tiêu này?")) {
        appState.goals = appState.goals.filter(g => g.id !== goalId);
        saveDataToLocalStorage();
        renderAll();
    }
}

function updateGoalProgress(goal) {
    if (goal.subTasks.length === 0) { goal.progress = 0; return; }
    const completedCount = goal.subTasks.filter(s => s.completed).length;
    goal.progress = Math.round((completedCount / goal.subTasks.length) * 100);
}

function renderGoals() {
    const container = document.getElementById('goals-list-container');
    if (!container) return;

    if (appState.goals.length === 0) {
        container.innerHTML = `<div class="bg-white p-8 border rounded-2xl text-center text-slate-400 text-xs">Chưa có mục tiêu.</div>`;
        return;
    }

    container.innerHTML = appState.goals.map(goal => `
        <div class="bg-white rounded-2xl border p-6 space-y-4">
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="font-extrabold text-base">${goal.title}</h4>
                    <p class="text-xs text-slate-500">S: ${goal.specific}</p>
                </div>
                <button onclick="deleteGoal('${goal.id}')" class="text-slate-400 hover:text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>
            <div class="flex items-center justify-between text-xs font-bold">
                <div class="flex-grow mr-4">
                    <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div class="h-full bg-blue-500" style="width: ${goal.progress}%"></div></div>
                </div>
                <span class="text-red-500">Hạn: ${goal.timebound}</span>
            </div>
            <div class="space-y-2">
                ${goal.subTasks.map(sub => `
                    <label class="flex items-center gap-2 text-xs cursor-pointer">
                        <input type="checkbox" ${sub.completed ? 'checked' : ''} onchange="toggleSubTask('${goal.id}', '${sub.id}')">
                        <span class="${sub.completed ? 'line-through text-slate-400' : ''}">${sub.text}</span>
                    </label>
                `).join('')}
                <div class="flex gap-2 max-w-xs pt-2">
                    <input id="input-subtask-${goal.id}" type="text" placeholder="Bước nhỏ thực hiện..." class="flex-grow px-2 py-1 border text-xs rounded-xl focus:outline-none">
                    <button onclick="addSubTask('${goal.id}')" class="px-3 py-1 bg-slate-800 text-white text-xs rounded-xl">Thêm</button>
                </div>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

function renderHotGoals() {
    const hotListContainer = document.getElementById('hot-goals-list');
    if (!hotListContainer) return;
    const hotGoals = appState.goals.filter(g => g.progress < 100).slice(0, 2);
    if (hotGoals.length === 0) { hotListContainer.innerHTML = `<p class="text-xs text-slate-400 italic">Trống.</p>`; return; }
    hotListContainer.innerHTML = hotGoals.map(goal => `<div class="p-4 bg-slate-50 border rounded-xl flex justify-between items-center text-xs"><span>${goal.title}</span><span class="font-bold text-blue-600">${goal.progress}%</span></div>`).join('');
}

function addScheduleEvent(event) {
    event.preventDefault();
    const day = document.getElementById('s-day').value;
    const title = document.getElementById('s-title').value.trim();
    const start = document.getElementById('s-start').value;
    const end = document.getElementById('s-end').value;
    const type = document.getElementById('s-type').value;

    appState.schedule.push({ id: 'evt_' + Date.now(), day, title, start, end, type });
    appState.schedule.sort((a, b) => a.start.localeCompare(b.start));
    saveDataToLocalStorage();
    renderSchedule();
    document.getElementById('schedule-form').reset();
}

function deleteScheduleEvent(evtId) {
    appState.schedule = appState.schedule.filter(e => e.id !== evtId);
    saveDataToLocalStorage();
    renderSchedule();
}

function suggestSchedule() {
    if (confirm("Áp dụng Khung Thời Gian Vàng chuẩn khoa học?")) {
        appState.schedule = [
            { id: 'se_1', day: 'Hàng ngày', title: '📘 Học tập chuyên sâu (Deep Work)', start: '08:00', end: '11:00', type: 'hoc-tap' },
            { id: 'se_2', day: 'Hàng ngày', title: '☘️ Nghỉ trưa giải tỏa', start: '12:00', end: '13:30', type: 'nghi-ngoi' },
            { id: 'se_3', day: 'Hàng ngày', title: '🎮 Thể thao vận động', start: '16:30', end: '17:30', type: 'giai-tri' },
            { id: 'se_4', day: 'Hàng ngày', title: '📘 Tự học & Ôn bài', start: '19:30', end: '21:30', type: 'hoc-tap' }
        ];
        saveDataToLocalStorage();
        renderSchedule();
    }
}

function renderSchedule() {
    const container = document.getElementById('weekly-schedule-container');
    if (!container) return;
    const days = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật", "Hàng ngày"];
    container.innerHTML = days.map(day => {
        const evts = appState.schedule.filter(e => e.day === day);
        return `
            <div class="border-b pb-3 last:border-0">
                <h4 class="text-xs font-black text-slate-400 uppercase mb-2">● ${day}</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
                    ${evts.map(e => `<div class="p-2 border rounded-xl flex justify-between items-center text-xs"><span>${e.title} (${e.start}-${e.end})</span><button onclick="deleteScheduleEvent('${e.id}')" class="text-red-400">x</button></div>`).join('')}
                </div>
            </div>`;
    }).join('');
}

function createHabit(event) {
    event.preventDefault();
    const nameField = document.getElementById('h-name');
    const name = nameField.value.trim();
    if (name) {
        appState.habits.push({ id: 'habit_' + Date.now(), name, completed: false });
        saveDataToLocalStorage();
        renderHabits();
        nameField.value = "";
    }
}

function toggleHabit(habitId) {
    const habit = appState.habits.find(h => h.id === habitId);
    if (habit) {
        habit.completed = !habit.completed;
        if (habit.completed) {
            appState.lastCheckInDate = new Date().toISOString().split('T')[0];
            if (appState.streak === 0) appState.streak = 1;
        }
        saveDataToLocalStorage();
        renderAll();
    }
}

function deleteHabit(habitId) {
    appState.habits = appState.habits.filter(h => h.id !== habitId);
    saveDataToLocalStorage();
    renderAll();
}

function renderHabits() {
    const container = document.getElementById('habits-list-container');
    if (!container) return;
    container.innerHTML = appState.habits.map(h => `
        <div class="flex justify-between items-center p-3 border rounded-xl bg-white text-xs">
            <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" ${h.completed ? 'checked' : ''} onchange="toggleHabit('${h.id}')">
                <span class="${h.completed ? 'line-through text-slate-400' : ''}">${h.name}</span>
            </label>
            <button onclick="deleteHabit('${h.id}')" class="text-slate-300 hover:text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
        </div>`).join('');
    lucide.createIcons();
}

function checkAndAwardBadges() {
    const earned = {
        b1: appState.streak >= 3,
        b2: appState.goals.some(g => g.progress === 100),
        b3: (appState.timeAllocation.hocTap > 0) && (appState.timeAllocation.hocTap / (appState.timeAllocation.hocTap + appState.timeAllocation.nghiNgoi + appState.timeAllocation.giaiTri) >= 0.5),
        b4: parseInt(document.getElementById('discipline-score')?.innerText || "0") >= 100
    };

    const earnedCount = Object.values(earned).filter(v => v).length;
    document.getElementById('dashboard-badges').innerText = `${earnedCount} / 4`;
    document.getElementById('dashboard-streak').innerText = `${appState.streak} ngày liên tiếp`;

    const container = document.getElementById('badges-container');
    if (container) {
        container.innerHTML = BADGES_CONFIG.map(b => `
            <div class="p-4 border rounded-2xl text-center space-y-1 ${earned[b.id] ? b.color : 'bg-slate-50 opacity-40'}">
                <h4 class="text-xs font-black">${b.name}</h4>
                <p class="text-[10px] text-slate-500">${b.desc}</p>
            </div>`).join('');
    }
}

function toggleFocusMode() {
    const btn = document.getElementById('focus-toggle-btn');
    const btnText = document.getElementById('focus-btn-text');
    if (!isFocusMode) {
        isFocusMode = true;
        btn.className = "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase border bg-red-600 text-white border-red-700";
        focusTimeRemaining = 25 * 60;
        pomodoroInterval = setInterval(() => {
            focusTimeRemaining--;
            const mins = Math.floor(focusTimeRemaining / 60);
            const secs = focusTimeRemaining % 60;
            btnText.innerText = `Tập trung: ${mins}:${secs.toString().padStart(2, '0')}`;
            if (focusTimeRemaining <= 0) {
                clearInterval(pomodoroInterval);
                modifyTime('hocTap', 25);
                toggleFocusMode();
            }
        }, 1000);
    } else {
        clearInterval(pomodoroInterval);
        isFocusMode = false;
        btn.className = "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase border bg-white text-slate-700";
        btnText.innerText = "Chế độ tập trung";
    }
}

function exportReport() { window.print(); }

function showToast(msg, type) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `p-3 rounded-xl border text-xs font-semibold bg-slate-900 text-white opacity-90 transition-all`;
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

function saveDataToLocalStorage() { localStorage.setItem('study_balance_state', JSON.stringify(appState)); }
function loadDataFromLocalStorage() { const raw = localStorage.getItem('study_balance_state'); if (raw) { try { appState = { ...appState, ...JSON.parse(raw) }; } catch (e) {} } }

function renderAll() {
    renderTimeAllocation();
    renderAIAlerts();
    renderGoals();
    renderHotGoals();
    renderSchedule();
    renderHabits();
    renderDisciplineScore();
    checkAndAwardBadges();
}