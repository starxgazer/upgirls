/* =========================================================
   UPgirls Fan Site
   Shared helpers, then page logic. Data lives in the *.json files.
   ========================================================= */

/* ---------- Helpers ---------- */

const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ESC_MAP[c]);

// Only allow http(s) links coming from data files.
function safeUrl(u) {
    try {
        const url = new URL(u, window.location.href);
        return ['http:', 'https:'].includes(url.protocol) ? url.href : '#';
    } catch (e) {
        return '#';
    }
}

// Local placeholder (no external service), used when a member photo is missing or broken.
function placeholderImg(name) {
    const letter = esc(String(name || '?').charAt(0).toUpperCase());
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='400'><rect width='100%' height='100%' fill='#ffd6e0'/><text x='50%' y='50%' font-family='sans-serif' font-size='120' fill='#ff69b4' text-anchor='middle' dominant-baseline='central'>${letter}</text></svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// Swap in the placeholder if an image fails to load.
document.addEventListener('error', e => {
    const img = e.target;
    if (img && img.tagName === 'IMG' && img.dataset.fallback && !img.dataset.fellBack) {
        img.dataset.fellBack = '1';
        img.src = img.dataset.fallback;
    }
}, true);

function fetchJSON(url) {
    return fetch(url).then(r => {
        if (!r.ok) throw new Error(`${url}: ${r.status}`);
        return r.json();
    });
}

function setMeta(name, content, attr = 'name') {
    if (!content) return;
    let el = document.head.querySelector(`meta[${attr}="${name}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}

function setPageMeta(title, description) {
    if (title) {
        document.title = title;
        setMeta('og:title', title, 'property');
    }
    if (description) {
        setMeta('description', description);
        setMeta('og:description', description, 'property');
    }
    setMeta('og:url', window.location.href, 'property');
    // Every member/song page shares one HTML file, so point the canonical URL at this specific page.
    let canon = document.head.querySelector('link[rel="canonical"]');
    if (!canon) {
        canon = document.createElement('link');
        canon.rel = 'canonical';
        document.head.appendChild(canon);
    }
    canon.href = window.location.href;
}

const SVG_PATHS = {
    spotify: 'M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.306c-.221.362-.693.475-1.054.254-2.894-1.768-6.536-2.167-10.824-1.185-.413.095-.826-.164-.922-.577-.095-.413.164-.826.577-.922 4.697-1.073 8.71-.611 11.968 1.381.363.221.476.693.255 1.049zm1.467-3.267c-.278.452-.871.597-1.323.32-3.31-2.036-8.358-2.623-12.273-1.434-.51.155-1.044-.136-1.199-.646-.155-.51.136-1.044.646-1.199 4.47-1.356 10.033-.705 13.829 1.623.453.277.597.871.32 1.336zm.126-3.414C15.228 8.243 8.85 8.03 5.158 9.151c-.596.181-1.23-.153-1.411-.749-.181-.596.153-1.23.749-1.411 4.238-1.286 11.284-1.046 15.748 1.605.536.319.712 1.011.393 1.547-.319.535-1.011.712-1.547.393z',
    youtubeMusic: 'M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 17.022c-2.774 0-5.022-2.248-5.022-5.022S9.226 6.978 12 6.978s5.022 2.248 5.022 5.022-2.248 5.022-5.022 5.022z',
    youtubeVideo: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'
};

const SERVICES = [
    { key: 'spotify', field: 'spotify', label: 'Spotify', cls: 'spotify', path: SVG_PATHS.spotify },
    { key: 'youtubeMusic', field: 'youtube_music', label: 'YouTube Music', cls: 'youtube-music', path: SVG_PATHS.youtubeMusic },
    { key: 'youtubeVideo', field: 'youtube_video', label: 'YouTube Video', cls: 'youtube-video', path: SVG_PATHS.youtubeVideo }
];

function songLinksHTML(song, variant) {
    return SERVICES.filter(s => song[s.field]).map(s => {
        const svg = (variant === 'button')
            ? `<svg viewBox="0 0 24 24" fill="currentColor" class="btn-icon"><path d="${s.path}"/></svg>`
            : `<svg viewBox="0 0 24 24" fill="currentColor"><path d="${s.path}"/></svg>`;
        const href = esc(safeUrl(song[s.field]));
        if (variant === 'button') {
            return `<a href="${href}" target="_blank" rel="noopener" class="streaming-btn ${s.cls}">${svg}${s.label}</a>`;
        }
        return `<a href="${href}" target="_blank" rel="noopener" title="${s.label}" class="song-icon ${s.cls}">${svg}</a>`;
    }).join('');
}

function songRowElement(song, index, showYear) {
    const row = document.createElement('div');
    row.className = 'song-row clickable';
    row.onclick = e => {
        if (e.target.closest('.song-links-inline')) return;
        window.location.href = `song.html?id=${encodeURIComponent(song.id)}`;
    };
    row.innerHTML = `
        <div class="song-index">${index + 1}</div>
        <div class="song-info">
            <div class="song-title">${esc(song.title)}</div>
            <div class="song-artist">${esc(song.artist)} ${showYear && song.release_year ? `<span class="song-year-inline">(${esc(song.release_year)})</span>` : ''}</div>
        </div>
        <div class="song-links-inline">${songLinksHTML(song, 'inline')}</div>
    `;
    return row;
}

/* ---------- Event date helpers ---------- */

const isTBA = show => !/^\d{4}-\d{2}-\d{2}$/.test(show.date || '');

// Reads "14:00 WIB", "19.00-20.00 WIB", "07:00 WIB - selesai". Returns { start, end } as "HH:MM" or null.
function parseTimes(time) {
    if (!time || /until|sampai|deadline/i.test(time)) return null;
    const found = [...String(time).matchAll(/(\d{1,2})[.:](\d{2})/g)]
        .map(m => `${m[1].padStart(2, '0')}:${m[2]}`);
    if (!found.length) return null;
    return { start: found[0], end: found.length > 1 ? found[found.length - 1] : null };
}

// An event is over once its end time (or the end of its day) has passed. TBA events are never over.
function isPastShow(show, now = new Date()) {
    if (isTBA(show)) return false;
    const t = parseTimes(show.time);
    const endStr = (t && t.end) ? t.end + ':00' : '23:59:59';
    return new Date(`${show.date}T${endStr}`) < now;
}

// Start of an event in WIB (UTC+7), the time zone used on all posters.
function showStart(show) {
    const t = parseTimes(show.time);
    return new Date(`${show.date}T${t ? t.start : '00:00'}:00+07:00`);
}

function showDateParts(show) {
    const d = new Date(show.date + 'T12:00:00');
    return {
        day: d.getDate(),
        month: d.toLocaleString('en-US', { month: 'short' }),
        year: d.getFullYear()
    };
}

const byDateAsc = (a, b) => {
    if (isTBA(a) !== isTBA(b)) return isTBA(a) ? 1 : -1;
    return String(a.date).localeCompare(String(b.date));
};
const byDateDesc = (a, b) => {
    if (isTBA(a) !== isTBA(b)) return isTBA(a) ? 1 : -1;
    return String(b.date).localeCompare(String(a.date));
};

/* ---------- Add to calendar (.ics) ---------- */

function icsEscape(s) {
    return String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

function icsStamp(d) {
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function buildICS(show) {
    const t = parseTimes(show.time);
    const lines = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//UPgirls Fan Site//EN', 'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        `UID:upgirls-${show.id}@starxgazer.github.io`,
        `DTSTAMP:${icsStamp(new Date())}`
    ];
    if (t) {
        const start = showStart(show);
        let end = t.end ? new Date(`${show.date}T${t.end}:00+07:00`) : new Date(start.getTime() + 2 * 3600 * 1000);
        if (end <= start) end = new Date(start.getTime() + 2 * 3600 * 1000);
        lines.push(`DTSTART:${icsStamp(start)}`, `DTEND:${icsStamp(end)}`);
    } else {
        const next = new Date(show.date + 'T00:00:00Z');
        next.setUTCDate(next.getUTCDate() + 1);
        lines.push(`DTSTART;VALUE=DATE:${show.date.replace(/-/g, '')}`,
                   `DTEND;VALUE=DATE:${next.toISOString().slice(0, 10).replace(/-/g, '')}`);
    }
    lines.push(`SUMMARY:${icsEscape(show.name)}`);
    if (show.location && show.location !== 'TBA') lines.push(`LOCATION:${icsEscape(show.location)}`);
    const desc = [show.type, show.description, show.ticket_link].filter(Boolean).join('\n');
    if (desc) lines.push(`DESCRIPTION:${icsEscape(desc)}`);
    lines.push('END:VEVENT', 'END:VCALENDAR');
    return lines.join('\r\n');
}

function downloadICS(show) {
    const blob = new Blob([buildICS(show)], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${show.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'event'}-${show.date}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------- Event cards ---------- */

const CLOCK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="meta-icon"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';
const PIN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="meta-icon"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>';

function createShowCard(show, now = new Date()) {
    const tba = isTBA(show);
    const past = isPastShow(show, now);
    const audition = show.event_type === 'audition';
    const parts = tba ? { day: 'TBA', month: '', year: '' } : showDateParts(show);

    const card = document.createElement('div');
    card.className = `show-card ${past ? 'past-event' : ''} ${audition ? 'audition-card' : ''}`;
    card.dataset.eventType = show.event_type || 'performance';
    card.dataset.id = show.id;
    card.dataset.date = show.date;

    const hasTicket = show.ticket_link && show.ticket_link !== '#';
    let action;
    if (past) {
        action = '<span class="ticket-link disabled">Event Finished</span>';
    } else if (hasTicket) {
        action = `<a href="${esc(safeUrl(show.ticket_link))}" class="ticket-link ${audition ? 'audition-link' : ''}" target="_blank" rel="noopener">${audition ? 'Apply Now' : 'Buy Tickets'}</a>`;
    } else {
        action = `<span class="ticket-link disabled">${audition ? 'Apply Link Unavailable' : 'Ticket Link Unavailable'}</span>`;
    }
    const calendarBtn = (!past && !tba) ? `<button type="button" class="calendar-btn" data-id="${esc(show.id)}">+ Add to Calendar</button>` : '';

    card.innerHTML = `
        <div class="show-date-badge">
            <span class="day">${esc(parts.day)}</span>
            ${parts.month ? `<span class="month">${esc(parts.month)}</span>` : ''}
            ${parts.year ? `<span class="year">${esc(parts.year)}</span>` : ''}
            ${past ? '<span class="status-badge">Finished</span>' : ''}
            ${!past && audition ? '<span class="event-type-badge audition-badge">🎤 AUDITION</span>' : ''}
        </div>
        <div class="show-info">
            <h4 class="show-name">${esc(show.name)}</h4>
            <p class="show-type">${esc(show.type)}</p>
            ${show.description ? `<p class="show-description">${esc(show.description)}</p>` : ''}
            <div class="show-meta">
                ${show.time ? `<span class="show-time">${CLOCK_SVG}${esc(show.time)}</span>` : ''}
                ${show.location ? `<span class="show-location">${PIN_SVG}${esc(show.location)}</span>` : ''}
            </div>
            <div class="show-actions">${action}${calendarBtn}</div>
        </div>
    `;
    return card;
}

function renderShowCards(container, shows) {
    container.innerHTML = '';
    const now = new Date();
    const frag = document.createDocumentFragment();
    shows.forEach(show => frag.appendChild(createShowCard(show, now)));
    container.appendChild(frag);
}

// One click handler for every "Add to Calendar" button on the page.
function bindCalendarButtons(getShows) {
    document.addEventListener('click', e => {
        const btn = e.target.closest('.calendar-btn');
        if (!btn) return;
        const show = getShows().find(s => String(s.id) === btn.dataset.id);
        if (show) downloadICS(show);
    });
}

/* ---------- Countdown to next event ---------- */

function startCountdown(show, el) {
    const render = () => {
        const diff = showStart(show) - new Date();
        let when;
        if (diff <= 0) {
            when = 'Happening today!';
        } else {
            const mins = Math.floor(diff / 60000);
            const d = Math.floor(mins / 1440);
            const h = Math.floor((mins % 1440) / 60);
            const m = mins % 60;
            when = d > 0 ? `Starts in ${d}d ${h}h ${m}m` : `Starts in ${h}h ${m}m`;
        }
        el.innerHTML = `<span class="next-label">Next event</span> <strong>${esc(show.name)}</strong> <span class="next-when">${esc(when)}</span>`;
    };
    el.style.display = 'block';
    render();
    setInterval(render, 60000);
}

/* ---------- Theme (dark mode) ---------- */

function initThemeToggle() {
    const header = document.querySelector('header');
    if (!header) return;
    const root = document.documentElement;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-toggle';
    const sync = () => {
        const dark = root.dataset.theme === 'dark';
        btn.textContent = dark ? '☀️' : '🌙';
        btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
        btn.title = btn.getAttribute('aria-label');
    };
    btn.addEventListener('click', () => {
        root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem('theme', root.dataset.theme); } catch (e) { /* storage unavailable */ }
        sync();
    });
    sync();
    // Sits in the logo row so it stays vertically centered with the logo as it shrinks on scroll.
    (header.querySelector('.logo-container') || header).appendChild(btn);
}

/* ---------- Tweets ---------- */

function linkify(text) {
    return esc(text).replace(/\b((?:https?:\/\/|forms\.gle\/|bit\.ly\/)[^\s<]*[^\s<.,…!?])(?!…)/g, (m, u) => {
        const href = /^https?:/.test(u) ? u : 'https://' + u;
        return `<a href="${esc(safeUrl(href.replace(/&amp;/g, '&')))}" target="_blank" rel="noopener">${u}</a>`;
    });
}

function renderTweets(container, tweets) {
    container.innerHTML = '';
    tweets.forEach(tweet => {
        const card = document.createElement('div');
        card.className = 'tweet-card';
        card.innerHTML = `
            <div class="tweet-header"><span class="tweet-date">${esc(tweet.date || 'Recent')}</span></div>
            <div class="tweet-body"><p>${linkify(tweet.text || '')}</p></div>
            <div class="tweet-footer"><a href="${esc(safeUrl(tweet.url || 'https://x.com/theupgirls'))}" target="_blank" rel="noopener" class="tweet-link">View on X →</a></div>
        `;
        container.appendChild(card);
    });
}

/* =========================================================
   Page logic
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
    const $ = id => document.getElementById(id);
    const isSubpage = document.body.classList.contains('subpage');

    const activeGrid = $('active-members-grid');
    const traineeGrid = $('trainee-members-grid');
    const formerGrid = $('former-members-grid');
    const searchInput = $('member-search');
    const statusFilter = $('status-filter');
    const batchFilter = $('batch-filter');
    const sortOrder = $('sort-order');
    const activeSection = $('active-members-section');
    const formerSection = $('former-members-section');
    const noResults = $('no-results');
    const discographyList = $('discography-list');
    const songSearchInput = $('song-search');
    const artistFilter = $('artist-filter');
    const songSortOrder = $('song-sort-order');
    const noSongsResults = $('no-songs-results');
    const showsList = $('shows-list');
    const toggleFormerMembersBtn = $('toggle-former-members');
    const currentYearSpan = $('current-year');
    const tweetsContainer = $('tweets-container');

    let allMembers = [];
    let allSongs = [];
    let allShows = [];

    if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();
    initThemeToggle();

    /* ----- Header scroll + nav highlight ----- */

    const header = document.querySelector('header');
    const navLinks = document.querySelectorAll('header nav ul li a');
    const sections = document.querySelectorAll('main section');

    function highlightNav() {
        let currentSectionId = '';
        const scrollPos = window.scrollY + 200; // trigger line below the fixed header (full-size header is ~170px)
        const currentPath = window.location.pathname;

        sections.forEach(section => {
            if (scrollPos >= section.offsetTop && scrollPos < section.offsetTop + section.offsetHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        // The last section (Social) is shorter than the screen, so its top can never reach the
        // trigger line. When the page is scrolled to the very bottom, treat the last section as current.
        const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
        if (!isSubpage && atBottom && sections.length) {
            currentSectionId = sections[sections.length - 1].getAttribute('id');
        }

        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if ((!isSubpage && href === `#${currentSectionId}`) || (isSubpage && currentPath.includes(href))) {
                link.classList.add('active');
                const navUl = document.querySelector('header nav ul');
                if (navUl && window.innerWidth <= 768) {
                    const li = link.parentElement;
                    navUl.scrollTo({ left: li.offsetLeft - navUl.offsetWidth / 2 + li.offsetWidth / 2, behavior: 'smooth' });
                }
            }
        });
    }

    // The header is fixed and its size follows the scroll position (see the header rules in styles.css).
    // --hp goes 0 -> 1 over `range` pixels of scrolling, where `range` is exactly how many pixels the header
    // loses. So the header's bottom edge stays glued to the top of the content while it shrinks, and the
    // size always matches the scroll speed, forwards and backwards. Full-size space is reserved on <body>
    // (--header-full), so changing the header never moves the content.
    const headerState = { range: 1, progress: -1 };

    function updateHeader() {
        const p = Math.min(1, Math.max(0, window.scrollY / headerState.range));
        if (p !== headerState.progress) {
            headerState.progress = p;
            header.style.setProperty('--hp', p);
        }
    }

    function measureHeader() {
        const root = document.documentElement;
        header.style.setProperty('--hp', 0);
        const full = header.offsetHeight;
        header.style.setProperty('--hp', 1);
        const min = header.offsetHeight;
        root.style.setProperty('--header-full', full + 'px');
        root.style.setProperty('--header-min', min + 'px');
        headerState.range = Math.max(1, full - min);
        headerState.progress = -1;
        updateHeader();
    }

    if (header) {
        measureHeader();
        window.addEventListener('resize', measureHeader);
        window.addEventListener('load', measureHeader);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureHeader);
        window.addEventListener('scroll', () => {
            updateHeader();
            highlightNav();
        }, { passive: true });
        highlightNav();
    }

    /* ----- Members ----- */

    function createMemberCard(member) {
        const card = document.createElement('div');
        card.className = 'card clickable';
        card.tabIndex = 0;
        card.setAttribute('role', 'link');
        const go = () => { window.location.href = `member.html?name=${encodeURIComponent(member.name)}`; };
        card.onclick = go;
        card.onkeydown = e => { if (e.key === 'Enter') go(); };

        const fallback = placeholderImg(member.name);
        card.innerHTML = `
            <div class="member-img-wrapper">
                <img src="${esc(member.image || fallback)}" data-fallback="${esc(fallback)}" alt="${esc(member.name)}" loading="lazy" decoding="async" class="member-thumb ${member.is_active ? '' : 'former-img'}">
            </div>
            <div class="member-card-info"><h4>${esc(member.name)}</h4></div>
        `;
        return card;
    }

    const isRegular = m => m.is_active && !String(m.position || '').includes('Trainee');
    const isTrainee = m => m.is_active && String(m.position || '').includes('Trainee');

    function renderMembers() {
        const archive = !!document.querySelector('#members-archive');
        const searchTerm = (searchInput && searchInput.value) ? searchInput.value.toLowerCase() : '';
        const statusValue = statusFilter ? statusFilter.value : (archive ? 'all' : 'active');
        const batchValue = batchFilter ? batchFilter.value : 'all';
        const sortValue = sortOrder ? sortOrder.value : 'asc';

        const filtered = allMembers.filter(member => {
            const matchesSearch = member.name.toLowerCase().includes(searchTerm);
            let matchesStatus = true;
            if (statusValue === 'active') matchesStatus = isRegular(member);
            else if (statusValue === 'trainee') matchesStatus = isTrainee(member);
            else if (statusValue === 'former') matchesStatus = !member.is_active;
            const matchesBatch = batchValue === 'all' || member.batch === batchValue;
            return matchesSearch && matchesStatus && matchesBatch;
        });

        filtered.sort((a, b) => {
            const r = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
            return sortValue === 'asc' ? r : -r;
        });

        [activeGrid, traineeGrid, formerGrid].forEach(g => { if (g) g.innerHTML = ''; });

        const activeMembers = filtered.filter(isRegular);
        const traineeMembers = filtered.filter(isTrainee);
        const formerMembers = filtered.filter(m => !m.is_active);

        if (activeSection) activeSection.style.display = activeMembers.length > 0 ? 'block' : 'none';
        const traineeSection = $('trainee-members-section');
        if (traineeSection) traineeSection.style.display = traineeMembers.length > 0 ? 'block' : 'none';

        const isFormerFiltered = statusValue === 'all' || statusValue === 'former';
        const isToggleOn = toggleFormerMembersBtn && toggleFormerMembersBtn.textContent.includes('Hide');
        if (formerSection) {
            const show = isFormerFiltered && (statusValue === 'former' || isToggleOn || archive);
            formerSection.style.display = show && formerMembers.length > 0 ? 'block' : 'none';
        }

        const toggleContainer = document.querySelector('.member-toggle-container');
        if (toggleContainer) {
            toggleContainer.style.display = (formerMembers.length > 0 && statusValue === 'active' && !archive) ? 'block' : 'none';
        }

        if (noResults) noResults.style.display = filtered.length === 0 ? 'block' : 'none';

        if (activeGrid) activeMembers.forEach(m => activeGrid.appendChild(createMemberCard(m)));
        if (formerGrid) formerMembers.forEach(m => formerGrid.appendChild(createMemberCard(m)));
        if (traineeGrid) traineeMembers.forEach(m => traineeGrid.appendChild(createMemberCard(m)));
    }

    if (activeGrid) {
        fetchJSON('members.json')
            .then(data => {
                allMembers = data;
                const isArchive = isSubpage && document.querySelector('#members-archive');

                if (isArchive) {
                    renderMembers();
                    [searchInput, statusFilter, batchFilter, sortOrder].forEach(el => {
                        if (el) el.addEventListener(el === searchInput ? 'input' : 'change', renderMembers);
                    });
                } else {
                    allMembers.sort((a, b) => a.name.localeCompare(b.name));
                    activeGrid.innerHTML = '';
                    allMembers.filter(isRegular).forEach(m => activeGrid.appendChild(createMemberCard(m)));

                    if (traineeGrid) {
                        traineeGrid.innerHTML = '';
                        const trainees = allMembers.filter(isTrainee);
                        trainees.forEach(m => traineeGrid.appendChild(createMemberCard(m)));
                        const traineeSection = $('trainee-members-section');
                        if (traineeSection) traineeSection.style.display = trainees.length > 0 ? 'block' : 'none';
                    }
                }
            })
            .catch(error => console.error('Error loading members:', error));
    }

    if (toggleFormerMembersBtn && formerSection) {
        toggleFormerMembersBtn.addEventListener('click', () => {
            const isHidden = formerSection.style.display === 'none';
            formerSection.style.display = isHidden ? 'block' : 'none';
            toggleFormerMembersBtn.textContent = isHidden ? 'Hide Former Members' : 'View Former Members';
            if (isHidden) formerSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    /* ----- Discography ----- */

    function filterSongs() {
        const term = songSearchInput.value.toLowerCase();
        const artistValue = artistFilter.value;
        const dir = songSortOrder.value === 'asc' ? 1 : -1;

        return allSongs
            .filter(song => {
                const isGroup = song.artist.toLowerCase() === 'upgirls';
                const matchesSearch = song.title.toLowerCase().includes(term) || song.artist.toLowerCase().includes(term);
                const matchesArtist = artistValue === 'all' || (artistValue === 'upgirls' ? isGroup : !isGroup);
                return matchesSearch && matchesArtist;
            })
            .sort((a, b) => dir * a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
    }

    function renderDiscography(songs) {
        discographyList.innerHTML = '';
        if (noSongsResults) noSongsResults.style.display = songs.length === 0 ? 'block' : 'none';
        songs.forEach((song, i) => discographyList.appendChild(songRowElement(song, i, true)));
    }

    if (discographyList && songSearchInput) {
        fetchJSON('discography.json')
            .then(data => {
                allSongs = data.sort((a, b) => a.title.localeCompare(b.title));
                renderDiscography(allSongs);
                const update = () => renderDiscography(filterSongs());
                songSearchInput.addEventListener('input', update);
                artistFilter.addEventListener('change', update);
                songSortOrder.addEventListener('change', update);
            })
            .catch(error => console.error('Error loading discography:', error));
    }

    /* ----- Latest updates (tweets) ----- */

    if (tweetsContainer) {
        fetchJSON('x_tweets_updated.json')
            .then(data => {
                const latest = data
                    .filter(t => t.text && !isNaN(new Date(t.date)))
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 6);
                renderTweets(tweetsContainer, latest);
            })
            .catch(error => console.error('Error loading tweets:', error));
    }

    /* ----- Events ----- */

    // Date (or date range) picked on the calendar. Listeners repaint the calendar and re-render the list.
    const selection = {
        from: null,
        to: null,
        listeners: [],
        set(from, to) {
            this.from = from;
            this.to = to || from;
            if (this.from && this.from > this.to) [this.from, this.to] = [this.to, this.from];
            this.listeners.forEach(fn => fn());
        },
        clear() { this.set(null, null); }
    };

    const formatDay = s => new Date(s + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    function renderHomeEvents() {
        const note = $('shows-note');
        const nextEl = $('next-event');
        const now = new Date();
        const upcoming = allShows.filter(s => !isPastShow(s, now)).sort(byDateAsc);

        let list;
        if (upcoming.length) {
            list = upcoming.slice(0, 6);
            if (note) note.textContent = upcoming.length > 6 ? `Next 6 of ${upcoming.length} upcoming events.` : '';
            const next = upcoming.find(s => !isTBA(s));
            if (next && nextEl) startCountdown(next, nextEl);
        } else {
            list = allShows.filter(s => !isTBA(s)).sort(byDateDesc).slice(0, 3);
            if (note) note.textContent = 'No upcoming events scheduled right now. Here are the most recent ones.';
        }
        renderShowCards(showsList, list);
    }

    function initAllEvents() {
        const PAGE_SIZE = 24;
        const q = $('event-search');
        const yearSel = $('event-year-filter');
        const monthSel = $('event-month-filter');
        const typeSel = $('event-type-filter');
        const statusSel = $('event-status-filter');
        const moreBtn = $('events-load-more');
        const countEl = $('events-count');
        let visible = PAGE_SIZE;

        const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        if (yearSel) {
            const years = [...new Set(allShows.filter(s => !isTBA(s)).map(s => s.date.slice(0, 4)))].sort().reverse();
            yearSel.innerHTML = '<option value="all">All Years</option>' + years.map(y => `<option value="${y}">${y}</option>`).join('');
        }
        if (monthSel) {
            monthSel.innerHTML = '<option value="all">All Months</option>' +
                MONTHS.map((m, i) => `<option value="${String(i + 1).padStart(2, '0')}">${m}</option>`).join('');
        }

        function filtered() {
            const term = q ? q.value.trim().toLowerCase() : '';
            const now = new Date();
            return allShows.filter(s => {
                if (selection.from && (isTBA(s) || s.date < selection.from || s.date > selection.to)) return false;
                if (term &&!`${s.name} ${s.type} ${s.location || ''} ${s.description || ''}`.toLowerCase().includes(term)) return false;
                if (yearSel && yearSel.value !== 'all' && s.date.slice(0, 4) !== yearSel.value) return false;
                if (monthSel && monthSel.value !== 'all' && s.date.slice(5, 7) !== monthSel.value) return false;
                if (typeSel && typeSel.value !== 'all' && (s.event_type || 'performance') !== typeSel.value) return false;
                if (statusSel && statusSel.value !== 'all') {
                    const past = isPastShow(s, now);
                    if (statusSel.value === 'upcoming' && past) return false;
                    if (statusSel.value === 'finished' && !past) return false;
                }
                return true;
            }).sort(byDateDesc);
        }

        const chip = $('date-filter');
        const chipText = $('date-filter-text');
        const chipClear = $('date-filter-clear');

        function render() {
            const list = filtered();
            const picked = !!selection.from;
            if (chip) {
                chip.style.display = picked ? 'flex' : 'none';
                if (picked) {
                    const single = selection.from === selection.to;
                    chipText.textContent = single
                        ? `Events on ${formatDay(selection.from)}`
                        : `Events from ${formatDay(selection.from)} to ${formatDay(selection.to)}`;
                    const hint = $('date-filter-hint');
                    if (hint) hint.textContent = single ? 'Pick another date for a range' : '';
                }
            }
            renderShowCards(showsList, list.slice(0, visible));
            if (countEl) countEl.textContent = list.length ? `Showing ${Math.min(visible, list.length)} of ${list.length} events` : '';
            if (moreBtn) moreBtn.style.display = list.length > visible ? 'inline-block' : 'none';
            if (!list.length) {
                showsList.innerHTML = `<p class="no-results">${picked ? 'No events on the selected date(s).' : 'No events match your filters.'}</p>`;
            }
        }

        // Search, year and month conflict with a calendar pick, so changing them clears it.
        [q, yearSel, monthSel].forEach(el => {
            if (el) el.addEventListener(el === q ? 'input' : 'change', () => {
                visible = PAGE_SIZE;
                if (selection.from) selection.clear(); else render();
            });
        });
        [typeSel, statusSel].forEach(el => {
            if (el) el.addEventListener('change', () => { visible = PAGE_SIZE; render(); });
        });
        if (moreBtn) moreBtn.addEventListener('click', () => { visible += PAGE_SIZE; render(); });
        if (chipClear) chipClear.addEventListener('click', () => selection.clear());
        const chipSee = $('date-filter-see');
        if (chipSee) chipSee.addEventListener('click', () => {
            const top = showsList.getBoundingClientRect().top + window.scrollY - 130;
            window.scrollTo({ top, behavior: 'smooth' });
        });

        // A calendar pick shows only that date (or range), regardless of the other filters.
        selection.listeners.push(() => {
            if (selection.from) {
                if (q) q.value = '';
                if (yearSel) yearSel.value = 'all';
                if (monthSel) monthSel.value = 'all';
            }
            visible = PAGE_SIZE;
            render();
        });

        render();
    }

    function initCalendar() {
        const calendarContainer = $('multi-calendar-view');
        const monthYearDisplay = $('current-month-year');
        const prevMonthBtn = $('prev-month');
        const nextMonthBtn = $('next-month');
        if (!calendarContainer || !monthYearDisplay) return;

        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const middleDate = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthFmt = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });

        function createMonthGrid(date) {
            const grid = document.createElement('div');
            grid.className = 'calendar-grid';

            const title = document.createElement('div');
            title.className = 'month-grid-header';
            title.textContent = monthFmt.format(date);
            grid.appendChild(title);

            ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(name => {
                const el = document.createElement('div');
                el.className = 'day-name';
                el.textContent = name;
                grid.appendChild(el);
            });

            const year = date.getFullYear();
            const month = date.getMonth();
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const daysInPrev = new Date(year, month, 0).getDate();

            const otherDay = n => {
                const el = document.createElement('div');
                el.className = 'calendar-day other-month';
                el.textContent = n;
                grid.appendChild(el);
            };
            for (let i = firstDay - 1; i >= 0; i--) otherDay(daysInPrev - i);

            for (let i = 1; i <= daysInMonth; i++) {
                const dayDiv = document.createElement('div');
                dayDiv.className = 'calendar-day';
                dayDiv.textContent = i;

                const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                const dayEvents = allShows.filter(s => s.date === dateString);

                dayDiv.dataset.date = dateString;
                dayDiv.tabIndex = 0;
                dayDiv.setAttribute('role', 'button');

                if (dayEvents.length > 0) {
                    dayDiv.classList.add('has-event');
                    if (new Date(dateString + 'T00:00:00') < todayStart) dayDiv.classList.add('past-event');
                    const dot = document.createElement('div');
                    dot.className = 'event-dot';
                    dayDiv.appendChild(dot);
                    dayDiv.title = dayEvents.map(e => e.name).join(', ');
                }

                if (year === today.getFullYear() && month === today.getMonth() && i === today.getDate()) {
                    dayDiv.classList.add('today');
                }
                grid.appendChild(dayDiv);
            }

            for (let i = 1; i <= 42 - (firstDay + daysInMonth); i++) otherDay(i);
            return grid;
        }

        function renderCalendars() {
            calendarContainer.innerHTML = '';
            const grid = createMonthGrid(new Date(middleDate.getFullYear(), middleDate.getMonth(), 1));
            grid.classList.add('current-month-grid');
            calendarContainer.appendChild(grid);
            monthYearDisplay.textContent = monthFmt.format(middleDate);
            paintSelection();
        }

        // Mark the picked day(s): ends get "selected", everything between gets "in-range".
        function paintSelection() {
            calendarContainer.querySelectorAll('.calendar-day[data-date]').forEach(el => {
                const d = el.dataset.date;
                const inside = !!selection.from && d >= selection.from && d <= selection.to;
                el.classList.toggle('in-range', inside);
                el.classList.toggle('selected', inside && (d === selection.from || d === selection.to));
                el.setAttribute('aria-pressed', inside ? 'true' : 'false');
            });
        }
        selection.listeners.push(paintSelection);

        // Click a day for that date; drag (or Shift+click) across days for a range; click the same day again to clear.
        let anchor = null;
        let dragging = false;
        let dragged = false;
        const dayOf = e => e.target.closest('.calendar-day[data-date]');

        calendarContainer.addEventListener('mousedown', e => {
            const day = dayOf(e);
            if (!day || e.button !== 0) return;
            e.preventDefault();
            if (e.shiftKey && anchor) {
                selection.set(anchor, day.dataset.date);
                return;
            }
            anchor = day.dataset.date;
            dragging = true;
            dragged = false;
        });
        calendarContainer.addEventListener('mouseover', e => {
            const day = dayOf(e);
            if (!dragging || !day) return;
            if (day.dataset.date !== anchor) dragged = true;
            if (dragged) selection.set(anchor, day.dataset.date);
        });
        document.addEventListener('mouseup', () => {
            if (!dragging) return;
            dragging = false;
            if (dragged) return;
            const single = selection.from && selection.from === selection.to;
            if (single && selection.from === anchor) {
                selection.clear();                      // same day again: cancel
            } else if (single) {
                selection.set(selection.from, anchor);  // second day: make a range
            } else {
                selection.set(anchor, anchor);          // none or a range: start over
            }
        });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && selection.from) selection.clear();
        });
        calendarContainer.addEventListener('keydown', e => {
            const day = dayOf(e);
            if (!day || e.key !== 'Enter') return;
            anchor = day.dataset.date;
            if (e.shiftKey && selection.from) selection.set(selection.from, anchor); else selection.set(anchor, anchor);
        });

        prevMonthBtn.addEventListener('click', () => { middleDate.setMonth(middleDate.getMonth() - 1); renderCalendars(); });
        nextMonthBtn.addEventListener('click', () => { middleDate.setMonth(middleDate.getMonth() + 1); renderCalendars(); });
        renderCalendars();
    }

    if (showsList) {
        bindCalendarButtons(() => allShows);
        fetchJSON('shows.json')
            .then(data => {
                allShows = data;
                if (isSubpage && document.querySelector('#all-events-section')) {
                    initAllEvents();
                    initCalendar();
                } else {
                    renderHomeEvents();
                }
            })
            .catch(error => {
                console.error('Error loading shows:', error);
                showsList.innerHTML = '<p class="no-results">Could not load events. Please try again later.</p>';
            });
    }
});

