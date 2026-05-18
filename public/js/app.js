// Global State
let currentUser = null;
let socket = null;
let activeTimers = {}; // Store intervals

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    currentUser = JSON.parse(localStorage.getItem('user'));

    if (currentUser) {
        initDashboard();
    } else {
        document.getElementById('landingLayout').classList.remove('d-none');
        document.getElementById('authLayout').classList.add('d-none');
        document.getElementById('dashboardLayout').classList.add('d-none');
    }

    setupEventListeners();
});

// Setup DOM Event Listeners
function setupEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('bookingForm').addEventListener('submit', handleCreateBooking);
    document.getElementById('profileForm').addEventListener('submit', handleUpdateProfile);
}

// Landing Page Routing
function goToLogin(role) {
    document.getElementById('landingLayout').classList.add('d-none');
    document.getElementById('authLayout').classList.remove('d-none');
    
    // Set proper context
    if(role === 'student') {
        document.getElementById('loginTitle').innerText = 'Student Login';
        document.getElementById('regRole').value = 'student';
    } else {
        document.getElementById('loginTitle').innerText = 'Lab Assistant Login';
        document.getElementById('regRole').value = 'lab_assistant';
    }
    toggleRegFields();
    showPage('loginPage');
}

function showLandingPage() {
    document.getElementById('landingLayout').classList.remove('d-none');
    document.getElementById('authLayout').classList.add('d-none');
}

// Show/Hide Registration Fields based on Role
function toggleRegFields() {
    const role = document.getElementById('regRole').value;
    const studentFields = document.getElementById('studentFields');
    if (role === 'student') {
        studentFields.classList.remove('d-none');
        document.getElementById('regDeptId').required = true;
    } else {
        studentFields.classList.add('d-none');
        document.getElementById('regDeptId').required = false;
    }
}

// Authentication
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await UserAPI.login({ email, password });
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        currentUser = response.user;
        showToast('Login successful!', 'success');
        initDashboard();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const data = {
        role: document.getElementById('regRole').value,
        name: document.getElementById('regName').value,
        email: document.getElementById('regEmail').value,
        department: document.getElementById('regDept').value,
        password: document.getElementById('regPassword').value,
    };
    if (data.role === 'student') {
        data.dept_id = document.getElementById('regDeptId').value;
        data.session = document.getElementById('regSession').value;
    }

    try {
        await UserAPI.register(data);
        showToast('Registration successful! Please sign in.', 'success');
        showPage('loginPage');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    if (socket) socket.disconnect();
    
    // Clear all timers
    Object.values(activeTimers).forEach(clearInterval);
    activeTimers = {};
    
    document.getElementById('dashboardLayout').classList.add('d-none');
    showLandingPage();
    showToast('Logged out successfully', 'success');
}

// Dashboard Initialization
function initDashboard() {
    document.getElementById('authLayout').classList.add('d-none');
    document.getElementById('dashboardLayout').classList.remove('d-none');
    
    document.getElementById('userNameDisplay').textContent = currentUser.name;
    document.getElementById('userAvatar').textContent = currentUser.name.charAt(0).toUpperCase();

    setupSidebar();
    initSocket();
    fetchNotifications();

    if (currentUser.role === 'student') {
        showPage('myBookingsPage');
    } else {
        showPage('assistantDashboardPage');
    }
}

