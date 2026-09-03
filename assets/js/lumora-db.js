/* ==========================================================================
   My Skin My Health — Central Data Store & Management Database Engine
   --------------------------------------------------------------------------
   Unified source of truth for Clinic Info, Doctors, Services, Blogs,
   Reviews, Appointments, Patients, Staff & Roles, WhatsApp Automation,
   Revenue Tracking, and Audit Logs.
   ========================================================================== */
(function (global) {
    'use strict';

    var STORAGE_KEY = 'msmh_db_v1';
    var SESSION_KEY = 'lumora_active_session';
    var PATIENT_SESSION_KEY = 'lumora_patient_session';

    /* Initial Seed Data based on real website content */
    var INITIAL_DATA = {
        clinic: {
            name: 'My Skin My Health',
            brand: 'My Skin My Health',
            tagline: 'Advanced Dermatology, Trichology & Aesthetic Health Care in Sakinaka, Mumbai.',
            address: 'Unit No. A 407/408, A Wing, Pranik Chambers, Opp. H.P. Petrol Pump, Saki Vihar Road, Sag Baug, Marol, Sakinaka, Mumbai, Maharashtra 400072',
            shortAddress: 'Pranik Chambers, Sakinaka, Mumbai',
            phone: '+91 8422 990 990',
            phoneSecondary: '+91 99309 05011',
            phoneE164: '918422990990',
            whatsapp: '+91 8422 990 990',
            email: 'myskinmyhealth@gmail.com',
            emergencyEmail: 'care@myskinmyhealth.in',
            mapsUrl: 'https://maps.google.com/?cid=5170842553753193281',
            mapsEmbed: 'https://maps.google.com/maps?q=My%20Skin%20My%20Health%20Pranik%20Chambers%20Sakinaka%20Mumbai&output=embed',
            hours: {
                0: { open: '11:00', close: '14:00', brk: null, label: 'Sunday: 11:00 AM - 2:00 PM', closed: false },
                1: { open: '11:00', close: '21:00', brk: null, label: 'Monday: 11:00 AM - 9:00 PM', closed: false },
                2: { open: '11:00', close: '21:00', brk: null, label: 'Tuesday: 11:00 AM - 9:00 PM', closed: false },
                3: { open: '11:00', close: '21:00', brk: null, label: 'Wednesday: 11:00 AM - 9:00 PM', closed: false },
                4: { open: '11:00', close: '21:00', brk: null, label: 'Thursday: 11:00 AM - 9:00 PM', closed: false },
                5: { open: '11:00', close: '21:00', brk: null, label: 'Friday: 11:00 AM - 9:00 PM', closed: false },
                6: { open: '11:00', close: '21:00', brk: null, label: 'Saturday: 11:00 AM - 9:00 PM', closed: false }
            },
            transit: {
                metro: 'Near Sakinaka Metro Station (~500m)',
                bus: 'Saki Vihar Road / Marol',
                landmark: 'Opposite H.P. Petrol Pump, Pranik Chambers (~2 km from Chhatrapati Shivaji Maharaj International Airport)',
                parking: 'Ample visitor parking available at Pranik Chambers'
            },
            bookingWindowDays: 60,
            minNoticeMinutes: 90,
            currency: '₹',
            closedDates: []
        },

        doctors: [
            {
                id: 'pallavi-rathi',
                name: 'Dr. Pallavi Rathi',
                email: 'dr.pallavi@myskinmyhealth.in',
                specialization: 'Chief Dermatologist, Cosmetologist & Trichologist',
                qualification: 'MBBS, MD (Skin Diseases), FCPS (Dermatology, Venereology & Leprosy)',
                experience: '21+ years experience',
                department: 'Clinical Dermatology, Trichology & Aesthetics',
                image: 'assets/img/gen_team-image-5.jpg',
                phone: '+91 8422 990 990',
                bio: 'Distinguished Dermatologist, Cosmetologist, and Trichologist with over 21 years of specialized medical practice. Founder of My Skin My Health, specializing in personalized acne revision, aesthetic skin rejuvenation, chronic skin conditions, and advanced hair restoration therapies.',
                languages: ['English', 'Hindi', 'Marathi'],
                services: ['clinical-dermatology', 'aesthetic-anti-ageing', 'laser-treatments', 'trichology-prp', 'general-consultation', 'medifacials-peels', 'follow-up'],
                featured: true,
                active: true,
                loginEnabled: true,
                schedule: {
                    0: { open: '11:00', close: '14:00', brk: null },
                    1: { open: '11:00', close: '21:00', brk: null },
                    2: { open: '11:00', close: '21:00', brk: null },
                    3: { open: '11:00', close: '21:00', brk: null },
                    4: { open: '11:00', close: '21:00', brk: null },
                    5: { open: '11:00', close: '21:00', brk: null },
                    6: { open: '11:00', close: '21:00', brk: null }
                }
            },
            {
                id: 'kapil-rathi',
                name: 'Dr. Kapil Rathi',
                email: 'dr.kapil@myskinmyhealth.in',
                specialization: 'Consultant Physician & Lifestyle Medicine Specialist',
                qualification: 'MBBS, MD (Medicine)',
                experience: '18+ years experience',
                department: 'Holistic Health & Lifestyle Medicine',
                image: 'assets/img/gen_team-image-6.jpg',
                phone: '+91 8422 990 990',
                bio: 'Co-founder of My Skin My Health leading the internal health and wellness division. Focuses on addressing root systemic triggers for skin and hair health, metabolic balance, allergies, and lifestyle medicine.',
                languages: ['English', 'Hindi', 'Marathi'],
                services: ['general-consultation', 'follow-up'],
                featured: true,
                active: true,
                loginEnabled: true,
                schedule: {
                    0: { open: '11:00', close: '14:00', brk: null },
                    1: { open: '11:00', close: '21:00', brk: null },
                    2: { open: '11:00', close: '21:00', brk: null },
                    3: { open: '11:00', close: '21:00', brk: null },
                    4: { open: '11:00', close: '21:00', brk: null },
                    5: { open: '11:00', close: '21:00', brk: null },
                    6: { open: '11:00', close: '21:00', brk: null }
                }
            },
            {
                id: 'aesthetic-specialist',
                name: 'Associate Cosmetologist',
                email: 'cosmetology@myskinmyhealth.in',
                specialization: 'Aesthetic Specialist & Laser Technologist',
                qualification: 'Fellowship in Aesthetic Medicine (FAM)',
                experience: '7 years experience',
                department: 'Aesthetic Medicine & Laser Therapy',
                image: 'assets/img/gen_team-image-1.jpg',
                phone: '+91 8422 990 990',
                bio: 'Specialist in clinical medifacials, carbon laser toning, skin brightening chemical peels, and laser resurfacing for flawless, radiant skin.',
                languages: ['English', 'Hindi', 'Marathi'],
                services: ['aesthetic-anti-ageing', 'laser-treatments', 'medifacials-peels', 'follow-up'],
                featured: true,
                active: true,
                loginEnabled: true,
                schedule: {
                    0: { open: '11:00', close: '14:00', brk: null },
                    1: { open: '11:00', close: '21:00', brk: null },
                    2: { open: '11:00', close: '21:00', brk: null },
                    3: { open: '11:00', close: '21:00', brk: null },
                    4: { open: '11:00', close: '21:00', brk: null },
                    5: { open: '11:00', close: '21:00', brk: null },
                    6: { open: '11:00', close: '21:00', brk: null }
                }
            },
            {
                id: 'trichology-specialist',
                name: 'Senior Trichologist',
                email: 'hair@myskinmyhealth.in',
                specialization: 'Trichology & Scalp Therapist',
                qualification: 'Certified Trichologist, Clinical Hair Care',
                experience: '6 years experience',
                department: 'Trichology & Hair Restoration',
                image: 'assets/img/gen_team-image-3.jpg',
                phone: '+91 8422 990 990',
                bio: 'Expert in scalp micro-diagnostics, Platelet-Rich Plasma (PRP) therapies, hair thinning management, and holistic follicular stimulation.',
                languages: ['English', 'Hindi', 'Marathi'],
                services: ['trichology-prp', 'general-consultation', 'follow-up'],
                featured: false,
                active: true,
                loginEnabled: true,
                schedule: {
                    0: { open: '11:00', close: '14:00', brk: null },
                    1: { open: '11:00', close: '21:00', brk: null },
                    2: { open: '11:00', close: '21:00', brk: null },
                    3: { open: '11:00', close: '21:00', brk: null },
                    4: { open: '11:00', close: '21:00', brk: null },
                    5: { open: '11:00', close: '21:00', brk: null },
                    6: { open: '11:00', close: '21:00', brk: null }
                }
            }
        ],

        services: [
            {
                id: 'clinical-dermatology',
                name: 'Medical Dermatology & Acne Care',
                tagline: 'Targeted solutions for acne, pigmentation, and chronic skin conditions',
                description: 'At My Skin My Health, Dr. Pallavi Rathi combines 21+ years of clinical expertise with modern dermatological science for gentle, effective treatment of stubborn acne, scars, melasma, eczema, and psoriasis.',
                duration: 30,
                price: 1200,
                modes: ['in-person'],
                image: 'assets/img/gen_service-thumbnail-image.jpg',
                category: 'Clinical Dermatology',
                featured: true,
                active: true,
                doctors: ['pallavi-rathi', 'aesthetic-specialist']
            },
            {
                id: 'trichology-prp',
                name: 'Hair Fall & PRP Therapy',
                tagline: 'Advanced hair restoration and regenerative scalp treatments',
                description: 'Comprehensive hair loss evaluation, Platelet-Rich Plasma (PRP) therapy, growth factor concentrate, and specialized anti-dandruff scalp therapies designed to restore follicle strength and volume.',
                duration: 45,
                price: 4500,
                modes: ['in-person'],
                image: 'assets/img/gen_service-thumbnail-image-4.jpg',
                category: 'Trichology',
                featured: true,
                active: true,
                doctors: ['pallavi-rathi', 'trichology-specialist']
            },
            {
                id: 'aesthetic-anti-ageing',
                name: 'Aesthetic & Anti-Ageing Solutions',
                tagline: 'Radiant, youthful skin with subtle, natural-looking results',
                description: 'Non-surgical facial contouring, Botox, hyaluronic dermal fillers, skin boosters, collagen rejuvenation, and fine line smoothing administered with clinical precision and artistic care.',
                duration: 45,
                price: 6500,
                modes: ['in-person'],
                image: 'assets/img/gen_service-thumbnail-image-2.jpg',
                category: 'Aesthetics',
                featured: true,
                active: true,
                doctors: ['pallavi-rathi', 'aesthetic-specialist']
            },
            {
                id: 'laser-treatments',
                name: 'Laser Treatments & Resurfacing',
                tagline: 'State-of-the-art US-FDA laser technology for clear, smooth skin',
                description: 'Safe, virtually painless laser hair reduction, carbon laser facials (Hollywood peel), laser scar revision, and pigmentation removal suitable for all Indian skin tones.',
                duration: 45,
                price: 3500,
                modes: ['in-person'],
                image: 'assets/img/gen_service-thumbnail-image-3.jpg',
                category: 'Laser Care',
                featured: true,
                active: true,
                doctors: ['pallavi-rathi', 'aesthetic-specialist']
            },
            {
                id: 'medifacials-peels',
                name: 'Medifacials & Clinical Peels',
                tagline: 'Medical-grade hydration and skin brightening infusions',
                description: 'Medical hydrafacials, gentle chemical peels, deep pore detoxification, and antioxidant glow infusions custom-curated for immediate radiance and healthy skin barrier maintenance.',
                duration: 45,
                price: 2800,
                modes: ['in-person'],
                image: 'assets/img/gen_service-thumbnail-image.jpg',
                category: 'Medifacials',
                featured: true,
                active: true,
                doctors: ['aesthetic-specialist', 'pallavi-rathi']
            },
            {
                id: 'general-consultation',
                name: 'Comprehensive Skin & Health Consultation',
                tagline: 'Detailed diagnostic assessment with Dr. Pallavi Rathi',
                description: 'In-depth clinical examination, digital dermoscopic evaluation, lifestyle and allergy review, and an individualized treatment roadmap designed for lasting skin and hair wellness.',
                duration: 30,
                price: 1000,
                modes: ['in-person', 'online'],
                image: 'assets/img/gen_service-thumbnail-image-2.jpg',
                category: 'Consultation',
                featured: true,
                active: true,
                doctors: ['pallavi-rathi', 'kapil-rathi', 'aesthetic-specialist', 'trichology-specialist']
            },
            {
                id: 'follow-up',
                name: 'Follow-up Consultation',
                tagline: 'Treatment progress review & regimen tuning',
                description: 'Review visit following laser sessions, peels, or medical regimens to assess healing progress and maintain luminous, healthy skin.',
                duration: 15,
                price: 500,
                modes: ['in-person', 'online'],
                image: 'assets/img/gen_service-thumbnail-image-3.jpg',
                category: 'Review',
                featured: false,
                active: true,
                doctors: ['pallavi-rathi', 'kapil-rathi', 'aesthetic-specialist', 'trichology-specialist']
            }
        ],

        blogs: [
            {
                id: 'blog-skincare-routine',
                title: 'The ultimate guide to a dermatologist-approved daily skincare routine',
                slug: 'dermatologist-approved-daily-skincare-routine',
                category: 'Skin Health',
                author: 'Dr. Pallavi Rathi',
                date: 'April 30, 2026',
                summary: 'Discover how simplifying your skincare routine to essential, scientifically-backed steps can dramatically transform your skin barrier, prevent premature ageing, and preserve natural radiance.',
                content: '<p>A glowing, resilient complexion starts with protecting your skin barrier. Gentle double cleansing at night, adequate hyaluronic hydration, and daily broad-spectrum sun protection form the non-negotiable core of dermatological health.</p><p>Avoid overloading active ingredients simultaneously. Introduce retinoids and vitamin C gradually under professional guidance for optimal, irritation-free results.</p>',
                image: 'assets/img/gen_blog-image-4.jpg',
                featured: true,
                published: true
            },
            {
                id: 'blog-acne-myths',
                title: 'Acne myths debunked: what your skin actually needs for clear confidence',
                slug: 'acne-myths-debunked',
                category: 'Acne & Blemishes',
                author: 'Dr. Pallavi Rathi',
                date: 'April 22, 2026',
                summary: 'From aggressive scrubbing to skipping moisturizer, we debunk common misconceptions preventing patients from achieving smooth, breakout-free skin.',
                content: '<p>Myth #1: Oily skin does not need moisturizer. In fact, dehydrated skin overproduces sebum, triggering more blemishes. Myth #2: Squeezing acne speeds up healing. Physical trauma pushes bacteria deeper and guarantees post-inflammatory hyperpigmentation.</p>',
                image: 'assets/img/gen_blog-image-6.jpg',
                featured: false,
                published: true
            },
            {
                id: 'blog-hair-fall-prp',
                title: 'Understanding hair thinning: how PRP therapy stimulates natural follicular regrowth',
                slug: 'understanding-hair-thinning-prp-therapy',
                category: 'Hair Care & Trichology',
                author: 'Senior Trichologist',
                date: 'April 15, 2026',
                summary: 'Experiencing excess shedding or widening hair parting? Learn how concentrated autologous growth factors in PRP restore follicle vigor.',
                content: '<p>Platelet-Rich Plasma therapy utilizes your own blood plasma rich in bioactive growth factors. When injected into targeted scalp zones, it enhances microcirculation, prolongs the anagen growth phase, and thickens existing hair shafts.</p>',
                image: 'assets/img/gen_blog-image-5.jpg',
                featured: false,
                published: true
            },
            {
                id: 'blog-sunscreen-importance',
                title: 'Why broad-spectrum SPF is your ultimate anti-ageing defense in Mumbai',
                slug: 'why-broad-spectrum-spf-is-ultimate-anti-ageing',
                category: 'Sun Protection',
                author: 'Dr. Kapil Rathi',
                date: 'April 08, 2026',
                summary: 'UV radiation and urban pollution accelerate collagen breakdown. Here is how to shield your skin effectively throughout every season.',
                content: '<p>Up to 80% of facial ageing signs—fine lines, hyperpigmentation, and loss of elasticity—are caused by photo-damage. Wearing broad-spectrum SPF 50 with PA+++ daily, even indoors or on overcast days, is the single most powerful preventative health habit for your skin.</p>',
                image: 'assets/img/gen_blog-image-3.jpg',
                featured: false,
                published: true
            }
        ],

        reviews: [
            {
                id: 'rev-1',
                author: 'Pooja Sharma',
                designation: 'Media Professional, Andheri',
                rating: 5,
                comment: '“I struggled with persistent acne and pigmentation for years before visiting Dr. Pallavi Rathi. Her diagnosis was thorough and within 8 weeks of her personalized treatment and peeling sessions, my skin completely cleared up. Truly the best dermatologist in Sakinaka!”',
                avatar: 'assets/img/gen_testimonial-author-1.jpg',
                doctorId: 'pallavi-rathi',
                serviceId: 'clinical-dermatology',
                date: '2026-08-14',
                featured: true,
                published: true
            },
            {
                id: 'rev-2',
                author: 'Vikram Mehta',
                designation: 'IT Executive, Marol',
                rating: 5,
                comment: '“Took PRP sessions for severe hair fall at My Skin My Health. Dr. Pallavi Rathi and her trichology team are extremely knowledgeable and patient. The hair shedding reduced drastically and new growth is clearly visible. The clinic at Pranik Chambers is pristine.”',
                avatar: 'assets/img/gen_testimonial-author-2.jpg',
                doctorId: 'pallavi-rathi',
                serviceId: 'trichology-prp',
                date: '2026-08-20',
                featured: true,
                published: true
            },
            {
                id: 'rev-3',
                author: 'Sneha Kulkarni',
                designation: 'Fashion Designer',
                rating: 5,
                comment: '“Had a carbon laser facial and medical hydrafacial before my sister’s wedding. The glow and texture improvement were immediate without any downtime! The entire staff is courteous and very gentle.”',
                avatar: 'assets/img/gen_testimonial-author-3.jpg',
                doctorId: 'aesthetic-specialist',
                serviceId: 'medifacials-peels',
                date: '2026-08-28',
                featured: true,
                published: true
            },
            {
                id: 'rev-4',
                author: 'Ananya Deshmukh',
                designation: 'Corporate Banker, Powai',
                rating: 5,
                comment: '“Dr. Pallavi Rathi is so warm and comforting. She explained my skin allergy triggers step by step and prescribed a minimalist, effective regimen. No unnecessary tests or expensive creams pushed. Outstanding experience.”',
                avatar: 'assets/img/gen_testimonial-author-1.jpg',
                doctorId: 'pallavi-rathi',
                serviceId: 'general-consultation',
                date: '2026-08-30',
                featured: true,
                published: true
            }
        ],

        patients: [
            {
                id: 'pat-1001',
                name: 'Pooja Sharma',
                phone: '+91 98112 34567',
                email: 'pooja.s@example.com',
                age: 29,
                gender: 'Female',
                bloodGroup: 'B+',
                address: 'Marol, Andheri East, Mumbai',
                medicalHistory: 'Hormonal acne under maintenance. No drug allergies.',
                lastVisit: '2026-08-25',
                upcomingAppointment: '2026-09-03 11:30',
                status: 'Active',
                totalVisits: 4,
                totalSpent: 4800,
                createdAt: '2026-01-15T10:00:00Z'
            },
            {
                id: 'pat-1002',
                name: 'Vikram Mehta',
                phone: '+91 98734 56789',
                email: 'vikram.m@example.com',
                age: 36,
                gender: 'Male',
                bloodGroup: 'O+',
                address: 'Sakinaka, Mumbai',
                medicalHistory: 'PRP scalp therapy cycle in progress.',
                lastVisit: '2026-08-28',
                upcomingAppointment: '2026-09-05 16:00',
                status: 'Active',
                totalVisits: 6,
                totalSpent: 18000,
                createdAt: '2026-02-10T14:30:00Z'
            },
            {
                id: 'pat-1003',
                name: 'Rahul Joshi',
                phone: '+91 99581 23456',
                email: 'rahul.j@example.com',
                age: 42,
                gender: 'Male',
                bloodGroup: 'A+',
                address: 'Powai, Mumbai',
                medicalHistory: 'Seborrheic dermatitis treated.',
                lastVisit: '2026-08-18',
                upcomingAppointment: null,
                status: 'Active',
                totalVisits: 3,
                totalSpent: 3600,
                createdAt: '2026-03-05T09:15:00Z'
            },
            {
                id: 'pat-1004',
                name: 'Sneha Kulkarni',
                phone: '+91 97110 87654',
                email: 'sneha.k@example.com',
                age: 26,
                gender: 'Female',
                bloodGroup: 'AB+',
                address: 'Ghatkopar, Mumbai',
                medicalHistory: 'Routine medifacials and glowing peels.',
                lastVisit: '2026-07-12',
                upcomingAppointment: '2026-09-02 14:00',
                status: 'Active',
                totalVisits: 2,
                totalSpent: 5600,
                createdAt: '2026-04-12T11:00:00Z'
            },
            {
                id: 'pat-1005',
                name: 'Rohan Varma',
                phone: '+91 98109 43210',
                email: 'rohan.v@example.com',
                age: 34,
                gender: 'Male',
                bloodGroup: 'O-',
                address: 'Chakala, Andheri East, Mumbai',
                medicalHistory: 'Tattoo removal consultation.',
                lastVisit: '2026-06-20',
                upcomingAppointment: null,
                status: 'Inactive',
                totalVisits: 1,
                totalSpent: 1000,
                createdAt: '2026-06-20T16:00:00Z'
            }
        ],

        appointments: [
            {
                reference: 'MSMH-901A01',
                patientId: 'pat-1001',
                patientName: 'Pooja Sharma',
                patientPhone: '+91 98112 34567',
                patientEmail: 'pooja.s@example.com',
                patientAge: 29,
                doctorId: 'pallavi-rathi',
                serviceId: 'clinical-dermatology',
                date: '2026-09-03',
                time: '11:30 AM',
                startIso: '2026-09-03T11:30:00',
                status: 'Confirmed',
                fee: 1200,
                paymentStatus: 'Paid',
                notes: 'Follow-up acne review and brightening peel.',
                createdAt: '2026-08-30T10:15:00Z',
                history: [
                    { time: '2026-08-30T10:15:00Z', action: 'Booked online', user: 'Patient' },
                    { time: '2026-08-30T11:00:00Z', action: 'Confirmed by Admin', user: 'Admin' }
                ]
            },
            {
                reference: 'MSMH-901A02',
                patientId: 'pat-1002',
                patientName: 'Vikram Mehta',
                patientPhone: '+91 98734 56789',
                patientEmail: 'vikram.m@example.com',
                patientAge: 36,
                doctorId: 'pallavi-rathi',
                serviceId: 'trichology-prp',
                date: '2026-09-05',
                time: '04:00 PM',
                startIso: '2026-09-05T16:00:00',
                status: 'Confirmed',
                fee: 4500,
                paymentStatus: 'Paid',
                notes: 'PRP Scalp Therapy Session 3.',
                createdAt: '2026-08-31T09:30:00Z',
                history: [
                    { time: '2026-08-31T09:30:00Z', action: 'Booked online', user: 'Patient' },
                    { time: '2026-08-31T10:00:00Z', action: 'Confirmed by Staff', user: 'Staff' }
                ]
            },
            {
                reference: 'MSMH-901A03',
                patientId: 'pat-1004',
                patientName: 'Sneha Kulkarni',
                patientPhone: '+91 97110 87654',
                patientEmail: 'sneha.k@example.com',
                patientAge: 26,
                doctorId: 'aesthetic-specialist',
                serviceId: 'medifacials-peels',
                date: '2026-09-02',
                time: '02:00 PM',
                startIso: '2026-09-02T14:00:00',
                status: 'Pending',
                fee: 2800,
                paymentStatus: 'Pending',
                notes: 'Medical hydrafacial before event.',
                createdAt: '2026-09-01T08:00:00Z',
                history: [
                    { time: '2026-09-01T08:00:00Z', action: 'Booked online via Website', user: 'Patient' }
                ]
            }
        ],

        staff: [
            {
                id: 'usr-admin-1',
                name: 'Clinic Administrator',
                email: 'admin@myskinmyhealth.in',
                role: 'ADMIN',
                phone: '+91 8422 990 990',
                active: true,
                avatar: '/assets/img/clinic-icon.svg',
                permissions: [
                    'dashboard', 'appointments', 'calendar', 'patients', 'doctors',
                    'services', 'blogs', 'reviews', 'analytics', 'reports',
                    'revenue', 'contact', 'whatsapp', 'staff', 'settings'
                ],
                createdAt: '2026-01-01T00:00:00Z'
            },
            {
                id: 'usr-staff-1',
                name: 'Clinic Reception Desk',
                email: 'staff@myskinmyhealth.in',
                role: 'STAFF',
                phone: '+91 8422 990 990',
                active: true,
                avatar: 'assets/img/gen_team-image-1.jpg',
                permissions: [
                    'dashboard', 'appointments', 'calendar', 'patients', 'reviews'
                ],
                createdAt: '2026-02-01T00:00:00Z'
            }
        ],

        credentials: {
            'admin@myskinmyhealth.in': { password: 'admin123', role: 'ADMIN', refId: 'usr-admin-1' },
            'staff@myskinmyhealth.in': { password: 'staff123', role: 'STAFF', refId: 'usr-staff-1' },
            'dr.pallavi@myskinmyhealth.in': { password: 'doctor123', role: 'DOCTOR', refId: 'pallavi-rathi' },
            'dr.kapil@myskinmyhealth.in': { password: 'doctor123', role: 'DOCTOR', refId: 'kapil-rathi' },
            'cosmetology@myskinmyhealth.in': { password: 'doctor123', role: 'DOCTOR', refId: 'aesthetic-specialist' },
            'hair@myskinmyhealth.in': { password: 'doctor123', role: 'DOCTOR', refId: 'trichology-specialist' },
            'patient@example.com': { password: 'patient123', role: 'PATIENT', refId: 'pat-1001' }
        },

        whatsappTemplates: {
            confirmation: {
                enabled: true,
                title: 'Appointment Confirmed',
                template: 'Namaste {{patientName}},\n\nYour appointment at *{{clinicName}}* with *{{doctorName}}* has been *CONFIRMED*.\n\n📋 *Token No:* {{tokenNumber}}\n✨ *Service:* {{serviceTitle}}\n📅 *Date:* {{date}}\n⏰ *Time Slot:* {{timeSlot}}\n🏥 *Location:* {{clinicAddress}}\n\n📌 *Instructions:* Please arrive 10 minutes prior to your slot. For queries, call {{clinicPhone}}.'
            },
            rescheduled: {
                enabled: true,
                title: 'Appointment Rescheduled',
                template: 'Namaste {{patientName}},\n\nYour appointment at *{{clinicName}}* has been *RESCHEDULED*.\n\n📋 *Token No:* {{tokenNumber}}\n👩‍⚕️ *Doctor:* {{doctorName}}\n📅 *NEW Date:* {{date}}\n⏰ *NEW Time:* {{timeSlot}}\n🏥 *Location:* {{clinicAddress}}\n\nHelpdesk: {{clinicPhone}}.'
            },
            reminder: {
                enabled: true,
                title: '24-Hour Reminder',
                template: 'Namaste {{patientName}},\n\nGentle reminder for your appointment tomorrow with *{{doctorName}}* at *{{clinicName}}*.\n\n📋 *Token No:* {{tokenNumber}}\n📅 *Date:* {{date}}\n⏰ *Time Slot:* {{timeSlot}}\n🏥 *Venue:* {{clinicAddress}}\n\nCall {{clinicPhone}} for assistance.'
            },
            attended: {
                enabled: true,
                title: 'Thank You for Visiting',
                template: 'Namaste {{patientName}},\n\nThank you for visiting *{{clinicName}}*. We hope your session with *{{doctorName}}* was wonderful.\n\n💧 Follow post-procedure care and skincare recommendations consistently.\n🚨 For questions or emergencies, call {{emergencyPhone}}.\n\nWarm regards,\n*{{clinicName}}*'
            },
            notAttended: {
                enabled: true,
                title: 'Missed Appointment',
                template: 'Namaste {{patientName}},\n\nWe missed you today for your scheduled visit (*Token: {{tokenNumber}}*) with *{{doctorName}}* at *{{clinicName}}*.\n\nConsistent care is key for your skin & hair health.\n\nTo reschedule, please contact:\n📞 *Helpline:* {{clinicPhone}}\n🏥 *Venue:* {{clinicAddress}}\n\nWarm regards,\n*{{clinicName}}*'
            },
            rejection: {
                enabled: true,
                title: 'Appointment Declined / Cancelled',
                template: 'Namaste {{patientName}},\n\nYour appointment on {{date}} at {{timeSlot}} with *{{doctorName}}* (Token: {{tokenNumber}}) has been *CANCELLED*.\n\nTo book a new slot, call {{clinicPhone}} or visit our website.\n\nWarm regards,\n*{{clinicName}}*'
            }
        },

        auditLogs: [
            {
                id: 'log-1',
                timestamp: '2026-09-01T08:00:00Z',
                user: 'System',
                role: 'SYSTEM',
                action: 'INITIALIZED',
                entity: 'Database',
                details: 'My Skin My Health management core initialized.'
            }
        ],

        settings: {
            clinicName: 'My Skin My Health',
            tagline: 'Advanced Dermatology, Trichology & Aesthetic Health Care',
            taxPercentage: 0,
            allowOnlineCancellation: true,
            cancellationNoticeHours: 4,
            requirePhoneVerification: false,
            soundNotifications: true,
            themeMode: 'dark',
            autoConfirmAppointments: false
        }
    };

    /* ----------------------------------------------------------- Engine Core */
    function LumoraDB() {
        this.data = null;
        this.listeners = [];
        this.init();
    }

    LumoraDB.prototype.init = function () {
        try {
            var raw = global.localStorage.getItem(STORAGE_KEY);
            if (raw) {
                var parsed = JSON.parse(raw);
                this.data = Object.assign({}, INITIAL_DATA, parsed);
                this.data.clinic = Object.assign({}, INITIAL_DATA.clinic, parsed.clinic || {});
                this.data.whatsappTemplates = Object.assign({}, INITIAL_DATA.whatsappTemplates, parsed.whatsappTemplates || {});
                this.data.credentials = Object.assign({}, INITIAL_DATA.credentials, parsed.credentials || {});
                this.data.settings = Object.assign({}, INITIAL_DATA.settings, parsed.settings || {});
            } else {
                this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
                this.save();
            }
        } catch (e) {
            console.error('LumoraDB init error, fallback to memory', e);
            this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
        }

        var self = this;
        global.addEventListener('storage', function (e) {
            if (e.key === STORAGE_KEY && e.newValue) {
                try {
                    self.data = JSON.parse(e.newValue);
                    self.notifyListeners('sync', null);
                } catch (err) {}
            }
        });
    };

    LumoraDB.prototype.save = function () {
        try {
            global.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
            this.notifyListeners('save', this.data);
        } catch (e) {
            console.warn('Storage save failed:', e);
        }
    };

    LumoraDB.prototype.subscribe = function (cb) {
        if (typeof cb === 'function') {
            this.listeners.push(cb);
        }
    };

    LumoraDB.prototype.notifyListeners = function (action, payload) {
        for (var i = 0; i < this.listeners.length; i++) {
            try {
                this.listeners[i](action, payload);
            } catch (e) {
                console.error(e);
            }
        }
    };

    LumoraDB.prototype.logAudit = function (user, role, action, entity, details) {
        var log = {
            id: 'log-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
            timestamp: new Date().toISOString(),
            user: user || 'Anonymous',
            role: role || 'STAFF',
            action: action,
            entity: entity,
            details: details
        };
        this.data.auditLogs.unshift(log);
        if (this.data.auditLogs.length > 500) {
            this.data.auditLogs = this.data.auditLogs.slice(0, 500);
        }
        this.save();
    };

    /* ----------------------------------------------------------- Auth Engine */
    LumoraDB.prototype.login = function (email, password) {
        email = (email || '').trim().toLowerCase();
        var cred = this.data.credentials[email];
        if (!cred) {
            return { success: false, message: 'Invalid email or password.' };
        }
        if (cred.password !== password) {
            return { success: false, message: 'Invalid email or password.' };
        }

        var sessionUser = {
            email: email,
            role: cred.role,
            refId: cred.refId
        };

        if (cred.role === 'ADMIN' || cred.role === 'STAFF') {
            var staffMember = (this.data.staff || []).find(function (s) { return s.id === cred.refId; });
            sessionUser.name = staffMember ? staffMember.name : 'Administrator';
            sessionUser.permissions = staffMember ? staffMember.permissions : ['all'];
            sessionUser.avatar = staffMember ? staffMember.avatar : 'assets/img/lumora-logo.svg';
        } else if (cred.role === 'DOCTOR') {
            var doc = (this.data.doctors || []).find(function (d) { return d.id === cred.refId; });
            sessionUser.name = doc ? doc.name : 'Doctor';
            sessionUser.specialization = doc ? doc.specialization : '';
            sessionUser.avatar = doc ? doc.image : 'assets/img/gen_team-image-5.jpg';
            sessionUser.permissions = ['doctor_portal', 'appointments', 'calendar', 'patients'];
        } else if (cred.role === 'PATIENT') {
            var pat = (this.data.patients || []).find(function (p) { return p.id === cred.refId; });
            sessionUser.name = pat ? pat.name : 'Patient';
            sessionUser.phone = pat ? pat.phone : '';
            sessionUser.permissions = ['patient_portal'];
        }

        try {
            if (cred.role === 'PATIENT') {
                global.localStorage.setItem(PATIENT_SESSION_KEY, JSON.stringify(sessionUser));
            } else {
                global.localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
            }
        } catch (e) {}

        this.logAudit(sessionUser.name, cred.role, 'LOGIN', 'Auth', 'User logged in successfully.');
        return { success: true, user: sessionUser };
    };

    LumoraDB.prototype.registerPatient = function (name, phone, email, password, age) {
        email = (email || '').trim().toLowerCase();
        phone = (phone || '').trim();
        name = (name || '').trim();

        if (!name || !phone || !email || !password) {
            return { success: false, message: 'All required fields must be filled.' };
        }
        if (this.data.credentials[email]) {
            return { success: false, message: 'An account with this email already exists.' };
        }

        var patId = 'pat-' + Date.now().toString(36).toUpperCase();
        var newPatient = {
            id: patId,
            name: name,
            phone: phone,
            email: email,
            age: parseInt(age, 10) || 30,
            gender: 'Unspecified',
            bloodGroup: 'N/A',
            address: '',
            medicalHistory: 'New registered patient via portal.',
            lastVisit: null,
            upcomingAppointment: null,
            status: 'Active',
            totalVisits: 0,
            totalSpent: 0,
            createdAt: new Date().toISOString()
        };

        this.data.patients.unshift(newPatient);
        this.data.credentials[email] = {
            password: password,
            role: 'PATIENT',
            refId: patId
        };

        this.save();
        this.logAudit(name, 'PATIENT', 'REGISTER', 'Patient', 'New patient registered: ' + name);

        return this.login(email, password);
    };

    LumoraDB.prototype.getSession = function () {
        try {
            var raw = global.localStorage.getItem(SESSION_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    };

    LumoraDB.prototype.getPatientSession = function () {
        try {
            var raw = global.localStorage.getItem(PATIENT_SESSION_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    };

    LumoraDB.prototype.logout = function (isPatient) {
        try {
            if (isPatient) {
                global.localStorage.removeItem(PATIENT_SESSION_KEY);
            } else {
                global.localStorage.removeItem(SESSION_KEY);
            }
        } catch (e) {}
    };

    /* ----------------------------------------------------- Entity Operations */

    LumoraDB.prototype.getClinic = function () {
        return JSON.parse(JSON.stringify(this.data.clinic));
    };

    LumoraDB.prototype.updateClinic = function (patch, actor) {
        this.data.clinic = Object.assign({}, this.data.clinic, patch);
        this.save();
        this.logAudit(actor ? actor.name : 'Admin', actor ? actor.role : 'ADMIN', 'UPDATE', 'Clinic Information', 'Updated contact & clinic information.');
        return this.data.clinic;
    };

    LumoraDB.prototype.getDoctors = function (activeOnly) {
        var list = this.data.doctors || [];
        if (activeOnly) {
            return list.filter(function (d) { return d.active !== false; });
        }
        return JSON.parse(JSON.stringify(list));
    };

    LumoraDB.prototype.getDoctorById = function (id) {
        return (this.data.doctors || []).find(function (d) { return d.id === id; }) || null;
    };

    LumoraDB.prototype.saveDoctor = function (doctor, actor) {
        doctor.active = doctor.active !== false;
        doctor.featured = !!doctor.featured;
        if (!doctor.id) {
            doctor.id = (doctor.name || 'doctor').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || ('doc-' + Date.now());
            doctor.services = doctor.services || ['general-consultation', 'preventive-dentistry'];
            this.data.doctors.push(doctor);
            this.logAudit(actor ? actor.name : 'Admin', actor ? actor.role : 'ADMIN', 'CREATE', 'Doctor', 'Added doctor ' + doctor.name);
        } else {
            var idx = this.data.doctors.findIndex(function (d) { return d.id === doctor.id; });
            if (idx !== -1) {
                this.data.doctors[idx] = Object.assign({}, this.data.doctors[idx], doctor);
                this.logAudit(actor ? actor.name : 'Admin', actor ? actor.role : 'ADMIN', 'UPDATE', 'Doctor', 'Updated doctor ' + doctor.name);
            } else {
                this.data.doctors.push(doctor);
            }
        }

        if (doctor.email && doctor.loginEnabled) {
            var lowerEmail = doctor.email.toLowerCase();
            if (!this.data.credentials[lowerEmail]) {
                this.data.credentials[lowerEmail] = {
                    password: 'doctor123',
                    role: 'DOCTOR',
                    refId: doctor.id
                };
            }
        }

        this.save();
        return doctor;
    };

    LumoraDB.prototype.deleteDoctor = function (id, actor) {
        var doc = this.getDoctorById(id);
        this.data.doctors = this.data.doctors.filter(function (d) { return d.id !== id; });
        if (doc && doc.email) {
            delete this.data.credentials[doc.email.toLowerCase()];
        }
        this.save();
        this.logAudit(actor ? actor.name : 'Admin', actor ? actor.role : 'ADMIN', 'DELETE', 'Doctor', 'Deleted doctor ID ' + id);
    };

    LumoraDB.prototype.getServices = function (activeOnly) {
        var list = this.data.services || [];
        if (activeOnly) {
            return list.filter(function (s) { return s.active !== false; });
        }
        return JSON.parse(JSON.stringify(list));
    };

    LumoraDB.prototype.getServiceById = function (id) {
        return (this.data.services || []).find(function (s) { return s.id === id; }) || null;
    };

    LumoraDB.prototype.saveService = function (svc, actor) {
        if (!svc.id) {
            svc.id = svc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || ('svc-' + Date.now());
            svc.active = svc.active !== false;
            svc.duration = parseInt(svc.duration, 10) || 30;
            svc.price = parseInt(svc.price, 10) || 500;
            svc.modes = svc.modes || ['in-person'];
            this.data.services.push(svc);
            this.logAudit(actor ? actor.name : 'Admin', actor ? actor.role : 'ADMIN', 'CREATE', 'Service', 'Added service ' + svc.name);
        } else {
            var idx = this.data.services.findIndex(function (s) { return s.id === svc.id; });
            if (idx !== -1) {
                this.data.services[idx] = Object.assign({}, this.data.services[idx], svc);
                this.logAudit(actor ? actor.name : 'Admin', actor ? actor.role : 'ADMIN', 'UPDATE', 'Service', 'Updated service ' + svc.name);
            } else {
                this.data.services.push(svc);
            }
        }
        this.save();
        return svc;
    };

    LumoraDB.prototype.deleteService = function (id, actor) {
        this.data.services = this.data.services.filter(function (s) { return s.id !== id; });
        this.save();
        this.logAudit(actor ? actor.name : 'Admin', actor ? actor.role : 'ADMIN', 'DELETE', 'Service', 'Deleted service ID ' + id);
    };

    LumoraDB.prototype.getBlogs = function (publishedOnly) {
        var list = this.data.blogs || [];
        if (publishedOnly) {
            return list.filter(function (b) { return b.published !== false; });
        }
        return JSON.parse(JSON.stringify(list));
    };

    LumoraDB.prototype.getBlogById = function (id) {
        return (this.data.blogs || []).find(function (b) { return b.id === id; }) || null;
    };

    LumoraDB.prototype.saveBlog = function (blog, actor) {
        if (!blog.id) {
            blog.id = 'blog-' + Date.now().toString(36);
            blog.slug = blog.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            blog.date = blog.date || new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
            blog.published = blog.published !== false;
            this.data.blogs.unshift(blog);
            this.logAudit(actor ? actor.name : 'Admin', actor ? actor.role : 'ADMIN', 'CREATE', 'Blog', 'Published blog post ' + blog.title);
        } else {
            var idx = this.data.blogs.findIndex(function (b) { return b.id === blog.id; });
            if (idx !== -1) {
                this.data.blogs[idx] = Object.assign({}, this.data.blogs[idx], blog);
                this.logAudit(actor ? actor.name : 'Admin', actor ? actor.role : 'ADMIN', 'UPDATE', 'Blog', 'Updated blog post ' + blog.title);
            } else {
                this.data.blogs.unshift(blog);
            }
        }
        this.save();
        return blog;
    };

    LumoraDB.prototype.deleteBlog = function (id, actor) {
        this.data.blogs = this.data.blogs.filter(function (b) { return b.id !== id; });
        this.save();
        this.logAudit(actor ? actor.name : 'Admin', actor ? actor.role : 'ADMIN', 'DELETE', 'Blog', 'Deleted blog ID ' + id);
    };

    LumoraDB.prototype.getReviews = function (publishedOnly) {
        var list = this.data.reviews || [];
        if (publishedOnly) {
            return list.filter(function (r) { return r.published !== false; });
        }
        return JSON.parse(JSON.stringify(list));
    };

    LumoraDB.prototype.saveReview = function (rev, actor) {
        if (!rev.id) {
            rev.id = 'rev-' + Date.now().toString(36);
            rev.date = rev.date || new Date().toISOString().slice(0, 10);
            rev.rating = parseInt(rev.rating, 10) || 5;
            rev.published = rev.published !== false;
            rev.avatar = rev.avatar || 'assets/img/gen_testimonial-author-1.jpg';
            this.data.reviews.unshift(rev);
            this.logAudit(actor ? actor.name : 'Admin', actor ? actor.role : 'ADMIN', 'CREATE', 'Review', 'Added review from ' + rev.author);
        } else {
            var idx = this.data.reviews.findIndex(function (r) { return r.id === rev.id; });
            if (idx !== -1) {
                this.data.reviews[idx] = Object.assign({}, this.data.reviews[idx], rev);
                this.logAudit(actor ? actor.name : 'Admin', actor ? actor.role : 'ADMIN', 'UPDATE', 'Review', 'Updated review from ' + rev.author);
            } else {
                this.data.reviews.unshift(rev);
            }
        }
        this.save();
        return rev;
    };

    LumoraDB.prototype.deleteReview = function (id, actor) {
        this.data.reviews = this.data.reviews.filter(function (r) { return r.id !== id; });
        this.save();
        this.logAudit(actor ? actor.name : 'Admin', actor ? actor.role : 'ADMIN', 'DELETE', 'Review', 'Deleted review ID ' + id);
    };

    LumoraDB.prototype.getPatients = function () {
        return JSON.parse(JSON.stringify(this.data.patients || []));
    };

    LumoraDB.prototype.getPatientById = function (id) {
        return (this.data.patients || []).find(function (p) { return p.id === id; }) || null;
    };

    LumoraDB.prototype.savePatient = function (patient, actor) {
        if (!patient.id) {
            patient.id = 'pat-' + Date.now().toString(36).toUpperCase();
            patient.createdAt = new Date().toISOString();
            patient.status = patient.status || 'Active';
            patient.totalVisits = 0;
            patient.totalSpent = 0;
            this.data.patients.unshift(patient);
            this.logAudit(actor ? actor.name : 'Admin', actor ? actor.role : 'ADMIN', 'CREATE', 'Patient', 'Created patient record for ' + patient.name);
        } else {
            var idx = this.data.patients.findIndex(function (p) { return p.id === patient.id; });
            if (idx !== -1) {
                this.data.patients[idx] = Object.assign({}, this.data.patients[idx], patient);
                this.logAudit(actor ? actor.name : 'Admin', actor ? actor.role : 'ADMIN', 'UPDATE', 'Patient', 'Updated patient record for ' + patient.name);
            } else {
                this.data.patients.unshift(patient);
            }
        }
        this.save();
        return patient;
    };

    LumoraDB.prototype.getAppointments = function (filterDoctorId) {
        var list = this.data.appointments || [];
        if (filterDoctorId) {
            return list.filter(function (a) { return a.doctorId === filterDoctorId; });
        }
        return JSON.parse(JSON.stringify(list));
    };

    LumoraDB.prototype.getAppointmentByRef = function (ref) {
        return (this.data.appointments || []).find(function (a) { return a.reference === ref; }) || null;
    };

    LumoraDB.prototype.createAppointment = function (appt, actor) {
        var ref = appt.reference || ('DC-' + Date.now().toString(36).toUpperCase().slice(-6));
        var svc = this.getServiceById(appt.serviceId);
        var fee = svc ? svc.price : 500;

        var record = {
            reference: ref,
            patientId: appt.patientId || null,
            patientName: appt.patientName || (appt.patient && appt.patient.name) || 'Anonymous',
            patientPhone: appt.patientPhone || (appt.patient && (appt.patient.dialCode || '') + ' ' + (appt.patient.phone || '')) || '',
            patientEmail: appt.patientEmail || '',
            patientAge: appt.patientAge || (appt.patient && appt.patient.age) || 30,
            doctorId: appt.doctorId || (appt.doctor && appt.doctor.id),
            serviceId: appt.serviceId || (appt.service && appt.service.id),
            date: appt.date || (appt.startIso ? appt.startIso.slice(0, 10) : new Date().toISOString().slice(0, 10)),
            time: appt.time || (appt.startIso ? new Date(appt.startIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '11:00 AM'),
            startIso: appt.startIso || new Date().toISOString(),
            status: appt.status || 'Pending',
            fee: appt.fee || fee,
            paymentStatus: appt.paymentStatus || 'Pending',
            notes: appt.notes || (appt.patient && appt.patient.notes) || '',
            createdAt: new Date().toISOString(),
            history: [
                {
                    time: new Date().toISOString(),
                    action: 'Appointment Created',
                    user: actor ? actor.name : 'Patient'
                }
            ]
        };

        var patientMatch = (this.data.patients || []).find(function (p) {
            return p.id === record.patientId || (p.phone && record.patientPhone && p.phone.replace(/\D/g, '') === record.patientPhone.replace(/\D/g, ''));
        });

        if (patientMatch) {
            record.patientId = patientMatch.id;
            patientMatch.upcomingAppointment = record.date + ' ' + record.time;
        } else if (record.patientName && record.patientPhone) {
            var newPat = {
                id: 'pat-' + Date.now().toString(36).toUpperCase(),
                name: record.patientName,
                phone: record.patientPhone,
                email: record.patientEmail,
                age: record.patientAge,
                gender: 'Unspecified',
                bloodGroup: 'N/A',
                address: '',
                medicalHistory: record.notes || 'First appointment booked.',
                lastVisit: null,
                upcomingAppointment: record.date + ' ' + record.time,
                status: 'Active',
                totalVisits: 0,
                totalSpent: 0,
                createdAt: new Date().toISOString()
            };
            this.data.patients.unshift(newPat);
            record.patientId = newPat.id;
        }

        this.data.appointments.unshift(record);
        this.save();
        this.logAudit(actor ? actor.name : record.patientName, actor ? actor.role : 'PATIENT', 'CREATE', 'Appointment', 'Created appointment ' + ref);
        return record;
    };

    LumoraDB.prototype.updateAppointmentStatus = function (ref, newStatus, actor, extraNotes) {
        var appt = this.getAppointmentByRef(ref);
        if (!appt) return null;

        var oldStatus = appt.status;
        appt.status = newStatus;
        appt.history = appt.history || [];
        appt.history.unshift({
            time: new Date().toISOString(),
            action: 'Status changed from ' + oldStatus + ' to ' + newStatus + (extraNotes ? ' (' + extraNotes + ')' : ''),
            user: actor ? actor.name : 'Admin'
        });

        if (newStatus === 'Attended') {
            appt.paymentStatus = 'Paid';
            var pat = this.getPatientById(appt.patientId);
            if (pat) {
                pat.lastVisit = appt.date;
                pat.totalVisits = (pat.totalVisits || 0) + 1;
                pat.totalSpent = (pat.totalSpent || 0) + (appt.fee || 0);
            }
        }

        this.save();
        this.logAudit(actor ? actor.name : 'Admin', actor ? actor.role : 'ADMIN', 'STATUS_CHANGE', 'Appointment', 'Ref ' + ref + ' -> ' + newStatus);
        return appt;
    };

    LumoraDB.prototype.rescheduleAppointment = function (ref, newDate, newTime, newStartIso, actor, reason) {
        var appt = this.getAppointmentByRef(ref);
        if (!appt) return null;

        var prevInfo = appt.date + ' ' + appt.time;
        appt.date = newDate;
        appt.time = newTime;
        if (newStartIso) appt.startIso = newStartIso;
        appt.status = 'Rescheduled';
        appt.history = appt.history || [];
        appt.history.unshift({
            time: new Date().toISOString(),
            action: 'Rescheduled from ' + prevInfo + ' to ' + newDate + ' ' + newTime + (reason ? ' (' + reason + ')' : ''),
            user: actor ? actor.name : 'Admin'
        });

        var pat = this.getPatientById(appt.patientId);
        if (pat) {
            pat.upcomingAppointment = newDate + ' ' + newTime;
        }

        this.save();
        this.logAudit(actor ? actor.name : 'Admin', actor ? actor.role : 'ADMIN', 'RESCHEDULE', 'Appointment', 'Ref ' + ref + ' moved to ' + newDate + ' ' + newTime);
        return appt;
    };

    LumoraDB.prototype.deleteAppointment = function (ref, actor) {
        var idx = -1;
        for (var i = 0; i < (this.data.appointments || []).length; i++) {
            if (this.data.appointments[i].reference === ref) {
                idx = i;
                break;
            }
        }
        if (idx === -1) return false;
        var removed = this.data.appointments.splice(idx, 1)[0];
        this.save();
        this.logAudit(actor ? actor.name : 'Admin', actor ? actor.role : 'ADMIN', 'DELETE', 'Appointment', 'Deleted appointment ' + ref + ' (' + removed.patientName + ')');
        return true;
    };

    LumoraDB.prototype.getStaff = function () {
        return JSON.parse(JSON.stringify(this.data.staff || []));
    };

    LumoraDB.prototype.saveStaff = function (staffMember, password, actor) {
        if (!staffMember.id) {
            staffMember.id = 'usr-staff-' + Date.now().toString(36);
            staffMember.createdAt = new Date().toISOString();
            staffMember.active = staffMember.active !== false;
            staffMember.permissions = staffMember.permissions || ['dashboard', 'appointments', 'calendar', 'patients'];
            this.data.staff.push(staffMember);
            this.logAudit(actor ? actor.name : 'Admin', actor ? actor.role : 'ADMIN', 'CREATE', 'Staff', 'Added staff member ' + staffMember.name);
        } else {
            var idx = this.data.staff.findIndex(function (s) { return s.id === staffMember.id; });
            if (idx !== -1) {
                this.data.staff[idx] = Object.assign({}, this.data.staff[idx], staffMember);
                this.logAudit(actor ? actor.name : 'Admin', actor ? actor.role : 'ADMIN', 'UPDATE', 'Staff', 'Updated staff member ' + staffMember.name);
            } else {
                this.data.staff.push(staffMember);
            }
        }

        if (staffMember.email) {
            var lowerEmail = staffMember.email.toLowerCase();
            this.data.credentials[lowerEmail] = {
                password: password || (this.data.credentials[lowerEmail] ? this.data.credentials[lowerEmail].password : 'staff123'),
                role: staffMember.role || 'STAFF',
                refId: staffMember.id
            };
        }

        this.save();
        return staffMember;
    };

    LumoraDB.prototype.deleteStaff = function (id, actor) {
        var staffMember = (this.data.staff || []).find(function (s) { return s.id === id; });
        this.data.staff = this.data.staff.filter(function (s) { return s.id !== id; });
        if (staffMember && staffMember.email) {
            delete this.data.credentials[staffMember.email.toLowerCase()];
        }
        this.save();
        this.logAudit(actor ? actor.name : 'Admin', actor ? actor.role : 'ADMIN', 'DELETE', 'Staff', 'Removed staff ID ' + id);
    };

    LumoraDB.prototype.getWhatsAppTemplates = function () {
        return JSON.parse(JSON.stringify(this.data.whatsappTemplates || {}));
    };

    LumoraDB.prototype.updateWhatsAppTemplates = function (templates, actor) {
        this.data.whatsappTemplates = Object.assign({}, this.data.whatsappTemplates, templates);
        this.save();
        this.logAudit(actor ? actor.name : 'Admin', actor ? actor.role : 'ADMIN', 'UPDATE', 'WhatsApp', 'Updated WhatsApp templates.');
        return this.data.whatsappTemplates;
    };

    LumoraDB.prototype.formatWhatsAppPhone = function (phone) {
        if (!phone) return '';
        var clean = String(phone).replace(/\D/g, '');
        if (clean.length === 10) {
            clean = '91' + clean;
        } else if (clean.length === 11 && clean.startsWith('0')) {
            clean = '91' + clean.slice(1);
        }
        return clean;
    };

    LumoraDB.prototype.compileWhatsAppMessage = function (templateKey, appt) {
        var tplObj = (this.data.whatsappTemplates || {})[templateKey];
        var msg = (tplObj && tplObj.template) ? tplObj.template : '';
        if (!msg) {
            msg = 'Namaste {{patientName}},\n\nYour appointment at *{{clinicName}}* is confirmed (Token: {{tokenNumber}}).\n👨‍⚕️ Consultant: {{doctorName}}\n🦷 Service: {{serviceTitle}}\n📅 Date: {{date}}\n⏰ Time Slot: {{timeSlot}}\n🏥 Location: {{clinicAddress}}\n📞 Phone: {{clinicPhone}}';
        }

        var doc = this.getDoctorById(appt.doctorId);
        var svc = this.getServiceById(appt.serviceId);
        var clinic = this.getClinic();

        var patName = appt.patientName || 'Patient';
        var refNo = appt.reference || '';
        var docName = doc ? doc.name : (appt.doctorName || 'Specialist Dentist');
        var svcName = svc ? svc.name : (appt.serviceName || 'Dental Consultation');
        var apptDate = appt.date || '';
        var apptTime = appt.time || '';
        var clinicName = clinic.name || 'My Skin My Health';
        var clinicAddr = clinic.address || '3rd Floor, Grand Helios Building, 303, Off FC Rd, above Axis Bank, opp. Hotel Ambassador, Model Colony, Shivajinagar, Pune 411016';
        var clinicPh = clinic.phone || '+91 97654 07679';
        var emergPh = clinic.phone || '+91 97654 07679';
        var mapsLink = clinic.mapsUrl || 'https://maps.google.com/?cid=4187806642178671438';

        // Support both camelCase and snake_case tags
        msg = msg.replace(/{{patientName}}/g, patName).replace(/{{patient_name}}/g, patName);
        msg = msg.replace(/{{tokenNumber}}/g, refNo).replace(/{{token_number}}/g, refNo).replace(/{{reference_number}}/g, refNo).replace(/{{referenceNumber}}/g, refNo);
        msg = msg.replace(/{{doctorName}}/g, docName).replace(/{{doctor_name}}/g, docName);
        msg = msg.replace(/{{serviceTitle}}/g, svcName).replace(/{{service_name}}/g, svcName).replace(/{{serviceName}}/g, svcName);
        msg = msg.replace(/{{date}}/g, apptDate).replace(/{{appointment_date}}/g, apptDate);
        msg = msg.replace(/{{timeSlot}}/g, apptTime).replace(/{{appointment_time}}/g, apptTime).replace(/{{time}}/g, apptTime);
        msg = msg.replace(/{{clinicName}}/g, clinicName).replace(/{{clinic_name}}/g, clinicName);
        msg = msg.replace(/{{clinicAddress}}/g, clinicAddr).replace(/{{clinic_address}}/g, clinicAddr).replace(/{{location}}/g, clinicAddr);
        msg = msg.replace(/{{clinicPhone}}/g, clinicPh).replace(/{{clinic_phone}}/g, clinicPh);
        msg = msg.replace(/{{emergencyPhone}}/g, emergPh).replace(/{{emergency_phone}}/g, emergPh);
        msg = msg.replace(/{{clinicMaps}}/g, mapsLink).replace(/{{clinic_maps}}/g, mapsLink);

        return msg;
    };

    LumoraDB.prototype.getAnalytics = function (daysRange) {
        daysRange = daysRange || 30;
        var appts = this.data.appointments || [];
        var total = appts.length;
        var pending = appts.filter(function (a) { return a.status === 'Pending'; }).length;
        var confirmed = appts.filter(function (a) { return a.status === 'Confirmed'; }).length;
        var attended = appts.filter(function (a) { return a.status === 'Attended'; }).length;
        var notAttended = appts.filter(function (a) { return a.status === 'Not Attended'; }).length;
        var rejected = appts.filter(function (a) { return a.status === 'Rejected'; }).length;
        var rescheduled = appts.filter(function (a) { return a.status === 'Rescheduled'; }).length;

        var totalRevenue = appts.reduce(function (sum, a) {
            return sum + (a.paymentStatus === 'Paid' ? (a.fee || 0) : 0);
        }, 0);

        var pendingRevenue = appts.reduce(function (sum, a) {
            return sum + (a.paymentStatus === 'Pending' ? (a.fee || 0) : 0);
        }, 0);

        var attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0;
        var noShowRate = total > 0 ? Math.round((notAttended / total) * 100) : 0;
        var cancellationRate = total > 0 ? Math.round((rejected / total) * 100) : 0;

        var doctorPerf = (this.data.doctors || []).map(function (doc) {
            var docAppts = appts.filter(function (a) { return a.doctorId === doc.id; });
            var docAttended = docAppts.filter(function (a) { return a.status === 'Attended'; }).length;
            var docRev = docAppts.reduce(function (sum, a) { return sum + (a.paymentStatus === 'Paid' ? (a.fee || 0) : 0); }, 0);
            return {
                id: doc.id,
                name: doc.name,
                image: doc.image,
                total: docAppts.length,
                attended: docAttended,
                revenue: docRev
            };
        });

        var servicePerf = (this.data.services || []).map(function (svc) {
            var svcAppts = appts.filter(function (a) { return a.serviceId === svc.id; });
            var svcRev = svcAppts.reduce(function (sum, a) { return sum + (a.paymentStatus === 'Paid' ? (a.fee || 0) : 0); }, 0);
            return {
                id: svc.id,
                name: svc.name,
                total: svcAppts.length,
                revenue: svcRev
            };
        });

        return {
            totalAppointments: total,
            pending: pending,
            confirmed: confirmed,
            attended: attended,
            notAttended: notAttended,
            rejected: rejected,
            rescheduled: rescheduled,
            attendanceRate: attendanceRate,
            noShowRate: noShowRate,
            cancellationRate: cancellationRate,
            totalRevenue: totalRevenue,
            pendingRevenue: pendingRevenue,
            totalPatients: (this.data.patients || []).length,
            totalDoctors: (this.data.doctors || []).length,
            totalServices: (this.data.services || []).length,
            doctorPerformance: doctorPerf,
            servicePerformance: servicePerf
        };
    };

    LumoraDB.prototype.getAuditLogs = function () {
        return JSON.parse(JSON.stringify(this.data.auditLogs || []));
    };

    LumoraDB.prototype.getSettings = function () {
        return JSON.parse(JSON.stringify(this.data.settings || {}));
    };

    LumoraDB.prototype.updateSettings = function (patch, actor) {
        this.data.settings = Object.assign({}, this.data.settings, patch);
        this.save();
        this.logAudit(actor ? actor.name : 'Admin', actor ? actor.role : 'ADMIN', 'UPDATE', 'Settings', 'Updated system settings.');
        return this.data.settings;
    };

    LumoraDB.prototype.exportDataJSON = function () {
        return JSON.stringify(this.data, null, 2);
    };

    LumoraDB.prototype.importDataJSON = function (jsonString, actor) {
        try {
            var parsed = JSON.parse(jsonString);
            if (!parsed.clinic || !parsed.doctors || !parsed.services) {
                return { success: false, message: 'Invalid data format.' };
            }
            this.data = parsed;
            this.save();
            this.logAudit(actor ? actor.name : 'Admin', actor ? actor.role : 'ADMIN', 'IMPORT', 'Database', 'Imported backup dataset.');
            return { success: true };
        } catch (e) {
            return { success: false, message: e.message };
        }
    };

    // Instantiate Singleton
    var instance = new LumoraDB();
    global.LumoraDB = instance;

    /* -------------------------------------------------------------------------
       Compatibility Bridge for existing booking-data.js & booking.js
       ------------------------------------------------------------------------- */
    global.BookingData = {
        get clinic() { return instance.getClinic(); },
        get services() { return instance.getServices(true); },
        get doctors() { return instance.getDoctors(true); },
        api: {
            getClinic: function () { return instance.getClinic(); },
            getDoctors: function () { return Promise.resolve(instance.getDoctors(true)); },
            getDoctor: function (id) { return instance.getDoctorById(id); },
            getService: function (id) { return instance.getServiceById(id); },
            getServicesForDoctor: function (doctorId) {
                var doc = instance.getDoctorById(doctorId);
                if (!doc) return Promise.resolve([]);
                var allSvc = instance.getServices(true);
                return Promise.resolve(allSvc.filter(function (s) {
                    return (doc.services || []).indexOf(s.id) !== -1;
                }));
            },
            getAvailableDates: function (doctorId, year, month) {
                var doc = instance.getDoctorById(doctorId);
                var clinic = instance.getClinic();
                var out = [];
                if (!doc) return Promise.resolve(out);

                var today = new Date(); today.setHours(0, 0, 0, 0);
                var last = new Date(today.getTime());
                last.setDate(last.getDate() + (clinic.bookingWindowDays || 60));

                var d = new Date(year, month, 1);
                while (d.getMonth() === month) {
                    var iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                    var day = d.getDay();
                    var sched = (doc.schedule && doc.schedule[day]) || (clinic.hours && clinic.hours[day]);
                    var isOpen = sched && !sched.closed;
                    var isClosedDate = (clinic.closedDates || []).indexOf(iso) !== -1;
                    if (d >= today && d <= last && isOpen && !isClosedDate) {
                        out.push(iso);
                    }
                    d.setDate(d.getDate() + 1);
                }
                return Promise.resolve(out);
            },
            getAvailability: function (doctorId, serviceId, dateIso) {
                var doc = instance.getDoctorById(doctorId);
                var svc = instance.getServiceById(serviceId);
                var clinic = instance.getClinic();
                if (!doc || !svc) return Promise.resolve([]);

                var parts = dateIso.split('-');
                var date = new Date(+parts[0], +parts[1] - 1, +parts[2]);
                var day = date.getDay();
                var sched = (doc.schedule && doc.schedule[day]) || (clinic.hours && clinic.hours[day]);
                if (!sched || sched.closed || (clinic.closedDates || []).indexOf(dateIso) !== -1) {
                    return Promise.resolve([]);
                }

                function toMins(t) { var p = (t || '00:00').split(':'); return parseInt(p[0], 10) * 60 + parseInt(p[1], 10); }
                var openM = toMins(sched.open || '10:00');
                var closeM = toMins(sched.close || '20:00');
                var now = new Date();
                var earliest = now.getTime() + (clinic.minNoticeMinutes || 90) * 60000;
                var slots = [];

                for (var m = openM; m + (svc.duration || 30) <= closeM; m += (svc.duration || 30)) {
                    if (sched.brk) {
                        var bS = toMins(sched.brk.start), bE = toMins(sched.brk.end);
                        if (m < bE && (m + (svc.duration || 30)) > bS) continue;
                    }
                    var st = new Date(date.getTime());
                    st.setHours(Math.floor(m / 60), m % 60, 0, 0);
                    if (st.getTime() < earliest) continue;
                    var h = st.getHours(), min = st.getMinutes();
                    var suffix = h >= 12 ? 'PM' : 'AM';
                    var h12 = h % 12; if (h12 === 0) h12 = 12;
                    var label = h12 + ':' + String(min).padStart(2, '0') + ' ' + suffix;
                    slots.push({
                        start: st.toISOString(),
                        minutes: m,
                        label: label
                    });
                }
                return Promise.resolve(slots);
            },
            submitBooking: function (booking) {
                var patSession = instance.getPatientSession();
                var record = instance.createAppointment({
                    patientId: patSession ? patSession.refId : null,
                    patientName: booking.patient ? booking.patient.name : '',
                    patientPhone: booking.patient ? ((booking.patient.dialCode || '') + ' ' + (booking.patient.phone || '')).trim() : '',
                    patientAge: booking.patient ? booking.patient.age : 30,
                    notes: booking.patient ? booking.patient.notes : '',
                    doctorId: booking.doctor ? booking.doctor.id : '',
                    serviceId: booking.service ? booking.service.id : '',
                    startIso: booking.startIso,
                    date: booking.startIso ? booking.startIso.slice(0, 10) : '',
                    status: 'Pending'
                }, patSession ? { name: patSession.name, role: 'PATIENT' } : null);

                return Promise.resolve({ reference: record.reference, success: true });
            },
            formatTime: function (date) {
                var h = date.getHours(), m = date.getMinutes();
                var suffix = h >= 12 ? 'PM' : 'AM';
                var h12 = h % 12; if (h12 === 0) h12 = 12;
                return h12 + ':' + String(m).padStart(2, '0') + ' ' + suffix;
            },
            formatDateLong: function (date) {
                var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                return days[date.getDay()] + ', ' + months[date.getMonth()] + ' ' + date.getDate();
            },
            isoDate: function (d) {
                return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            }
        }
    };

})(typeof window !== 'undefined' ? window : this);
