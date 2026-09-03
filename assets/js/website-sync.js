/* ==========================================================================
   The Dental Solutions — Website Synchronization & Dynamic Content Hydrator
   --------------------------------------------------------------------------
   Connects the public website presentation layer to the central LumoraDB
   while preserving 100% of the existing design, animations and layouts.
   ========================================================================== */
(function (global) {
    'use strict';

    function initSync() {
        if (!global.LumoraDB) return;

        var clinic = global.LumoraDB.getClinic();
        syncContactInfo(clinic);
        syncDoctors();
        syncServices();
        syncBlogs();
        syncReviews();
        injectPatientPortal();
    }

    // Run immediately and also on DOMContentLoaded / load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSync);
    } else {
        initSync();
    }
    window.addEventListener('load', initSync);

    // Cross-tab real-time live synchronization
    window.addEventListener('storage', function (e) {
        if (e.key === 'lumora_db_store' && global.LumoraDB) {
            try {
                global.LumoraDB.data = JSON.parse(e.newValue || '{}');
            } catch (_) { }
            initSync();
        }
    });

    // In-tab subscription
    if (global.LumoraDB && global.LumoraDB.subscribe) {
        global.LumoraDB.subscribe(function () {
            initSync();
            updatePatientNavState();
        });
    }

    /* ------------------------------------------------ Contact Information */
    function syncContactInfo(clinic) {
        if (!clinic) return;

        var cleanPhoneE164 = (clinic.phoneE164 || clinic.phone || '918422990990').replace(/\D/g, '');
        var cleanWa = (clinic.whatsapp || clinic.phoneE164 || clinic.phone || '918422990990').replace(/\D/g, '');

        // 1. Phone numbers across links and texts
        var phoneLinks = document.querySelectorAll('a[href^="tel:"], .bk-top__call, a.our-info_item-link[href^="tel:"]');
        phoneLinks.forEach(function (a) {
            a.href = 'tel:+' + cleanPhoneE164;
            // Update child span or div text if present
            var childText = a.querySelector('span, div, .our-info_item-para');
            if (childText) {
                if (childText.textContent.indexOf('Call :') !== -1 || childText.textContent.indexOf('Call:') !== -1) {
                    childText.textContent = 'Call : ' + (clinic.phone || '+91 8422 990 990');
                } else if (/\+?\d[\d\s-]{6,}/.test(childText.textContent)) {
                    childText.textContent = clinic.phone || '+91 8422 990 990';
                }
            } else if (/\+?\d[\d\s-]{6,}/.test(a.textContent)) {
                a.textContent = clinic.phone || '+91 8422 990 990';
            }
        });

        // 2. WhatsApp links
        var waLinks = document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp.com"]');
        waLinks.forEach(function (a) {
            var currHref = a.getAttribute('href') || '';
            var textParam = '';
            if (currHref.indexOf('text=') !== -1) {
                textParam = currHref.substring(currHref.indexOf('text='));
            }
            a.href = 'https://wa.me/' + cleanWa + (textParam ? '?' + textParam : '');
        });

        // 3. Email links
        var mailLinks = document.querySelectorAll('a[href^="mailto:"]');
        mailLinks.forEach(function (a) {
            if (clinic.email) {
                a.href = 'mailto:' + clinic.email + (a.href.indexOf('?subject=') !== -1 ? '?subject=contact' : '');
                var childText = a.querySelector('div, span, .our-info_item-para');
                if (childText && (childText.textContent.indexOf('Email:') !== -1 || childText.textContent.indexOf('Email :') !== -1)) {
                    childText.textContent = 'Email: ' + clinic.email;
                } else if (childText && childText.textContent.indexOf('@') !== -1) {
                    childText.textContent = clinic.email;
                }
            }
        });

        // 4. Address elements
        var addressElements = document.querySelectorAll('.location_para, .footer-address, [data-sync="address"], .our-info_item-para.is-address');
        addressElements.forEach(function (el) {
            if (clinic.address) {
                el.textContent = clinic.address;
            }
        });
    }

    /* ---------------------------------------------------- Doctors Hydration */
    function renderDoctorCard(doc) {
        var imgSrc = (doc.image || 'assets/img/gen_team-image-5.jpg').replace(/^\.\.\//, '').replace(/^\//, '');
        var spec = doc.specialization || doc.qualification || 'Dentist';
        var ig = doc.instagram || 'https://instagram.com/';
        var tw = doc.twitter || 'https://twitter.com/';
        return '<div role="listitem" class="w-dyn-item">' +
            '<div class="team_item">' +
                '<a aria-label="doctors profile" href="about.html#team-members" class="team-image_wrap w-inline-block">' +
                    '<div class="image-animation-trigger">' +
                        '<div class="image-animation-scale">' +
                            '<img src="' + imgSrc + '" loading="lazy" alt="' + doc.name + '" class="team_image"/>' +
                        '</div>' +
                    '</div>' +
                '</a>' +
                '<div class="team-item_content">' +
                    '<a aria-label="doctor profile" href="about.html#team-members" class="team-menmber_wrap w-inline-block">' +
                        '<h3 class="team-menmber_name">' + doc.name + '</h3>' +
                    '</a>' +
                    '<div class="team-menuber_info">' +
                        '<p class="team-menuber_designation">' + spec + '</p>' +
                        '<div class="team-menuber_social">' +
                            '<a aria-label="team social link" href="' + ig + '" target="_blank" class="team-menuber_social-item w-inline-block">' +
                                '<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 24 24" fill="none" vector-effect="non-scaling-stroke"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="currentColor"/></svg>' +
                            '</a>' +
                            '<a aria-label="team social link" href="' + tw + '" target="_blank" class="team-menuber_social-item w-inline-block">' +
                                '<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 24 24" fill="none" vector-effect="non-scaling-stroke"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"/></svg>' +
                            '</a>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function syncDoctors() {
        if (!global.LumoraDB || !global.LumoraDB.getDoctors) return;
        var doctors = global.LumoraDB.getDoctors(true) || [];
        var teamList = document.querySelector('.team_list, .team-collection_list');
        var homeSection = document.querySelector('.section_team.is-home');

        var isHomepage = !!document.querySelector('.section_team.is-home, .is-home-hero, .section_hero.is-home');
        var path = (window.location.pathname || '').toLowerCase();
        if (path.indexOf('about') !== -1) {
            isHomepage = false;
        }

        if (isHomepage) {
            var featuredDoctors = doctors.filter(function (d) { return d.featured === true; });
            if (homeSection) {
                homeSection.style.display = featuredDoctors.length === 0 ? 'none' : '';
            }
            if (teamList) {
                teamList.innerHTML = featuredDoctors.map(renderDoctorCard).join('');
            }
        } else if (teamList) {
            var activeDoctors = doctors.filter(function (d) { return d.active !== false; });
            teamList.innerHTML = activeDoctors.map(renderDoctorCard).join('');
        }
    }

    /* --------------------------------------------------- Services Hydration */
    function syncServices() {
        var services = global.LumoraDB.getServices(true);
        if (!services || !services.length) return;

        // 1. Homepage Service List (.service-item_info-title)
        var homeServiceTitles = document.querySelectorAll('.service-item_info-title');
        if (homeServiceTitles.length > 0) {
            services.slice(0, homeServiceTitles.length).forEach(function (svc, idx) {
                homeServiceTitles[idx].textContent = svc.name;
            });
        }

        // 2. Services Page (.service-item_wrap)
        var serviceList = document.querySelector('.service_list, .collection-list.w-dyn-items');
        if (serviceList) {
            var items = serviceList.querySelectorAll('.service-item_wrap, .w-dyn-item');
            if (items.length > 0) {
                services.slice(0, items.length).forEach(function (svc, idx) {
                    var item = items[idx];
                    var titleEl = item.querySelector('.service-trigger_title, .service_title, h3');
                    var descEl = item.querySelector('.service-trigger_para, .service_para, p');
                    if (titleEl && svc.name) titleEl.textContent = svc.name;
                    if (descEl && svc.description) descEl.textContent = svc.description;
                });
            }
        }
    }

    /* ------------------------------------------------------ Blogs Hydration */
    function syncBlogs() {
        var blogs = global.LumoraDB.getBlogs(true);
        if (!blogs || !blogs.length) return;

        // Featured blog
        var featureBlog = document.querySelector('.feature_blog');
        if (featureBlog) {
            var featured = blogs.find(function (b) { return b.featured; }) || blogs[0];
            if (featured) {
                var titleEl = featureBlog.querySelector('.feature-blog_title, h2');
                var textEl = featureBlog.querySelector('.feature-blog_text, p');
                var tagEl = featureBlog.querySelector('.feature-blog_tag div, .feature-blog_tag');
                var img = featureBlog.querySelector('.feature-blog_image, img');
                if (titleEl) titleEl.textContent = featured.title;
                if (textEl) textEl.textContent = featured.summary;
                if (tagEl) tagEl.textContent = featured.category;
                if (img && featured.image) img.src = featured.image;
            }
        }

        // Blog list items
        var blogList = document.querySelector('.blog_list');
        if (blogList) {
            var items = blogList.querySelectorAll('.blog_item, .w-dyn-item');
            if (items.length > 0) {
                blogs.slice(0, items.length).forEach(function (b, idx) {
                    var item = items[idx];
                    var titleEl = item.querySelector('.blog-item_title, h2, h3');
                    var img = item.querySelector('.blog-item_image, img');
                    if (titleEl && b.title) titleEl.textContent = b.title;
                    if (img && b.image) img.src = b.image;
                });
            }
        }
    }

    /* ---------------------------------------------------- Reviews Hydration */
    function syncReviews() {
        var reviews = global.LumoraDB.getReviews(true);
        if (!reviews || !reviews.length) return;

        var sliderCards = document.querySelectorAll('.testimonial-slider_card, .testimonial_card');
        if (sliderCards.length > 0) {
            reviews.slice(0, sliderCards.length).forEach(function (rev, idx) {
                var card = sliderCards[idx];
                var authorEl = card.querySelector('.testimonial-author_name, h3, h4');
                var desigEl = card.querySelector('.testimonial-author_designation, .author_designation');
                var quoteEl = card.querySelector('.testimonial-slider_quotes, .testimonial_quotes, p');
                var img = card.querySelector('.testimonial-author_image, img');

                if (authorEl && rev.author) authorEl.textContent = rev.author;
                if (desigEl && rev.designation) desigEl.textContent = rev.designation;
                if (quoteEl && rev.comment) quoteEl.textContent = rev.comment;
                if (img && rev.avatar) img.src = rev.avatar;
            });
        }
    }

    /* ------------------------------------------------ Patient Portal & Auth */
    function injectPatientPortal() {
        // Inject button into navbar
        var navMenu = document.querySelector('.navbar_menu');
        var navWrapper = document.querySelector('.navbar-button_wrapper');
        if (!navMenu && !navWrapper) return;

        var patientPortalBtn = document.getElementById('lumora-patient-portal-btn');
        if (!patientPortalBtn) {
            patientPortalBtn = document.createElement('a');
            patientPortalBtn.id = 'lumora-patient-portal-btn';
            patientPortalBtn.href = '#patient-portal';
            patientPortalBtn.className = 'lumora-patient-nav-btn';
            patientPortalBtn.innerHTML = `
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span id="lumora-patient-nav-label">Patient Portal</span>
            `;
            if (navWrapper) {
                navWrapper.insertBefore(patientPortalBtn, navWrapper.firstChild);
            } else if (navMenu) {
                navMenu.appendChild(patientPortalBtn);
            }

            patientPortalBtn.addEventListener('click', function (e) {
                e.preventDefault();
                openPatientModal();
            });
        }

        // Add Staff/Admin discrete link in footer
        var footerBottom = document.querySelector('.footer_bottom-wrap, .footer-bottom, .navbar-dropdown_bottom');
        if (footerBottom && !document.getElementById('lumora-admin-shortcut')) {
            var adminLink = document.createElement('a');
            adminLink.id = 'lumora-admin-shortcut';
            adminLink.href = 'admin/index.html';
            adminLink.className = 'lumora-footer-admin-link';
            adminLink.innerHTML = '⚡ Staff & Admin Access';
            footerBottom.appendChild(adminLink);
        }

        // Create Modal Container in DOM
        if (!document.getElementById('lumora-patient-modal-root')) {
            var modalRoot = document.createElement('div');
            modalRoot.id = 'lumora-patient-modal-root';
            modalRoot.className = 'lumora-modal-root is-hidden';
            modalRoot.innerHTML = `
                <div class="lumora-modal-backdrop" id="lumora-patient-backdrop"></div>
                <div class="lumora-modal-card">
                    <button class="lumora-modal-close" id="lumora-patient-close" aria-label="Close modal">&times;</button>
                    <div id="lumora-patient-modal-content"></div>
                </div>
            `;
            document.body.appendChild(modalRoot);

            document.getElementById('lumora-patient-backdrop').addEventListener('click', closePatientModal);
            document.getElementById('lumora-patient-close').addEventListener('click', closePatientModal);
        }

        updatePatientNavState();
    }

    function updatePatientNavState() {
        var session = global.LumoraDB.getPatientSession();
        var label = document.getElementById('lumora-patient-nav-label');
        if (label) {
            if (session) {
                label.textContent = 'Hi, ' + (session.name ? session.name.split(' ')[0] : 'Patient');
            } else {
                label.textContent = 'Patient Portal';
            }
        }
    }

    function openPatientModal() {
        var modal = document.getElementById('lumora-patient-modal-root');
        if (!modal) return;
        renderPatientPortalView();
        modal.classList.remove('is-hidden');
        document.body.style.overflow = 'hidden';
    }

    function closePatientModal() {
        var modal = document.getElementById('lumora-patient-modal-root');
        if (modal) {
            modal.classList.add('is-hidden');
            document.body.style.overflow = '';
        }
    }

    function renderPatientPortalView() {
        var content = document.getElementById('lumora-patient-modal-content');
        if (!content) return;

        var session = global.LumoraDB.getPatientSession();

        if (!session) {
            // Render Login / Register tabs
            content.innerHTML = `
                <div class="lumora-auth-box">
                    <div class="lumora-auth-header">
                        <div class="lumora-auth-badge">Patient Portal</div>
                        <h2>Welcome to My Skin My Health</h2>
                        <p>Sign in to manage your appointments, view dental history, or book a consultation.</p>
                    </div>

                    <div class="lumora-tab-nav">
                        <button class="lumora-tab-btn is-active" id="btn-tab-login">Login</button>
                        <button class="lumora-tab-btn" id="btn-tab-reg">Create Account</button>
                    </div>

                    <!-- Login Form -->
                    <form id="form-patient-login" class="lumora-form">
                        <div class="lumora-field">
                            <label>Email Address</label>
                            <input type="email" id="pat-login-email" required placeholder="patient@example.com" value="patient@example.com" autocomplete="username">
                        </div>
                        <div class="lumora-field">
                            <label>Password</label>
                            <input type="password" id="pat-login-pass" required placeholder="••••••••" value="patient123" autocomplete="current-password">
                        </div>
                        <div id="pat-login-error" class="lumora-form-error is-hidden"></div>
                        <button type="submit" class="lumora-btn-primary">Sign In to Portal</button>
                        <div class="lumora-auth-hint">Demo Patient: patient@example.com / patient123</div>
                    </form>

                    <!-- Register Form -->
                    <form id="form-patient-reg" class="lumora-form is-hidden" style="display:none;">
                        <div class="lumora-field">
                            <label>Full Name *</label>
                            <input type="text" id="pat-reg-name" required placeholder="e.g. Ayesha Khan">
                        </div>
                        <div class="lumora-field-row">
                            <div class="lumora-field">
                                <label>Phone Number *</label>
                                <input type="tel" id="pat-reg-phone" required placeholder="+91 98765 43210">
                            </div>
                            <div class="lumora-field">
                                <label>Age</label>
                                <input type="number" id="pat-reg-age" placeholder="28" min="1" max="110">
                            </div>
                        </div>
                        <div class="lumora-field">
                            <label>Email Address *</label>
                            <input type="email" id="pat-reg-email" required placeholder="name@example.com">
                        </div>
                        <div class="lumora-field">
                            <label>Password *</label>
                            <input type="password" id="pat-reg-pass" required placeholder="Minimum 6 characters">
                        </div>
                        <div id="pat-reg-error" class="lumora-form-error is-hidden"></div>
                        <button type="submit" class="lumora-btn-primary">Create Patient Account</button>
                    </form>
                </div>
            `;

            // Tab switching logic
            var tabLogin = document.getElementById('btn-tab-login');
            var tabReg = document.getElementById('btn-tab-reg');
            var formLogin = document.getElementById('form-patient-login');
            var formReg = document.getElementById('form-patient-reg');

            tabLogin.addEventListener('click', function () {
                tabLogin.classList.add('is-active');
                tabReg.classList.remove('is-active');
                formLogin.classList.remove('is-hidden');
                formLogin.style.display = 'flex';
                formReg.classList.add('is-hidden');
                formReg.style.display = 'none';
            });

            tabReg.addEventListener('click', function () {
                tabReg.classList.add('is-active');
                tabLogin.classList.remove('is-active');
                formReg.classList.remove('is-hidden');
                formReg.style.display = 'flex';
                formLogin.classList.add('is-hidden');
                formLogin.style.display = 'none';
            });

            // Login submission
            formLogin.addEventListener('submit', function (e) {
                e.preventDefault();
                var email = document.getElementById('pat-login-email').value;
                var pass = document.getElementById('pat-login-pass').value;
                var res = global.LumoraDB.login(email, pass);
                if (res.success && res.user.role === 'PATIENT') {
                    updatePatientNavState();
                    renderPatientPortalView();
                } else if (res.success && (res.user.role === 'ADMIN' || res.user.role === 'STAFF' || res.user.role === 'DOCTOR')) {
                    // Redirect to Admin portal
                    window.location.href = 'admin/index.html';
                } else {
                    var errEl = document.getElementById('pat-login-error');
                    errEl.textContent = res.message || 'Login failed. Please check credentials.';
                    errEl.classList.remove('is-hidden');
                }
            });

            // Register submission
            formReg.addEventListener('submit', function (e) {
                e.preventDefault();
                var name = document.getElementById('pat-reg-name').value;
                var phone = document.getElementById('pat-reg-phone').value;
                var age = document.getElementById('pat-reg-age').value;
                var email = document.getElementById('pat-reg-email').value;
                var pass = document.getElementById('pat-reg-pass').value;

                var res = global.LumoraDB.registerPatient(name, phone, email, pass, age);
                if (res.success) {
                    updatePatientNavState();
                    renderPatientPortalView();
                } else {
                    var errEl = document.getElementById('pat-reg-error');
                    errEl.textContent = res.message || 'Registration failed.';
                    errEl.classList.remove('is-hidden');
                }
            });

        } else {
            // Patient is authenticated -> show Dashboard & My Appointments
            var allAppts = global.LumoraDB.getAppointments();
            var myAppts = allAppts.filter(function (a) {
                return a.patientId === session.refId ||
                    (a.patientEmail && a.patientEmail.toLowerCase() === session.email.toLowerCase()) ||
                    (session.phone && a.patientPhone && a.patientPhone.replace(/\D/g, '') === session.phone.replace(/\D/g, ''));
            });

            var upcoming = myAppts.filter(function (a) { return a.status !== 'Attended' && a.status !== 'Rejected' && a.status !== 'Cancelled'; });
            var past = myAppts.filter(function (a) { return a.status === 'Attended' || a.status === 'Rejected' || a.status === 'Cancelled'; });

            var apptsHtml = '';
            if (myAppts.length === 0) {
                apptsHtml = `
                    <div class="lumora-empty-state">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#24a3b1" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                        <h4>No appointments yet</h4>
                        <p>Book your visit online with our gentle dental specialists.</p>
                        <a href="booking.html" class="lumora-btn-primary" style="display:inline-block; margin-top:12px;">Book Appointment Now</a>
                    </div>
                `;
            } else {
                apptsHtml = myAppts.map(function (appt) {
                    var doc = global.LumoraDB.getDoctorById(appt.doctorId);
                    var svc = global.LumoraDB.getServiceById(appt.serviceId);
                    var statusClass = 'status-' + (appt.status || 'Pending').toLowerCase().replace(/\s+/g, '-');

                    return `
                        <div class="lumora-patient-appt-card">
                            <div class="lumora-appt-card-top">
                                <div>
                                    <span class="lumora-badge ${statusClass}">${appt.status}</span>
                                    <span class="lumora-ref">Ref: ${appt.reference}</span>
                                </div>
                                <div class="lumora-appt-fee">₹${appt.fee || 500} (${appt.paymentStatus || 'Pending'})</div>
                            </div>
                            <div class="lumora-appt-details">
                                <div class="lumora-appt-item">
                                    <span class="label">Service:</span>
                                    <strong>${svc ? svc.name : 'Dental Consultation'}</strong>
                                </div>
                                <div class="lumora-appt-item">
                                    <span class="label">Doctor:</span>
                                    <strong>${doc ? doc.name : 'Assigned Doctor'}</strong>
                                </div>
                                <div class="lumora-appt-item">
                                    <span class="label">Date & Time:</span>
                                    <strong>${appt.date} at ${appt.time}</strong>
                                </div>
                                ${appt.notes ? `<div class="lumora-appt-notes"><em>Notes: ${appt.notes}</em></div>` : ''}
                            </div>
                            ${(appt.status === 'Pending' || appt.status === 'Confirmed') ? `
                                <div class="lumora-appt-actions">
                                    <button class="lumora-btn-sm lumora-btn-cancel" data-ref="${appt.reference}">Cancel Visit</button>
                                    <a href="https://wa.me/918422990990?text=Hi%20DENTAL%20CLINICa,%20I%20would%20like%20to%20reschedule%20my%20appointment%20(Ref:%20${appt.reference})" target="_blank" class="lumora-btn-sm lumora-btn-resched">Request Reschedule</a>
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('');
            }

            content.innerHTML = `
                <div class="lumora-patient-portal">
                    <div class="lumora-portal-header">
                        <div>
                            <div class="lumora-auth-badge">Patient Account</div>
                            <h2>Hello, ${session.name}</h2>
                            <p>${session.email} ${session.phone ? '• ' + session.phone : ''}</p>
                        </div>
                        <button id="lumora-patient-logout" class="lumora-btn-outline">Logout</button>
                    </div>

                    <div class="lumora-portal-stats">
                        <div class="lumora-stat-box">
                            <span class="stat-num">${myAppts.length}</span>
                            <span class="stat-lbl">Total Visits</span>
                        </div>
                        <div class="lumora-stat-box">
                            <span class="stat-num">${upcoming.length}</span>
                            <span class="stat-lbl">Upcoming</span>
                        </div>
                        <div class="lumora-stat-box">
                            <span class="stat-num">${past.length}</span>
                            <span class="stat-lbl">Completed</span>
                        </div>
                    </div>

                    <div class="lumora-portal-sec-header">
                        <h3>My Appointments</h3>
                        <a href="booking.html" class="lumora-btn-primary lumora-btn-sm">+ Book New Visit</a>
                    </div>

                    <div class="lumora-patient-appts-list">
                        ${apptsHtml}
                    </div>
                </div>
            `;

            // Logout
            document.getElementById('lumora-patient-logout').addEventListener('click', function () {
                global.LumoraDB.logout(true);
                updatePatientNavState();
                renderPatientPortalView();
            });

            // Cancel appointment listeners
            content.querySelectorAll('.lumora-btn-cancel').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var ref = btn.dataset.ref;
                    if (confirm('Are you sure you want to cancel appointment ' + ref + '?')) {
                        global.LumoraDB.updateAppointmentStatus(ref, 'Cancelled', { name: session.name, role: 'PATIENT' }, 'Cancelled by patient');
                        renderPatientPortalView();
                    }
                });
            });
        }
    }

    // Inject minimal scoped styles for the Patient Portal modal
    function injectStyles() {
        if (document.getElementById('lumora-sync-styles')) return;
        var style = document.createElement('style');
        style.id = 'lumora-sync-styles';
        style.textContent = `
            .lumora-patient-nav-btn {
                display: inline-flex;
                align-items: center;
                color: #24a3b1;
                background: rgba(36, 163, 177, 0.08);
                border: 1px solid rgba(36, 163, 177, 0.3);
                padding: 7px 14px;
                border-radius: 999px;
                font-family: 'Sora', sans-serif;
                font-size: 13px;
                font-weight: 500;
                text-decoration: none;
                margin-right: 12px;
                cursor: pointer;
                transition: all 0.25s ease;
            }
            .lumora-patient-nav-btn:hover {
                background: rgba(36, 163, 177, 0.2);
                border-color: #24a3b1;
                color: #ffffff;
            }
            .lumora-footer-admin-link {
                display: inline-block;
                color: rgba(255, 255, 255, 0.45);
                font-size: 11px;
                text-decoration: none;
                padding: 4px 8px;
                margin-top: 8px;
                border-radius: 4px;
                transition: color 0.2s;
            }
            .lumora-footer-admin-link:hover {
                color: #24a3b1;
                background: rgba(36, 163, 177, 0.1);
            }

            /* Modal */
            .lumora-modal-root {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 1;
                visibility: visible;
                transition: opacity 0.25s ease, visibility 0.25s ease;
            }
            .is-hidden {
                display: none !important;
            }
            .lumora-modal-root.is-hidden {
                opacity: 0;
                visibility: hidden;
                pointer-events: none;
                display: none !important;
            }
            .lumora-modal-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(1, 31, 35, 0.85);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
            }
            .lumora-modal-card {
                position: relative;
                width: 92%;
                max-width: 580px;
                max-height: 90vh;
                overflow-y: auto;
                background: #022f34;
                border: 1px solid rgba(36, 163, 177, 0.35);
                border-radius: 20px;
                padding: 32px;
                box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(36, 163, 177, 0.15);
                color: #f1f7f8;
                font-family: 'Sora', sans-serif;
                animation: lumoraCardPop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            @keyframes lumoraCardPop {
                from { transform: scale(0.94) translateY(12px); opacity: 0; }
                to { transform: scale(1) translateY(0); opacity: 1; }
            }
            .lumora-modal-close {
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(255, 255, 255, 0.08);
                border: none;
                color: #fff;
                width: 34px;
                height: 34px;
                border-radius: 50%;
                font-size: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: background 0.2s;
            }
            .lumora-modal-close:hover {
                background: #24a3b1;
            }

            /* Auth Box */
            .lumora-auth-badge {
                display: inline-block;
                background: rgba(36, 163, 177, 0.15);
                color: #24a3b1;
                border: 1px solid rgba(36, 163, 177, 0.3);
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                padding: 4px 10px;
                border-radius: 999px;
                margin-bottom: 10px;
            }
            .lumora-auth-header h2 {
                font-size: 24px;
                font-weight: 600;
                margin: 0 0 6px 0;
                color: #ffffff;
            }
            .lumora-auth-header p {
                color: rgba(255, 255, 255, 0.7);
                font-size: 13px;
                margin: 0 0 20px 0;
                line-height: 1.5;
            }
            .lumora-tab-nav {
                display: flex;
                gap: 8px;
                margin-bottom: 20px;
                background: rgba(0, 0, 0, 0.25);
                padding: 4px;
                border-radius: 12px;
            }
            .lumora-tab-btn {
                flex: 1;
                background: transparent;
                border: none;
                color: rgba(255, 255, 255, 0.6);
                padding: 10px;
                font-family: inherit;
                font-size: 13px;
                font-weight: 500;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .lumora-tab-btn.is-active {
                background: #24a3b1;
                color: #ffffff;
                font-weight: 600;
            }
            .lumora-form {
                display: flex;
                flex-direction: column;
                gap: 14px;
            }
            .lumora-field-row {
                display: grid;
                grid-template-columns: 2fr 1fr;
                gap: 12px;
            }
            .lumora-field label {
                display: block;
                font-size: 12px;
                font-weight: 500;
                color: rgba(255, 255, 255, 0.85);
                margin-bottom: 5px;
            }
            .lumora-field input {
                width: 100%;
                background: rgba(1, 31, 35, 0.6);
                border: 1px solid rgba(36, 163, 177, 0.3);
                border-radius: 10px;
                padding: 11px 14px;
                color: #ffffff;
                font-family: inherit;
                font-size: 14px;
                outline: none;
                box-sizing: border-box;
                transition: border-color 0.2s, box-shadow 0.2s;
            }
            .lumora-field input:focus {
                border-color: #24a3b1;
                box-shadow: 0 0 0 3px rgba(36, 163, 177, 0.25);
            }
            .lumora-form-error {
                background: rgba(220, 53, 69, 0.2);
                border: 1px solid rgba(220, 53, 69, 0.4);
                color: #ff8b94;
                padding: 8px 12px;
                border-radius: 8px;
                font-size: 12px;
            }
            .lumora-btn-primary {
                background: #24a3b1;
                color: #ffffff;
                border: none;
                border-radius: 10px;
                padding: 12px 18px;
                font-family: inherit;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                text-align: center;
                text-decoration: none;
                transition: background 0.2s, transform 0.15s;
            }
            .lumora-btn-primary:hover {
                background: #2bc0d1;
                transform: translateY(-1px);
            }
            .lumora-btn-outline {
                background: transparent;
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: rgba(255, 255, 255, 0.8);
                border-radius: 8px;
                padding: 6px 12px;
                font-size: 12px;
                font-family: inherit;
                cursor: pointer;
                transition: all 0.2s;
            }
            .lumora-btn-outline:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #fff;
            }
            .lumora-auth-hint {
                font-size: 11px;
                color: rgba(255, 255, 255, 0.45);
                text-align: center;
                margin-top: 4px;
            }

            /* Patient Portal Dashboard */
            .lumora-portal-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 20px;
                border-bottom: 1px solid rgba(36, 163, 177, 0.2);
                padding-bottom: 16px;
            }
            .lumora-portal-header h2 {
                font-size: 22px;
                margin: 4px 0 2px 0;
            }
            .lumora-portal-header p {
                font-size: 12px;
                color: rgba(255, 255, 255, 0.6);
                margin: 0;
            }
            .lumora-portal-stats {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
                margin-bottom: 24px;
            }
            .lumora-stat-box {
                background: rgba(1, 31, 35, 0.5);
                border: 1px solid rgba(36, 163, 177, 0.2);
                border-radius: 12px;
                padding: 12px;
                text-align: center;
            }
            .lumora-stat-box .stat-num {
                display: block;
                font-size: 22px;
                font-weight: 700;
                color: #24a3b1;
            }
            .lumora-stat-box .stat-lbl {
                font-size: 11px;
                color: rgba(255, 255, 255, 0.6);
            }
            .lumora-portal-sec-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 14px;
            }
            .lumora-portal-sec-header h3 {
                font-size: 16px;
                margin: 0;
            }
            .lumora-btn-sm {
                padding: 6px 12px;
                font-size: 12px;
            }
            .lumora-patient-appts-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .lumora-patient-appt-card {
                background: rgba(1, 31, 35, 0.6);
                border: 1px solid rgba(36, 163, 177, 0.25);
                border-radius: 14px;
                padding: 16px;
                transition: border-color 0.2s;
            }
            .lumora-patient-appt-card:hover {
                border-color: rgba(36, 163, 177, 0.5);
            }
            .lumora-appt-card-top {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            .lumora-badge {
                display: inline-block;
                padding: 3px 8px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
            }
            .status-confirmed { background: rgba(40, 167, 69, 0.2); color: #4cd964; border: 1px solid rgba(76, 217, 100, 0.3); }
            .status-pending { background: rgba(255, 193, 7, 0.2); color: #ffcc00; border: 1px solid rgba(255, 204, 0, 0.3); }
            .status-attended { background: rgba(36, 163, 177, 0.2); color: #24a3b1; border: 1px solid rgba(36, 163, 177, 0.4); }
            .status-rescheduled { background: rgba(111, 66, 193, 0.2); color: #b197fc; border: 1px solid rgba(177, 151, 252, 0.3); }
            .status-cancelled, .status-not-attended, .status-rejected { background: rgba(220, 53, 69, 0.2); color: #ff6b6b; border: 1px solid rgba(255, 107, 107, 0.3); }
            .lumora-ref {
                font-size: 11px;
                color: rgba(255, 255, 255, 0.5);
                margin-left: 8px;
            }
            .lumora-appt-fee {
                font-size: 12px;
                color: #24a3b1;
                font-weight: 600;
            }
            .lumora-appt-details {
                display: flex;
                flex-direction: column;
                gap: 4px;
                font-size: 13px;
                margin-bottom: 12px;
            }
            .lumora-appt-item .label {
                color: rgba(255, 255, 255, 0.5);
                margin-right: 6px;
            }
            .lumora-appt-notes {
                font-size: 12px;
                color: rgba(255, 255, 255, 0.6);
                margin-top: 4px;
            }
            .lumora-appt-actions {
                display: flex;
                gap: 8px;
                border-top: 1px solid rgba(255, 255, 255, 0.08);
                padding-top: 10px;
            }
            .lumora-btn-cancel {
                background: rgba(220, 53, 69, 0.15);
                border: 1px solid rgba(220, 53, 69, 0.3);
                color: #ff8b94;
                border-radius: 6px;
                cursor: pointer;
            }
            .lumora-btn-cancel:hover {
                background: rgba(220, 53, 69, 0.3);
            }
            .lumora-btn-resched {
                background: rgba(36, 163, 177, 0.15);
                border: 1px solid rgba(36, 163, 177, 0.3);
                color: #24a3b1;
                border-radius: 6px;
                text-decoration: none;
                cursor: pointer;
            }
            .lumora-btn-resched:hover {
                background: rgba(36, 163, 177, 0.3);
                color: #fff;
            }
            .lumora-empty-state {
                text-align: center;
                padding: 30px 10px;
            }
            .lumora-empty-state h4 {
                font-size: 16px;
                margin: 12px 0 6px 0;
            }
            .lumora-empty-state p {
                font-size: 13px;
                color: rgba(255, 255, 255, 0.6);
                margin: 0;
            }
        `;
        document.head.appendChild(style);
    }

    // Auto-boot when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            injectStyles();
            initSync();
        });
    } else {
        injectStyles();
        initSync();
    }

    global.LumoraSync = {
        init: initSync,
        openPatientModal: openPatientModal,
        closePatientModal: closePatientModal
    };

})(typeof window !== 'undefined' ? window : this);
