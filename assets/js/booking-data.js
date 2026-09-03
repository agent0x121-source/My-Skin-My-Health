/* ==========================================================================
   My Skin My Health — Booking data layer (Connected to LumoraDB)
   ========================================================================== */
(function (global) {
    'use strict';

    /* Fallback default clinic info */
    var DEFAULT_CLINIC = {
        name: 'My Skin My Health',
        tagline: 'Advanced Dermatology, Trichology & Aesthetic Health Care in Sakinaka, Mumbai.',
        address: 'Unit No. A 407/408, A Wing, Pranik Chambers, Opp. H.P. Petrol Pump, Saki Vihar Road, Sag Baug, Marol, Sakinaka, Mumbai, Maharashtra 400072',
        shortAddress: 'Pranik Chambers, Sakinaka, Mumbai',
        phone: '+91 8422 990 990',
        phoneE164: '918422990990',
        email: 'myskinmyhealth@gmail.com',
        whatsapp: '+91 8422 990 990',
        mapsUrl: 'https://maps.google.com/?cid=5170842553753193281',
        hours: {
            0: { open: '11:00', close: '14:00', brk: null },
            1: { open: '11:00', close: '21:00', brk: null },
            2: { open: '11:00', close: '21:00', brk: null },
            3: { open: '11:00', close: '21:00', brk: null },
            4: { open: '11:00', close: '21:00', brk: null },
            5: { open: '11:00', close: '21:00', brk: null },
            6: { open: '11:00', close: '21:00', brk: null }
        },
        bookingWindowDays: 60,
        minNoticeMinutes: 90,
        closedDates: []
    };

    function getDB() {
        return global.LumoraDB || null;
    }

    function getClinicData() {
        var db = getDB();
        if (db && db.getClinic) {
            var c = db.getClinic();
            return {
                name: c.name || DEFAULT_CLINIC.name,
                tagline: c.tagline || DEFAULT_CLINIC.tagline,
                address: c.address || DEFAULT_CLINIC.address,
                shortAddress: c.shortAddress || DEFAULT_CLINIC.shortAddress,
                phone: c.phone || DEFAULT_CLINIC.phone,
                phoneE164: (c.phoneE164 || c.phone || DEFAULT_CLINIC.phoneE164).replace(/\D/g, ''),
                whatsapp: c.whatsapp || c.phone || DEFAULT_CLINIC.whatsapp,
                email: c.email || DEFAULT_CLINIC.email,
                mapsUrl: c.mapsUrl || DEFAULT_CLINIC.mapsUrl,
                hours: c.hours || DEFAULT_CLINIC.hours,
                bookingWindowDays: c.bookingWindowDays || 60,
                minNoticeMinutes: c.minNoticeMinutes || 90,
                closedDates: c.closedDates || []
            };
        }
        return DEFAULT_CLINIC;
    }

    function getDoctorsData() {
        var db = getDB();
        if (db && db.getDoctors) {
            return db.getDoctors(true);
        }
        return [];
    }

    function getServicesData() {
        var db = getDB();
        if (db && db.getServices) {
            return db.getServices(true);
        }
        return [];
    }

    /* ------------------------------------------------------------- utilities */
    function toMinutes(hhmm) {
        if (!hhmm) return 600;
        var p = String(hhmm).split(':');
        return parseInt(p[0], 10) * 60 + parseInt(p[1] || 0, 10);
    }

    function isoDate(d) {
        return d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0');
    }

    function windowFor(doctor, date) {
        var clinic = getClinicData();
        var day = date.getDay();
        var table = (doctor && doctor.schedule) ? doctor.schedule : clinic.hours;
        var w = table ? table[day] : null;
        if (!w || w.closed) return null;
        
        var clinicWindow = clinic.hours ? clinic.hours[day] : null;
        if (!clinicWindow || clinicWindow.closed) return null;

        var openMin = Math.max(toMinutes(w.open || '10:00'), toMinutes(clinicWindow.open || '10:00'));
        var closeMin = Math.min(toMinutes(w.close || '23:00'), toMinutes(clinicWindow.close || '23:00'));
        if (openMin >= closeMin) return null;

        var brk = (w && w.brk) || (clinicWindow && clinicWindow.brk) || null;
        return {
            open: openMin,
            close: closeMin,
            brkStart: brk ? toMinutes(brk.start) : null,
            brkEnd: brk ? toMinutes(brk.end) : null
        };
    }

    /* --------------------------------------------------------------- the API */
    var BookingAPI = {
        getClinic: function () {
            return getClinicData();
        },

        getDoctors: function () {
            return Promise.resolve(getDoctorsData());
        },

        getDoctor: function (id) {
            var db = getDB();
            if (db && db.getDoctorById) {
                var d = db.getDoctorById(id);
                if (d) return d;
            }
            var docs = getDoctorsData();
            return docs.filter(function (doc) { return doc.id === id; })[0] || null;
        },

        getService: function (id) {
            var db = getDB();
            if (db && db.getServiceById) {
                var s = db.getServiceById(id);
                if (s) return s;
            }
            var svcs = getServicesData();
            return svcs.filter(function (svc) { return svc.id === id; })[0] || null;
        },

        getServicesForDoctor: function (doctorId) {
            var doctor = BookingAPI.getDoctor(doctorId);
            var allSvcs = getServicesData();
            if (!doctor) return Promise.resolve(allSvcs);
            if (!doctor.services || !doctor.services.length) return Promise.resolve(allSvcs);
            return Promise.resolve(allSvcs.filter(function (s) {
                return doctor.services.indexOf(s.id) !== -1;
            }));
        },

        getAvailableDates: function (doctorId, year, month) {
            var doctor = BookingAPI.getDoctor(doctorId);
            var clinic = getClinicData();
            var out = [];
            if (!doctor) return Promise.resolve(out);

            var today = new Date(); today.setHours(0, 0, 0, 0);
            var last = new Date(today.getTime());
            last.setDate(last.getDate() + (clinic.bookingWindowDays || 60));

            var d = new Date(year, month, 1);
            while (d.getMonth() === month) {
                var iso = isoDate(d);
                var withinWindow = d >= today && d <= last;
                var open = windowFor(doctor, d) !== null;
                var closed = (clinic.closedDates || []).indexOf(iso) !== -1;
                if (withinWindow && open && !closed) out.push(iso);
                d.setDate(d.getDate() + 1);
            }
            return Promise.resolve(out);
        },

        getAvailability: function (doctorId, serviceId, dateIso) {
            var doctor = BookingAPI.getDoctor(doctorId);
            var service = BookingAPI.getService(serviceId);
            var clinic = getClinicData();
            if (!doctor || !service) return Promise.resolve([]);

            var parts = dateIso.split('-');
            var date = new Date(+parts[0], +parts[1] - 1, +parts[2]);
            var w = windowFor(doctor, date);
            if (!w || (clinic.closedDates || []).indexOf(dateIso) !== -1) return Promise.resolve([]);

            var now = new Date();
            var earliest = now.getTime() + (clinic.minNoticeMinutes || 90) * 60000;
            var duration = service.duration || 30;
            var slots = [];

            for (var m = w.open; m + duration <= w.close; m += duration) {
                if (w.brkStart !== null && m < w.brkEnd && (m + duration) > w.brkStart) continue;
                var start = new Date(date.getTime());
                start.setHours(Math.floor(m / 60), m % 60, 0, 0);
                if (start.getTime() < earliest) continue;
                slots.push({
                    start: start.toISOString(),
                    minutes: m,
                    label: BookingAPI.formatTime(start)
                });
            }
            return Promise.resolve(slots);
        },

        /* Submits directly into Central LumoraDB */
        submitBooking: function (booking) {
            var db = getDB();
            var pat = booking.patient || {};
            var fullPhone = (pat.dialCode ? pat.dialCode + ' ' : '') + (pat.phone || '');
            
            var startDate = booking.startIso ? new Date(booking.startIso) : new Date();
            var dateIsoStr = isoDate(startDate);
            var timeFormatted = BookingAPI.formatTime(startDate);

            var createdAppt = null;
            if (db && db.createAppointment) {
                var activePatientSession = db.getPatientSession ? db.getPatientSession() : null;
                var notesText = (pat.age ? 'Age: ' + pat.age + '. ' : '') + (pat.notes || '');

                createdAppt = db.createAppointment({
                    patientId: activePatientSession ? activePatientSession.refId : null,
                    patientName: pat.name,
                    patientPhone: fullPhone.trim(),
                    patientEmail: activePatientSession ? activePatientSession.email : '',
                    doctorId: booking.doctor ? booking.doctor.id : null,
                    serviceId: booking.service ? booking.service.id : null,
                    date: dateIsoStr,
                    time: timeFormatted,
                    fee: booking.service ? (booking.service.price || 500) : 500,
                    notes: notesText,
                    startIso: booking.startIso
                });
            }

            var ref = createdAppt ? createdAppt.reference : ('DC-' + Date.now().toString(36).toUpperCase().slice(-6));

            // Also keep local log backup
            try {
                var log = JSON.parse(global.localStorage.getItem('dc_bookings') || '[]');
                log.push({
                    reference: ref,
                    createdAt: new Date().toISOString(),
                    doctorId: booking.doctor ? booking.doctor.id : null,
                    serviceId: booking.service ? booking.service.id : null,
                    start: booking.startIso,
                    patient: pat
                });
                global.localStorage.setItem('dc_bookings', JSON.stringify(log.slice(-20)));
            } catch (err) {}

            return Promise.resolve({ reference: ref, success: true });
        },

        formatTime: function (date) {
            var h = date.getHours(), m = date.getMinutes();
            var suffix = h >= 12 ? 'PM' : 'AM';
            var h12 = h % 12; if (h12 === 0) h12 = 12;
            return h12 + ':' + String(m).padStart(2, '0') + ' ' + suffix;
        },

        formatDateLong: function (date) {
            var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            var months = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
            return days[date.getDay()] + ', ' + months[date.getMonth()] + ' ' + date.getDate();
        },

        isoDate: isoDate
    };

    // Export BookingData with reactive getters
    var BookingDataExport = {
        api: BookingAPI
    };

    Object.defineProperty(BookingDataExport, 'clinic', {
        get: getClinicData,
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(BookingDataExport, 'doctors', {
        get: getDoctorsData,
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(BookingDataExport, 'services', {
        get: getServicesData,
        enumerable: true,
        configurable: true
    });

    global.BookingData = BookingDataExport;

})(typeof window !== 'undefined' ? window : this);
