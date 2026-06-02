// ==========================================
// 1. KHỞI TẠO & SỬA LỖI LƯU TRỮ LOCALSTORAGE
// ==========================================
let users = [];
let currentUser = null;

try {
    // Ép trình duyệt đọc sâu vào ổ cứng để lấy dữ liệu không bị mất tài khoản
    users = JSON.parse(localStorage.getItem('tbdate_users')) || [];
    currentUser = JSON.parse(localStorage.getItem('tbdate_current_user')) || null;
} catch (e) {
    console.error("Lỗi đọc bộ nhớ:", e);
    users = [];
    currentUser = null;
}

document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupEventListeners();
});

function initApp() {
    if (currentUser) {
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('main-container').classList.remove('hidden');
        
        document.getElementById('nav-username').innerText = currentUser.fullname;
        document.getElementById('welcome-name').innerText = currentUser.fullname;
        
        switchTab('home');
        renderHabits();
        renderAnalytics();
        renderProfile();
    } else {
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('main-container').classList.add('hidden');
        showAuthBox('login');
    }
}

// ==========================================
// 2. CHUYỂN MÀN HÌNH & FORM ĐĂNG KÝ / ĐĂNG NHẬP
// ==========================================
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    
    const activeTab = document.getElementById(`tab-${tabName}`);
    if (activeTab) activeTab.classList.remove('hidden');
    
    const activeBtn = document.getElementById(`btn-tab-${tabName}`);
    if (activeBtn) activeBtn.classList.add('active');
}

function showAuthBox(type) {
    if (type === 'login') {
        document.getElementById('login-box').classList.remove('hidden');
        document.getElementById('register-box').classList.add('hidden');
    } else {
        document.getElementById('login-box').classList.add('hidden');
        document.getElementById('register-box').classList.remove('hidden');
    }
}