function setupSidebar() {
    const nav = document.getElementById('sidebarNav');
    nav.innerHTML = '';
    
    const items = currentUser.role === 'student' ? [
        { id: 'myBookingsPage', title: 'My Bookings', icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
        { id: 'bookEquipmentPage', title: 'Book Equipment', icon: 'M12 20v-6M6 20V10M18 20V4' },
        { id: 'profilePage', title: 'Profile', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' }
    ] : [
        { id: 'assistantDashboardPage', title: 'Live Tracking', icon: 'M12 20v-6M6 20V10M18 20V4' },
        { id: 'financePage', title: 'Accounts & Fines', icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' }
    ];

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'nav-item';
        div.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${item.icon}"></path></svg> <span>${item.title}</span>`;
        div.onclick = () => showPage(item.id);
        nav.appendChild(div);
    });
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const p = document.getElementById(pageId);
    if(p) p.classList.add('active');

    // Handle Active Nav State
    document.querySelectorAll('.nav-item').forEach(nav => {
        if (nav.textContent.trim() === document.getElementById(pageId)?.querySelector('h3')?.textContent) {
            nav.classList.add('active');
        } else {
            nav.classList.remove('active');
        }
    });

    // Page Specific Loads
    if (pageId === 'bookEquipmentPage') loadAvailableEquipment();
    if (pageId === 'myBookingsPage') loadStudentBookings();
    if (pageId === 'assistantDashboardPage') loadAssistantDashboard();
    if (pageId === 'profilePage') loadProfile();
}

// Socket.IO
function initSocket() {
    socket = io();
    
    // Join rooms based on role
    socket.emit('join_user', currentUser.user_id);
    if (currentUser.role === 'lab_assistant') {
        socket.emit('join_dept', currentUser.department);
    }

    socket.on('notification', (data) => {
        showToast(data.message, data.type === 'warning' ? 'warning' : 'success');
        fetchNotifications();
    });

    socket.on('new_booking', (booking) => {
        if (currentUser.role === 'lab_assistant') {
            showToast(`New booking: ${booking.equipment_name}`, 'info');
            loadAssistantDashboard(); // Refresh tracking
        }
    });

    socket.on('booking_updated', (data) => {
        if (currentUser.role === 'lab_assistant') {
            loadAssistantDashboard();
        }
    });
}

// Student Specific Methods
async function loadAvailableEquipment() {
    try {
        const eq = await EquipmentAPI.getAvailable();
        const sel = document.getElementById('bookSelectEq');
        sel.innerHTML = '<option value="" disabled selected>Select Equipment...</option>';
        
        // Group by department
        const grouped = eq.reduce((acc, item) => {
            acc[item.department] = acc[item.department] || [];
            acc[item.department].push(item);
            return acc;
        }, {});

        Object.keys(grouped).forEach(dept => {
            let groupHTML = `<optgroup label="${dept}">`;
            grouped[dept].forEach(item => {
                groupHTML += `<option value="${item.equipment_id}">${item.equipment_name} (${item.serial_no})</option>`;
            });
            groupHTML += `</optgroup>`;
            sel.innerHTML += groupHTML;
        });

    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function handleCreateBooking(e) {
    e.preventDefault();
    try {
        await BookingAPI.createBooking({ equipment_id: document.getElementById('bookSelectEq').value });
        showToast('Booked Successfully!', 'success');
        showPage('myBookingsPage');
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function loadStudentBookings() {
    try {
        const bookings = await BookingAPI.getUserBookings();
        const container = document.getElementById('studentBookingsContainer');
        container.innerHTML = '';
        
        Object.values(activeTimers).forEach(clearInterval); // Clear old timers
        activeTimers = {};

        if (bookings.length === 0) {
            container.innerHTML = '<p class="text-secondary p-3">No active or past bookings.</p>';
            return;
        }

        bookings.forEach(b => {
            const el = document.createElement('div');
            el.className = 'booking-item';
            el.innerHTML = `
                <div class="booking-info">
                    <h4 style="margin-bottom:4px;">${b.equipment_name}</h4>
                    <p style="font-size:0.85rem; color:var(--text-secondary)">Booked: ${moment(b.booking_time).format('h:mm A, MMM D')}</p>
                    <div id="countdown_${b.booking_id}" style="font-weight:600; margin-top:5px; font-size:0.9rem;"></div>
                </div>
                <div style="text-align:right">
                    <div style="font-size:0.85rem; margin-bottom:5px;">Fine: <b id="fine_${b.booking_id}">${b.current_fine} TK</b></div>
                    <div class="status-bar-container" style="width:100px;">
                        <div class="status-bar" id="bar_${b.booking_id}"></div>
                    </div>
                </div>
            `;
            container.appendChild(el);
            
            // Set initial bar styling based on status
            const bar = document.getElementById(`bar_${b.booking_id}`);
            if (b.status === 'returned_ontime') {
                bar.className = 'status-bar status-pink';
                document.getElementById(`countdown_${b.booking_id}`).innerHTML = '<span class="text-success">Returned On Time</span>';
            } else if (b.status === 'returned_late') {
                bar.className = 'status-bar status-purple';
                document.getElementById(`countdown_${b.booking_id}`).innerHTML = '<span class="text-primary">Returned with Fine</span>';
            } else {
                // Active Booking - Start Timer
                startCountdown(b, `countdown_${b.booking_id}`, `bar_${b.booking_id}`, `fine_${b.booking_id}`);
            }
        });
    } catch (e) {
        showToast(e.message, 'error');
    }
}

// Lab Assistant Specific Methods
async function loadAssistantDashboard() {
    try {
        const bookings = await BookingAPI.getDepartmentBookings();
        const tbody = document.getElementById('assistantTrackingTable');
        tbody.innerHTML = '';
        
        Object.values(activeTimers).forEach(clearInterval);
        activeTimers = {};
        
        let activeC = 0, overdueC = 0, returnedC = 0, totalPendingFine = 0;

        bookings.forEach(b => {
            const el = document.createElement('tr');
            el.innerHTML = `
                <td><b>${b.equipment_name}</b></td>
                <td>${b.user_name}</td>
                <td>${b.dept_id}</td>
                <td><div id="a_count_${b.booking_id}"></div><div style="font-size:0.8rem">Fine: <b id="a_fine_${b.booking_id}">${b.current_fine} TK</b></div></td>
                <td style="width:200px;">
                    <div class="status-bar-container">
                        <div class="status-bar" id="a_bar_${b.booking_id}" onclick="handleAssistantBarClick(${b.booking_id}, '${b.status}')"></div>
                    </div>
                </td>
                <td id="a_action_${b.booking_id}"></td>
            `;
            tbody.appendChild(el);

            const bar = document.getElementById(`a_bar_${b.booking_id}`);
            const actionTd = document.getElementById(`a_action_${b.booking_id}`);

            if (b.status === 'returned_ontime') {
                returnedC++;
                bar.className = 'status-bar status-pink';
                document.getElementById(`a_count_${b.booking_id}`).innerHTML = '<span class="text-success">Returned</span>';
                actionTd.innerHTML = `<span class="badge" style="background:var(--status-pink); position:static">Completed</span>`;
            } else if (b.status === 'returned_late') {
                returnedC++;
                totalPendingFine += b.fine_amount;
                bar.className = 'status-bar status-purple';
                document.getElementById(`a_count_${b.booking_id}`).innerHTML = '<span class="text-primary">Returned Late</span>';
                actionTd.innerHTML = `<span class="badge" style="background:var(--status-purple); position:static">Archived</span>`;
            } else {
                activeC++; // Initial classification, might switch to overdue in interval
                
                // Add Checkmark for returning
                actionTd.innerHTML = `<button class="btn btn-icon btn-success" title="Mark as Returned" onclick="returnEquipment(${b.booking_id})"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg></button>`;

                // Start Timer logic which will handle turning it red
                activeTimers[`b_${b.booking_id}`] = setInterval(() => {
                    const now = moment();
                    const deadline = moment(b.deadline);
                    const cd = document.getElementById(`a_count_${b.booking_id}`);
                    const bEl = document.getElementById(`a_bar_${b.booking_id}`);
                    const fEl = document.getElementById(`a_fine_${b.booking_id}`);
                    
                    if (now.isAfter(deadline)) {
                        // Overdue
                        const diff = moment.duration(now.diff(deadline));
                        cd.innerHTML = `<span class="text-danger">Overdue by ${Math.floor(diff.asMinutes())}m ${diff.seconds()}s</span>`;
                        bEl.className = 'status-bar status-red'; // Red Bar
                        bEl.setAttribute('onclick', `sendWarning(${b.booking_id})`); // Lab assistant can now click
                        
                        // Calculate live fine (20TK / min after 5 min grace)
                        const mins = Math.floor(diff.asMinutes());
                        const fine = mins > 5 ? (mins - 5) * 20 : 0;
                        fEl.innerText = `${fine} TK`;
                    } else {
                        // Active & Safe
                        const diff = moment.duration(deadline.diff(now));
                        cd.innerHTML = `<span class="text-success">${Math.floor(diff.asMinutes())}m ${diff.seconds()}s left</span>`;
                        bEl.className = 'status-bar status-green';
                        bEl.removeAttribute('onclick'); // Assistant cannot click Green bar
                    }
                }, 1000);
            }
        });

        // Update stats
        // To be highly accurate we'd recount inside the interval, but doing it statically here for initial load
        document.getElementById('statActive').innerText = activeC;
        document.getElementById('statReturned').innerText = returnedC;
        document.getElementById('statPendingFines').innerText = `${totalPendingFine} TK`;
        // We'll let overdue be counted roughly or updated via interval in a real prod app, 
        // simplified here.

    } catch (e) {
        showToast(e.message, 'error');
    }
}

function returnEquipment(id) {
    showModal("Mark as Returned?", "Are you sure you want to mark this equipment as returned? The fine will be calculated dynamically.", async () => {
        try {
            await BookingAPI.returnEquipment(id);
            showToast("Equipment marked as returned", "success");
            loadAssistantDashboard(); // Refresh
        } catch (e) {
            showToast(e.message, 'error');
        }
    });
}

function sendWarning(id) {
    showModal("Send Warning?", "This will send an instant warning notification to the student.", async () => {
        try {
            await BookingAPI.sendWarning(id);
            showToast("Warning notification sent to student", "success");
        } catch(e) {
            showToast(e.message, 'error');
        }
    });
}

// Countdown utility for student view
function startCountdown(booking, countdownId, barId, fineId) {
    activeTimers[`b_${booking.booking_id}`] = setInterval(() => {
        const now = moment();
        const deadline = moment(booking.deadline);
        const cd = document.getElementById(countdownId);
        const bar = document.getElementById(barId);
        const fEl = document.getElementById(fineId);
        
        if(!cd || !bar) {
            clearInterval(activeTimers[`b_${booking.booking_id}`]);
            return;
        }

        if (now.isAfter(deadline)) {
            // Overdue
            const diff = moment.duration(now.diff(deadline));
            cd.innerHTML = `<span class="text-danger">EXPIRED (Overdue by ${Math.floor(diff.asMinutes())}m ${diff.seconds()}s)</span>`;
            bar.className = 'status-bar status-red';
            
            // Fine
            const mins = Math.floor(diff.asMinutes());
            const fine = mins > 5 ? (mins - 5) * 20 : 0;
            fEl.innerText = `${fine} TK`;
        } else {
            // Safe
            const diff = moment.duration(deadline.diff(now));
            cd.innerHTML = `<span class="text-success">${Math.floor(diff.asMinutes())}m ${diff.seconds()}s remaining</span>`;
            bar.className = 'status-bar status-green';
        }
    }, 1000);
}


// Notification System
async function fetchNotifications() {
    try {
        const notifs = await NotificationAPI.getNotifications();
        const list = document.getElementById('notifList');
        const badge = document.getElementById('notifBadge');
        
        list.innerHTML = '';
        let unread = 0;
        
        notifs.forEach(n => {
            if (!n.is_read) unread++;
            const item = document.createElement('div');
            item.className = `notif-item ${!n.is_read ? 'unread' : ''}`;
            let icon = '';
            if(n.type === 'warning') icon = '🔴';
            else if(n.type === 'return_confirmation') icon = '🩷';
            else icon = '🟢';
            
            item.innerHTML = `<p>${icon} ${n.message}</p><span class="notif-time">${moment(n.created_at).fromNow()}</span>`;
            
            if(!n.is_read) {
                item.onclick = async () => {
                    await NotificationAPI.markAsRead(n.notification_id);
                    fetchNotifications();
                };
                item.style.cursor = 'pointer';
            }
            list.appendChild(item);
        });
        
        badge.innerText = unread;
        badge.style.display = unread > 0 ? 'flex' : 'none';
        
    } catch (e) {
        console.error("Notifications error:", e);
    }
}

function toggleNotifications() {
    document.getElementById('notifDropdown').classList.toggle('show');
}

// Profile
async function loadProfile() {
    try {
        const prof = await UserAPI.getProfile();
        document.getElementById('profName').value = prof.name;
        document.getElementById('profEmail').value = prof.email;
        if(prof.role === 'student') {
            document.getElementById('profStudentFields').classList.remove('d-none');
            document.getElementById('profDeptId').value = prof.dept_id;
            document.getElementById('profSession').value = prof.session || '';
        }
    } catch(e) {
        showToast(e.message, 'error');
    }
}

async function handleUpdateProfile(e) {
    e.preventDefault();
    try {
        const name = document.getElementById('profName').value;
        const session = document.getElementById('profSession').value;
        await UserAPI.updateProfile({ name, session });
        showToast("Profile Updated", "success");
        currentUser.name = name;
        localStorage.setItem('user', JSON.stringify(currentUser));
        document.getElementById('userNameDisplay').textContent = name;
        document.getElementById('userAvatar').textContent = name.charAt(0).toUpperCase();
    } catch(e) {
        showToast(e.message, 'error');
    }
}

// Custom Modal System
let modalCallback = null;

function showModal(title, message, onConfirm) {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalMessage').innerText = message;
    document.getElementById('customModal').classList.remove('d-none');
    modalCallback = onConfirm;
    
    const confirmBtn = document.getElementById('modalConfirmBtn');
    // Remove old listeners to prevent double firing
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
    
    newBtn.addEventListener('click', () => {
        if(modalCallback) modalCallback();
        closeModal();
    });
}

function closeModal() {
    document.getElementById('customModal').classList.add('d-none');
    modalCallback = null;
}

// Toast UI
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