/* =========================================================
   Detail pages (called from song.html / member.html)
   ========================================================= */

function loadSongDetail(id) {
    fetchJSON('discography.json')
        .then(songs => {
            const song = songs.find(s => String(s.id) === String(id));
            if (!song) {
                document.getElementById('song-detail').innerHTML = '<p>Song not found. <a href="index.html">Back to home</a></p>';
                return;
            }

            document.getElementById('song-title').textContent = song.title;
            setPageMeta(`${song.title} - ${song.artist} | UPgirls Fan Site`,
                        `${song.title} by ${song.artist}${song.release_year ? ` (${song.release_year})` : ''}. Lyrics and streaming links on the UPgirls fan site.`);

            // Featured members link to their profile; the group name stays plain text.
            const songArtist = document.getElementById('song-artist');
            if (songArtist) {
                songArtist.innerHTML = '';
                song.artist.split(',').map(a => a.trim()).forEach((artist, index, all) => {
                    if (artist.toLowerCase() === 'upgirls') {
                        const span = document.createElement('span');
                        span.textContent = artist;
                        songArtist.appendChild(span);
                    } else {
                        const link = document.createElement('a');
                        link.href = `member.html?name=${encodeURIComponent(artist.replace(/\s+UPgirls$/i, '').trim())}`;
                        link.textContent = artist;
                        link.className = 'member-link';
                        songArtist.appendChild(link);
                    }
                    if (index < all.length - 1) songArtist.appendChild(document.createTextNode(', '));
                });
            }

            const songType = document.getElementById('song-type');
            const songYear = document.getElementById('song-year');
            if (songType) songType.textContent = song.type || 'Single';
            if (songYear) songYear.textContent = song.release_year || '';

            const streamingContainer = document.getElementById('streaming-links');
            streamingContainer.innerHTML = songLinksHTML(song, 'button');
            if (!streamingContainer.innerHTML) {
                const section = document.querySelector('.song-links');
                if (section) section.style.display = 'none';
            }

            const lyricsContent = document.getElementById('lyrics-content');
            const lyricsPlaceholder = document.getElementById('lyrics-placeholder');
            if (song.lyrics) {
                lyricsContent.textContent = song.lyrics;
                lyricsContent.style.display = 'block';
                if (lyricsPlaceholder) lyricsPlaceholder.style.display = 'none';
            } else {
                lyricsContent.style.display = 'none';
                if (lyricsPlaceholder) lyricsPlaceholder.style.display = 'block';
            }
        })
        .catch(error => console.error('Error loading song details:', error));
}