// ==========================================
// 3. ĐĂNG KÝ TẤT CẢ SỰ KIỆN NÚT BẤM
// ==========================================
function setupEventListeners() {
    // Điều hướng Auth
    document.getElementById('go-to-register').addEventListener('click', (e) => { e.preventDefault(); showAuthBox('register'); });
    document.getElementById('go-to-login').addEventListener('click', (e) => { e.preventDefault(); showAuthBox('login'); });

    // Điều hướng Menu chính
    document.getElementById('btn-tab-home').addEventListener('click', () => switchTab('home'));
    document.getElementById('btn-tab-analytics').addEventListener('click', () => switchTab('analytics'));
    document.getElementById('btn-tab-profile').addEventListener('click', () => switchTab('profile'));
    document.getElementById('nav-profile-btn').addEventListener('click', () => switchTab('profile'));

    // LÔ-GÍC ĐĂNG KÝ TÀI KHOẢN (ĐÃ KHÔI PHỤC VÀ FIX LỖI)
    document.getElementById('register-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('reg-username').value.trim().toLowerCase();
        const fullname = document.getElementById('reg-fullname').value.trim();
        const password = document.getElementById('reg-password').value;

        if (users.some(u => u.username === username)) {
            alert('Tên đăng nhập này đã tồn tại!');
            return;
        }

        const newUser = {
            username: username,
            fullname: fullname,
            password: password,
            habits: [],
            journals: [],
            coins: 0,
            freezeCount: 0,
            maxStreakRecord: 0,
            avatar: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Felix' // Ảnh mặc định ban đầu
        };

        users.push(newUser);
        localStorage.setItem('tbdate_users', JSON.stringify(users));
        alert('Đăng ký thành công! Hãy đăng nhập ngay.');
        document.getElementById('register-form').reset();
        showAuthBox('login');
    });

    // LÔ-GÍC ĐĂNG NHẬP
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim().toLowerCase();
        const password = document.getElementById('login-password').value;

        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            currentUser = user;
            localStorage.setItem('tbdate_current_user', JSON.stringify(currentUser));
            document.getElementById('login-form').reset();
            initApp();
        } else {
            alert('Sai tên đăng nhập hoặc mật khẩu!');
        }
    });

    // ĐĂNG XUẤT
    document.getElementById('logout-btn').addEventListener('click', () => {
        saveUserData();
        currentUser = null;
        localStorage.removeItem('tbdate_current_user');
        initApp();
    });

    // QUẢN LÝ MODALS THÓI QUEN
    document.getElementById('open-add-modal').addEventListener('click', () => { document.getElementById('add-habit-modal').classList.remove('hidden'); });
    document.getElementById('close-modal').addEventListener('click', () => { document.getElementById('add-habit-modal').classList.add('hidden'); });
    document.getElementById('close-edit-modal').addEventListener('click', () => { document.getElementById('edit-habit-modal').classList.add('hidden'); });

    document.getElementById('add-habit-form').addEventListener('submit', (e) => {
        e.preventDefault();
        currentUser.habits.push({
            name: document.getElementById('habit-name').value.trim(),
            group: document.getElementById('habit-target-group').value.trim(),
            streak: 0,
            lastChecked: null,
            history: []
        });
        saveUserData();
        renderHabits();
        document.getElementById('add-habit-form').reset();
        document.getElementById('add-habit-modal').classList.add('hidden');
    });

    document.getElementById('edit-habit-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const idx = document.getElementById('edit-habit-index').value;
        currentUser.habits[idx].name = document.getElementById('edit-habit-name').value.trim();
        currentUser.habits[idx].group = document.getElementById('edit-habit-target').value.trim();
        saveUserData();
        renderHabits();
        document.getElementById('edit-habit-modal').classList.add('hidden');
    });

    // VIẾT NHẬT KÝ
    document.getElementById('journal-form').addEventListener('submit', (e) => {
        e.preventDefault();
        currentUser.journals.unshift({
            date: new Date().toLocaleDateString('vi-VN'),
            title: document.getElementById('journal-title').value.trim(),
            text: document.getElementById('journal-text').value.trim()
        });
        currentUser.coins += 5;
        saveUserData();
        renderAnalytics();
        renderProfile();
        document.getElementById('journal-form').reset();
        alert('Đã lưu bài viết! Bạn nhận được +5 Xu.');
    });

    // MUA KHIÊN ĐÓNG BĂNG CHUỖI
    document.getElementById('buy-freeze-btn').addEventListener('click', () => {
        if (currentUser.coins >= 50) {
            currentUser.coins -= 50;
            currentUser.freezeCount += 1;
            saveUserData();
            renderProfile();
            alert('Mua thành công 1 Khiên Đóng Băng Chuỗi!');
        } else {
            alert('Bạn không đủ Xu tích lũy!');
        }
    });
}

function saveUserData() {
    if (!currentUser) return;
    const idx = users.findIndex(u => u.username === currentUser.username);
    if (idx !== -1) users[idx] = currentUser;
    localStorage.setItem('tbdate_users', JSON.stringify(users));
    localStorage.setItem('tbdate_current_user', JSON.stringify(currentUser));
}

// ==========================================
// 4. XỬ LÝ ĐIỂM DANH CHUỖI & ĐỒ THỊ
// ==========================================
function renderHabits() {
    const listDiv = document.getElementById('habit-list');
    listDiv.innerHTML = '';
    if (currentUser.habits.length === 0) {
        listDiv.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding: 20px;">Hãy tạo chuỗi kỷ luật đầu tiên nhé! 🚀</p>`;
        return;
    }
    
    const d = new Date();
    const todayStr = d.toISOString().split('T')[0];

    currentUser.habits.forEach((habit, index) => {
        const isCheckedToday = (habit.lastChecked === todayStr);
        const card = document.createElement('div');
        card.className = `habit-card ${isCheckedToday ? 'checked-today' : ''}`;
        card.innerHTML = `
            <div class="habit-info">
                <div class="habit-details">
                    <div class="habit-title-container">
                        <h5>${habit.name}</h5>
                        <button class="btn-edit-habit" onclick="openEditModal(${index})"><i class="fa-solid fa-pen"></i></button>
                    </div>
                    <span class="target-badge">${habit.group}</span>
                    <div class="habit-streak-count">Chuỗi hiện tại: <strong>${habit.streak} ngày</strong></div>
                </div>
            </div>
            <button class="btn-checkin ${isCheckedToday ? 'active-check' : ''}" onclick="checkInHabit(${index})" ${isCheckedToday ? 'disabled' : ''}>
                <i class="fa-solid ${isCheckedToday ? 'fa-check' : 'fa-bolt'}"></i>
            </button>
        `;
        listDiv.appendChild(card);
    });
}

