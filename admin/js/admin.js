/* ==========================================================================
   My Skin My Health — Admin Ecosystem Core Application Controller
   --------------------------------------------------------------------------
   Modular SPA Architecture powering Admin, Doctor, and Staff Panels,
   with 25 interconnected systems, real-time sync, and role-based access.
   ========================================================================== */
(function (global) {
    'use strict';

    var db = global.LumoraDB;
    if (!db) {
        console.error('LumoraDB engine is required.');
        return;
    }

    var app = {
        currentUser: null,
        currentRoute: 'dashboard',
        chartInstances: {},
        calendarState: {
            currentDate: new Date(),
            view: 'month', // month, week, day
            doctorId: 'all'
        },

        init: function () {
            this.bindGlobalEvents();
            this.checkSession();
        },

        checkSession: function () {
            var session = db.getSession();
            var loader = document.getElementById('admin-app-loader');

            if (session) {
                this.currentUser = session;
                this.showAppShell();
                this.renderSidebarNav();
                this.handleRouting();
            } else {
                this.showLoginScreen();
            }

            if (loader) {
                setTimeout(function () {
                    loader.classList.add('is-hidden');
                }, 350);
            }
        },

        showAppShell: function () {
            document.getElementById('admin-shell').classList.remove('is-hidden');
            document.getElementById('admin-login-screen').classList.add('is-hidden');

            // Update user badge in sidebar and header
            var user = this.currentUser;
            document.getElementById('sidebar-user-name').textContent = user.name || 'User';
            document.getElementById('sidebar-user-role').textContent = user.role;
            document.getElementById('sidebar-role-badge').textContent = user.role + ' Panel';
            document.getElementById('header-user-name').textContent = (user.name || '').split(' ')[0];

            if (user.avatar) {
                document.getElementById('sidebar-user-avatar').src = user.avatar;
                document.getElementById('header-user-avatar').src = user.avatar;
            }
        },

        showLoginScreen: function () {
            document.getElementById('admin-shell').classList.add('is-hidden');
            document.getElementById('admin-login-screen').classList.remove('is-hidden');
        },

        bindGlobalEvents: function () {
            var self = this;

            // Route changes via Hash
            global.addEventListener('hashchange', function () {
                self.handleRouting();
            });

            // Mobile sidebar toggles
            var mobileToggle = document.getElementById('header-mobile-toggle');
            var sidebar = document.getElementById('admin-sidebar');
            var sidebarBackdrop = document.getElementById('sidebar-mobile-backdrop');
            var sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');

            if (mobileToggle) {
                mobileToggle.addEventListener('click', function () {
                    sidebar.classList.toggle('sidebar-open');
                    sidebarBackdrop.classList.toggle('is-active');
                });
            }

            if (sidebarBackdrop) {
                sidebarBackdrop.addEventListener('click', function () {
                    sidebar.classList.remove('sidebar-open');
                    sidebarBackdrop.classList.remove('is-active');
                });
            }

            if (sidebarToggleBtn) {
                sidebarToggleBtn.addEventListener('click', function () {
                    sidebar.classList.remove('sidebar-open');
                    if (sidebarBackdrop) sidebarBackdrop.classList.remove('is-active');
                });
            }

            // Logout buttons
            var logoutBtn = document.getElementById('sidebar-logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', function () {
                    self.confirmDialog('Sign Out', 'Are you sure you want to sign out of your panel?', function () {
                        db.logout(false);
                        self.currentUser = null;
                        self.showToast('Signed Out', 'You have been signed out successfully.', 'info');
                        self.showLoginScreen();
                    });
                });
            }

            // Profile modal click triggers
            var headerProfile = document.getElementById('header-profile-trigger');
            if (headerProfile) {
                headerProfile.style.cursor = 'pointer';
                headerProfile.addEventListener('click', function () {
                    self.openCurrentUserProfileModal();
                });
            }

            var sidebarUserCard = document.getElementById('sidebar-user-card');
            if (sidebarUserCard) {
                sidebarUserCard.style.cursor = 'pointer';
                sidebarUserCard.addEventListener('click', function (e) {
                    if (e.target.closest('#sidebar-logout-btn')) return;
                    self.openCurrentUserProfileModal();
                });
            }

            // Quick New Booking header action
            var quickNewAppt = document.getElementById('btn-quick-new-appt');
            if (quickNewAppt) {
                quickNewAppt.addEventListener('click', function () {
                    self.openNewAppointmentModal();
                });
            }

            // Global Search input
            var globalSearch = document.getElementById('admin-global-search');
            if (globalSearch) {
                globalSearch.addEventListener('input', function (e) {
                    var q = e.target.value.trim().toLowerCase();
                    if (self.currentRoute === 'appointments') {
                        self.renderAppointments(q);
                    } else if (self.currentRoute === 'patients') {
                        self.renderPatients(q);
                    } else if (self.currentRoute === 'doctors') {
                        self.renderDoctors(q);
                    }
                });
            }

            // Demo Pills in Login Screen
            document.querySelectorAll('.demo-pill').forEach(function (pill) {
                pill.addEventListener('click', function () {
                    document.querySelectorAll('.demo-pill').forEach(function (p) { p.classList.remove('is-active'); });
                    pill.classList.add('is-active');
                    document.getElementById('login-email').value = pill.dataset.email;
                    document.getElementById('login-password').value = pill.dataset.pass;
                });
            });

            // Login Form submission
            var loginForm = document.getElementById('admin-login-form');
            if (loginForm) {
                loginForm.addEventListener('submit', function (e) {
                    e.preventDefault();
                    var email = document.getElementById('login-email').value;
                    var pass = document.getElementById('login-password').value;
                    var res = db.login(email, pass);

                    if (res.success && (res.user.role === 'ADMIN' || res.user.role === 'DOCTOR' || res.user.role === 'STAFF')) {
                        self.currentUser = res.user;
                        document.getElementById('login-error-msg').classList.add('is-hidden');
                        self.showAppShell();
                        self.renderSidebarNav();
                        window.location.hash = '#dashboard';
                        self.handleRouting();
                        self.showToast('Welcome back', 'Logged in as ' + res.user.name + ' (' + res.user.role + ')', 'success');
                    } else if (res.success && res.user.role === 'PATIENT') {
                        // Patient logged in via admin form
                        window.location.href = '/index.html';
                    } else {
                        var errEl = document.getElementById('login-error-msg');
                        errEl.textContent = res.message || 'Invalid credentials.';
                        errEl.classList.remove('is-hidden');
                    }
                });
            }

            // Modals close button & backdrop
            var modalCloseBtn = document.getElementById('admin-modal-close-btn');
            var modalBackdrop = document.getElementById('admin-modal-backdrop');
            if (modalCloseBtn) modalCloseBtn.addEventListener('click', this.closeModal.bind(this));
            if (modalBackdrop) modalBackdrop.addEventListener('click', this.closeModal.bind(this));

            // Drawer close button & backdrop
            var drawerCloseBtn = document.getElementById('admin-drawer-close-btn');
            var drawerBackdrop = document.getElementById('admin-drawer-backdrop');
            if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', this.closeDrawer.bind(this));
            if (drawerBackdrop) drawerBackdrop.addEventListener('click', this.closeDrawer.bind(this));

            // Database Live Sync Subscription
            db.subscribe(function () {
                self.refreshCurrentView();
            });
        },

        /* ------------------------------------------------ Navigation & RBAC */
        renderSidebarNav: function () {
            var menu = document.getElementById('sidebar-menu');
            if (!menu || !this.currentUser) return;

            var role = this.currentUser.role;
            var perms = this.currentUser.permissions || [];

            function can(mod) {
                if (role === 'ADMIN') return true;
                if (perms.indexOf('all') !== -1) return true;
                return perms.indexOf(mod) !== -1;
            }

            var html = '';

            // Group: Core
            html += '<div class="nav-group-title">Core</div>';
            if (can('dashboard')) {
                html += '<a href="#dashboard" class="nav-item" data-route="dashboard"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg><span>Dashboard</span></a>';
            }
            if (can('appointments')) {
                var pendingCount = db.getAppointments().filter(function(a){ return a.status === 'Pending'; }).length;
                html += '<a href="#appointments" class="nav-item" data-route="appointments"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg><span>Appointments</span>' + (pendingCount > 0 ? '<span class="nav-badge">' + pendingCount + '</span>' : '') + '</a>';
            }
            if (can('calendar')) {
                html += '<a href="#calendar" class="nav-item" data-route="calendar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span>Calendar</span></a>';
            }
            if (can('patients')) {
                html += '<a href="#patients" class="nav-item" data-route="patients"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><span>Patients Directory</span></a>';
            }

            // Group: Clinical & Catalogue
            html += '<div class="nav-group-title">Clinical & Catalogue</div>';
            if (role === 'DOCTOR') {
                html += '<a href="#my-availability" class="nav-item" data-route="my-availability"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span>My Availability</span></a>';
                html += '<a href="#my-profile" class="nav-item" data-route="my-profile"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span>Doctor Profile</span></a>';
            } else {
                if (can('doctors')) {
                    html += '<a href="#doctors" class="nav-item" data-route="doctors"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg><span>Doctors</span></a>';
                }
                if (can('services')) {
                    html += '<a href="#services" class="nav-item" data-route="services"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg><span>Services</span></a>';
                }
            }

            if (can('blogs')) {
                html += '<a href="#blogs" class="nav-item" data-route="blogs"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg><span>Blog Articles</span></a>';
            }
            if (can('reviews')) {
                html += '<a href="#reviews" class="nav-item" data-route="reviews"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg><span>Reviews & Testimonials</span></a>';
            }

            // Group: Insights & Finance
            if (can('analytics') || can('reports') || can('revenue')) {
                html += '<div class="nav-group-title">Insights & Finance</div>';
                if (can('analytics')) {
                    html += '<a href="#analytics" class="nav-item" data-route="analytics"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg><span>Analytics</span></a>';
                }
                if (can('reports')) {
                    html += '<a href="#reports" class="nav-item" data-route="reports"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg><span>Reports Generator</span></a>';
                }
                if (can('revenue')) {
                    html += '<a href="#revenue" class="nav-item" data-route="revenue"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg><span>Revenue Tracking</span></a>';
                }
            }

            // Group: Management & Automation
            if (can('contact') || can('whatsapp') || can('staff') || can('settings')) {
                html += '<div class="nav-group-title">Administration</div>';
                if (can('contact')) {
                    html += '<a href="#contact" class="nav-item" data-route="contact"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><span>Contact & Timings</span></a>';
                }
                if (can('whatsapp')) {
                    html += '<a href="#whatsapp" class="nav-item" data-route="whatsapp"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg><span>WhatsApp Automation</span></a>';
                }
                if (can('staff')) {
                    html += '<a href="#staff" class="nav-item" data-route="staff"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><span>Staff & Permissions</span></a>';
                }
                if (can('settings')) {
                    html += '<a href="#settings" class="nav-item" data-route="settings"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg><span>Settings & Audit</span></a>';
                }
            }

            menu.innerHTML = html;
        },

        /* ---------------------------------------------------- Router Hub */
        handleRouting: function () {
            var rawHash = window.location.hash.replace(/^#\/?/, '') || 'dashboard';
            var route = rawHash.split('?')[0].split('/')[0];
            this.currentRoute = route;

            // Update active nav class
            document.querySelectorAll('.nav-item').forEach(function (el) {
                if (el.dataset.route === route) {
                    el.classList.add('is-active');
                } else {
                    el.classList.remove('is-active');
                }
            });

            // Close mobile sidebar on route switch
            var sidebar = document.getElementById('admin-sidebar');
            var sidebarBackdrop = document.getElementById('sidebar-mobile-backdrop');
            if (sidebar) sidebar.classList.remove('sidebar-open');
            if (sidebarBackdrop) sidebarBackdrop.classList.remove('is-active');

            // Dispatch to specific renderer
            var titleEl = document.getElementById('header-page-title');
            var subEl = document.getElementById('header-page-subtitle');
            var container = document.getElementById('admin-content-body');
            if (!container) return;

            // Route permission enforcement
            if (this.currentUser && this.currentUser.role !== 'ADMIN') {
                var perms = this.currentUser.permissions || [];
                if (route !== 'dashboard' && route !== 'my-availability' && route !== 'my-profile' && perms.indexOf(route) === -1 && perms.indexOf('all') === -1) {
                    container.innerHTML = `
                        <div class="admin-card" style="text-align:center; padding: 48px 24px;">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            <h2 style="margin:16px 0 8px 0;">Access Denied</h2>
                            <p style="color:var(--text-secondary);">You do not have permission to access the <strong>${route}</strong> module.</p>
                            <a href="#dashboard" class="btn btn-primary" style="margin-top:16px;">Back to Dashboard</a>
                        </div>
                    `;
                    titleEl.textContent = 'Access Restricted';
                    subEl.textContent = 'Security Policy';
                    return;
                }
            }

            switch (route) {
                case 'dashboard':
                    titleEl.textContent = 'Dashboard';
                    subEl.textContent = 'Real-time overview of clinic appointments, revenue & activity';
                    this.renderDashboard();
                    break;
                case 'appointments':
                    titleEl.textContent = 'Appointments';
                    subEl.textContent = 'Manage, confirm, reschedule and review all patient bookings';
                    this.renderAppointments();
                    break;
                case 'calendar':
                    titleEl.textContent = 'Appointment Calendar';
                    subEl.textContent = 'Interactive schedule timeline and doctor availability view';
                    this.renderCalendar();
                    break;
                case 'patients':
                    titleEl.textContent = 'Patients Directory';
                    subEl.textContent = 'Patient medical records, appointment history, and profiles';
                    this.renderPatients();
                    break;
                case 'doctors':
                    titleEl.textContent = 'Doctor Management';
                    subEl.textContent = 'Specialist profiles, weekly working hours & assigned services';
                    this.renderDoctors();
                    break;
                case 'my-availability':
                    titleEl.textContent = 'My Availability';
                    subEl.textContent = 'Configure your weekly consultation hours and day-offs';
                    this.renderDoctorAvailabilitySelf();
                    break;
                case 'my-profile':
                    titleEl.textContent = 'Doctor Profile';
                    subEl.textContent = 'Update your professional bio, credentials and photo';
                    this.renderDoctorProfileSelf();
                    break;
                case 'services':
                    titleEl.textContent = 'Skin & Health Services';
                    subEl.textContent = 'Service catalogue, pricing, durations and assigned doctors';
                    this.renderServices();
                    break;
                case 'blogs':
                    titleEl.textContent = 'Blog Management';
                    subEl.textContent = 'Publish skincare and wellness guides, articles and featured stories';
                    this.renderBlogs();
                    break;
                case 'reviews':
                    titleEl.textContent = 'Reviews & Testimonials';
                    subEl.textContent = 'Manage patient feedback, star ratings, and homepage features';
                    this.renderReviews();
                    break;
                case 'analytics':
                    titleEl.textContent = 'Analytics Hub';
                    subEl.textContent = 'Performance metrics, attendance rates, and patient trends';
                    this.renderAnalytics();
                    break;
                case 'reports':
                    titleEl.textContent = 'Reports Generator';
                    subEl.textContent = 'Export comprehensive CSV, print, and PDF clinical reports';
                    this.renderReports();
                    break;
                case 'revenue':
                    titleEl.textContent = 'Revenue Tracking';
                    subEl.textContent = 'Financial overview, billing records, and doctor earnings';
                    this.renderRevenue();
                    break;
                case 'contact':
                    titleEl.textContent = 'Website Contact & Timings';
                    subEl.textContent = 'Master clinic phone numbers, address, OPD hours, and maps';
                    this.renderContact();
                    break;
                case 'whatsapp':
                    titleEl.textContent = 'WhatsApp Automation';
                    subEl.textContent = 'Configure automated message templates and patient alerts';
                    this.renderWhatsApp();
                    break;
                case 'staff':
                    titleEl.textContent = 'Staff Roles & Permissions';
                    subEl.textContent = 'Manage clinic personnel, access levels and authorization';
                    this.renderStaff();
                    break;
                case 'settings':
                    titleEl.textContent = 'Settings & Audit Logs';
                    subEl.textContent = 'System preferences, backup export/import and security logs';
                    this.renderSettings();
                    break;
                default:
                    this.renderDashboard();
                    break;
            }
        },

        refreshCurrentView: function () {
            // Re-render only if user is logged in
            if (this.currentUser) {
                this.renderSidebarNav();
                this.handleRouting();
            }
        },

        /* ------------------------------------------------ 1. DASHBOARD */
        renderDashboard: function () {
            var container = document.getElementById('admin-content-body');
            var analytics = db.getAnalytics(30);
            var isDoctor = this.currentUser && this.currentUser.role === 'DOCTOR';
            var doctorId = isDoctor ? this.currentUser.refId : null;

            var appts = db.getAppointments(doctorId);
            var todayIso = new Date().toISOString().slice(0, 10);
            var todayAppts = appts.filter(function (a) { return a.date === todayIso; });
            var pendingAppts = appts.filter(function (a) { return a.status === 'Pending'; });

            container.innerHTML = `
                <div class="kpi-grid">
                    <div class="kpi-card">
                        <div class="kpi-top">
                            <span class="kpi-label">Today's Visits</span>
                            <div class="kpi-icon-wrap">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            </div>
                        </div>
                        <div class="kpi-value">${todayAppts.length}</div>
                        <div class="kpi-trend">Scheduled for today (${todayIso})</div>
                    </div>

                    <div class="kpi-card kpi-warning">
                        <div class="kpi-top">
                            <span class="kpi-label">Pending Approval</span>
                            <div class="kpi-icon-wrap" style="background:var(--status-warning-bg); color:var(--status-warning);">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            </div>
                        </div>
                        <div class="kpi-value">${pendingAppts.length}</div>
                        <div class="kpi-trend">Requires confirmation</div>
                    </div>

                    <div class="kpi-card kpi-success">
                        <div class="kpi-top">
                            <span class="kpi-label">Total Appointments</span>
                            <div class="kpi-icon-wrap" style="background:var(--status-success-bg); color:var(--status-success);">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                        </div>
                        <div class="kpi-value">${appts.length}</div>
                        <div class="kpi-trend">${analytics.attendanceRate}% Attendance Rate</div>
                    </div>

                    ${!isDoctor ? `
                        <div class="kpi-card kpi-purple">
                            <div class="kpi-top">
                                <span class="kpi-label">Total Revenue</span>
                                <div class="kpi-icon-wrap" style="background:var(--status-purple-bg); color:#be84d8;">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                </div>
                            </div>
                            <div class="kpi-value">₹${analytics.totalRevenue.toLocaleString()}</div>
                            <div class="kpi-trend">₹${analytics.pendingRevenue.toLocaleString()} Pending</div>
                        </div>
                    ` : `
                        <div class="kpi-card">
                            <div class="kpi-top">
                                <span class="kpi-label">My Attended</span>
                                <div class="kpi-icon-wrap">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                                </div>
                            </div>
                            <div class="kpi-value">${appts.filter(function(a){ return a.status === 'Attended'; }).length}</div>
                            <div class="kpi-trend">Completed visits</div>
                        </div>
                    `}
                </div>

                <!-- Quick Action Shortcuts -->
                <div class="quick-actions-bar">
                    <button type="button" class="quick-action-btn" id="qa-add-appt">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        <span>Book Appointment</span>
                    </button>
                    ${!isDoctor ? `
                        <button type="button" class="quick-action-btn" id="qa-add-patient">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                            <span>Add Patient</span>
                        </button>
                        <button type="button" class="quick-action-btn" id="qa-add-doc">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                            <span>Add Doctor</span>
                        </button>
                        <button type="button" class="quick-action-btn" id="qa-add-svc">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/></svg>
                            <span>Add Service</span>
                        </button>
                        <button type="button" class="quick-action-btn" id="qa-add-blog">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                            <span>Write Blog</span>
                        </button>
                    ` : ''}
                    <a href="#calendar" class="quick-action-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/></svg>
                        <span>View Calendar</span>
                    </a>
                </div>

                <div style="display:grid; grid-template-columns: 2fr 1fr; gap:20px; margin-bottom:24px;">
                    <!-- Recent Appointments -->
                    <div class="admin-card">
                        <div class="card-header">
                            <div>
                                <h3 class="card-title">Recent Appointments</h3>
                                <span class="card-subtitle">Latest booking activity</span>
                            </div>
                            <a href="#appointments" class="btn btn-outline btn-sm">View All</a>
                        </div>
                        <div class="table-responsive">
                            <table class="admin-table">
                                <thead>
                                    <tr>
                                        <th>Ref</th>
                                        <th>Patient</th>
                                        <th>Service</th>
                                        <th>Date & Time</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${appts.slice(0, 6).map(function (a) {
                                        var svc = db.getServiceById(a.serviceId);
                                        return `
                                            <tr class="table-row-clickable" data-ref="${a.reference}">
                                                <td><strong style="color:var(--brand-teal);">${a.reference}</strong></td>
                                                <td>${a.patientName}<br><small style="color:var(--text-muted);">${a.patientPhone || ''}</small></td>
                                                <td>${svc ? svc.name : 'Consultation'}</td>
                                                <td>${a.date}<br><small style="color:var(--text-muted);">${a.time}</small></td>
                                                <td><span class="badge badge-${a.status.toLowerCase().replace(/\s+/g, '-')}">${a.status}</span></td>
                                                <td>
                                                    <button type="button" class="btn btn-secondary btn-sm btn-view-appt" data-ref="${a.reference}">Manage</button>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Recent Audit Activity -->
                    <div class="admin-card">
                        <div class="card-header">
                            <div>
                                <h3 class="card-title">Recent Activity</h3>
                                <span class="card-subtitle">Audit trail log</span>
                            </div>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:12px;">
                            ${db.getAuditLogs().slice(0, 6).map(function (log) {
                                return `
                                    <div style="display:flex; gap:10px; font-size:12px; border-bottom:1px solid var(--border-subtle); padding-bottom:8px;">
                                        <div style="width:6px; height:6px; border-radius:50%; background:var(--brand-teal); margin-top:6px; flex-shrink:0;"></div>
                                        <div style="flex:1;">
                                             <div><strong>${log.user}</strong> <span style="color:var(--text-muted);">(${log.role})</span></div>
                                             <div style="color:var(--text-secondary);">${log.details || log.action}</div>
                                             <div style="font-size:10px; color:var(--text-muted);">${new Date(log.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} • ${new Date(log.timestamp).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `;

            // Bind quick actions
            var self = this;
            var qaAddAppt = document.getElementById('qa-add-appt');
            if (qaAddAppt) qaAddAppt.addEventListener('click', function () { self.openNewAppointmentModal(); });
            var qaAddPatient = document.getElementById('qa-add-patient');
            if (qaAddPatient) qaAddPatient.addEventListener('click', function () { self.openPatientModal(); });
            var qaAddDoc = document.getElementById('qa-add-doc');
            if (qaAddDoc) qaAddDoc.addEventListener('click', function () { self.openDoctorModal(); });
            var qaAddSvc = document.getElementById('qa-add-svc');
            if (qaAddSvc) qaAddSvc.addEventListener('click', function () { self.openServiceModal(); });
            var qaAddBlog = document.getElementById('qa-add-blog');
            if (qaAddBlog) qaAddBlog.addEventListener('click', function () { self.openBlogModal(); });

            // Bind full row click for appointments
            container.querySelectorAll('.table-row-clickable').forEach(function (row) {
                row.addEventListener('click', function (e) {
                    if (e.target.closest('button') || e.target.closest('a')) return;
                    if (row.dataset.ref) {
                        self.openAppointmentDetailsDrawer(row.dataset.ref);
                    }
                });
            });

            // Bind manage buttons
            container.querySelectorAll('.btn-view-appt').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    self.openAppointmentDetailsDrawer(btn.dataset.ref);
                });
            });
        },

        /* ------------------------------------------------ 2. APPOINTMENTS */
        renderAppointments: function (searchQuery) {
            var container = document.getElementById('admin-content-body');
            var isDoctor = this.currentUser && this.currentUser.role === 'DOCTOR';
            var doctorId = isDoctor ? this.currentUser.refId : null;
            var allAppts = db.getAppointments(doctorId);
            var doctors = db.getDoctors();
            var services = db.getServices();

            var q = (searchQuery || '').toLowerCase();
            var filtered = allAppts.filter(function (a) {
                if (!q) return true;
                return (a.reference && a.reference.toLowerCase().indexOf(q) !== -1) ||
                       (a.patientName && a.patientName.toLowerCase().indexOf(q) !== -1) ||
                       (a.patientPhone && a.patientPhone.toLowerCase().indexOf(q) !== -1) ||
                       (a.status && a.status.toLowerCase().indexOf(q) !== -1);
            });

            container.innerHTML = `
                <div class="admin-card">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">Appointments Directory</h3>
                            <span class="card-subtitle">Showing ${filtered.length} of ${allAppts.length} appointments</span>
                        </div>
                        <div style="display:flex; gap:10px;">
                            <button type="button" class="btn btn-primary btn-sm" id="btn-create-appt">+ New Appointment</button>
                        </div>
                    </div>

                    <!-- Filters Bar -->
                    <div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:18px; background:var(--bg-surface); padding:12px; border-radius:var(--radius-md);">
                        <div style="flex:1; min-width:200px;">
                            <input type="text" id="appt-filter-search" placeholder="Search patient, phone, ref..." value="${searchQuery || ''}" style="width:100%; padding:8px 12px; background:var(--bg-input); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); color:#fff;">
                        </div>
                        <div>
                            <select id="appt-filter-status" style="padding:8px 12px; background:var(--bg-input); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); color:#fff;">
                                <option value="all">All Statuses</option>
                                <option value="Pending">Pending</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Attended">Attended</option>
                                <option value="Not Attended">Not Attended</option>
                                <option value="Rescheduled">Rescheduled</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                        ${!isDoctor ? `
                            <div>
                                <select id="appt-filter-doctor" style="padding:8px 12px; background:var(--bg-input); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); color:#fff;">
                                    <option value="all">All Doctors</option>
                                    ${doctors.map(function(d){ return `<option value="${d.id}">${d.name}</option>`; }).join('')}
                                </select>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Table -->
                    <div class="table-responsive">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Ref</th>
                                    <th>Patient</th>
                                    <th>Doctor</th>
                                    <th>Service</th>
                                    <th>Date & Time</th>
                                    <th>Fee</th>
                                    <th>Status</th>
                                    <th>Quick Actions</th>
                                </tr>
                            </thead>
                            <tbody id="appts-table-body">
                                ${filtered.length === 0 ? `
                                    <tr><td colspan="8" style="text-align:center; padding:32px; color:var(--text-muted);">No appointments found.</td></tr>
                                ` : filtered.map(function (a) {
                                    var doc = db.getDoctorById(a.doctorId);
                                    var svc = db.getServiceById(a.serviceId);
                                    return `
                                        <tr class="table-row-clickable" data-ref="${a.reference}">
                                            <td><strong style="color:var(--brand-teal);">${a.reference}</strong></td>
                                            <td>
                                                <div style="font-weight:600;">${a.patientName}</div>
                                                <div style="font-size:11px; color:var(--text-muted);">${a.patientPhone || 'No phone'}</div>
                                            </td>
                                            <td>${doc ? doc.name : 'Assigned Doctor'}</td>
                                            <td>${svc ? svc.name : 'Consultation'}</td>
                                            <td>
                                                <div>${a.date}</div>
                                                <div style="font-size:11px; color:var(--text-muted);">${a.time}</div>
                                            </td>
                                            <td>₹${a.fee || 500} <span style="font-size:10px; color:${a.paymentStatus==='Paid'?'var(--status-success)':'var(--status-warning)'};">(${a.paymentStatus||'Pending'})</span></td>
                                            <td><span class="badge badge-${a.status.toLowerCase().replace(/\s+/g, '-')}">${a.status}</span></td>
                                            <td>
                                                <div class="table-actions">
                                                    <button type="button" class="btn btn-secondary btn-sm btn-manage-appt" data-ref="${a.reference}">Manage</button>
                                                    <button type="button" class="btn btn-outline btn-sm btn-wa-notify" data-ref="${a.reference}" title="Send WhatsApp alert">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                                                    </button>
                                                    <button type="button" class="btn btn-outline btn-sm btn-delete-appt" data-ref="${a.reference}" data-name="${a.patientName}" title="Delete Appointment" style="color:#ff5c75; border-color:rgba(255,92,117,0.3); background:rgba(255,92,117,0.08); padding:6px 8px; display:inline-flex; align-items:center;">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            var self = this;
            var btnCreate = document.getElementById('btn-create-appt');
            if (btnCreate) btnCreate.addEventListener('click', function () { self.openNewAppointmentModal(); });

            var filterSearch = document.getElementById('appt-filter-search');
            var filterStatus = document.getElementById('appt-filter-status');
            var filterDoctor = document.getElementById('appt-filter-doctor');

            function applyFilters() {
                var search = filterSearch ? filterSearch.value.trim().toLowerCase() : '';
                var st = filterStatus ? filterStatus.value : 'all';
                var dc = filterDoctor ? filterDoctor.value : 'all';

                var res = allAppts.filter(function (a) {
                    var matchSearch = !search ||
                        (a.reference && a.reference.toLowerCase().indexOf(search) !== -1) ||
                        (a.patientName && a.patientName.toLowerCase().indexOf(search) !== -1) ||
                        (a.patientPhone && a.patientPhone.toLowerCase().indexOf(search) !== -1);
                    var matchStatus = st === 'all' || a.status === st;
                    var matchDoctor = dc === 'all' || a.doctorId === dc;
                    return matchSearch && matchStatus && matchDoctor;
                });

                var tbody = document.getElementById('appts-table-body');
                if (!tbody) return;

                if (res.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:32px; color:var(--text-muted);">No matching appointments found.</td></tr>';
                } else {
                    tbody.innerHTML = res.map(function (a) {
                        var doc = db.getDoctorById(a.doctorId);
                        var svc = db.getServiceById(a.serviceId);
                        return `
                            <tr class="table-row-clickable" data-ref="${a.reference}">
                                <td><strong style="color:var(--brand-teal);">${a.reference}</strong></td>
                                <td>
                                    <div style="font-weight:600;">${a.patientName}</div>
                                    <div style="font-size:11px; color:var(--text-muted);">${a.patientPhone || 'No phone'}</div>
                                </td>
                                <td>${doc ? doc.name : 'Assigned Doctor'}</td>
                                <td>${svc ? svc.name : 'Consultation'}</td>
                                <td>
                                    <div>${a.date}</div>
                                    <div style="font-size:11px; color:var(--text-muted);">${a.time}</div>
                                </td>
                                <td>₹${a.fee || 500} <span style="font-size:10px; color:${a.paymentStatus==='Paid'?'var(--status-success)':'var(--status-warning)'};">(${a.paymentStatus||'Pending'})</span></td>
                                <td><span class="badge badge-${a.status.toLowerCase().replace(/\s+/g, '-')}">${a.status}</span></td>
                                <td>
                                    <div class="table-actions">
                                        <button type="button" class="btn btn-secondary btn-sm btn-manage-appt" data-ref="${a.reference}">Manage</button>
                                        <button type="button" class="btn btn-outline btn-sm btn-wa-notify" data-ref="${a.reference}" title="Send WhatsApp alert">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                                        </button>
                                        <button type="button" class="btn btn-outline btn-sm btn-delete-appt" data-ref="${a.reference}" data-name="${a.patientName}" title="Delete Appointment" style="color:#ff5c75; border-color:rgba(255,92,117,0.3); background:rgba(255,92,117,0.08); padding:6px 8px; display:inline-flex; align-items:center;">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('');

                    self.bindAppointmentTableActions(tbody);
                }
            }

            if (filterSearch) filterSearch.addEventListener('input', applyFilters);
            if (filterStatus) filterStatus.addEventListener('change', applyFilters);
            if (filterDoctor) filterDoctor.addEventListener('change', applyFilters);

            this.bindAppointmentTableActions(container);
        },

        bindAppointmentTableActions: function (parent) {
            var self = this;
            parent.querySelectorAll('.table-row-clickable').forEach(function (row) {
                row.addEventListener('click', function (e) {
                    if (e.target.closest('button') || e.target.closest('a')) return;
                    if (row.dataset.ref) {
                        self.openAppointmentDetailsDrawer(row.dataset.ref);
                    }
                });
            });

            parent.querySelectorAll('.btn-manage-appt').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    self.openAppointmentDetailsDrawer(btn.dataset.ref);
                });
            });

            parent.querySelectorAll('.btn-wa-notify').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    self.openWhatsAppSendModal(btn.dataset.ref);
                });
            });

            parent.querySelectorAll('.btn-delete-appt').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    self.confirmDeleteAppointment(btn.dataset.ref, btn.dataset.name);
                });
            });
        },

        /* ------------------------------------------------ 3. CALENDAR */
        renderCalendar: function () {
            var container = document.getElementById('admin-content-body');
            var doctors = db.getDoctors();
            var state = this.calendarState;
            var isDoctor = this.currentUser && this.currentUser.role === 'DOCTOR';
            if (isDoctor) state.doctorId = this.currentUser.refId;

            var curr = state.currentDate;
            var year = curr.getFullYear();
            var month = curr.getMonth();

            var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            var monthTitle = monthNames[month] + ' ' + year;

            var appts = db.getAppointments(state.doctorId === 'all' ? null : state.doctorId);

            // Compute calendar days for current month
            var firstDayIndex = new Date(year, month, 1).getDay();
            var daysInMonth = new Date(year, month + 1, 0).getDate();
            var prevMonthDays = new Date(year, month, 0).getDate();

            var cellsHtml = '';

            // Previous month trailing days
            for (var p = firstDayIndex - 1; p >= 0; p--) {
                var prevDayNum = prevMonthDays - p;
                cellsHtml += `<div class="calendar-cell is-other-month"><div class="calendar-date-num">${prevDayNum}</div></div>`;
            }

            // Current month days
            var today = new Date();
            var isCurrYearMonth = today.getFullYear() === year && today.getMonth() === month;

            for (var d = 1; d <= daysInMonth; d++) {
                var isToday = isCurrYearMonth && today.getDate() === d;
                var iso = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
                var dayAppts = appts.filter(function (a) { return a.date === iso; });

                cellsHtml += `
                    <div class="calendar-cell ${isToday ? 'is-today' : ''}" data-date="${iso}">
                        <div class="calendar-date-num" style="${isToday ? 'color:var(--brand-teal); font-weight:700;' : ''}">${d}</div>
                        <div style="display:flex; flex-direction:column; gap:3px; overflow-y:auto; max-height:80px;">
                            ${dayAppts.map(function (a) {
                                return `
                                    <div class="calendar-event-pill btn-cal-event" data-ref="${a.reference}" title="${a.time} - ${a.patientName} (${a.status})">
                                        ${a.time.slice(0, 5)} ${a.patientName}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }

            container.innerHTML = `
                <div class="calendar-wrapper">
                    <div class="calendar-toolbar">
                        <div class="calendar-nav-group">
                            <button type="button" class="btn btn-secondary btn-sm" id="cal-nav-today">Today</button>
                            <button type="button" class="btn btn-secondary btn-sm" id="cal-nav-prev">‹</button>
                            <button type="button" class="btn btn-secondary btn-sm" id="cal-nav-next">›</button>
                            <div class="calendar-month-title">${monthTitle}</div>
                        </div>

                        <div style="display:flex; gap:10px; align-items:center;">
                            ${!isDoctor ? `
                                <select id="cal-doctor-select" style="padding:6px 12px; background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); color:#fff;">
                                    <option value="all" ${state.doctorId === 'all' ? 'selected' : ''}>All Doctors</option>
                                    ${doctors.map(function(d){ return `<option value="${d.id}" ${state.doctorId === d.id ? 'selected' : ''}>${d.name}</option>`; }).join('')}
                                </select>
                            ` : ''}
                            <button type="button" class="btn btn-primary btn-sm" id="btn-cal-add-appt">+ Book Slot</button>
                        </div>
                    </div>

                    <div class="calendar-grid">
                        <div class="calendar-day-header">Sun</div>
                        <div class="calendar-day-header">Mon</div>
                        <div class="calendar-day-header">Tue</div>
                        <div class="calendar-day-header">Wed</div>
                        <div class="calendar-day-header">Thu</div>
                        <div class="calendar-day-header">Fri</div>
                        <div class="calendar-day-header">Sat</div>
                        ${cellsHtml}
                    </div>
                </div>
            `;

            var self = this;
            document.getElementById('cal-nav-today').addEventListener('click', function () {
                state.currentDate = new Date();
                self.renderCalendar();
            });
            document.getElementById('cal-nav-prev').addEventListener('click', function () {
                state.currentDate.setMonth(state.currentDate.getMonth() - 1);
                self.renderCalendar();
            });
            document.getElementById('cal-nav-next').addEventListener('click', function () {
                state.currentDate.setMonth(state.currentDate.getMonth() + 1);
                self.renderCalendar();
            });

            var docSelect = document.getElementById('cal-doctor-select');
            if (docSelect) {
                docSelect.addEventListener('change', function (e) {
                    state.doctorId = e.target.value;
                    self.renderCalendar();
                });
            }

            document.getElementById('btn-cal-add-appt').addEventListener('click', function () {
                self.openNewAppointmentModal();
            });

            container.querySelectorAll('.btn-cal-event').forEach(function (el) {
                el.addEventListener('click', function (e) {
                    e.stopPropagation();
                    self.openAppointmentDetailsDrawer(el.dataset.ref);
                });
            });
        },

        /* ------------------------------------------------ 4. PATIENTS */
        renderPatients: function (searchQuery) {
            var container = document.getElementById('admin-content-body');
            var patients = db.getPatients();
            var q = (searchQuery || '').toLowerCase();

            var filtered = patients.filter(function (p) {
                if (!q) return true;
                return (p.name && p.name.toLowerCase().indexOf(q) !== -1) ||
                       (p.phone && p.phone.toLowerCase().indexOf(q) !== -1) ||
                       (p.email && p.email.toLowerCase().indexOf(q) !== -1);
            });

            container.innerHTML = `
                <div class="admin-card" style="margin-bottom:20px;">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">Patients Directory</h3>
                            <span class="card-subtitle">Grid view of registered clinic patients</span>
                        </div>
                        <button type="button" class="btn btn-primary btn-sm" id="btn-add-patient">+ Register Patient</button>
                    </div>

                    <div class="patient-grid">
                        ${filtered.length === 0 ? `
                            <div style="grid-column: 1 / -1; text-align:center; padding:40px; color:var(--text-muted);">
                                <h4>No patients found</h4>
                                <p>Register a new patient to start managing their records.</p>
                            </div>
                        ` : filtered.map(function (pat) {
                            var initials = pat.name.split(' ').map(function(n){ return n[0]; }).join('').slice(0, 2).toUpperCase();
                            return `
                                <div class="patient-card card-clickable" data-id="${pat.id}">
                                    <div class="patient-card-head">
                                        <div class="pat-avatar-badge">${initials}</div>
                                        <div>
                                            <div class="patient-card-name">${pat.name}</div>
                                            <div class="patient-card-id">${pat.id} • ${pat.age || 30} yrs (${pat.gender || 'N/A'})</div>
                                        </div>
                                    </div>
                                    <div class="patient-card-info">
                                        <div class="pat-info-row">
                                            <span class="pat-info-label">Phone:</span>
                                            <span>${pat.phone || 'N/A'}</span>
                                        </div>
                                        <div class="pat-info-row">
                                            <span class="pat-info-label">Last Visit:</span>
                                            <span>${pat.lastVisit || 'None'}</span>
                                        </div>
                                        <div class="pat-info-row">
                                            <span class="pat-info-label">Next Visit:</span>
                                            <span style="color:var(--brand-teal);">${pat.upcomingAppointment || 'None'}</span>
                                        </div>
                                        <div class="pat-info-row">
                                            <span class="pat-info-label">Total Visits:</span>
                                            <span>${pat.totalVisits || 0} visits (₹${pat.totalSpent || 0})</span>
                                        </div>
                                    </div>
                                    <div style="display:flex; justify-content:space-between; align-items:center;">
                                        <span class="badge ${pat.status==='Active'?'badge-active':'badge-inactive'}">${pat.status}</span>
                                        <button type="button" class="btn btn-secondary btn-sm btn-pat-profile" data-id="${pat.id}">View Record</button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;

            var self = this;
            document.getElementById('btn-add-patient').addEventListener('click', function () {
                self.openPatientModal();
            });

            container.querySelectorAll('.patient-card').forEach(function (card) {
                card.addEventListener('click', function (e) {
                    if (e.target.closest('button') || e.target.closest('a')) return;
                    self.openPatientDetailsDrawer(card.dataset.id);
                });
            });

            container.querySelectorAll('.btn-pat-profile').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    self.openPatientDetailsDrawer(btn.dataset.id);
                });
            });
        },

        /* ------------------------------------------------ 5. DOCTORS */
        renderDoctors: function (searchQuery) {
            var container = document.getElementById('admin-content-body');
            var doctors = db.getDoctors();
            var q = (searchQuery || '').toLowerCase();

            var filtered = doctors.filter(function (d) {
                if (!q) return true;
                return (d.name && d.name.toLowerCase().indexOf(q) !== -1) ||
                       (d.specialization && d.specialization.toLowerCase().indexOf(q) !== -1);
            });

            container.innerHTML = `
                <div class="admin-card">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">Doctor & Specialist Management</h3>
                            <span class="card-subtitle">Doctors, availability schedules, and website display status</span>
                        </div>
                        <button type="button" class="btn btn-primary btn-sm" id="btn-create-doctor">+ Add Doctor</button>
                    </div>

                    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:20px;">
                        ${filtered.map(function (doc) {
                            return `
                                <div class="admin-card card-clickable doc-item-card" data-id="${doc.id}" style="background:var(--bg-surface);">
                                    <div style="display:flex; gap:14px; margin-bottom:14px;">
                                        <img src="/${(doc.image || 'assets/img/gen_team-image-5.jpg').replace(/^\.\.\//, '').replace(/^\//, '')}" alt="${doc.name}" style="width:64px; height:64px; border-radius:var(--radius-md); object-fit:cover; border:2px solid var(--brand-teal);">
                                        <div>
                                            <h4 style="font-size:15px; font-weight:700; margin-bottom:2px;">${doc.name}</h4>
                                            <div style="font-size:12px; color:var(--brand-teal-light);">${doc.specialization}</div>
                                            <div style="font-size:11px; color:var(--text-muted);">${doc.experience} • ${doc.qualification || 'BDS'}</div>
                                        </div>
                                    </div>

                                    <p style="font-size:12px; color:var(--text-secondary); margin-bottom:14px; line-height:1.4;">${doc.bio || 'No bio specified.'}</p>

                                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-subtle); padding-top:12px; gap:8px; flex-wrap:wrap;">
                                        <div style="display:flex; gap:6px; align-items:center;">
                                            ${doc.featured ? '<span class="badge badge-featured">★ Featured on Home</span>' : ''}
                                            <span class="badge ${doc.active ? 'badge-active' : 'badge-inactive'}">${doc.active ? 'Active' : 'Inactive'}</span>
                                        </div>
                                        <div class="table-actions">
                                            <button type="button" class="btn btn-secondary btn-sm btn-edit-doctor" data-id="${doc.id}">Edit Profile</button>
                                            <button type="button" class="btn ${doc.featured ? 'btn-primary' : 'btn-outline'} btn-sm btn-toggle-feat-doc" data-id="${doc.id}">${doc.featured ? 'Unfeature' : 'Feature'}</button>
                                            <button type="button" class="btn btn-outline btn-sm btn-delete-doctor" data-id="${doc.id}" style="color:#ff6b6b; border-color:rgba(255,107,107,0.35);" title="Delete Doctor">Delete</button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;

            var self = this;
            document.getElementById('btn-create-doctor').addEventListener('click', function () {
                self.openDoctorModal();
            });

            container.querySelectorAll('.doc-item-card').forEach(function (card) {
                card.addEventListener('click', function (e) {
                    if (e.target.closest('button') || e.target.closest('a')) return;
                    self.openDoctorModal(card.dataset.id);
                });
            });

            container.querySelectorAll('.btn-edit-doctor').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    self.openDoctorModal(btn.dataset.id);
                });
            });

            container.querySelectorAll('.btn-toggle-feat-doc').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    var doc = db.getDoctorById(btn.dataset.id);
                    if (doc) {
                        doc.featured = !doc.featured;
                        db.saveDoctor(doc, self.currentUser);
                        self.showToast('Updated', doc.name + ' featured status changed to ' + (doc.featured ? 'Featured on Home' : 'Normal') + '.', 'success');
                        self.renderDoctors(searchQuery);
                    }
                });
            });

            container.querySelectorAll('.btn-delete-doctor').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    var doc = db.getDoctorById(btn.dataset.id);
                    if (doc && confirm('Are you sure you want to permanently delete ' + doc.name + '? It will be removed from the website immediately.')) {
                        db.deleteDoctor(doc.id, self.currentUser);
                        self.showToast('Deleted', doc.name + ' has been removed from website.', 'success');
                        self.renderDoctors(searchQuery);
                    }
                });
            });
        },

        /* ------------------------------------------------ 6. SERVICES */
        renderServices: function () {
            var container = document.getElementById('admin-content-body');
            var services = db.getServices();

            container.innerHTML = `
                <div class="admin-card">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">Clinical Skin & Health Services</h3>
                            <span class="card-subtitle">Manage procedures, pricing, durations and assignments</span>
                        </div>
                        <button type="button" class="btn btn-primary btn-sm" id="btn-create-service">+ Add Service</button>
                    </div>

                    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:18px;">
                        ${services.map(function (svc) {
                            return `
                                <div class="admin-card card-clickable svc-item-card" data-id="${svc.id}" style="background:var(--bg-surface);">
                                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                                        <h4 style="font-size:15px; font-weight:700; margin:0;">${svc.name}</h4>
                                        <strong style="color:var(--brand-teal); font-size:15px;">₹${svc.price}</strong>
                                    </div>
                                    <div style="font-size:11px; color:var(--text-muted); margin-bottom:8px;">Duration: ${svc.duration} mins • Category: ${svc.category || 'General'}</div>
                                    <p style="font-size:12px; color:var(--text-secondary); margin-bottom:14px;">${svc.description}</p>
                                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-subtle); padding-top:10px;">
                                        <span class="badge ${svc.active ? 'badge-active' : 'badge-inactive'}">${svc.active ? 'Active' : 'Disabled'}</span>
                                        <button type="button" class="btn btn-secondary btn-sm btn-edit-service" data-id="${svc.id}">Edit Service</button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;

            var self = this;
            document.getElementById('btn-create-service').addEventListener('click', function () {
                self.openServiceModal();
            });

            container.querySelectorAll('.svc-item-card').forEach(function (card) {
                card.addEventListener('click', function (e) {
                    if (e.target.closest('button') || e.target.closest('a')) return;
                    self.openServiceModal(card.dataset.id);
                });
            });

            container.querySelectorAll('.btn-edit-service').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    self.openServiceModal(btn.dataset.id);
                });
            });
        },

        /* ------------------------------------------------ 7. BLOGS */
        renderBlogs: function () {
            var container = document.getElementById('admin-content-body');
            var blogs = db.getBlogs();

            container.innerHTML = `
                <div class="admin-card">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">Blog Articles & Guides</h3>
                            <span class="card-subtitle">Manage public articles rendered on /blog.html</span>
                        </div>
                        <button type="button" class="btn btn-primary btn-sm" id="btn-create-blog">+ Write Article</button>
                    </div>

                    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:20px;">
                        ${blogs.map(function (b) {
                            return `
                                <div class="admin-card card-clickable blog-item-card" data-id="${b.id}" style="background:var(--bg-surface);">
                                    <img src="/${(b.image || 'assets/img/gen_blog-image-4.jpg').replace(/^\.\.\//, '').replace(/^\//, '')}" alt="${b.title}" style="width:100%; height:160px; object-fit:cover; border-radius:var(--radius-md); margin-bottom:12px;">
                                    <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                                        <span class="badge badge-pending">${b.category}</span>
                                        <span style="font-size:11px; color:var(--text-muted);">${b.date}</span>
                                    </div>
                                    <h4 style="font-size:15px; font-weight:600; margin-bottom:8px; line-height:1.4;">${b.title}</h4>
                                    <p style="font-size:12px; color:var(--text-secondary); margin-bottom:14px;">${b.summary}</p>
                                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-subtle); padding-top:10px;">
                                        <span class="badge ${b.published ? 'badge-active' : 'badge-inactive'}">${b.published ? 'Published' : 'Draft'}</span>
                                        <div class="table-actions">
                                            <button type="button" class="btn btn-secondary btn-sm btn-edit-blog" data-id="${b.id}">Edit</button>
                                            <button type="button" class="btn btn-danger btn-sm btn-delete-blog" data-id="${b.id}">Delete</button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;

            var self = this;
            document.getElementById('btn-create-blog').addEventListener('click', function () {
                self.openBlogModal();
            });

            container.querySelectorAll('.blog-item-card').forEach(function (card) {
                card.addEventListener('click', function (e) {
                    if (e.target.closest('button') || e.target.closest('a')) return;
                    self.openBlogModal(card.dataset.id);
                });
            });

            container.querySelectorAll('.btn-edit-blog').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    self.openBlogModal(btn.dataset.id);
                });
            });

            container.querySelectorAll('.btn-delete-blog').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    self.confirmDialog('Delete Article', 'Are you sure you want to permanently delete this blog post?', function () {
                        db.deleteBlog(btn.dataset.id, self.currentUser);
                        self.showToast('Deleted', 'Blog post removed.', 'info');
                        self.renderBlogs();
                    });
                });
            });
        },

        /* ------------------------------------------------ 8. REVIEWS */
        renderReviews: function () {
            var container = document.getElementById('admin-content-body');
            var reviews = db.getReviews();

            container.innerHTML = `
                <div class="admin-card">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">Patient Testimonials & Reviews</h3>
                            <span class="card-subtitle">Manage feedback displayed in the website homepage review slider</span>
                        </div>
                        <button type="button" class="btn btn-primary btn-sm" id="btn-create-review">+ Add Review</button>
                    </div>

                    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:20px;">
                        ${reviews.map(function (r) {
                            return `
                                <div class="admin-card card-clickable review-item-card" data-id="${r.id}" style="background:var(--bg-surface);">
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                                        <div style="display:flex; align-items:center; gap:10px;">
                                            <img src="/${(r.avatar || 'assets/img/gen_testimonial-author-1.jpg').replace(/^\.\.\//, '').replace(/^\//, '')}" alt="${r.author}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">
                                            <div>
                                                <h4 style="font-size:14px; font-weight:700; margin:0;">${r.author}</h4>
                                                <span style="font-size:11px; color:var(--text-muted);">${r.designation || 'Patient'}</span>
                                            </div>
                                        </div>
                                        <div style="color:#f1c40f; font-size:14px;">${'★'.repeat(r.rating || 5)}</div>
                                    </div>
                                    <p style="font-size:12px; color:var(--text-secondary); font-style:italic; margin-bottom:14px; line-height:1.5;">${r.comment}</p>
                                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-subtle); padding-top:10px;">
                                        <span class="badge ${r.published ? 'badge-active' : 'badge-inactive'}">${r.published ? 'Published' : 'Hidden'}</span>
                                        <div class="table-actions">
                                            <button type="button" class="btn btn-secondary btn-sm btn-edit-review" data-id="${r.id}">Edit</button>
                                            <button type="button" class="btn btn-danger btn-sm btn-delete-review" data-id="${r.id}">Delete</button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;

            var self = this;
            document.getElementById('btn-create-review').addEventListener('click', function () {
                self.openReviewModal();
            });

            container.querySelectorAll('.review-item-card').forEach(function (card) {
                card.addEventListener('click', function (e) {
                    if (e.target.closest('button') || e.target.closest('a')) return;
                    self.openReviewModal(card.dataset.id);
                });
            });

            container.querySelectorAll('.btn-edit-review').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    self.openReviewModal(btn.dataset.id);
                });
            });

            container.querySelectorAll('.btn-delete-review').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    self.confirmDialog('Delete Review', 'Are you sure you want to delete this testimonial?', function () {
                        db.deleteReview(btn.dataset.id, self.currentUser);
                        self.showToast('Deleted', 'Review removed.', 'info');
                        self.renderReviews();
                    });
                });
            });
        },

        /* ------------------------------------------------ 9. ANALYTICS */
        renderAnalytics: function () {
            var container = document.getElementById('admin-content-body');
            var metrics = db.getAnalytics(30);

            container.innerHTML = `
                <div class="kpi-grid">
                    <div class="kpi-card kpi-success">
                        <div class="kpi-top"><span class="kpi-label">Attendance Rate</span></div>
                        <div class="kpi-value">${metrics.attendanceRate}%</div>
                        <div class="kpi-trend">Patients arriving on schedule</div>
                    </div>
                    <div class="kpi-card kpi-warning">
                        <div class="kpi-top"><span class="kpi-label">No-Show Rate</span></div>
                        <div class="kpi-value">${metrics.noShowRate}%</div>
                        <div class="kpi-trend">Missed appointments</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-top"><span class="kpi-label">Cancellation Rate</span></div>
                        <div class="kpi-value">${metrics.cancellationRate}%</div>
                        <div class="kpi-trend">Declined or cancelled</div>
                    </div>
                    <div class="kpi-card kpi-purple">
                        <div class="kpi-top"><span class="kpi-label">Total Realized Revenue</span></div>
                        <div class="kpi-value">₹${metrics.totalRevenue.toLocaleString()}</div>
                        <div class="kpi-trend">Paid treatments</div>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:24px;">
                    <!-- Doctor Performance -->
                    <div class="admin-card">
                        <div class="card-header">
                            <h3 class="card-title">Doctor Consultation Volume</h3>
                            <span class="card-subtitle">Patient visits by specialist</span>
                        </div>
                        <div class="table-responsive">
                            <table class="admin-table">
                                <thead>
                                    <tr><th>Doctor</th><th>Appointments</th><th>Attended</th><th>Revenue</th></tr>
                                </thead>
                                <tbody>
                                    ${metrics.doctorPerformance.map(function(dp){
                                        return `<tr>
                                            <td><strong>${dp.name}</strong></td>
                                            <td>${dp.total}</td>
                                            <td><span class="badge badge-confirmed">${dp.attended}</span></td>
                                            <td>₹${dp.revenue.toLocaleString()}</td>
                                        </tr>`;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Service Popularity -->
                    <div class="admin-card">
                        <div class="card-header">
                            <h3 class="card-title">Service Demand Breakdown</h3>
                            <span class="card-subtitle">Most booked clinical treatments</span>
                        </div>
                        <div class="table-responsive">
                            <table class="admin-table">
                                <thead>
                                    <tr><th>Service</th><th>Bookings</th><th>Revenue</th></tr>
                                </thead>
                                <tbody>
                                    ${metrics.servicePerformance.map(function(sp){
                                        return `<tr>
                                            <td><strong>${sp.name}</strong></td>
                                            <td>${sp.total}</td>
                                            <td>₹${sp.revenue.toLocaleString()}</td>
                                        </tr>`;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        },

        /* ------------------------------------------------ 10. REPORTS */
        renderReports: function () {
            var container = document.getElementById('admin-content-body');
            var appts = db.getAppointments();

            container.innerHTML = `
                <div class="admin-card">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">Clinical & Business Reports</h3>
                            <span class="card-subtitle">Generate exportable audit datasets</span>
                        </div>
                        <div style="display:flex; gap:10px;">
                            <button type="button" class="btn btn-secondary btn-sm" id="btn-export-csv">Export CSV</button>
                            <button type="button" class="btn btn-primary btn-sm" id="btn-print-report">Print Report</button>
                        </div>
                    </div>

                    <div class="table-responsive" id="report-printable-area">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Reference</th>
                                    <th>Date</th>
                                    <th>Patient</th>
                                    <th>Doctor</th>
                                    <th>Service</th>
                                    <th>Fee</th>
                                    <th>Payment</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${appts.map(function (a) {
                                    var doc = db.getDoctorById(a.doctorId);
                                    var svc = db.getServiceById(a.serviceId);
                                    return `
                                        <tr>
                                            <td>${a.reference}</td>
                                            <td>${a.date} ${a.time}</td>
                                            <td>${a.patientName} (${a.patientPhone || ''})</td>
                                            <td>${doc ? doc.name : 'Doctor'}</td>
                                            <td>${svc ? svc.name : 'Consultation'}</td>
                                            <td>₹${a.fee || 500}</td>
                                            <td>${a.paymentStatus || 'Pending'}</td>
                                            <td>${a.status}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            document.getElementById('btn-export-csv').addEventListener('click', function () {
                var csv = 'Reference,Date,Time,PatientName,Phone,Doctor,Service,Fee,PaymentStatus,Status\n';
                appts.forEach(function (a) {
                    var doc = db.getDoctorById(a.doctorId);
                    var svc = db.getServiceById(a.serviceId);
                    csv += `"${a.reference}","${a.date}","${a.time}","${a.patientName}","${a.patientPhone||''}","${doc?doc.name:''}","${svc?svc.name:''}",${a.fee||500},"${a.paymentStatus||''}","${a.status}"\n`;
                });
                var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                var link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.setAttribute('download', 'lumora-appointments-report-' + new Date().toISOString().slice(0,10) + '.csv');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });

            document.getElementById('btn-print-report').addEventListener('click', function () {
                window.print();
            });
        },

        /* ------------------------------------------------ 11. REVENUE */
        renderRevenue: function () {
            var container = document.getElementById('admin-content-body');
            var metrics = db.getAnalytics(30);
            var appts = db.getAppointments();

            container.innerHTML = `
                <div class="kpi-grid">
                    <div class="kpi-card kpi-success">
                        <div class="kpi-top"><span class="kpi-label">Paid / Collected</span></div>
                        <div class="kpi-value">₹${metrics.totalRevenue.toLocaleString()}</div>
                        <div class="kpi-trend">Fully settled revenue</div>
                    </div>
                    <div class="kpi-card kpi-warning">
                        <div class="kpi-top"><span class="kpi-label">Pending Collection</span></div>
                        <div class="kpi-value">₹${metrics.pendingRevenue.toLocaleString()}</div>
                        <div class="kpi-trend">Pending payment</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-top"><span class="kpi-label">Total Billed</span></div>
                        <div class="kpi-value">₹${(metrics.totalRevenue + metrics.pendingRevenue).toLocaleString()}</div>
                        <div class="kpi-trend">Gross billings</div>
                    </div>
                </div>

                <div class="admin-card">
                    <div class="card-header">
                        <h3 class="card-title">Billing & Transactions Ledger</h3>
                        <span class="card-subtitle">Individual appointment invoices</span>
                    </div>
                    <div class="table-responsive">
                        <table class="admin-table">
                            <thead>
                                <tr><th>Ref</th><th>Patient</th><th>Treatment</th><th>Amount</th><th>Status</th><th>Receipt</th></tr>
                            </thead>
                            <tbody>
                                ${appts.map(function (a) {
                                    var svc = db.getServiceById(a.serviceId);
                                    return `
                                        <tr class="table-row-clickable" data-ref="${a.reference}">
                                            <td><strong style="color:var(--brand-teal);">${a.reference}</strong></td>
                                            <td>${a.patientName}</td>
                                            <td>${svc ? svc.name : 'Consultation'}</td>
                                            <td><strong>₹${a.fee || 500}</strong></td>
                                            <td><span class="badge ${a.paymentStatus === 'Paid' ? 'badge-confirmed' : 'badge-pending'}">${a.paymentStatus || 'Pending'}</span></td>
                                            <td>
                                                <button type="button" class="btn btn-secondary btn-sm btn-view-receipt" data-ref="${a.reference}">Invoice Receipt</button>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            var self = this;
            container.querySelectorAll('.table-row-clickable').forEach(function (row) {
                row.addEventListener('click', function (e) {
                    if (e.target.closest('button') || e.target.closest('a')) return;
                    if (row.dataset.ref) {
                        self.openInvoiceReceiptModal(row.dataset.ref);
                    }
                });
            });

            container.querySelectorAll('.btn-view-receipt').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    self.openInvoiceReceiptModal(btn.dataset.ref);
                });
            });
        },

        /* ------------------------------------------------ 12. CONTACT & TIMINGS */
        renderContact: function () {
            var container = document.getElementById('admin-content-body');
            var clinic = db.getClinic();

            container.innerHTML = `
                <div class="admin-card">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">Website Contact & OPD Timings</h3>
                            <span class="card-subtitle">Master centralized data source — updates sync immediately across the public website</span>
                        </div>
                        <button type="button" class="btn btn-primary btn-sm" id="btn-save-contact">Save Changes</button>
                    </div>

                    <form id="form-contact-editor" class="admin-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Primary Phone *</label>
                                <input type="text" id="cnt-phone" value="${clinic.phone || ''}" required>
                            </div>
                            <div class="form-group">
                                <label>Secondary / Emergency Phone</label>
                                <input type="text" id="cnt-phone-sec" value="${clinic.phoneSecondary || ''}">
                            </div>
                            <div class="form-group">
                                <label>WhatsApp Number *</label>
                                <input type="text" id="cnt-wa" value="${clinic.whatsapp || ''}" required>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>Official Email Address *</label>
                                <input type="email" id="cnt-email" value="${clinic.email || ''}" required>
                            </div>
                            <div class="form-group">
                                <label>Google Maps CID / URL</label>
                                <input type="text" id="cnt-maps-url" value="${clinic.mapsUrl || ''}">
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Full Physical Clinic Address *</label>
                            <textarea id="cnt-address" rows="2">${clinic.address || ''}</textarea>
                        </div>

                        <h4 style="margin: 16px 0 8px 0; color:var(--brand-teal);">Weekly OPD Consultation Hours (Mon - Sat)</h4>
                        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:12px; background:var(--bg-surface); padding:16px; border-radius:var(--radius-md);">
                            ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(function (day, idx) {
                                var h = (clinic.hours && clinic.hours[idx]) || { open: '09:00', close: '18:00', closed: false };
                                var hb = h.brk || {};
                                return `
                                    <div style="background:var(--bg-card); padding:10px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
                                        <div style="font-weight:700; font-size:12px; margin-bottom:6px;">${day}</div>
                                        <div style="display:flex; gap:6px; align-items:center;">
                                            <input type="time" id="hour-open-${idx}" value="${h.open || '10:00'}" style="padding:4px; font-size:11px; background:var(--bg-input); border:1px solid var(--border-subtle); color:#fff; border-radius:4px;">
                                            <span>to</span>
                                            <input type="time" id="hour-close-${idx}" value="${h.close || '18:00'}" style="padding:4px; font-size:11px; background:var(--bg-input); border:1px solid var(--border-subtle); color:#fff; border-radius:4px;">
                                        </div>
                                        <div style="display:flex; gap:6px; align-items:center; margin-top:6px;">
                                            <span style="font-size:10px; opacity:.7; min-width:36px;">Break</span>
                                            <input type="time" id="hour-brk-start-${idx}" value="${hb.start || ''}" style="padding:4px; font-size:11px; background:var(--bg-input); border:1px solid var(--border-subtle); color:#fff; border-radius:4px;">
                                            <span>to</span>
                                            <input type="time" id="hour-brk-end-${idx}" value="${hb.end || ''}" style="padding:4px; font-size:11px; background:var(--bg-input); border:1px solid var(--border-subtle); color:#fff; border-radius:4px;">
                                        </div>
                                        <label style="display:flex; gap:6px; align-items:center; margin-top:6px; font-size:11px; cursor:pointer;">
                                            <input type="checkbox" id="hour-closed-${idx}" ${h.closed ? 'checked' : ''}>
                                            Closed all day
                                        </label>
                                    </div>
                                `;
                            }).join('')}
                        </div>

                        <h4 style="margin: 16px 0 8px 0; color:var(--brand-teal);">Transit & Directions</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Nearest Metro</label>
                                <input type="text" id="cnt-metro" value="${(clinic.transit && clinic.transit.metro) || ''}">
                            </div>
                            <div class="form-group">
                                <label>Bus Stop</label>
                                <input type="text" id="cnt-bus" value="${(clinic.transit && clinic.transit.bus) || ''}">
                            </div>
                        </div>
                    </form>
                </div>
            `;

            var self = this;
            document.getElementById('btn-save-contact').addEventListener('click', function () {
                var DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                function pretty(t) {
                    var p = (t || '').split(':');
                    if (p.length < 2) return t || '';
                    var hh = parseInt(p[0], 10), mm = p[1];
                    var suf = hh >= 12 ? 'PM' : 'AM';
                    var h12 = hh % 12; if (h12 === 0) h12 = 12;
                    return h12 + ':' + mm + ' ' + suf;
                }
                var hours = {};
                for (var i = 0; i <= 6; i++) {
                    var isClosed = document.getElementById('hour-closed-' + i).checked;
                    var oV = document.getElementById('hour-open-' + i).value;
                    var cV = document.getElementById('hour-close-' + i).value;
                    var bS = document.getElementById('hour-brk-start-' + i).value;
                    var bE = document.getElementById('hour-brk-end-' + i).value;
                    var brk = (bS && bE) ? { start: bS, end: bE } : null;
                    var label = isClosed
                        ? DAY_NAMES[i] + ': Closed'
                        : DAY_NAMES[i] + ': ' + (brk
                            ? pretty(oV) + ' - ' + pretty(brk.start) + ', ' + pretty(brk.end) + ' - ' + pretty(cV)
                            : pretty(oV) + ' - ' + pretty(cV));
                    hours[i] = { open: oV, close: cV, brk: brk, closed: isClosed, label: label };
                }

                var patch = {
                    phone: document.getElementById('cnt-phone').value,
                    phoneSecondary: document.getElementById('cnt-phone-sec').value,
                    whatsapp: document.getElementById('cnt-wa').value,
                    email: document.getElementById('cnt-email').value,
                    mapsUrl: document.getElementById('cnt-maps-url').value,
                    address: document.getElementById('cnt-address').value,
                    hours: hours,
                    transit: Object.assign({}, clinic.transit, {
                        metro: document.getElementById('cnt-metro').value,
                        bus: document.getElementById('cnt-bus').value
                    })
                };

                db.updateClinic(patch, self.currentUser);
                self.showToast('Saved', 'Contact and OPD timings updated across the entire ecosystem.', 'success');
            });
        },

        /* ------------------------------------------------ 13. WHATSAPP AUTOMATION */
        renderWhatsApp: function () {
            var container = document.getElementById('admin-content-body');
            var templates = db.getWhatsAppTemplates();
            var appts = db.getAppointments();
            var clinic = db.getClinic();

            container.innerHTML = `
                <div class="admin-card">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">WhatsApp Messaging & Automation Hub</h3>
                            <span class="card-subtitle">Personalized message templates with dynamic tags and auto-triggering</span>
                        </div>
                        <button type="button" class="btn btn-primary btn-sm" id="btn-save-wa">Save Templates</button>
                    </div>

                    <div class="whatsapp-grid">
                        <!-- Templates Form (Left Column) -->
                        <div class="admin-form">
                            <div class="form-group" style="margin-bottom:6px;">
                                <label>Available Dynamic Tags (Click any tag to insert into active template):</label>
                                <div class="wa-var-chips">
                                    <span class="wa-var-chip" data-var="{{tokenNumber}}">{{tokenNumber}}</span>
                                    <span class="wa-var-chip" data-var="{{patientName}}">{{patientName}}</span>
                                    <span class="wa-var-chip" data-var="{{doctorName}}">{{doctorName}}</span>
                                    <span class="wa-var-chip" data-var="{{serviceTitle}}">{{serviceTitle}}</span>
                                    <span class="wa-var-chip" data-var="{{date}}">{{date}}</span>
                                    <span class="wa-var-chip" data-var="{{timeSlot}}">{{timeSlot}}</span>
                                    <span class="wa-var-chip" data-var="{{clinicName}}">{{clinicName}}</span>
                                    <span class="wa-var-chip" data-var="{{clinicAddress}}">{{clinicAddress}}</span>
                                    <span class="wa-var-chip" data-var="{{clinicPhone}}">{{clinicPhone}}</span>
                                    <span class="wa-var-chip" data-var="{{emergencyPhone}}">{{emergencyPhone}}</span>
                                </div>
                            </div>

                            <!-- Scrollable Template Edit Boxes -->
                            <div class="wa-templates-scroll-container">
                                <div class="form-group" style="margin-bottom:0;">
                                    <label style="font-weight:600; color:#fff;">1. Appointment Confirmation Template (Automated on "Confirmed")</label>
                                    <textarea id="wa-tpl-confirmation" rows="5" class="wa-template-input" data-type="confirmation">${templates.confirmation ? templates.confirmation.template : ''}</textarea>
                                </div>

                                <div class="form-group" style="margin-bottom:0;">
                                    <label style="font-weight:600; color:#fff;">2. Appointment Rescheduled Template (Automated on "Rescheduled")</label>
                                    <textarea id="wa-tpl-rescheduled" rows="5" class="wa-template-input" data-type="rescheduled">${templates.rescheduled ? templates.rescheduled.template : ''}</textarea>
                                </div>

                                <div class="form-group" style="margin-bottom:0;">
                                    <label style="font-weight:600; color:#fff;">3. 24-Hour Reminder Template</label>
                                    <textarea id="wa-tpl-reminder" rows="5" class="wa-template-input" data-type="reminder">${templates.reminder ? templates.reminder.template : ''}</textarea>
                                </div>

                                <div class="form-group" style="margin-bottom:0;">
                                    <label style="font-weight:600; color:#fff;">4. Post-Visit Attendance / Thank You Template (Automated on "Attended")</label>
                                    <textarea id="wa-tpl-attended" rows="5" class="wa-template-input" data-type="attended">${templates.attended ? templates.attended.template : ''}</textarea>
                                </div>

                                <div class="form-group" style="margin-bottom:0;">
                                    <label style="font-weight:600; color:#fff;">5. Missed Appointment / No-Show Template (Automated on "Not Attended")</label>
                                    <textarea id="wa-tpl-notAttended" rows="5" class="wa-template-input" data-type="notAttended">${templates.notAttended ? templates.notAttended.template : ''}</textarea>
                                </div>

                                <div class="form-group" style="margin-bottom:0;">
                                    <label style="font-weight:600; color:#fff;">6. Appointment Declined Template (Automated on "Rejected")</label>
                                    <textarea id="wa-tpl-rejection" rows="5" class="wa-template-input" data-type="rejection">${templates.rejection ? templates.rejection.template : ''}</textarea>
                                </div>
                            </div>
                        </div>

                        <!-- Live WhatsApp Bubble Preview (Right Column - Sticky) -->
                        <div class="wa-preview-sticky-wrap">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
                                <h4 style="margin:0; font-size:14px; display:flex; align-items:center; gap:6px;">
                                    <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#25d366;"></span>
                                    Live Preview
                                </h4>
                                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                                    <select id="wa-preview-type-select" style="padding:6px 10px; font-size:12px; background:var(--bg-input); color:#fff; border:1px solid var(--border-subtle); border-radius:var(--radius-sm); outline:none;">
                                        <option value="confirmation">1. Confirmed</option>
                                        <option value="rescheduled">2. Rescheduled</option>
                                        <option value="reminder">3. 24h Reminder</option>
                                        <option value="attended">4. Attended</option>
                                        <option value="notAttended">5. Missed</option>
                                        <option value="rejection">6. Declined</option>
                                    </select>
                                    <select id="wa-preview-appt-select" style="padding:6px 10px; font-size:12px; background:var(--bg-input); color:#fff; border:1px solid var(--border-subtle); border-radius:var(--radius-sm); outline:none; max-width:240px;">
                                        ${appts.length === 0 ? '<option value="">No Appointments Found</option>' :
                                          appts.map(function (a) {
                                              return `<option value="${a.reference}">${a.patientName} (${a.reference} • ${a.date})</option>`;
                                          }).join('')}
                                    </select>
                                </div>
                            </div>

                            <div class="wa-chat-preview">
                                <div class="wa-bubble" id="wa-preview-bubble" style="white-space:pre-wrap; line-height:1.5; font-size:13px;">
                                    <!-- Dynamic Live Compiled WhatsApp Message -->
                                </div>
                                <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-top:14px; flex-wrap:wrap;">
                                    <span id="wa-preview-phone-info" style="font-size:12px; color:var(--text-muted);"></span>
                                    <div style="display:flex; gap:8px;">
                                        <button type="button" class="btn btn-secondary btn-sm" id="btn-copy-preview-wa" style="display:inline-flex; align-items:center; gap:6px;">
                                            📋 Copy Message
                                        </button>
                                        <button type="button" class="btn btn-primary btn-sm" id="btn-open-preview-wa" style="background:#25d366; border-color:#25d366; color:#fff; display:inline-flex; align-items:center; gap:6px;">
                                            💬 Test on WhatsApp
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            var self = this;
            var activeTextarea = document.getElementById('wa-tpl-confirmation');
            var lastCompiledRawText = '';
            var activePatientPhone = '';

            function updateLivePreview() {
                var selectedType = document.getElementById('wa-preview-type-select').value;
                var selectedRef = document.getElementById('wa-preview-appt-select').value;
                var appt = db.getAppointmentByRef(selectedRef) || appts[0] || {
                    reference: 'DC-SAMPLE',
                    patientName: 'Sameer Kulkarni',
                    patientPhone: '+91 98111 22334',
                    doctorId: 'pallavi-rathi',
                    serviceId: 'clinical-dermatology',
                    date: '2026-09-15',
                    time: '11:30 AM'
                };

                var doc = db.getDoctorById(appt.doctorId);
                var svc = db.getServiceById(appt.serviceId);
                var c = db.getClinic();

                var tplTextarea = document.getElementById('wa-tpl-' + selectedType);
                var rawTemplate = tplTextarea ? tplTextarea.value : '';

                var patName = appt.patientName || 'Patient';
                var refNo = appt.reference || '';
                var docName = doc ? doc.name : (appt.doctorName || 'Specialist Doctor');
                var svcName = svc ? svc.name : (appt.serviceName || 'Skin & Health Consultation');
                var apptDate = appt.date || '';
                var apptTime = appt.time || '';
                var clinicName = c.name || 'My Skin My Health';
                var clinicAddr = c.address || 'Unit No. A 407/408, A Wing, Pranik Chambers, Opp. H.P. Petrol Pump, Saki Vihar Road, Sag Baug, Marol, Sakinaka, Mumbai 400072';
                var clinicPh = c.phone || '+91 8422 990 990';
                var emergPh = c.phone || '+91 8422 990 990';
                var mapsLink = c.mapsUrl || 'https://maps.google.com/?cid=4187806642178671438';

                // Replace variables (both camelCase and snake_case)
                var compiled = rawTemplate
                    .replace(/{{patientName}}/g, patName).replace(/{{patient_name}}/g, patName)
                    .replace(/{{tokenNumber}}/g, refNo).replace(/{{token_number}}/g, refNo).replace(/{{reference_number}}/g, refNo).replace(/{{referenceNumber}}/g, refNo)
                    .replace(/{{doctorName}}/g, docName).replace(/{{doctor_name}}/g, docName)
                    .replace(/{{serviceTitle}}/g, svcName).replace(/{{service_name}}/g, svcName).replace(/{{serviceName}}/g, svcName)
                    .replace(/{{date}}/g, apptDate).replace(/{{appointment_date}}/g, apptDate)
                    .replace(/{{timeSlot}}/g, apptTime).replace(/{{appointment_time}}/g, apptTime).replace(/{{time}}/g, apptTime)
                    .replace(/{{clinicName}}/g, clinicName).replace(/{{clinic_name}}/g, clinicName)
                    .replace(/{{clinicAddress}}/g, clinicAddr).replace(/{{clinic_address}}/g, clinicAddr).replace(/{{location}}/g, clinicAddr)
                    .replace(/{{clinicPhone}}/g, clinicPh).replace(/{{clinic_phone}}/g, clinicPh)
                    .replace(/{{emergencyPhone}}/g, emergPh).replace(/{{emergency_phone}}/g, emergPh)
                    .replace(/{{clinicMaps}}/g, mapsLink).replace(/{{clinic_maps}}/g, mapsLink);

                lastCompiledRawText = compiled;
                activePatientPhone = db.formatWhatsAppPhone ? db.formatWhatsAppPhone(appt.patientPhone) : (appt.patientPhone || '').replace(/\D/g, '');

                var phoneInfoEl = document.getElementById('wa-preview-phone-info');
                if (phoneInfoEl) {
                    phoneInfoEl.textContent = 'To: ' + (appt.patientName || 'Patient') + ' (' + (appt.patientPhone || 'No Phone') + ')';
                }

                // Render into WhatsApp bubble with formatting
                var formattedHtml = compiled
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
                    .replace(/_(.*?)_/g, '<em>$1</em>')
                    .replace(/\n/g, '<br>');

                var bubbleEl = document.getElementById('wa-preview-bubble');
                if (bubbleEl) {
                    bubbleEl.innerHTML = formattedHtml + `
                        <div class="wa-meta" style="margin-top:8px; text-align:right; font-size:10px; opacity:0.75;">
                            <span>${appt.time || '11:30 AM'}</span> <span style="color:#53bdeb;">✓✓</span>
                        </div>
                    `;
                }
            }

            // Track active textarea and attach real-time live input listeners
            var allInputs = document.querySelectorAll('.wa-template-input');
            allInputs.forEach(function (inp) {
                inp.addEventListener('focus', function () {
                    activeTextarea = inp;
                    var type = inp.dataset.type;
                    var selType = document.getElementById('wa-preview-type-select');
                    if (selType && selType.value !== type) {
                        selType.value = type;
                    }
                    updateLivePreview();
                });

                inp.addEventListener('input', function () {
                    var type = inp.dataset.type;
                    var selType = document.getElementById('wa-preview-type-select');
                    if (selType && selType.value !== type) {
                        selType.value = type;
                    }
                    updateLivePreview();
                });
            });

            // Variable chips click to insert
            document.querySelectorAll('.wa-var-chip').forEach(function (chip) {
                chip.style.cursor = 'pointer';
                chip.addEventListener('click', function () {
                    var tag = chip.dataset.var || chip.textContent.trim();
                    if (activeTextarea) {
                        var start = activeTextarea.selectionStart || 0;
                        var end = activeTextarea.selectionEnd || 0;
                        var text = activeTextarea.value;
                        activeTextarea.value = text.substring(0, start) + tag + text.substring(end);
                        activeTextarea.selectionStart = activeTextarea.selectionEnd = start + tag.length;
                        activeTextarea.focus();
                        updateLivePreview();
                        self.showToast('Tag Inserted', tag + ' added to template', 'info');
                    }
                });
            });

            document.getElementById('wa-preview-type-select').addEventListener('change', updateLivePreview);
            document.getElementById('wa-preview-appt-select').addEventListener('change', updateLivePreview);

            // Copy Preview Message Button
            document.getElementById('btn-copy-preview-wa').addEventListener('click', function () {
                if (lastCompiledRawText) {
                    navigator.clipboard.writeText(lastCompiledRawText);
                    self.showToast('Copied to Clipboard', 'Formatted WhatsApp message copied. Ready to paste!', 'success');
                }
            });

            // Open in WhatsApp Button
            document.getElementById('btn-open-preview-wa').addEventListener('click', function () {
                var phone = activePatientPhone || '919765407679';
                var url = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(lastCompiledRawText);
                window.open(url, '_blank');
            });

            // Save Templates Button
            document.getElementById('btn-save-wa').addEventListener('click', function () {
                var patch = {
                    confirmation: { enabled: true, title: 'Appointment Confirmed', template: document.getElementById('wa-tpl-confirmation').value },
                    rescheduled: { enabled: true, title: 'Appointment Rescheduled', template: document.getElementById('wa-tpl-rescheduled').value },
                    reminder: { enabled: true, title: '24-Hour Reminder', template: document.getElementById('wa-tpl-reminder').value },
                    attended: { enabled: true, title: 'Thank You for Visiting', template: document.getElementById('wa-tpl-attended').value },
                    notAttended: { enabled: true, title: 'Missed Appointment', template: document.getElementById('wa-tpl-notAttended').value },
                    rejection: { enabled: true, title: 'Appointment Declined', template: document.getElementById('wa-tpl-rejection').value }
                };
                db.updateWhatsAppTemplates(patch, self.currentUser);
                self.showToast('Templates Saved', 'WhatsApp automation templates saved and active across all statuses.', 'success');
                updateLivePreview();
            });

            // Initial render of preview
            updateLivePreview();
        },

        /* ------------------------------------------------ 14. STAFF & PERMISSIONS */
        renderStaff: function () {
            var container = document.getElementById('admin-content-body');
            var staffList = db.getStaff();

            container.innerHTML = `
                <div class="admin-card">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">Staff Members & RBAC Permissions</h3>
                            <span class="card-subtitle">Granular module-level authorization for personnel</span>
                        </div>
                        <button type="button" class="btn btn-primary btn-sm" id="btn-create-staff">+ Add Staff User</button>
                    </div>

                    <div class="table-responsive">
                        <table class="admin-table">
                            <thead>
                                <tr><th>Name</th><th>Role</th><th>Email / Phone</th><th>Active Permissions</th><th>Status</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                ${staffList.map(function (s) {
                                    return `
                                        <tr class="table-row-clickable" data-id="${s.id}">
                                             <td><strong>${s.name}</strong></td>
                                             <td><span class="badge ${s.role==='ADMIN'?'badge-featured':'badge-confirmed'}">${s.role}</span></td>
                                             <td>${s.email}<br><small style="color:var(--text-muted);">${s.phone || ''}</small></td>
                                             <td>
                                                 <div style="display:flex; gap:4px; flex-wrap:wrap; max-width:300px;">
                                                     ${(s.permissions || []).map(function(p){ return `<span style="font-size:10px; background:rgba(36,163,177,0.15); color:var(--brand-teal-light); padding:2px 6px; border-radius:4px;">${p}</span>`; }).join('')}
                                                 </div>
                                             </td>
                                             <td><span class="badge ${s.active ? 'badge-active' : 'badge-inactive'}">${s.active ? 'Active' : 'Disabled'}</span></td>
                                             <td>
                                                 <div class="table-actions">
                                                     <button type="button" class="btn btn-secondary btn-sm btn-edit-staff" data-id="${s.id}">Edit</button>
                                                     ${s.role !== 'ADMIN' ? `<button type="button" class="btn btn-danger btn-sm btn-del-staff" data-id="${s.id}">Delete</button>` : ''}
                                                 </div>
                                             </td>
                                         </tr>
                                     `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            var self = this;
            document.getElementById('btn-create-staff').addEventListener('click', function () {
                self.openStaffModal();
            });

            container.querySelectorAll('.table-row-clickable').forEach(function (row) {
                row.addEventListener('click', function (e) {
                    if (e.target.closest('button') || e.target.closest('a')) return;
                    if (row.dataset.id) {
                        self.openStaffModal(row.dataset.id);
                    }
                });
            });

            container.querySelectorAll('.btn-edit-staff').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    self.openStaffModal(btn.dataset.id);
                });
            });

            container.querySelectorAll('.btn-del-staff').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    self.confirmDialog('Delete Staff Member', 'Are you sure you want to remove this staff user?', function () {
                        db.deleteStaff(btn.dataset.id, self.currentUser);
                        self.showToast('Deleted', 'Staff member removed.', 'info');
                        self.renderStaff();
                    });
                });
            });
        },

        /* ------------------------------------------------ 15. DOCTOR SELF VIEWS */
        renderDoctorAvailabilitySelf: function () {
            var container = document.getElementById('admin-content-body');
            var docId = this.currentUser ? this.currentUser.refId : null;
            var doc = db.getDoctorById(docId);

            if (!doc) {
                container.innerHTML = '<div class="admin-card"><p>Doctor profile not found.</p></div>';
                return;
            }

            container.innerHTML = `
                <div class="admin-card">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">My Consultation Hours</h3>
                            <span class="card-subtitle">Set your active schedule for patients booking online</span>
                        </div>
                        <button type="button" class="btn btn-primary btn-sm" id="btn-save-doc-sched">Save Availability</button>
                    </div>

                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:16px;">
                        ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(function (day, idx) {
                            var s = (doc.schedule && doc.schedule[idx]) || { open: '10:00', close: '20:00', closed: false };
                            return `
                                <div style="background:var(--bg-surface); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                                        <strong>${day}</strong>
                                        <label style="font-size:11px; display:flex; align-items:center; gap:4px;">
                                            <input type="checkbox" id="doc-day-off-${idx}" ${s.closed ? 'checked' : ''}> Day Off
                                        </label>
                                    </div>
                                    <div style="display:flex; gap:6px; align-items:center;">
                                        <input type="time" id="doc-time-open-${idx}" value="${s.open || '10:00'}" style="padding:6px; background:var(--bg-input); border:1px solid var(--border-subtle); color:#fff; border-radius:4px; flex:1;">
                                        <span>to</span>
                                        <input type="time" id="doc-time-close-${idx}" value="${s.close || '20:00'}" style="padding:6px; background:var(--bg-input); border:1px solid var(--border-subtle); color:#fff; border-radius:4px; flex:1;">
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;

            var self = this;
            document.getElementById('btn-save-doc-sched').addEventListener('click', function () {
                var sched = {};
                for (var i = 0; i <= 6; i++) {
                    var isClosed = document.getElementById('doc-day-off-' + i).checked;
                    sched[i] = {
                        open: document.getElementById('doc-time-open-' + i).value,
                        close: document.getElementById('doc-time-close-' + i).value,
                        closed: isClosed
                    };
                }
                doc.schedule = sched;
                db.saveDoctor(doc, self.currentUser);
                self.showToast('Saved', 'Your consultation schedule has been updated.', 'success');
            });
        },

        renderDoctorProfileSelf: function () {
            var container = document.getElementById('admin-content-body');
            var docId = this.currentUser ? this.currentUser.refId : null;
            var doc = db.getDoctorById(docId);

            if (!doc) {
                container.innerHTML = '<div class="admin-card"><p>Doctor profile not found.</p></div>';
                return;
            }

            container.innerHTML = `
                <div class="admin-card">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">My Doctor Profile</h3>
                            <span class="card-subtitle">Public biography and specialization displayed on website</span>
                        </div>
                        <button type="button" class="btn btn-primary btn-sm" id="btn-save-doc-profile">Save Profile</button>
                    </div>

                    <form id="form-doc-profile" class="admin-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Doctor Full Name</label>
                                <input type="text" id="dp-name" value="${doc.name || ''}" required>
                            </div>
                            <div class="form-group">
                                <label>Specialization</label>
                                <input type="text" id="dp-spec" value="${doc.specialization || ''}">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>Qualifications</label>
                                <input type="text" id="dp-qual" value="${doc.qualification || ''}">
                            </div>
                            <div class="form-group">
                                <label>Experience (Years / Details)</label>
                                <input type="text" id="dp-exp" value="${doc.experience || ''}">
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Professional Bio / About Me</label>
                            <textarea id="dp-bio" rows="4">${doc.bio || ''}</textarea>
                        </div>
                    </form>
                </div>
            `;

            var self = this;
            document.getElementById('btn-save-doc-profile').addEventListener('click', function () {
                doc.name = document.getElementById('dp-name').value;
                doc.specialization = document.getElementById('dp-spec').value;
                doc.qualification = document.getElementById('dp-qual').value;
                doc.experience = document.getElementById('dp-exp').value;
                doc.bio = document.getElementById('dp-bio').value;

                db.saveDoctor(doc, self.currentUser);
                self.showToast('Saved', 'Your profile details have been saved.', 'success');
            });
        },

        /* ------------------------------------------------ 16. SETTINGS & AUDIT */
        renderSettings: function () {
            var container = document.getElementById('admin-content-body');
            var settings = db.getSettings();
            var logs = db.getAuditLogs();

            container.innerHTML = `
                <div class="admin-card" style="margin-bottom:24px;">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">System Settings & Policies</h3>
                            <span class="card-subtitle">Global clinic configurations</span>
                        </div>
                        <button type="button" class="btn btn-primary btn-sm" id="btn-save-settings">Save Settings</button>
                    </div>

                    <form class="admin-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Clinic Display Name</label>
                                <input type="text" id="set-clinic-name" value="${settings.clinicName || 'My Skin My Health'}">
                            </div>
                            <div class="form-group">
                                <label>Tagline</label>
                                <input type="text" id="set-tagline" value="${settings.tagline || ''}">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>Cancellation Notice (Hours)</label>
                                <input type="number" id="set-cancel-notice" value="${settings.cancellationNoticeHours || 4}">
                            </div>
                            <div class="form-group">
                                <label>Audio Notifications</label>
                                <select id="set-sound">
                                    <option value="true" ${settings.soundNotifications ? 'selected' : ''}>Enabled</option>
                                    <option value="false" ${!settings.soundNotifications ? 'selected' : ''}>Disabled</option>
                                </select>
                            </div>
                        </div>
                    </form>

                    <div style="margin-top:20px; border-top:1px solid var(--border-subtle); padding-top:16px; display:flex; gap:12px;">
                        <button type="button" class="btn btn-secondary btn-sm" id="btn-export-backup">Backup Database (JSON)</button>
                        <button type="button" class="btn btn-outline btn-sm" id="btn-import-backup">Restore Database</button>
                    </div>
                </div>

                <!-- Audit Trail -->
                <div class="admin-card">
                    <div class="card-header">
                        <h3 class="card-title">Security & Action Audit Logs</h3>
                        <span class="card-subtitle">Chronological record of system modifications</span>
                    </div>
                    <div class="table-responsive">
                        <table class="admin-table">
                            <thead>
                                <tr><th>Timestamp</th><th>User</th><th>Role</th><th>Action</th><th>Entity</th><th>Details</th></tr>
                            </thead>
                            <tbody>
                                ${logs.slice(0, 30).map(function (l) {
                                    return `
                                        <tr>
                                            <td>${new Date(l.timestamp).toLocaleString()}</td>
                                            <td><strong>${l.user}</strong></td>
                                            <td><span class="badge badge-pending">${l.role}</span></td>
                                            <td><strong>${l.action}</strong></td>
                                            <td>${l.entity}</td>
                                            <td>${l.details}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            var self = this;
            document.getElementById('btn-save-settings').addEventListener('click', function () {
                var patch = {
                    clinicName: document.getElementById('set-clinic-name').value,
                    tagline: document.getElementById('set-tagline').value,
                    cancellationNoticeHours: parseInt(document.getElementById('set-cancel-notice').value, 10) || 4,
                    soundNotifications: document.getElementById('set-sound').value === 'true'
                };
                db.updateSettings(patch, self.currentUser);
                self.showToast('Saved', 'System settings saved.', 'success');
            });

            document.getElementById('btn-export-backup').addEventListener('click', function () {
                var json = db.exportDataJSON();
                var blob = new Blob([json], { type: 'application/json' });
                var a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'msmh-clinic-backup-' + new Date().toISOString().slice(0, 10) + '.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            });

            document.getElementById('btn-import-backup').addEventListener('click', function () {
                var input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = function (e) {
                    var file = e.target.files[0];
                    if (file) {
                        var reader = new FileReader();
                        reader.onload = function (ev) {
                            var res = db.importDataJSON(ev.target.result, self.currentUser);
                            if (res.success) {
                                self.showToast('Restored', 'Database restored successfully.', 'success');
                                self.refreshCurrentView();
                            } else {
                                alert('Restore error: ' + res.message);
                            }
                        };
                        reader.readAsText(file);
                    }
                };
                input.click();
            });
        },

        /* ------------------------------------------------ Modals & Drawers */
        openNewAppointmentModal: function () {
            var doctors = db.getDoctors(true);
            var services = db.getServices(true);

            var body = `
                <form id="form-new-appt-modal" class="admin-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Patient Full Name *</label>
                            <input type="text" id="na-name" required placeholder="e.g. Farhan Ali">
                        </div>
                        <div class="form-group">
                            <label>Phone Number *</label>
                            <input type="tel" id="na-phone" required placeholder="+91 98765 43210">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Select Doctor *</label>
                            <select id="na-doctor" required>
                                ${doctors.map(function(d){ return `<option value="${d.id}">${d.name} (${d.specialization})</option>`; }).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Select Service *</label>
                            <select id="na-service" required>
                                ${services.map(function(s){ return `<option value="${s.id}">${s.name} (₹${s.price})</option>`; }).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Appointment Date *</label>
                            <input type="date" id="na-date" value="${new Date().toISOString().slice(0, 10)}" required>
                        </div>
                        <div class="form-group">
                            <label>Appointment Time *</label>
                            <select id="na-time" required>
                                <option value="10:00 AM">10:00 AM</option>
                                <option value="11:00 AM">11:00 AM</option>
                                <option value="12:00 PM">12:00 PM</option>
                                <option value="02:00 PM">02:00 PM</option>
                                <option value="03:30 PM">03:30 PM</option>
                                <option value="05:00 PM">05:00 PM</option>
                                <option value="06:30 PM">06:30 PM</option>
                                <option value="08:00 PM">08:00 PM</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Clinical Notes / Symptoms</label>
                        <textarea id="na-notes" placeholder="e.g. Acne treatment, laser toning or general skin checkup"></textarea>
                    </div>

                    <button type="submit" class="btn btn-primary btn-block">Confirm & Create Appointment</button>
                </form>
            `;

            this.openModal('Book New Patient Appointment', body);

            var self = this;
            document.getElementById('form-new-appt-modal').addEventListener('submit', function (e) {
                e.preventDefault();
                var record = db.createAppointment({
                    patientName: document.getElementById('na-name').value,
                    patientPhone: document.getElementById('na-phone').value,
                    doctorId: document.getElementById('na-doctor').value,
                    serviceId: document.getElementById('na-service').value,
                    date: document.getElementById('na-date').value,
                    time: document.getElementById('na-time').value,
                    notes: document.getElementById('na-notes').value,
                    status: 'Confirmed'
                }, self.currentUser);

                self.closeModal();
                self.showToast('Appointment Created', 'Reference ' + record.reference + ' booked successfully.', 'success');
                self.refreshCurrentView();
            });
        },

        openAppointmentDetailsDrawer: function (ref) {
            var appt = db.getAppointmentByRef(ref);
            if (!appt) return;

            var doc = db.getDoctorById(appt.doctorId);
            var svc = db.getServiceById(appt.serviceId);

            var body = `
                <div style="display:flex; flex-direction:column; gap:16px;">
                    <div style="background:var(--bg-surface); padding:16px; border-radius:var(--radius-md);">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                            <span class="badge badge-${appt.status.toLowerCase().replace(/\s+/g, '-')}">${appt.status}</span>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <strong style="color:var(--brand-teal);">${appt.reference}</strong>
                                <button type="button" class="btn btn-outline btn-sm btn-drawer-del-icon" title="Delete this appointment" style="color:#ff5c75; border-color:rgba(255,92,117,0.35); background:rgba(255,92,117,0.08); padding:4px 8px; border-radius:6px; display:inline-flex; align-items:center; gap:4px; font-size:11px; cursor:pointer;">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                    <span>Delete</span>
                                </button>
                            </div>
                        </div>
                        <h3 style="margin:4px 0 2px 0;">${appt.patientName}</h3>
                        <div style="font-size:12px; color:var(--text-muted);">${appt.patientPhone || 'No Phone'} • ${appt.patientEmail || 'No Email'}</div>
                    </div>

                    <div class="admin-card" style="padding:16px;">
                        <h4 style="font-size:13px; color:var(--brand-teal); margin-bottom:8px;">Booking Details</h4>
                        <div style="font-size:13px; display:flex; flex-direction:column; gap:6px;">
                            <div><strong>Service:</strong> ${svc ? svc.name : 'Skin & Health Consultation'}</div>
                            <div><strong>Doctor:</strong> ${doc ? doc.name : 'Assigned Doctor'}</div>
                            <div><strong>Date & Time:</strong> ${appt.date} at ${appt.time}</div>
                            <div><strong>Fee:</strong> ₹${appt.fee || 500} (${appt.paymentStatus || 'Pending'})</div>
                            ${appt.notes ? `<div><strong>Notes:</strong> ${appt.notes}</div>` : ''}
                        </div>
                    </div>

                    <!-- Status Change Action Buttons -->
                    <div class="admin-card" style="padding:16px;">
                        <h4 style="font-size:13px; color:var(--brand-teal); margin-bottom:10px;">Update Status</h4>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                            <button type="button" class="btn btn-secondary btn-sm btn-status-act" data-status="Confirmed">Confirm</button>
                            <button type="button" class="btn btn-primary btn-sm btn-status-act" data-status="Attended">Mark Attended</button>
                            <button type="button" class="btn btn-secondary btn-sm btn-resched-act">Reschedule</button>
                            <button type="button" class="btn btn-danger btn-sm btn-status-act" data-status="Not Attended">Not Attended</button>
                            <button type="button" class="btn btn-danger btn-sm btn-status-act" data-status="Rejected">Reject</button>
                            <button type="button" class="btn btn-outline btn-sm btn-drawer-wa">WhatsApp Alert</button>
                            <button type="button" class="btn btn-outline btn-sm btn-drawer-del-full" style="grid-column: span 2; display:flex; align-items:center; justify-content:center; gap:6px; color:#ff5c75; border-color:rgba(255,92,117,0.35); background:rgba(255,92,117,0.08); padding:8px; border-radius:6px; font-weight:600; cursor:pointer;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                <span>Delete Appointment</span>
                            </button>
                        </div>
                    </div>

                    <!-- Audit Timeline -->
                    <div class="admin-card" style="padding:16px;">
                        <h4 style="font-size:13px; color:var(--brand-teal); margin-bottom:8px;">Appointment History</h4>
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            ${(appt.history || []).map(function (h) {
                                return `
                                    <div style="font-size:11px; border-left:2px solid var(--brand-teal); padding-left:8px;">
                                        <div><strong>${h.action}</strong></div>
                                        <div style="color:var(--text-muted);">${h.user || 'System'} • ${new Date(h.time).toLocaleString()}</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `;

            this.openDrawer('Appointment ' + ref, body);

            var self = this;
            var drawerCard = document.getElementById('admin-drawer-card');

            drawerCard.querySelectorAll('.btn-status-act').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var st = btn.dataset.status;
                    db.updateAppointmentStatus(ref, st, self.currentUser);
                    self.showToast('Status Updated', 'Appointment ' + ref + ' marked as ' + st + '. WhatsApp alert ready.', 'success');
                    self.triggerAutomatedWhatsApp(ref, st);
                    self.openAppointmentDetailsDrawer(ref);
                    self.refreshCurrentView();
                });
            });

            var btnResched = drawerCard.querySelector('.btn-resched-act');
            if (btnResched) {
                btnResched.addEventListener('click', function () {
                    self.openRescheduleModal(ref);
                });
            }

            var btnWa = drawerCard.querySelector('.btn-drawer-wa');
            if (btnWa) {
                btnWa.addEventListener('click', function () {
                    self.openWhatsAppSendModal(ref);
                });
            }

            var delBtns = drawerCard.querySelectorAll('.btn-drawer-del-icon, .btn-drawer-del-full');
            delBtns.forEach(function (b) {
                b.addEventListener('click', function () {
                    self.confirmDeleteAppointment(ref, appt.patientName);
                });
            });
        },

        confirmDeleteAppointment: function (ref, patientName) {
            var self = this;
            var msg = 'Are you sure you want to permanently delete appointment ' + ref + (patientName ? ' for ' + patientName : '') + '?';
            if (confirm(msg)) {
                var success = db.deleteAppointment(ref, self.currentUser);
                if (success) {
                    self.showToast('Appointment Deleted', 'Appointment ' + ref + ' has been permanently removed.', 'success');
                    self.closeDrawer();
                    self.closeModal();
                    self.refreshCurrentView();
                } else {
                    self.showToast('Error', 'Could not delete appointment.', 'error');
                }
            }
        },

        triggerAutomatedWhatsApp: function (ref, statusKey) {
            var appt = db.getAppointmentByRef(ref);
            if (!appt) return;

            var tplKey = 'confirmation';
            if (statusKey === 'Confirmed') tplKey = 'confirmation';
            else if (statusKey === 'Rejected') tplKey = 'rejection';
            else if (statusKey === 'Rescheduled') tplKey = 'rescheduled';
            else if (statusKey === 'Attended') tplKey = 'attended';
            else if (statusKey === 'Not Attended') tplKey = 'notAttended';

            var compiledMsg = db.compileWhatsAppMessage(tplKey, appt);
            var phoneClean = db.formatWhatsAppPhone ? db.formatWhatsAppPhone(appt.patientPhone) : (appt.patientPhone || '').replace(/\D/g, '');

            if (phoneClean) {
                var url = 'https://wa.me/' + phoneClean + '?text=' + encodeURIComponent(compiledMsg);
                try {
                    window.open(url, '_blank');
                } catch (_) {}
            }
        },

        openRescheduleModal: function (ref) {
            var appt = db.getAppointmentByRef(ref);
            if (!appt) return;

            var body = `
                <form id="form-resched-modal" class="admin-form">
                    <p style="font-size:13px; color:var(--text-secondary);">Currently scheduled for <strong>${appt.date} at ${appt.time}</strong></p>
                    <div class="form-group">
                        <label>New Date *</label>
                        <input type="date" id="rs-date" value="${appt.date}" required>
                    </div>
                    <div class="form-group">
                        <label>New Time Slot *</label>
                        <select id="rs-time" required>
                            <option value="10:00 AM">10:00 AM</option>
                            <option value="11:30 AM">11:30 AM</option>
                            <option value="01:00 PM">01:00 PM</option>
                            <option value="03:00 PM">03:00 PM</option>
                            <option value="04:30 PM">04:30 PM</option>
                            <option value="06:00 PM">06:00 PM</option>
                            <option value="07:30 PM">07:30 PM</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Reason for Rescheduling</label>
                        <input type="text" id="rs-reason" placeholder="e.g. Patient requested morning slot">
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Confirm Reschedule & Send WhatsApp</button>
                </form>
            `;

            this.openModal('Reschedule Appointment ' + ref, body);

            var self = this;
            document.getElementById('form-resched-modal').addEventListener('submit', function (e) {
                e.preventDefault();
                var newDate = document.getElementById('rs-date').value;
                var newTime = document.getElementById('rs-time').value;
                var reason = document.getElementById('rs-reason').value;

                db.rescheduleAppointment(ref, newDate, newTime, newDate + 'T' + newTime, self.currentUser, reason);
                self.closeModal();
                self.showToast('Rescheduled', 'Appointment ' + ref + ' moved to ' + newDate + ' ' + newTime, 'success');
                self.triggerAutomatedWhatsApp(ref, 'Rescheduled');
                self.openAppointmentDetailsDrawer(ref);
                self.refreshCurrentView();
            });
        },

        openWhatsAppSendModal: function (ref) {
            var appt = db.getAppointmentByRef(ref);
            if (!appt) return;

            var tplKey = appt.status === 'Confirmed' ? 'confirmation' :
                         (appt.status === 'Attended' ? 'attended' :
                         (appt.status === 'Rescheduled' ? 'rescheduled' :
                         (appt.status === 'Rejected' ? 'rejection' :
                         (appt.status === 'Not Attended' ? 'notAttended' : 'reminder'))));

            var compiledMsg = db.compileWhatsAppMessage(tplKey, appt);
            var phoneClean = db.formatWhatsAppPhone ? db.formatWhatsAppPhone(appt.patientPhone) : (appt.patientPhone || '').replace(/\D/g, '');

            var body = `
                <div class="admin-form">
                    <p style="font-size:13px; color:var(--text-secondary);">Template: <strong>${tplKey.toUpperCase()}</strong> for Patient <strong>${appt.patientName}</strong> (${appt.patientPhone || 'No Phone'})</p>
                    <div class="form-group">
                        <label>Message Content (Editable)</label>
                        <textarea id="wa-send-text" rows="8" style="font-family:inherit; font-size:13px; line-height:1.5;">${compiledMsg}</textarea>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button type="button" class="btn btn-secondary btn-block" id="btn-copy-wa">Copy Message</button>
                        <button type="button" class="btn btn-primary btn-block" id="btn-launch-wa" style="background:#25d366; border-color:#25d366; color:#fff;">Open & Send on WhatsApp</button>
                    </div>
                </div>
            `;

            this.openModal('WhatsApp Message Preview (' + ref + ')', body);

            var self = this;
            document.getElementById('btn-copy-wa').addEventListener('click', function () {
                var text = document.getElementById('wa-send-text').value;
                navigator.clipboard.writeText(text);
                self.showToast('Copied', 'WhatsApp message copied to clipboard.', 'info');
            });

            document.getElementById('btn-launch-wa').addEventListener('click', function () {
                var text = document.getElementById('wa-send-text').value;
                var url = 'https://wa.me/' + phoneClean + '?text=' + encodeURIComponent(text);
                window.open(url, '_blank');
            });
        },

        openInvoiceReceiptModal: function (ref) {
            var appt = db.getAppointmentByRef(ref);
            if (!appt) return;

            var doc = db.getDoctorById(appt.doctorId);
            var svc = db.getServiceById(appt.serviceId);
            var clinic = db.getClinic();

            var body = `
                <div style="background:#fff; color:#111; padding:24px; border-radius:var(--radius-md); font-family:sans-serif;" id="printable-receipt">
                    <div style="display:flex; justify-content:space-between; border-bottom:2px solid #24a3b1; padding-bottom:12px; margin-bottom:16px;">
                        <div>
                            <h2 style="margin:0; color:#011f23;">My Skin My Health</h2>
                            <p style="margin:2px 0 0 0; font-size:11px; color:#555;">Unit No. A 407/408, Pranik Chambers, Saki Vihar Road, Sakinaka, Mumbai • +91 8422 990 990</p>
                        </div>
                        <div style="text-align:right;">
                            <h3 style="margin:0; color:#24a3b1;">RECEIPT</h3>
                            <span style="font-size:12px; color:#777;">Ref: ${appt.reference}</span>
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:12px; margin-bottom:16px;">
                        <div><strong>Patient:</strong> ${appt.patientName} (${appt.patientPhone || ''})</div>
                        <div><strong>Date:</strong> ${appt.date} at ${appt.time}</div>
                        <div><strong>Attending Doctor:</strong> ${doc ? doc.name : 'Specialist'}</div>
                        <div><strong>Payment Status:</strong> <span style="color:green; font-weight:bold;">${appt.paymentStatus || 'Paid'}</span></div>
                    </div>

                    <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:20px;">
                        <thead>
                            <tr style="background:#f4f4f4;">
                                <th style="padding:8px; text-align:left; border-bottom:1px solid #ddd;">Description</th>
                                <th style="padding:8px; text-align:right; border-bottom:1px solid #ddd;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding:8px; border-bottom:1px solid #eee;">${svc ? svc.name : 'Skin & Health Consultation'}</td>
                                <td style="padding:8px; text-align:right; border-bottom:1px solid #eee;">₹${appt.fee || 500}</td>
                            </tr>
                            <tr style="font-weight:bold;">
                                <td style="padding:8px;">Total Paid</td>
                                <td style="padding:8px; text-align:right; color:#24a3b1; font-size:14px;">₹${appt.fee || 500}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div style="text-align:center; font-size:11px; color:#888;">Thank you for trusting My Skin My Health with your smile.</div>
                </div>
                <div style="margin-top:16px; text-align:right;">
                    <button type="button" class="btn btn-primary" onclick="window.print()">Print Receipt</button>
                </div>
            `;

            this.openModal('Receipt / Invoice (' + ref + ')', body);
        },

        openPatientDetailsDrawer: function (patId) {
            var pat = db.getPatientById(patId);
            if (!pat) return;

            var appts = db.getAppointments().filter(function (a) { return a.patientId === pat.id; });

            var body = `
                <div style="display:flex; flex-direction:column; gap:16px;">
                    <div style="background:var(--bg-surface); padding:16px; border-radius:var(--radius-md);">
                        <h3 style="margin:0 0 4px 0;">${pat.name}</h3>
                        <div style="font-size:12px; color:var(--text-muted);">${pat.id} • ${pat.gender || ''} (${pat.age || 30} yrs) • Blood Group: ${pat.bloodGroup || 'N/A'}</div>
                        <div style="font-size:12px; color:var(--text-secondary); margin-top:4px;">Phone: ${pat.phone || 'N/A'} | Email: ${pat.email || 'N/A'}</div>
                    </div>

                    <div class="admin-card" style="padding:16px;">
                        <h4 style="font-size:13px; color:var(--brand-teal); margin-bottom:6px;">Medical Background</h4>
                        <p style="font-size:12px; color:var(--text-secondary);">${pat.medicalHistory || 'No medical history recorded.'}</p>
                    </div>

                    <div class="admin-card" style="padding:16px;">
                        <h4 style="font-size:13px; color:var(--brand-teal); margin-bottom:10px;">Consultation History (${appts.length})</h4>
                        ${appts.length === 0 ? '<p style="font-size:12px; color:var(--text-muted);">No past appointments.</p>' : appts.map(function (a) {
                            var svc = db.getServiceById(a.serviceId);
                            return `
                                <div style="font-size:12px; padding:8px 0; border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between;">
                                    <div>
                                        <strong>${svc ? svc.name : 'Consultation'}</strong>
                                        <div style="color:var(--text-muted); font-size:10px;">${a.date} at ${a.time} (${a.reference})</div>
                                    </div>
                                    <span class="badge badge-${a.status.toLowerCase().replace(/\s+/g, '-')}">${a.status}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;

            this.openDrawer('Patient Profile: ' + pat.name, body);
        },

        openPatientModal: function (patId) {
            var pat = patId ? db.getPatientById(patId) : {};
            var isEdit = !!patId;

            var body = `
                <form id="form-patient-editor" class="admin-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Full Name *</label>
                            <input type="text" id="pe-name" value="${pat.name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Phone Number *</label>
                            <input type="tel" id="pe-phone" value="${pat.phone || ''}" required>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Email Address</label>
                            <input type="email" id="pe-email" value="${pat.email || ''}">
                        </div>
                        <div class="form-group">
                            <label>Age</label>
                            <input type="number" id="pe-age" value="${pat.age || 30}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Medical History & Notes</label>
                        <textarea id="pe-history" rows="3">${pat.medicalHistory || ''}</textarea>
                    </div>

                    <button type="submit" class="btn btn-primary btn-block">${isEdit ? 'Save Changes' : 'Create Patient Record'}</button>
                </form>
            `;

            this.openModal(isEdit ? 'Edit Patient' : 'Register New Patient', body);

            var self = this;
            document.getElementById('form-patient-editor').addEventListener('submit', function (e) {
                e.preventDefault();
                pat.name = document.getElementById('pe-name').value;
                pat.phone = document.getElementById('pe-phone').value;
                pat.email = document.getElementById('pe-email').value;
                pat.age = parseInt(document.getElementById('pe-age').value, 10) || 30;
                pat.medicalHistory = document.getElementById('pe-history').value;

                db.savePatient(pat, self.currentUser);
                self.closeModal();
                self.showToast('Saved', 'Patient record updated.', 'success');
                self.refreshCurrentView();
            });
        },

        openDoctorModal: function (docId) {
            var doc = docId ? db.getDoctorById(docId) : {};
            var isEdit = !!docId;
            var services = db.getServices();

            var body = `
                <form id="form-doc-editor" class="admin-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Doctor Full Name *</label>
                            <input type="text" id="de-name" value="${doc.name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Specialization *</label>
                            <input type="text" id="de-spec" value="${doc.specialization || 'Dermatologist'}" required>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Qualifications</label>
                            <input type="text" id="de-qual" value="${doc.qualification || 'BDS'}">
                        </div>
                        <div class="form-group">
                            <label>Experience</label>
                            <input type="text" id="de-exp" value="${doc.experience || '5 years experience'}">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Email Address</label>
                            <input type="email" id="de-email" value="${doc.email || ''}">
                        </div>
                        <div class="form-group">
                            <label>Profile Image URL / Path</label>
                            <input type="text" id="de-img" value="${doc.image || 'assets/img/gen_team-image-5.jpg'}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Bio / About</label>
                        <textarea id="de-bio" rows="3">${doc.bio || ''}</textarea>
                    </div>

                    <div class="form-group" style="display:flex; flex-direction:column; gap:10px;">
                        <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                            <input type="checkbox" id="de-featured" ${doc.featured ? 'checked' : ''}> <strong>Feature this doctor on website homepage</strong>
                        </label>
                        <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                            <input type="checkbox" id="de-active" ${doc.active !== false ? 'checked' : ''}> Doctor Active &amp; Displayed in Team section
                        </label>
                        <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                            <input type="checkbox" id="de-login" ${doc.loginEnabled !== false ? 'checked' : ''}> Enable Doctor Login Panel Access (Default password: doctor123)
                        </label>
                    </div>

                    <div style="display:flex; gap:10px; margin-top:16px;">
                        <button type="submit" class="btn btn-primary" style="flex:1;">${isEdit ? 'Update Doctor' : 'Add Doctor'}</button>
                        ${isEdit ? '<button type="button" class="btn btn-danger" id="btn-delete-doc-modal" style="background:#dc3545; color:#fff; border:none; padding:0 18px; border-radius:var(--radius-md); cursor:pointer; font-weight:600;">Delete</button>' : ''}
                    </div>
                </form>
            `;

            this.openModal(isEdit ? 'Edit Doctor Profile' : 'Add New Specialist', body);

            var self = this;
            if (isEdit) {
                var delBtn = document.getElementById('btn-delete-doc-modal');
                if (delBtn) {
                    delBtn.addEventListener('click', function () {
                        if (confirm('Are you sure you want to permanently delete ' + (doc.name || 'this doctor') + '? It will be removed from the website immediately.')) {
                            db.deleteDoctor(doc.id, self.currentUser);
                            self.closeModal();
                            self.showToast('Deleted', (doc.name || 'Doctor') + ' has been removed.', 'success');
                            self.refreshCurrentView();
                        }
                    });
                }
            }

            document.getElementById('form-doc-editor').addEventListener('submit', function (e) {
                e.preventDefault();
                doc.name = document.getElementById('de-name').value;
                doc.specialization = document.getElementById('de-spec').value;
                doc.qualification = document.getElementById('de-qual').value;
                doc.experience = document.getElementById('de-exp').value;
                doc.email = document.getElementById('de-email').value;
                doc.image = document.getElementById('de-img').value;
                doc.bio = document.getElementById('de-bio').value;
                doc.featured = document.getElementById('de-featured').checked;
                doc.active = document.getElementById('de-active').checked;
                doc.loginEnabled = document.getElementById('de-login').checked;

                db.saveDoctor(doc, self.currentUser);
                self.closeModal();
                self.showToast('Saved', 'Doctor details saved.', 'success');
                self.refreshCurrentView();
            });
        },

        openServiceModal: function (svcId) {
            var svc = svcId ? db.getServiceById(svcId) : {};
            var isEdit = !!svcId;

            var body = `
                <form id="form-svc-editor" class="admin-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Service Name *</label>
                            <input type="text" id="se-name" value="${svc.name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Price (₹) *</label>
                            <input type="number" id="se-price" value="${svc.price || 500}" required>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Duration (Minutes) *</label>
                            <input type="number" id="se-duration" value="${svc.duration || 30}" required>
                        </div>
                        <div class="form-group">
                            <label>Category</label>
                            <input type="text" id="se-category" value="${svc.category || 'General'}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="se-desc" rows="3">${svc.description || ''}</textarea>
                    </div>

                    <button type="submit" class="btn btn-primary btn-block">${isEdit ? 'Update Service' : 'Create Service'}</button>
                </form>
            `;

            this.openModal(isEdit ? 'Edit Clinical Service' : 'Add New Clinical Service', body);

            var self = this;
            document.getElementById('form-svc-editor').addEventListener('submit', function (e) {
                e.preventDefault();
                svc.name = document.getElementById('se-name').value;
                svc.price = parseInt(document.getElementById('se-price').value, 10) || 500;
                svc.duration = parseInt(document.getElementById('se-duration').value, 10) || 30;
                svc.category = document.getElementById('se-category').value;
                svc.description = document.getElementById('se-desc').value;

                db.saveService(svc, self.currentUser);
                self.closeModal();
                self.showToast('Saved', 'Service saved successfully.', 'success');
                self.refreshCurrentView();
            });
        },

        openBlogModal: function (blogId) {
            var blog = blogId ? db.getBlogById(blogId) : {};
            var isEdit = !!blogId;

            var body = `
                <form id="form-blog-editor" class="admin-form">
                    <div class="form-group">
                        <label>Article Title *</label>
                        <input type="text" id="be-title" value="${blog.title || ''}" required>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Category *</label>
                            <input type="text" id="be-cat" value="${blog.category || 'Preventive Care'}" required>
                        </div>
                        <div class="form-group">
                            <label>Author</label>
                            <input type="text" id="be-author" value="${blog.author || 'Dr. Pallavi Rathi'}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Featured Image URL / Path</label>
                        <input type="text" id="be-img" value="${blog.image || 'assets/img/gen_blog-image-4.jpg'}">
                    </div>

                    <div class="form-group">
                        <label>Short Summary *</label>
                        <textarea id="be-summary" rows="2" required>${blog.summary || ''}</textarea>
                    </div>

                    <div class="form-group">
                        <label>Full Content (HTML / Text)</label>
                        <textarea id="be-content" rows="6">${blog.content || ''}</textarea>
                    </div>

                    <div class="form-group">
                        <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                            <input type="checkbox" id="be-pub" ${blog.published !== false ? 'checked' : ''}> Publish Immediately
                        </label>
                        <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                            <input type="checkbox" id="be-feat" ${blog.featured ? 'checked' : ''}> Set as Featured Article on Blog Header
                        </label>
                    </div>

                    <button type="submit" class="btn btn-primary btn-block">${isEdit ? 'Update Article' : 'Publish Article'}</button>
                </form>
            `;

            this.openModal(isEdit ? 'Edit Blog Article' : 'Write Health & Skincare Article', body, 'modal-lg');

            var self = this;
            document.getElementById('form-blog-editor').addEventListener('submit', function (e) {
                e.preventDefault();
                blog.title = document.getElementById('be-title').value;
                blog.category = document.getElementById('be-cat').value;
                blog.author = document.getElementById('be-author').value;
                blog.image = document.getElementById('be-img').value;
                blog.summary = document.getElementById('be-summary').value;
                blog.content = document.getElementById('be-content').value;
                blog.published = document.getElementById('be-pub').checked;
                blog.featured = document.getElementById('be-feat').checked;

                db.saveBlog(blog, self.currentUser);
                self.closeModal();
                self.showToast('Published', 'Article saved and synced to blog.html', 'success');
                self.refreshCurrentView();
            });
        },

        openReviewModal: function (revId) {
            var rev = revId ? (db.getReviews().find(function (r) { return r.id === revId; }) || {}) : {};
            var isEdit = !!revId;

            var body = `
                <form id="form-rev-editor" class="admin-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Reviewer Name *</label>
                            <input type="text" id="re-author" value="${rev.author || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Designation / Role</label>
                            <input type="text" id="re-desig" value="${rev.designation || 'Patient'}">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Star Rating (1 - 5)</label>
                            <select id="re-rating">
                                <option value="5" ${rev.rating === 5 ? 'selected' : ''}>5 Stars ★★★★★</option>
                                <option value="4" ${rev.rating === 4 ? 'selected' : ''}>4 Stars ★★★★☆</option>
                                <option value="3" ${rev.rating === 3 ? 'selected' : ''}>3 Stars ★★★☆☆</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Avatar Photo URL / Path</label>
                            <input type="text" id="re-avatar" value="${rev.avatar || 'assets/img/gen_testimonial-author-1.jpg'}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Testimonial Comment *</label>
                        <textarea id="re-comment" rows="3" required>${rev.comment || ''}</textarea>
                    </div>

                    <div class="form-group">
                        <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                            <input type="checkbox" id="re-feat" ${rev.featured !== false ? 'checked' : ''}> Feature in Homepage Testimonial Slider
                        </label>
                    </div>

                    <button type="submit" class="btn btn-primary btn-block">${isEdit ? 'Update Review' : 'Add Testimonial'}</button>
                </form>
            `;

            this.openModal(isEdit ? 'Edit Testimonial' : 'Add Patient Review', body);

            var self = this;
            document.getElementById('form-rev-editor').addEventListener('submit', function (e) {
                e.preventDefault();
                rev.author = document.getElementById('re-author').value;
                rev.designation = document.getElementById('re-desig').value;
                rev.rating = parseInt(document.getElementById('re-rating').value, 10) || 5;
                rev.avatar = document.getElementById('re-avatar').value;
                rev.comment = document.getElementById('re-comment').value;
                rev.featured = document.getElementById('re-feat').checked;
                rev.published = true;

                db.saveReview(rev, self.currentUser);
                self.closeModal();
                self.showToast('Saved', 'Review saved and synced with website testimonials.', 'success');
                self.refreshCurrentView();
            });
        },

        openStaffModal: function (staffId) {
            var staffMember = staffId ? (db.getStaff().find(function (s) { return s.id === staffId; }) || {}) : {};
            var isEdit = !!staffId;

            var allModules = [
                'dashboard', 'appointments', 'calendar', 'patients', 'doctors',
                'services', 'blogs', 'reviews', 'analytics', 'reports',
                'revenue', 'contact', 'whatsapp', 'staff', 'settings'
            ];

            var curPerms = staffMember.permissions || ['dashboard', 'appointments', 'calendar', 'patients'];

            var body = `
                <form id="form-staff-editor" class="admin-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Full Name *</label>
                            <input type="text" id="ste-name" value="${staffMember.name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Role</label>
                            <select id="ste-role">
                                <option value="STAFF" ${staffMember.role === 'STAFF' ? 'selected' : ''}>Reception / Assistant Staff</option>
                                <option value="ADMIN" ${staffMember.role === 'ADMIN' ? 'selected' : ''}>Full Administrator</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Work Email *</label>
                            <input type="email" id="ste-email" value="${staffMember.email || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Login Password ${isEdit ? '(Leave blank to keep)' : '*'}</label>
                            <input type="password" id="ste-pass" placeholder="••••••••" ${!isEdit ? 'required' : ''}>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Module Access Permissions</label>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; background:var(--bg-surface); padding:12px; border-radius:var(--radius-sm);">
                            ${allModules.map(function (m) {
                                var checked = curPerms.indexOf(m) !== -1 || curPerms.indexOf('all') !== -1;
                                return `
                                    <label style="font-size:12px; display:flex; align-items:center; gap:6px; text-transform:capitalize;">
                                        <input type="checkbox" class="ste-perm-cb" value="${m}" ${checked ? 'checked' : ''}> ${m}
                                    </label>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <button type="submit" class="btn btn-primary btn-block">${isEdit ? 'Save Staff User' : 'Create Staff Member'}</button>
                </form>
            `;

            this.openModal(isEdit ? 'Edit Staff User' : 'Add New Staff User', body);

            var self = this;
            document.getElementById('form-staff-editor').addEventListener('submit', function (e) {
                e.preventDefault();
                staffMember.name = document.getElementById('ste-name').value;
                staffMember.role = document.getElementById('ste-role').value;
                staffMember.email = document.getElementById('ste-email').value;
                var pass = document.getElementById('ste-pass').value;

                var perms = [];
                document.querySelectorAll('.ste-perm-cb:checked').forEach(function (cb) {
                    perms.push(cb.value);
                });
                staffMember.permissions = perms;

                db.saveStaff(staffMember, pass, self.currentUser);
                self.closeModal();
                self.showToast('Saved', 'Staff member permissions saved.', 'success');
                self.refreshCurrentView();
            });
        },

        /* ------------------------------------------------ Dialogs, Toasts, Modals */
        openModal: function (title, contentHtml, sizeClass) {
            document.getElementById('admin-modal-title').textContent = title;
            document.getElementById('admin-modal-body').innerHTML = contentHtml;
            var box = document.getElementById('admin-modal-box');
            box.className = 'admin-modal-box ' + (sizeClass || '');
            document.getElementById('admin-modal-root').classList.remove('is-hidden');
        },

        closeModal: function () {
            document.getElementById('admin-modal-root').classList.add('is-hidden');
        },

        openDrawer: function (title, contentHtml) {
            document.getElementById('admin-drawer-title').textContent = title;
            document.getElementById('admin-drawer-body').innerHTML = contentHtml;
            document.getElementById('admin-drawer-root').classList.remove('is-hidden');
        },

        closeDrawer: function () {
            document.getElementById('admin-drawer-root').classList.add('is-hidden');
        },

        confirmDialog: function (title, message, onOk) {
            var root = document.getElementById('admin-confirm-root');
            document.getElementById('confirm-title').textContent = title;
            document.getElementById('confirm-message').textContent = message;
            root.classList.remove('is-hidden');

            var btnOk = document.getElementById('confirm-btn-ok');
            var btnCancel = document.getElementById('confirm-btn-cancel');

            function cleanup() {
                root.classList.add('is-hidden');
                btnOk.removeEventListener('click', okHandler);
                btnCancel.removeEventListener('click', cancelHandler);
            }

            function okHandler() {
                cleanup();
                if (typeof onOk === 'function') onOk();
            }

            function cancelHandler() {
                cleanup();
            }

            btnOk.addEventListener('click', okHandler);
            btnCancel.addEventListener('click', cancelHandler);
        },

        openCurrentUserProfileModal: function () {
            var user = this.currentUser;
            if (!user) return;

            var avatarRaw = user.avatar || (user.role === 'DOCTOR' && db.getDoctorById(user.refId) ? db.getDoctorById(user.refId).image : 'assets/img/gen_team-image-5.jpg');
            var avatarUrl = avatarRaw.startsWith('http') || avatarRaw.startsWith('data:') ? avatarRaw : ('/' + avatarRaw.replace(/^\.\.\//, '').replace(/^\//, ''));

            var body = `
                <form id="form-my-profile" class="admin-form">
                    <div style="display:flex; align-items:center; gap:16px; background:var(--bg-surface); padding:16px; border-radius:var(--radius-md); margin-bottom:16px; border:1px solid var(--border-subtle);">
                        <img src="${avatarUrl}" alt="Avatar" id="my-profile-avatar-preview" style="width:60px; height:60px; border-radius:50%; object-fit:cover; border:2px solid var(--brand-teal);"/>
                        <div>
                            <h3 style="margin:0 0 4px 0; font-size:16px; color:#fff;">${user.name}</h3>
                            <div style="display:flex; gap:8px; align-items:center;">
                                <span class="badge ${user.role==='ADMIN'?'badge-featured':(user.role==='DOCTOR'?'badge-active':'badge-confirmed')}">${user.role}</span>
                                <span style="font-size:12px; color:var(--text-muted);">${user.email}</span>
                            </div>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Full Name *</label>
                            <input type="text" id="prof-name" value="${user.name || ''}" required />
                        </div>
                        <div class="form-group">
                            <label>Email Address</label>
                            <input type="email" id="prof-email" value="${user.email || ''}" readonly style="opacity:0.75; cursor:not-allowed;" title="Email is your primary login identifier" />
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Phone / WhatsApp Number</label>
                            <input type="text" id="prof-phone" value="${user.phone || '+91 8422 990 990'}" />
                        </div>
                        <div class="form-group">
                            <label>Avatar Photo URL / Path</label>
                            <input type="text" id="prof-avatar" value="${avatarUrl}" />
                        </div>
                    </div>

                    <div style="border-top:1px solid var(--border-subtle); margin:16px 0; padding-top:14px;">
                        <h4 style="font-size:13px; color:var(--brand-teal); margin-bottom:10px;">Security & Password Update</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label>New Password</label>
                                <input type="password" id="prof-new-pass" placeholder="Leave empty to keep current password" />
                            </div>
                            <div class="form-group">
                                <label>Confirm New Password</label>
                                <input type="password" id="prof-confirm-pass" placeholder="Re-enter new password" />
                            </div>
                        </div>
                    </div>

                    <div style="display:flex; gap:10px; justify-content:space-between; margin-top:14px;">
                        <button type="button" class="btn btn-danger btn-sm" id="btn-prof-logout">Sign Out</button>
                        <button type="submit" class="btn btn-primary">Save Profile Changes</button>
                    </div>
                </form>
            `;

            this.openModal('My Account & Profile Settings', body);

            var self = this;
            document.getElementById('prof-avatar').addEventListener('input', function (e) {
                var prev = document.getElementById('my-profile-avatar-preview');
                if (prev && e.target.value) prev.src = e.target.value;
            });

            document.getElementById('btn-prof-logout').addEventListener('click', function () {
                self.closeModal();
                self.confirmDialog('Sign Out', 'Are you sure you want to sign out?', function () {
                    db.logout(false);
                    self.currentUser = null;
                    self.showToast('Signed Out', 'You have been signed out successfully.', 'info');
                    self.showLoginScreen();
                });
            });

            document.getElementById('form-my-profile').addEventListener('submit', function (e) {
                e.preventDefault();
                var newName = document.getElementById('prof-name').value.trim();
                var newPhone = document.getElementById('prof-phone').value.trim();
                var newAvatar = document.getElementById('prof-avatar').value.trim();
                var newPass = document.getElementById('prof-new-pass').value;
                var confirmPass = document.getElementById('prof-confirm-pass').value;

                if (newPass) {
                    if (newPass.length < 4) {
                        self.showToast('Password Error', 'Password must be at least 4 characters long.', 'danger');
                        return;
                    }
                    if (newPass !== confirmPass) {
                        self.showToast('Mismatch', 'New passwords do not match.', 'danger');
                        return;
                    }
                    db.data.credentials = db.data.credentials || {};
                    if (db.data.credentials[user.email]) {
                        db.data.credentials[user.email].password = newPass;
                    }
                }

                user.name = newName;
                user.phone = newPhone;
                user.avatar = newAvatar;

                if (user.role === 'DOCTOR' && user.refId) {
                    var doc = db.getDoctorById(user.refId);
                    if (doc) {
                        doc.name = newName;
                        doc.image = newAvatar;
                        db.saveDoctor(doc, user);
                    }
                } else if (user.role === 'STAFF' && user.refId) {
                    var stf = (db.data.staff || []).find(function(s){ return s.id === user.refId; });
                    if (stf) {
                        stf.name = newName;
                        stf.phone = newPhone;
                        stf.avatar = newAvatar;
                    }
                }

                db.save();
                global.sessionStorage.setItem('lumora_admin_session', JSON.stringify(user));

                self.currentUser = user;
                self.showAppShell();
                self.closeModal();
                self.showToast('Profile Saved', 'Your account details have been updated successfully.', 'success');
                self.refreshCurrentView();
            });
        },

        showToast: function (title, desc, type) {
            var container = document.getElementById('admin-toast-container');
            if (!container) return;

            var toast = document.createElement('div');
            toast.className = 'admin-toast toast-' + (type || 'success');
            toast.innerHTML = `
                <div class="toast-body">
                    <div class="toast-title">${title}</div>
                    <div class="toast-desc">${desc || ''}</div>
                </div>
            `;
            container.appendChild(toast);

            setTimeout(function () {
                toast.classList.add('toast-leaving');
                setTimeout(function () {
                    if (toast.parentNode) toast.parentNode.removeChild(toast);
                }, 300);
            }, 3500);
        }
    };

    // Initialize App when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            app.init();
        });
    } else {
        app.init();
    }

    global.LumoraAdminApp = app;

})(typeof window !== 'undefined' ? window : this);