// Songs a member is credited on, matched by exact name in the artist list.
function songsForMember(songs, memberName) {
    const name = memberName.toLowerCase();
    return songs.filter(song =>
        song.artist.split(',').map(a => a.replace(/\s+UPgirls$/i, '').trim().toLowerCase()).includes(name));
}

function renderMemberDiscography(songs) {
    const songList = document.getElementById('member-song-list');
    if (!songList) return;
    songList.innerHTML = '';
    if (songs.length === 0) {
        songList.innerHTML = '<p class="no-songs">No specific songs found for this member.</p>';
        return;
    }
    songs.forEach((song, i) => songList.appendChild(songRowElement(song, i, false)));
}

function loadMemberDetail(name) {
    const detailContainer = document.getElementById('member-detail');
    if (!detailContainer) return;

    fetchJSON('members.json')
        .then(data => {
            const lower = name.toLowerCase();
            const member = data.find(m => (m.full_name || '').toLowerCase() === lower || m.name.toLowerCase() === lower);
            if (!member) {
                detailContainer.innerHTML = '<p>Member not found. <a href="index.html">Back to home</a></p>';
                return;
            }

            const fallback = placeholderImg(member.name);
            const isValid = v => v && v !== 'N/A' && v !== 'Unknown';

            const socialDefs = [
                ['instagram', 'https://instagram.com/', 'ig', 'Instagram'],
                ['x', 'https://x.com/', 'x-com', 'X (Twitter)'],
                ['tiktok', 'https://tiktok.com/@', 'tiktok', 'TikTok'],
                ['idn_live', 'https://www.idn.app/', 'idn', 'IDN Live']
            ];
            const socials = socialDefs
                .filter(([field]) => member[field])
                .map(([field, base, cls, label]) =>
                    `<a href="${esc(base + encodeURIComponent(member[field]))}" target="_blank" rel="noopener" class="social-btn ${cls}">${label}</a>`)
                .join(' ');

            const statusTag = member.is_active ? '' : '<span class="status-badge former">Former Member</span>';

            const fields = [
                ['Full Name', isValid(member.full_name) && member.full_name.toLowerCase() !== member.name.toLowerCase() ? member.full_name : null],
                ['Position', member.position], ['Batch', member.batch], ['Birth Date', member.birth_date],
                ['Birth Place', member.birth_place], ['Blood Type', member.blood_type], ['MBTI', member.mbti],
                ['Zodiac', member.zodiac], ['Chinese Zodiac', member.chinese_zodiac], ['Nationality', member.nationality],
                ['Emoji', member.representative_emoji]
            ];
            const metaRows = fields
                .filter(([, v]) => isValid(v))
                .map(([label, v]) => `<li><span class="label">${label}</span><span class="value">${esc(v)}</span></li>`);
            const metaHTML = metaRows.length ? `<ul class="profile-meta">${metaRows.join('')}</ul>` : '';

            setPageMeta(`${member.name} - UPgirls Member Profile | UPgirls Fan Site`,
                        member.facts ? member.facts.slice(0, 150).replace(/\s+\S*$/, '') + '…' : `Profile of ${member.name}, member of UPgirls.`);
            if (member.image) setMeta('og:image', new URL(member.image, window.location.href).href, 'property');

            detailContainer.innerHTML = `
                <div class="member-detail-grid">
                    <div class="member-image-container">
                        <img src="${esc(member.image || fallback)}" data-fallback="${esc(fallback)}" alt="${esc(member.name)}" decoding="async" class="detail-image ${member.is_active ? '' : 'former-img'}">
                    </div>
                    <div class="member-info">
                        ${statusTag}
                        <h2>${esc(member.name)}</h2>
                        ${metaHTML}
                        <div class="bio-section">
                            <h3>Biography &amp; Facts</h3>
                            <p>${esc(member.facts || '—')}</p>
                        </div>
                        <div class="social-section">
                            <h3>Follow ${esc(member.name)}</h3>
                            <div class="social-btns">${socials}</div>
                        </div>
                        <div id="member-discography" class="member-discography-section" style="display: none;">
                            <h3>Discography</h3>
                            <div id="member-song-list" class="discography-list"></div>
                        </div>
                    </div>
                </div>
            `;

            // Only members credited on a song get a discography section.
            fetchJSON('discography.json')
                .then(songs => {
                    const memberSongs = songsForMember(songs, member.name);
                    if (memberSongs.length) {
                        document.getElementById('member-discography').style.display = 'block';
                        renderMemberDiscography(memberSongs);
                    }
                })
                .catch(error => console.error('Error loading member discography:', error));
        })
        .catch(error => {
            console.error('Error loading member details:', error);
            detailContainer.innerHTML = '<p>Error loading member details.</p>';
        });
}
