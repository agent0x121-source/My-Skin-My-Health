/* ==========================================================================
   The Dental Solutions — Appointment booking flow
   --------------------------------------------------------------------------
   Component map (each is a function returning a DOM node):
     BookingFlow          state machine + step rendering
     DoctorSelection      grid of DoctorCard
     DoctorCard           one selectable doctor
     ServiceSelector      doctor-filtered service dropdown; centred until a
                          service is chosen, then it rises and the calendar
                          fades in beneath it
     BookingDetails       doctor aside + scheduler (calendar ⇄ time panel)
     Calendar             month grid with availability
     TimeSlotSelector     right-hand time panel; the selected slot shrinks so
                          the Next button sits beside it in the same row
     PatientDetailsForm   validated patient form (name, phone, age, notes)
     BookingSummary       read-only recap (aside + confirm step)
     BookingSuccess       clinic-native confirmation + calendar export

   All data comes from BookingData.api — no data is defined here.
   ========================================================================== */
(function (global, doc) {
    'use strict';

    var API = global.BookingData.api;
    var CLINIC = global.BookingData.clinic;

    /* -------------------------------------------------------------- helpers */
    function el(tag, attrs, children) {
        var node = doc.createElement(tag);
        attrs = attrs || {};
        Object.keys(attrs).forEach(function (k) {
            var v = attrs[k];
            if (v === null || v === undefined || v === false) return;
            if (k === 'class') node.className = v;
            else if (k === 'html') node.innerHTML = v;
            else if (k === 'text') node.textContent = v;
            else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2).toLowerCase(), v);
            else node.setAttribute(k, v === true ? '' : v);
        });
        (children || []).forEach(function (c) {
            if (c === null || c === undefined) return;
            node.appendChild(typeof c === 'string' ? doc.createTextNode(c) : c);
        });
        return node;
    }

    function icon(path, size) {
        return el('span', {
            class: 'bk-icon',
            'aria-hidden': 'true',
            html: '<svg width="' + (size || 16) + '" height="' + (size || 16) + '" viewBox="0 0 24 24" fill="none" ' +
                'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + path + '</svg>'
        });
    }

    var ICONS = {
        clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
        pin: '<path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
        phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z"/>',
        globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18"/>',
        left: '<path d="M15 5l-7 7 7 7"/>',
        right: '<path d="M9 5l7 7-7 7"/>',
        arrow: '<path d="M5 12h13M13 6l6 6-6 6"/>',
        check: '<path d="M5 13l4.5 4.5L19 7"/>',
        calendar: '<rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
        calendarPlus: '<rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17M12 13v5M9.5 15.5h5"/>',
        alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.5"/>',
        stethoscope: '<path d="M6 3v6a4 4 0 0 0 8 0V3"/><path d="M10 13v2a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="11" r="2"/>'
    };

    var COUNTRY_CODES = [
        { code: '+91', label: 'IN +91' },
        { code: '+971', label: 'AE +971' },
        { code: '+44', label: 'UK +44' },
        { code: '+1', label: 'US +1' },
        { code: '+61', label: 'AU +61' },
        { code: '+65', label: 'SG +65' },
        { code: '+966', label: 'SA +966' }
    ];

    function detectTimezone() {
        try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'; }
        catch (e) { return 'Asia/Kolkata'; }
    }

    function timezoneLabel(tz) {
        try {
            var name = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'long' })
                .formatToParts(new Date())
                .filter(function (p) { return p.type === 'timeZoneName'; })[0];
            return name ? name.value : tz;
        } catch (e) { return tz; }
    }

    var TIMEZONES = ['Asia/Kolkata', 'Asia/Dubai', 'Europe/London', 'America/New_York', 'Asia/Singapore', 'Australia/Sydney'];

    function parseIso(iso) {
        var p = iso.split('-');
        return new Date(+p[0], +p[1] - 1, +p[2]);
    }

    /* ==================================================== BookingFlow (root) */
    function BookingFlow(mount) {
        /* Everything the patient has chosen. Never cleared when going back. */
        var state = {
            step: 'doctor',
            doctorId: null,
            serviceId: null,
            dateIso: null,
            slot: null,
            timezone: detectTimezone(),
            calendarCursor: new Date(),
            patient: { name: '', dialCode: '+91', phone: '', age: '', notes: '' },
            result: null
        };

        var STEPS = [
            { id: 'doctor', label: 'Doctor' },
            { id: 'schedule', label: 'Service & time' },
            { id: 'details', label: 'Your details' },
            { id: 'confirm', label: 'Confirm' }
        ];

        function go(step) {
            state.step = step;
            render();
            if (global.scrollY > 0) global.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function render() {
            mount.innerHTML = '';
            mount.appendChild(Steps(STEPS, state.step));

            var view;
            if (state.step === 'doctor') view = DoctorSelection(state, go);
            else if (state.step === 'schedule') view = BookingDetails(state, go);
            else if (state.step === 'details') view = PatientDetailsScreen(state, go);
            else if (state.step === 'confirm') view = ConfirmScreen(state, go);
            else view = BookingSuccess(state, go);

            view.classList.add('bk-view');
            mount.appendChild(view);

            /* Move focus to the new step for screen-reader and keyboard users. */
            var heading = view.querySelector('h1, h2');
            if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
        }

        render();
    }

    /* ----------------------------------------------------- progress indicator */
    function Steps(steps, current) {
        var currentIndex = steps.map(function (s) { return s.id; }).indexOf(current);
        var items = [];
        steps.forEach(function (s, i) {
            if (i) items.push(el('li', { class: 'bk-steps__sep', 'aria-hidden': 'true' }));
            var cls = 'bk-steps__item';
            if (currentIndex === i) cls += ' is-active';
            if (currentIndex > i || currentIndex === -1) cls += ' is-done';
            items.push(el('li', {
                class: cls,
                'aria-current': currentIndex === i ? 'step' : null
            }, [
                el('span', { class: 'bk-steps__dot', text: currentIndex > i || currentIndex === -1 ? '✓' : String(i + 1) }),
                el('span', { class: 'bk-steps__label', text: s.label })
            ]));
        });
        return el('ol', { class: 'bk-steps', 'aria-label': 'Booking progress' }, items);
    }

    /* =================================================== step 1 — doctor list */
    function DoctorCard(doctor, onSelect) {
        return el('button', {
            type: 'button',
            class: 'bk-doctor',
            'aria-label': 'Book an appointment with ' + doctor.name + ', ' + doctor.specialization,
            onClick: function () { onSelect(doctor.id); }
        }, [
            el('span', { class: 'bk-doctor__media' }, [
                el('img', { src: doctor.image, alt: doctor.name, loading: 'lazy' })
            ]),
            el('span', { class: 'bk-doctor__body' }, [
                el('span', { class: 'bk-doctor__name', text: doctor.name }),
                el('span', { class: 'bk-doctor__role', text: doctor.specialization }),
                el('span', { class: 'bk-doctor__bio', text: doctor.bio }),
                el('span', { class: 'bk-doctor__tags' }, [
                    doctor.experience ? el('span', { class: 'bk-tag', text: doctor.experience }) : null,
                    doctor.department ? el('span', { class: 'bk-tag', text: doctor.department }) : null
                ]),
                el('span', { class: 'bk-doctor__action' }, [
                    el('span', { text: 'Book Appointment' }),
                    el('span', { class: 'bk-doctor__arrow' }, [icon(ICONS.arrow, 17)])
                ])
            ])
        ]);
    }

    function DoctorSelection(state, go) {
        var wrap = el('div');

        wrap.appendChild(el('div', { class: 'bk-intro' }, [
            el('span', { class: 'bk-intro__eyebrow', text: 'Appointments' }),
            el('h1', { class: 'bk-intro__title', text: 'Book your visit at ' + CLINIC.name }),
            el('p', {
                class: 'bk-intro__para',
                text: 'Choose the dentist you would like to see. Pick a service, a date and a time that suits you — it takes less than a minute, and our team confirms every booking personally.'
            }),
            el('div', { class: 'bk-intro__meta' }, [
                el('span', {}, [icon(ICONS.clock), el('span', { text: 'Mon–Sat, 9:00–18:00' })]),
                el('span', {}, [icon(ICONS.pin), el('span', { text: CLINIC.shortAddress })])
            ])
        ]));

        var grid = el('div', { class: 'bk-doctors' });
        var loading = el('div', { class: 'bk-state' }, [
            el('span', { class: 'bk-spinner' }),
            el('span', { text: 'Loading our dentists…' })
        ]);
        wrap.appendChild(loading);

        API.getDoctors().then(function (doctors) {
            if (loading.parentNode) loading.parentNode.removeChild(loading);
            if (!doctors.length) {
                wrap.appendChild(el('div', { class: 'bk-state' }, [
                    icon(ICONS.alert, 22),
                    el('p', { text: 'No dentists are open for online booking right now. Please call the clinic on ' + CLINIC.phone + ' and we will find you a slot.' })
                ]));
                return;
            }
            doctors.forEach(function (d) {
                grid.appendChild(DoctorCard(d, function (id) {
                    if (state.doctorId !== id) {
                        /* Different doctor: previous service/slot may not apply. */
                        state.doctorId = id;
                        state.serviceId = null;
                        state.dateIso = null;
                        state.slot = null;
                    }
                    go('schedule');
                }));
            });
            wrap.appendChild(grid);
        });

        return wrap;
    }

    /* -------------------------------------------------- doctor aside (shared) */
    function DoctorAside(state, opts) {
        opts = opts || {};
        var doctor = API.getDoctor(state.doctorId);
        var service = state.serviceId ? API.getService(state.serviceId) : null;
        var duration = service ? service.duration + ' min' : '15 – 60 min';
        var mode = service && service.modes.indexOf('online') !== -1 && service.modes.length === 1
            ? 'Online consultation'
            : 'In-person consultation';

        var facts = [
            el('div', { class: 'bk-fact' }, [icon(ICONS.clock), el('span', { text: duration })]),
            el('div', { class: 'bk-fact' }, [icon(ICONS.stethoscope), el('span', { text: mode })]),
            el('div', { class: 'bk-fact' }, [icon(ICONS.pin), el('span', { text: CLINIC.address })])
        ];

        if (service) {
            facts.splice(1, 0, el('div', { class: 'bk-fact' }, [
                icon(ICONS.calendar), el('span', {}, [el('strong', { text: service.name })])
            ]));
        }

        var children = [];

        if (opts.onBack) {
            children.push(el('button', {
                type: 'button', class: 'bk-back', onClick: opts.onBack
            }, [icon(ICONS.left, 15), el('span', { text: opts.backLabel || 'Back' })]));
        }

        children.push(
            el('img', { class: 'bk-aside__avatar', src: doctor.image, alt: doctor.name }),
            el('h2', { class: 'bk-aside__name', text: doctor.name }),
            el('p', { class: 'bk-aside__role', text: doctor.specialization }),
            el('div', { class: 'bk-aside__facts' }, facts),
            el('div', { class: 'bk-aside__note' }, [
                el('h3', { text: 'Book Your Appointment' }),
                el('p', {
                    text: 'Tell us what you need and when you can come in. Our front desk confirms your slot on the number you provide, usually within a few minutes of the clinic being open.'
                })
            ])
        );

        if (opts.summary) children.push(BookingSummary(state));

        return el('aside', { class: 'bk-panel__aside' }, children);
    }

    /* ============ step 2 — service dropdown, then calendar ⇄ time panel */
    function BookingDetails(state, go) {
        var main = el('div', { class: 'bk-panel__main' });
        var asideOpts = { onBack: function () { go('doctor'); }, backLabel: 'All dentists' };
        var aside = DoctorAside(state, asideOpts);
        var panel = el('div', { class: 'bk-panel' }, [aside, main]);

        /* The aside shows the live service and duration, so it is rebuilt
           whenever the chosen service changes. */
        function refreshAside() {
            var next = DoctorAside(state, asideOpts);
            panel.replaceChild(next, aside);
            aside = next;
        }

        var title = el('h2', { class: 'bk-main__title', text: 'Select a Service' });
        main.appendChild(title);

        /* The dropdown sits centred in the empty area until a service is
           picked; .has-service then lifts it and reveals the calendar. */
        var stage = el('div', { class: 'bk-stage' });
        var bar = el('div', { class: 'bk-servicebar' });
        var reveal = el('div', { class: 'bk-reveal' });
        stage.appendChild(bar);
        stage.appendChild(reveal);
        main.appendChild(stage);

        var scheduler = el('div', { class: 'bk-scheduler' });
        var calSide = el('div', { class: 'bk-scheduler__cal' });
        var timeSide = el('div', { class: 'bk-scheduler__times', 'aria-live': 'polite' });
        scheduler.appendChild(calSide);
        scheduler.appendChild(timeSide);
        reveal.appendChild(scheduler);

        function renderCalendar() {
            calSide.innerHTML = '';
            calSide.appendChild(Calendar(state, {
                onPick: function (iso) {
                    state.dateIso = iso;
                    state.slot = null;
                    slideCalendarLeft();
                    renderSlots();
                },
                onMonth: function (cursor) {
                    state.calendarCursor = cursor;
                    renderCalendar();
                },
                onTimezone: function (tz) {
                    state.timezone = tz;
                    if (state.dateIso) renderSlots();
                }
            }));
        }

        /* The calendar's centred and left-aligned positions are both static
           layout — animating the margin between them fought with the column
           shrinking underneath it, which read as a pop. Instead we measure
           where the calendar starts, let it land in its final place, and play
           the difference back as one straight transform. */
        function slideCalendarLeft() {
            var calendar = calSide.querySelector('.bk-cal');
            var reduced = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;

            if (!calendar || reduced) {
                scheduler.classList.add('is-open');
                return;
            }

            var first = calendar.getBoundingClientRect().left;
            scheduler.classList.add('is-open');
            var last = calendar.getBoundingClientRect().left;
            var delta = first - last;

            if (!delta) return;

            calendar.style.transition = 'none';
            calendar.style.transform = 'translateX(' + delta + 'px)';
            /* Two frames: one to commit the offset, one to animate off it. */
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    calendar.style.transition = 'transform var(--bk-move-time) var(--bk-move)';
                    calendar.style.transform = 'translateX(0)';
                });
            });
        }

        function renderSlots() {
            timeSide.innerHTML = '';
            if (!state.dateIso) return;
            timeSide.appendChild(TimeSlotSelector(state, function () { go('details'); }));
        }

        function openCalendar() {
            refreshAside();
            stage.classList.add('has-service');
            title.textContent = 'Select a Date & Time';
            renderCalendar();
            if (state.dateIso) { scheduler.classList.add('is-open'); renderSlots(); }
        }

        var loading = el('div', { class: 'bk-state' }, [el('span', { class: 'bk-spinner' })]);
        bar.appendChild(loading);

        API.getServicesForDoctor(state.doctorId).then(function (services) {
            if (loading.parentNode) loading.parentNode.removeChild(loading);
            if (!services.length) {
                bar.appendChild(el('div', { class: 'bk-state' }, [
                    icon(ICONS.alert, 22),
                    el('p', { text: 'This dentist has no services open for online booking. Please call us on ' + CLINIC.phone + '.' })
                ]));
                return;
            }
            bar.appendChild(ServiceSelector(services, state.serviceId, function (id) {
                if (state.serviceId !== id) {
                    /* Slot length follows the service, so any held date/slot goes. */
                    state.serviceId = id;
                    state.slot = null;
                    state.dateIso = null;
                    scheduler.classList.remove('is-open');
                    timeSide.innerHTML = '';
                }
                if (!id) {
                    refreshAside();
                    stage.classList.remove('has-service');
                    title.textContent = 'Select a Service';
                    return;
                }
                openCalendar();
            }));
            if (state.serviceId) openCalendar();
        });

        return panel;
    }

    /* ------------------------------------------------------ ServiceSelector */
    function ServiceSelector(services, selectedId, onChange) {
        var hint = el('p', { class: 'bk-servicebar__hint' });

        function describe(id) {
            var chosen = services.filter(function (x) { return x.id === id; })[0];
            hint.textContent = chosen
                ? chosen.description + ' · ' + chosen.duration + ' min appointment'
                : 'Your appointment length follows the service you choose.';
        }

        var select = el('select', {
            class: 'bk-select bk-select--service', id: 'bk-service',
            onChange: function (e) { describe(e.target.value); onChange(e.target.value || null); }
        }, [el('option', { value: '', text: 'Select Service' })]);

        services.forEach(function (svc) {
            select.appendChild(el('option', {
                value: svc.id,
                text: svc.name + ' · ' + svc.duration + ' min',
                selected: svc.id === selectedId
            }));
        });
        describe(selectedId);

        return el('div', { class: 'bk-servicebar__inner' }, [
            el('label', { class: 'bk-label', for: 'bk-service' }, [
                doc.createTextNode('Select Service '), el('span', { class: 'bk-req', text: '*' })
            ]),
            el('div', { class: 'bk-select-wrap' }, [select]),
            hint
        ]);
    }

    /* ------------------------------------------------------------- Calendar */
    function Calendar(state, handlers) {
        var wrap = el('div', { class: 'bk-cal' });
        var cursor = new Date(state.calendarCursor.getFullYear(), state.calendarCursor.getMonth(), 1);
        var months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];

        var today = new Date(); today.setHours(0, 0, 0, 0);
        var atFirstMonth = cursor.getFullYear() === today.getFullYear() && cursor.getMonth() === today.getMonth();
        var limit = new Date(today.getTime());
        limit.setDate(limit.getDate() + CLINIC.bookingWindowDays);
        var atLastMonth = cursor.getFullYear() === limit.getFullYear() && cursor.getMonth() === limit.getMonth();

        function shift(by) {
            handlers.onMonth(new Date(cursor.getFullYear(), cursor.getMonth() + by, 1));
        }

        wrap.appendChild(el('div', { class: 'bk-cal__head' }, [
            el('div', { class: 'bk-cal__month', text: months[cursor.getMonth()] + ' ' + cursor.getFullYear() }),
            el('div', { class: 'bk-cal__nav' }, [
                el('button', {
                    type: 'button', 'aria-label': 'Previous month',
                    disabled: atFirstMonth, onClick: function () { shift(-1); }
                }, [icon(ICONS.left, 15)]),
                el('button', {
                    type: 'button', 'aria-label': 'Next month',
                    disabled: atLastMonth, onClick: function () { shift(1); }
                }, [icon(ICONS.right, 15)])
            ])
        ]));

        var grid = el('div', { class: 'bk-cal__grid', role: 'grid', 'aria-label': 'Available dates' });
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(function (d) {
            grid.appendChild(el('div', { class: 'bk-cal__dow', text: d.slice(0, 2) }));
        });
        wrap.appendChild(grid);

        wrap.appendChild(el('div', { class: 'bk-tz' }, [
            el('div', { class: 'bk-tz__label' }, [icon(ICONS.globe), doc.createTextNode(' Time zone')]),
            el('div', { class: 'bk-select-wrap' }, [
                (function () {
                    var list = TIMEZONES.slice();
                    if (list.indexOf(state.timezone) === -1) list.unshift(state.timezone);
                    var sel = el('select', {
                        class: 'bk-select', 'aria-label': 'Time zone',
                        onChange: function (e) { handlers.onTimezone(e.target.value); }
                    });
                    list.forEach(function (tz) {
                        sel.appendChild(el('option', {
                            value: tz,
                            text: timezoneLabel(tz) + ' (' + tz.split('/').pop().replace(/_/g, ' ') + ')',
                            selected: tz === state.timezone
                        }));
                    });
                    return sel;
                })()
            ])
        ]));

        API.getAvailableDates(state.doctorId, cursor.getFullYear(), cursor.getMonth()).then(function (available) {
            var firstWeekday = new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay();
            for (var i = 0; i < firstWeekday; i++) {
                grid.appendChild(el('div', { class: 'bk-day is-empty', 'aria-hidden': 'true' }));
            }
            var daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
            for (var day = 1; day <= daysInMonth; day++) {
                var date = new Date(cursor.getFullYear(), cursor.getMonth(), day);
                var iso = API.isoDate(date);
                var open = available.indexOf(iso) !== -1;
                var cls = 'bk-day';
                if (iso === state.dateIso) cls += ' is-selected';
                if (date.getTime() === today.getTime()) cls += ' is-today';
                grid.appendChild(el('button', {
                    type: 'button',
                    class: cls,
                    disabled: !open,
                    'aria-label': API.formatDateLong(date) + (open ? '' : ' — unavailable'),
                    'aria-pressed': iso === state.dateIso ? 'true' : 'false',
                    'data-iso': iso,
                    onClick: (function (value) {
                        return function () {
                            /* Highlight in place so the grid is not rebuilt. */
                            var prev = grid.querySelector('.bk-day.is-selected');
                            if (prev) {
                                prev.classList.remove('is-selected');
                                prev.setAttribute('aria-pressed', 'false');
                            }
                            this.classList.add('is-selected');
                            this.setAttribute('aria-pressed', 'true');
                            handlers.onPick(value);
                        };
                    })(iso)
                }, [doc.createTextNode(String(day))]));
            }
        });

        return wrap;
    }

    /* ------------------------------------------------------ TimeSlotSelector */
    /* Each slot owns a row. Selecting one shrinks that row's button to ~54%,
       turns it grey and reveals the Next button beside it in the same row. */
    function TimeSlotSelector(state, onNext) {
        var wrap = el('div', { class: 'bk-times' });
        var date = parseIso(state.dateIso);
        wrap.appendChild(el('p', { class: 'bk-times__head', text: API.formatDateLong(date) }));

        var list = el('div', {
            class: 'bk-times__list',
            role: 'group',
            'aria-label': 'Available times on ' + API.formatDateLong(date)
        });
        var loading = el('div', { class: 'bk-state' }, [el('span', { class: 'bk-spinner' })]);
        wrap.appendChild(loading);

        function select(row, button, slot, silent) {
            [].forEach.call(list.children, function (r) {
                r.classList.remove('is-selected');
                var b = r.querySelector('.bk-slot');
                if (b) b.setAttribute('aria-pressed', 'false');
                var n = r.querySelector('.bk-slot-next');
                if (n) { n.setAttribute('tabindex', '-1'); n.setAttribute('aria-hidden', 'true'); }
            });
            row.classList.add('is-selected');
            button.setAttribute('aria-pressed', 'true');
            var nextBtn = row.querySelector('.bk-slot-next');
            nextBtn.setAttribute('tabindex', '0');
            nextBtn.removeAttribute('aria-hidden');
            state.slot = slot;
            if (!silent) nextBtn.focus({ preventScroll: true });
        }

        API.getAvailability(state.doctorId, state.serviceId, state.dateIso).then(function (slots) {
            if (loading.parentNode) loading.parentNode.removeChild(loading);
            if (!slots.length) {
                wrap.appendChild(el('div', { class: 'bk-state' }, [
                    icon(ICONS.clock, 22),
                    el('p', { text: 'No times left on this date. Please pick another day, or call us on ' + CLINIC.phone + '.' })
                ]));
                return;
            }

            slots.forEach(function (slot) {
                var row = el('div', { class: 'bk-slot-row' });
                var button = el('button', {
                    type: 'button', class: 'bk-slot', 'aria-pressed': 'false',
                    onClick: function () { select(row, button, slot); }
                }, [doc.createTextNode(slot.label)]);

                var next = el('button', {
                    type: 'button', class: 'bk-slot-next',
                    tabindex: '-1', 'aria-hidden': 'true',
                    onClick: onNext
                }, [el('span', { text: 'Next' })]);

                row.appendChild(button);
                row.appendChild(next);
                list.appendChild(row);

                if (state.slot && state.slot.start === slot.start) select(row, button, slot, true);
            });

            wrap.appendChild(list);
        });

        return wrap;
    }

    /* ------------------------------------------------------- BookingSummary */
    function BookingSummary(state) {
        var doctor = API.getDoctor(state.doctorId);
        var service = API.getService(state.serviceId);
        var rows = [
            ['Doctor', doctor ? doctor.name : '—'],
            ['Service', service ? service.name : '—'],
            ['Date', state.dateIso ? API.formatDateLong(parseIso(state.dateIso)) : '—'],
            ['Time', state.slot ? state.slot.label : '—'],
            ['Duration', service ? service.duration + ' min' : '—'],
            ['Time zone', timezoneLabel(state.timezone)]
        ];
        return el('dl', { class: 'bk-summary' }, rows.map(function (r) {
            return el('div', { class: 'bk-summary__row' }, [
                el('dt', { text: r[0] }), el('dd', { text: r[1] })
            ]);
        }));
    }

    /* ============================================== step 4 — patient details */
    function PatientDetailsScreen(state, go) {
        var main = el('div', { class: 'bk-panel__main' });
        var panel = el('div', { class: 'bk-panel' }, [
            DoctorAside(state, {
                onBack: function () { go('schedule'); },
                backLabel: 'Change date & time',
                summary: true
            }),
            main
        ]);
        main.appendChild(el('h2', { class: 'bk-main__title', text: 'Enter Your Details' }));
        main.appendChild(PatientDetailsForm(state, function () { go('confirm'); }));
        return panel;
    }

    function PatientDetailsForm(state, onValid) {
        var p = state.patient;

        function field(opts) {
            var id = 'bk-' + opts.name;
            var input = opts.textarea
                ? el('textarea', { class: 'bk-textarea', id: id, name: opts.name, rows: '4', placeholder: opts.placeholder || '' })
                : el('input', {
                    class: 'bk-input', id: id, name: opts.name,
                    type: opts.type || 'text',
                    placeholder: opts.placeholder || '',
                    autocomplete: opts.autocomplete || 'off',
                    inputmode: opts.inputmode || null
                });
            input.value = p[opts.name] || '';
            var error = el('p', { class: 'bk-error', id: id + '-error', role: 'alert' });
            input.addEventListener('input', function () {
                p[opts.name] = input.value;
                input.classList.remove('is-invalid');
                error.classList.remove('is-visible');
                input.removeAttribute('aria-invalid');
            });
            return {
                input: input,
                error: error,
                node: el('div', { class: 'bk-field' }, [
                    el('label', { class: 'bk-label', for: id }, [
                        doc.createTextNode(opts.label + ' '),
                        opts.required
                            ? el('span', { class: 'bk-req', text: '*' })
                            : el('span', { class: 'bk-optional', text: 'Optional' })
                    ]),
                    input,
                    opts.hint ? el('p', { class: 'bk-hint', text: opts.hint }) : null,
                    error
                ])
            };
        }

        var name = field({
            name: 'name', label: 'Name', required: true,
            autocomplete: 'name', placeholder: 'e.g. Aisha Khan'
        });

        var dial = el('select', { class: 'bk-select', 'aria-label': 'Country code' });
        COUNTRY_CODES.forEach(function (c) {
            dial.appendChild(el('option', { value: c.code, text: c.label, selected: c.code === p.dialCode }));
        });
        dial.addEventListener('change', function () { p.dialCode = dial.value; });

        var phone = field({
            name: 'phone', label: 'Phone', required: true, type: 'tel',
            autocomplete: 'tel', inputmode: 'tel', placeholder: '97654 07679',
            hint: 'We confirm your appointment on this number.'
        });
        /* Wrapping the input in the country-code row moves it out of the field
           body, so it only needs re-inserting in the right place. */
        var phoneRow = el('div', { class: 'bk-phone' }, [
            el('div', { class: 'bk-select-wrap' }, [dial]), phone.input
        ]);
        phone.node.insertBefore(phoneRow, phone.node.querySelector('.bk-hint'));

        var age = field({
            name: 'age', label: 'Age', type: 'text',
            inputmode: 'numeric', placeholder: 'e.g. 32'
        });

        var notes = field({
            name: 'notes', label: 'Additional information', textarea: true,
            placeholder: 'Briefly describe your concern, or anything we should know before your visit.',
            hint: 'It helps the dentist prepare for your visit.'
        });

        var formAlert = el('p', { class: 'bk-alert', role: 'alert' }, [icon(ICONS.alert), el('span', { text: '' })]);

        function fail(f, message) {
            f.input.classList.add('is-invalid');
            f.input.setAttribute('aria-invalid', 'true');
            f.input.setAttribute('aria-describedby', f.error.id);
            f.error.textContent = message;
            f.error.classList.add('is-visible');
        }

        function validate() {
            var firstBad = null;
            [name, phone, age].forEach(function (f) {
                f.input.classList.remove('is-invalid');
                f.error.classList.remove('is-visible');
            });
            formAlert.classList.remove('is-visible');

            if (!p.name.trim() || p.name.trim().length < 2) {
                fail(name, 'Please enter your name.');
                firstBad = firstBad || name;
            }
            var digits = p.phone.replace(/\D/g, '');
            if (digits.length < 7 || digits.length > 15) {
                fail(phone, 'Please enter a valid phone number.');
                firstBad = firstBad || phone;
            }
            if (p.age.trim()) {
                var years = Number(p.age.trim());
                if (!/^\d{1,3}$/.test(p.age.trim()) || years < 1 || years > 120) {
                    fail(age, 'Please enter an age between 1 and 120, or leave it blank.');
                    firstBad = firstBad || age;
                }
            }

            if (firstBad) {
                formAlert.lastChild.textContent = 'Please correct the highlighted fields.';
                formAlert.classList.add('is-visible');
                firstBad.input.focus();
                return;
            }
            onValid();
        }

        return el('form', { novalidate: true, onSubmit: function (e) { e.preventDefault(); validate(); } }, [
            formAlert, name.node, phone.node, age.node, notes.node,
            el('div', { class: 'bk-actions' }, [
                el('button', { type: 'submit', class: 'bk-btn bk-btn--primary' }, [
                    el('span', { text: 'Review appointment' }), icon(ICONS.arrow, 17)
                ])
            ])
        ]);
    }

    /* ==================================================== step 5 — confirm */
    function ConfirmScreen(state, go) {
        var main = el('div', { class: 'bk-panel__main' });
        var panel = el('div', { class: 'bk-panel' }, [
            DoctorAside(state, { onBack: function () { go('details'); }, backLabel: 'Edit details' }),
            main
        ]);

        var doctor = API.getDoctor(state.doctorId);
        var service = API.getService(state.serviceId);
        var p = state.patient;

        main.appendChild(el('h2', { class: 'bk-main__title', text: 'Review & confirm' }));
        main.appendChild(el('p', {
            class: 'bk-main__para',
            text: 'Please check the details below. Your booking goes straight to our front desk.'
        }));

        var rows = [
            ['Doctor', doctor.name],
            ['Service', service.name],
            ['Date', API.formatDateLong(parseIso(state.dateIso))],
            ['Time', state.slot.label],
            ['Duration', service.duration + ' min'],
            ['Time zone', timezoneLabel(state.timezone)],
            ['Name', p.name],
            ['Phone', p.dialCode + ' ' + p.phone]
        ];
        if (p.age.trim()) rows.push(['Age', p.age.trim()]);
        if (p.notes.trim()) rows.push(['Additional information', p.notes.trim()]);

        main.appendChild(el('dl', { class: 'bk-summary' }, rows.map(function (r) {
            return el('div', { class: 'bk-summary__row' }, [el('dt', { text: r[0] }), el('dd', { text: r[1] })]);
        })));

        var alert = el('p', { class: 'bk-alert', role: 'alert' }, [icon(ICONS.alert), el('span', { text: '' })]);
        main.appendChild(alert);

        var confirm = el('button', { type: 'button', class: 'bk-btn bk-btn--primary' }, [
            el('span', { text: 'Confirm Appointment' }), icon(ICONS.check, 17)
        ]);

        confirm.addEventListener('click', function () {
            confirm.disabled = true;
            confirm.firstChild.textContent = 'Booking…';
            alert.classList.remove('is-visible');

            API.submitBooking({
                doctor: doctor,
                service: service,
                startIso: state.slot.start,
                timezone: timezoneLabel(state.timezone),
                patient: p
            }).then(function (result) {
                if (!result || !result.success) throw new Error('booking was not accepted');
                state.result = result;
                go('success');
            }).catch(function () {
                confirm.disabled = false;
                confirm.firstChild.textContent = 'Confirm Appointment';
                alert.lastChild.textContent = 'We could not complete your booking. Please try again, or call us on ' + CLINIC.phone + '.';
                alert.classList.add('is-visible');
            });
        });

        main.appendChild(el('div', { class: 'bk-actions' }, [
            confirm,
            el('button', {
                type: 'button', class: 'bk-btn bk-btn--ghost',
                onClick: function () { go('details'); }
            }, [el('span', { text: 'Edit details' })])
        ]));

        return panel;
    }

    /* ------------------------------------------------- calendar event export */
    /* Builds a valid iCalendar event. Nothing reaches any calendar until the
       patient presses the button — this only produces the event. */
    function buildIcs(state) {
        var doctor = API.getDoctor(state.doctorId);
        var service = API.getService(state.serviceId);
        var start = new Date(state.slot.start);
        var end = new Date(start.getTime() + service.duration * 60000);

        function stamp(d) {
            return d.getUTCFullYear() +
                String(d.getUTCMonth() + 1).padStart(2, '0') +
                String(d.getUTCDate()).padStart(2, '0') + 'T' +
                String(d.getUTCHours()).padStart(2, '0') +
                String(d.getUTCMinutes()).padStart(2, '0') +
                String(d.getUTCSeconds()).padStart(2, '0') + 'Z';
        }
        function esc(t) {
            return String(t).replace(/\\/g, '\\\\').replace(/;/g, '\\;')
                .replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
        }

        var description = [
            'Doctor: ' + doctor.name + ' (' + doctor.specialization + ')',
            'Service: ' + service.name,
            'Duration: ' + service.duration + ' min',
            'Clinic: ' + CLINIC.name,
            'Contact: ' + CLINIC.phone,
            'Reference: ' + state.result.reference
        ];
        if (state.patient.notes.trim()) description.push('Notes: ' + state.patient.notes.trim());

        /* CRLF line endings are required by RFC 5545. */
        return [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//My Skin My Health//Appointment Booking//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            'UID:' + state.result.reference + '@myskinmyhealth',
            'DTSTAMP:' + stamp(new Date()),
            'DTSTART:' + stamp(start),
            'DTEND:' + stamp(end),
            'SUMMARY:' + esc(service.name + ' — ' + doctor.name + ' · ' + CLINIC.name),
            'DESCRIPTION:' + esc(description.join('\n')),
            'LOCATION:' + esc(CLINIC.address),
            'STATUS:CONFIRMED',
            'BEGIN:VALARM',
            'TRIGGER:-PT2H',
            'ACTION:DISPLAY',
            'DESCRIPTION:' + esc('Appointment at ' + CLINIC.name),
            'END:VALARM',
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');
    }

    function addToCalendar(state, statusNode) {
        var ics = buildIcs(state);
        var filename = 'dental-clinica-' + state.result.reference + '.ics';
        var file = null;

        try { file = new File([ics], filename, { type: 'text/calendar' }); }
        catch (e) { file = null; }

        function downloadIcs() {
            try {
                var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
                var url = URL.createObjectURL(blob);
                var a = el('a', { href: url, download: filename });
                doc.body.appendChild(a);
                a.click();
                doc.body.removeChild(a);
                setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
                statusNode.textContent = 'Calendar file saved — open it to add this appointment to your calendar.';
            } catch (err) {
                statusNode.textContent = 'Your browser blocked the download. Please note your reference above, or call us on ' + CLINIC.phone + '.';
            }
        }

        /* On phones the share sheet is the most reliable route into the
           device's own calendar app; everywhere else the .ics file is. */
        if (file && global.navigator.canShare && global.navigator.canShare({ files: [file] })) {
            global.navigator.share({ files: [file], title: 'Appointment at ' + CLINIC.name })
                .then(function () { statusNode.textContent = 'Open the shared event in your calendar app to save it.'; })
                .catch(function () { downloadIcs(); });
            return;
        }
        downloadIcs();
    }

    /* ================================================= step 6 — confirmation */
    function BookingSuccess(state) {
        var doctor = API.getDoctor(state.doctorId);
        var service = API.getService(state.serviceId);
        var result = state.result || {};

        var rows = [
            ['Service', service.name],
            ['Date', API.formatDateLong(parseIso(state.dateIso))],
            ['Time', state.slot.label],
            ['Duration', service.duration + ' min'],
            ['Clinic', CLINIC.name],
            ['Location', CLINIC.address],
            ['Contact', CLINIC.phone]
        ];

        var card = el('div', { class: 'bk-card' }, [
            el('div', { class: 'bk-card__top' }, [
                el('div', { class: 'bk-card__doctor' }, [
                    el('img', { src: doctor.image, alt: doctor.name }),
                    el('div', {}, [
                        el('h3', { text: doctor.name }),
                        el('p', { text: doctor.specialization })
                    ])
                ]),
                el('div', { class: 'bk-ref-badge' }, [
                    el('span', { class: 'bk-ref-badge__label', text: 'Reference' }),
                    el('strong', { class: 'bk-ref-badge__code', text: result.reference || '—' })
                ])
            ]),
            el('dl', { class: 'bk-card__rows' }, rows.map(function (r) {
                return el('div', { class: 'bk-summary__row' }, [
                    el('dt', { text: r[0] }), el('dd', { text: r[1] })
                ]);
            }))
        ]);

        var status = el('p', { class: 'bk-cal-status', role: 'status' });

        var addBtn = el('button', { type: 'button', class: 'bk-btn bk-btn--primary' }, [
            icon(ICONS.calendarPlus, 17), el('span', { text: 'Add to Calendar' })
        ]);
        addBtn.addEventListener('click', function () { addToCalendar(state, status); });

        return el('div', { class: 'bk-success' }, [
            el('div', { class: 'bk-success__mark' }, [icon(ICONS.check, 30)]),
            el('h1', { class: 'bk-success__title', text: 'Appointment Booked Successfully' }),
            el('p', {
                class: 'bk-success__para',
                text: 'Your appointment has been successfully booked. Please quote your reference number when you contact the clinic.'
            }),
            card,
            el('div', { class: 'bk-actions bk-actions--center' }, [addBtn]),
            status,
            el('div', { class: 'bk-actions bk-actions--center' }, [
                el('a', { class: 'bk-btn bk-btn--ghost', href: 'tel:+' + CLINIC.phoneE164 },
                    [icon(ICONS.phone, 17), el('span', { text: 'Contact Clinic' })]),
                el('a', { class: 'bk-btn bk-btn--ghost', href: 'index.html' },
                    [el('span', { text: 'Done' })])
            ])
        ]);
    }

    /* ------------------------------------------------------------ bootstrap */
    doc.addEventListener('DOMContentLoaded', function () {
        var mount = doc.getElementById('booking-root');
        if (mount) BookingFlow(mount);
    });
})(window, document);