window.checkInHabit = function(index) {
    const habit = currentUser.habits[index];
    const todayStr = new Date().toISOString().split('T')[0];
    if (habit.lastChecked === todayStr) return;

    habit.streak += 1;
    habit.lastChecked = todayStr;
    if (!habit.history.includes(todayStr)) habit.history.push(todayStr);

    currentUser.coins += 10;
    if (habit.streak > currentUser.maxStreakRecord) currentUser.maxStreakRecord = habit.streak;

    saveUserData();
    renderHabits();
    renderAnalytics();
    renderProfile();
};

window.openEditModal = function(index) {
    const habit = currentUser.habits[index];
    document.getElementById('edit-habit-index').value = index;
    document.getElementById('edit-habit-name').value = habit.name;
    document.getElementById('edit-habit-target').value = habit.group;
    document.getElementById('edit-habit-modal').classList.remove('hidden');
};

function renderAnalytics() {
    let total = 0;
    currentUser.habits.forEach(h => total += h.history.length);
    document.getElementById('stat-total-checkins').innerText = total;

    const chartContainer = document.getElementById('chart-days-container');
    chartContainer.innerHTML = '';
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const barWrapper = document.createElement('div');
        barWrapper.className = 'chart-bar-wrapper';
        barWrapper.innerHTML = `
            <div class="chart-bar" style="height: 40%; opacity: 0.8"></div>
            <span class="chart-label">${days[d.getDay()]}</span>
        `;
        chartContainer.appendChild(barWrapper);
    }

    const journalList = document.getElementById('journal-container');
    journalList.innerHTML = '';
    currentUser.journals.forEach(j => {
        const item = document.createElement('div');
        item.className = 'journal-item';
        item.innerHTML = `<div class="journal-meta"><span>${j.title}</span><span style="color:var(--text-muted);">${j.date}</span></div><p>${j.text}</p>`;
        journalList.appendChild(item);
    });
}

function renderProfile() {
    document.getElementById('prof-fullname').innerText = currentUser.fullname;
    document.getElementById('prof-username-span').innerText = currentUser.username;
    document.getElementById('prof-max-streak').innerText = currentUser.maxStreakRecord;
    document.getElementById('prof-coins').innerText = currentUser.coins;
    document.getElementById('prof-freeze-count').innerText = currentUser.freezeCount;
    if (currentUser.avatar) document.getElementById('current-avatar-img').src = currentUser.avatar;

    const badgeContainer = document.getElementById('badges-container');
    badgeContainer.innerHTML = '';
    if (currentUser.maxStreakRecord >= 1) badgeContainer.innerHTML += `<span class="badge-tag">🏆 Khởi Đầu</span>`;
    if (currentUser.maxStreakRecord >= 7) badgeContainer.innerHTML += `<span class="badge-tag">💎 Vượt Ngưỡng</span>`;
}

// ==========================================
// 5. CHỨC NĂNG CHỌN VÀ ĐỔI AVATAR TÀI KHOẢN
// ==========================================
window.toggleAvatarShelf = function() {
    document.getElementById('avatar-shelf').classList.toggle('hidden');
};

window.changeAvatar = function(avatarUrl) {
    if (!currentUser) return;
    currentUser.avatar = avatarUrl;
    document.getElementById('current-avatar-img').src = avatarUrl;
    saveUserData();
    document.getElementById('avatar-shelf').classList.add('hidden');
};