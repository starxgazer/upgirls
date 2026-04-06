document.addEventListener('DOMContentLoaded', () => {
    const activeGrid = document.getElementById('active-members-grid');
    const traineeGrid = document.getElementById('trainee-members-grid');
    const formerGrid = document.getElementById('former-members-grid');
    const searchInput = document.getElementById('member-search');
    const statusFilter = document.getElementById('status-filter');
    const sortOrder = document.getElementById('sort-order');
    const activeSection = document.getElementById('active-members-section');
    const formerSection = document.getElementById('former-members-section');
    const noResults = document.getElementById('no-results');
    const discographyList = document.getElementById('discography-list');
    const songSearchInput = document.getElementById('song-search');
    const artistFilter = document.getElementById('artist-filter');
    const songSortOrder = document.getElementById('song-sort-order');
    const noSongsResults = document.getElementById('no-songs-results');
    const showsList = document.getElementById('shows-list');
    const toggleFormerMembersBtn = document.getElementById('toggle-former-members');
    const currentYearSpan = document.getElementById('current-year');

    // Update current year in footer
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    let allMembers = [];
    let allSongs = [];
    let allShows = [];

    // Handle header scroll effect
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    if (activeGrid) {
        fetch('members.json')
            .then(response => response.json())
            .then(data => {
                allMembers = data;
                
                const isAllMembersPage = document.body.classList.contains('subpage') && 
                                        document.querySelector('#members-archive');
                
                if (isAllMembersPage) {
                    renderMembers();
                    // Add event listeners for controls
                    if (searchInput) searchInput.addEventListener('input', renderMembers);
                    if (statusFilter) statusFilter.addEventListener('change', renderMembers);
                    if (sortOrder) sortOrder.addEventListener('change', renderMembers);
                } else {
                    // On home page, separate active (regular) and trainee members
                    const activeOnly = allMembers.filter(m => m.is_active && !m.position.includes('Trainee'));
                    const traineeOnly = allMembers.filter(m => m.is_active && m.position.includes('Trainee'));
                    
                    if (activeGrid) {
                        activeGrid.innerHTML = '';
                        activeOnly.forEach(member => {
                            activeGrid.appendChild(createMemberCard(member));
                        });
                    }
                    
                    if (traineeGrid) {
                        traineeGrid.innerHTML = '';
                        traineeOnly.forEach(member => {
                            traineeGrid.appendChild(createMemberCard(member));
                        });
                        
                        // Hide section if no trainees
                        const traineeSection = document.getElementById('trainee-members-section');
                        if (traineeSection) {
                            traineeSection.style.display = traineeOnly.length > 0 ? 'block' : 'none';
                        }
                    }
                }
            })
            .catch(error => console.error('Error loading members:', error));
    }

    if (discographyList && songSearchInput) {
        fetch('discography.json')
            .then(response => response.json())
            .then(data => {
                allSongs = data;
                renderDiscography(allSongs);

                // Add event listeners for discography controls
                songSearchInput.addEventListener('input', () => {
                    const filtered = filterSongs();
                    renderDiscography(filtered);
                });
                artistFilter.addEventListener('change', () => {
                    const filtered = filterSongs();
                    renderDiscography(filtered);
                });
                songSortOrder.addEventListener('change', () => {
                    const filtered = filterSongs();
                    renderDiscography(filtered);
                });
            })
            .catch(error => console.error('Error loading discography:', error));
    }

    if (showsList) {
        fetch('shows.json')
            .then(response => response.json())
            .then(data => {
                allShows = data;
                
                // If on index.html, only show upcoming
                // If on all-events.html, show all
                const isAllEventsPage = document.body.classList.contains('subpage') && 
                                        document.querySelector('#all-events-section');
                
                if (isAllEventsPage) {
                    renderShows(allShows, true);
                    initCalendar();
                } else {
                    const now = new Date();
                    const upcomingShows = allShows.filter(show => {
                        // Create show date object. If time is provided, use the end time if possible, 
                        // or just the end of day for safety.
                        const showDate = new Date(show.date + 'T23:59:59');
                        return showDate >= now;
                    });
                    renderShows(upcomingShows, false);
                }
            })
            .catch(error => console.error('Error loading shows:', error));
    }

    function initCalendar() {
        const calendarContainer = document.getElementById('multi-calendar-view');
        const monthYearDisplay = document.getElementById('current-month-year');
        const prevMonthBtn = document.getElementById('prev-month');
        const nextMonthBtn = document.getElementById('next-month');

        if (!calendarContainer || !monthYearDisplay) return;

        let currentDate = new Date(); // Dynamic current date
        let middleDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

        function createMonthGrid(date) {
            const grid = document.createElement('div');
            grid.className = 'calendar-grid';

            const header = document.createElement('div');
            header.className = 'month-grid-header';
            header.textContent = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
            grid.appendChild(header);

            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            dayNames.forEach(name => {
                const dayNameDiv = document.createElement('div');
                dayNameDiv.className = 'day-name';
                dayNameDiv.textContent = name;
                grid.appendChild(dayNameDiv);
            });

            const year = date.getFullYear();
            const month = date.getMonth();
            const firstDayOfMonth = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const daysInPrevMonth = new Date(year, month, 0).getDate();

            // Fill in days from previous month
            for (let i = firstDayOfMonth - 1; i >= 0; i--) {
                const dayDiv = document.createElement('div');
                dayDiv.className = 'calendar-day other-month';
                dayDiv.textContent = daysInPrevMonth - i;
                grid.appendChild(dayDiv);
            }

            // Fill in days of current month
            for (let i = 1; i <= daysInMonth; i++) {
                const dayDiv = document.createElement('div');
                dayDiv.className = 'calendar-day';
                dayDiv.textContent = i;

                const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                const dayEvents = allShows.filter(show => show.date === dateString);

            if (dayEvents.length > 0) {
                // If the event is today, it's not past yet regardless of time for calendar view purposes
                const eventDate = new Date(dateString + 'T00:00:00');
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const isPast = eventDate < today;
                dayDiv.classList.add('has-event');
                if (isPast) dayDiv.classList.add('past-event');
                    
                    const dot = document.createElement('div');
                    dot.className = 'event-dot';
                    dayDiv.appendChild(dot);

                    dayDiv.title = dayEvents.map(e => e.name).join(', ');
                    dayDiv.addEventListener('click', () => {
                        const showCards = document.querySelectorAll('.show-card');
                        showCards.forEach(card => {
                            const cardDate = card.querySelector('.show-date-badge');
                            if (cardDate && cardDate.textContent.includes(String(i)) && 
                                cardDate.textContent.includes(new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date))) {
                                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                card.style.boxShadow = '0 0 15px var(--primary-pink)';
                                setTimeout(() => {
                                    card.style.boxShadow = '';
                                }, 2000);
                            }
                        });
                    });
                }

                if (year === currentDate.getFullYear() && month === currentDate.getMonth() && i === currentDate.getDate()) {
                    dayDiv.classList.add('today');
                }

                grid.appendChild(dayDiv);
            }

            // Fill in days from next month
            const totalCells = 42;
            const filledCells = firstDayOfMonth + daysInMonth;
            for (let i = 1; i <= totalCells - filledCells; i++) {
                const dayDiv = document.createElement('div');
                dayDiv.className = 'calendar-day other-month';
                dayDiv.textContent = i;
                grid.appendChild(dayDiv);
            }

            return grid;
        }

        function renderCalendars() {
            calendarContainer.innerHTML = '';
            
            // Generate 3 months: prev, current (middle), next
            const months = [
                new Date(middleDate.getFullYear(), middleDate.getMonth() - 1, 1),
                new Date(middleDate.getFullYear(), middleDate.getMonth(), 1),
                new Date(middleDate.getFullYear(), middleDate.getMonth() + 1, 1)
            ];

            months.forEach((date, index) => {
                const grid = createMonthGrid(date);
                if (index === 0) grid.classList.add('prev-month-grid');
                if (index === 1) grid.classList.add('current-month-grid');
                if (index === 2) grid.classList.add('next-month-grid');
                calendarContainer.appendChild(grid);
            });

            monthYearDisplay.textContent = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(middleDate);
        }

        prevMonthBtn.addEventListener('click', () => {
            middleDate.setMonth(middleDate.getMonth() - 1);
            renderCalendars();
        });

        nextMonthBtn.addEventListener('click', () => {
            middleDate.setMonth(middleDate.getMonth() + 1);
            renderCalendars();
        });

        renderCalendars();
    }

    if (toggleFormerMembersBtn) {
        toggleFormerMembersBtn.addEventListener('click', () => {
            const isHidden = formerSection.style.display === 'none';
            formerSection.style.display = isHidden ? 'block' : 'none';
            toggleFormerMembersBtn.textContent = isHidden ? 'Hide Former Members' : 'View Former Members';
            if (isHidden) {
                formerSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    function renderShows(shows, showPast = true) {
        if (!showsList) return;
        showsList.innerHTML = '';

        // Current date
        const now = new Date();
        
        // Sort shows by date (descending, newest first)
        const sortedShows = [...shows].sort((a, b) => new Date(b.date) - new Date(a.date));

        if (sortedShows.length === 0) {
            showsList.innerHTML = '<p class="no-results">No upcoming shows scheduled at the moment. Check back soon!</p>';
            return;
        }

        sortedShows.forEach(show => {
            // Determine if event is past
            let isPast = false;
            const showDateOnly = new Date(show.date + 'T00:00:00');
            const todayOnly = new Date();
            todayOnly.setHours(0, 0, 0, 0);

            if (showDateOnly < todayOnly) {
                isPast = true;
            } else if (showDateOnly.getTime() === todayOnly.getTime()) {
                // It's today. Check the time if available.
                // Time format example: "19.00–20.00 WIB"
                if (show.time && show.time.includes('–')) {
                    const endTimeStr = show.time.split('–')[1].split(' ')[0].replace('.', ':');
                    const eventEndTime = new Date(show.date + 'T' + endTimeStr + ':00');
                    if (eventEndTime < now) {
                        isPast = true;
                    }
                } else {
                    // No specific end time, keep active until end of day
                    const endOfDay = new Date(show.date + 'T23:59:59');
                    if (endOfDay < now) isPast = true;
                }
            }
            
            if (!showPast && isPast) return;
            
            const displayDate = new Date(show.date + 'T12:00:00');
            const day = displayDate.getDate();
            const month = displayDate.toLocaleString('en-US', { month: 'short' });
            const year = displayDate.getFullYear();

            const showCard = document.createElement('div');
            showCard.className = `show-card ${isPast ? 'past-event' : ''}`;
            
            showCard.innerHTML = `
                <div class="show-date-badge">
                    <span class="day">${day}</span>
                    <span class="month">${month}</span>
                    <span class="year">${year}</span>
                    ${isPast ? '<span class="status-badge">Finished</span>' : ''}
                </div>
                <div class="show-info">
                    <h4 class="show-name">${show.name}</h4>
                    <p class="show-type">${show.type}</p>
                    <div class="show-meta">
                        ${show.time ? `<span class="show-time"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>${show.time}</span>` : ''}
                        ${show.location ? `<span class="show-location"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;vertical-align:middle;margin-left:8px;margin-right:4px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>${show.location}</span>` : ''}
                    </div>
                    ${isPast ? 
                        '<span class="ticket-link disabled">Event Finished</span>' : 
                        `<a href="${show.ticket_link}" class="ticket-link" ${show.ticket_link === '#' || !show.ticket_link ? 'style="opacity: 0.5; pointer-events: none;"' : ''} target="_blank" rel="noopener">${show.ticket_link === '#' || !show.ticket_link ? 'Ticket Link Unavailable' : 'Buy Tickets'}</a>`
                    }
                </div>
            `;

            showsList.appendChild(showCard);
        });
    }

    function filterSongs() {
        const searchTerm = songSearchInput.value.toLowerCase();
        const artistValue = artistFilter.value;
        const sortValue = songSortOrder.value;

        let filtered = allSongs.filter(song => {
            const matchesSearch = song.title.toLowerCase().includes(searchTerm) || 
                                 song.artist.toLowerCase().includes(searchTerm);
            
            let matchesArtist = true;
            if (artistValue === 'upgirls') {
                matchesArtist = song.artist.toLowerCase() === 'upgirls';
            } else if (artistValue === 'solo') {
                matchesArtist = song.artist.toLowerCase() !== 'upgirls';
            }

            return matchesSearch && matchesArtist;
        });

        // Sort songs
        filtered.sort((a, b) => {
            const titleA = a.title.toLowerCase();
            const titleB = b.title.toLowerCase();
            if (sortValue === 'asc') {
                return titleA < titleB ? -1 : (titleA > titleB ? 1 : 0);
            } else {
                return titleA > titleB ? -1 : (titleA < titleB ? 1 : 0);
            }
        });

        return filtered;
    }

    function renderDiscography(songs) {
        discographyList.innerHTML = '';
        
        if (songs.length === 0) {
            if (noSongsResults) noSongsResults.style.display = 'block';
            return;
        }
        
        if (noSongsResults) noSongsResults.style.display = 'none';

        songs.forEach((song, index) => {
            const songRow = document.createElement('div');
            songRow.className = 'song-row clickable';
            songRow.onclick = (e) => {
                // Prevent trigger if clicking on an icon link
                if (e.target.closest('.song-links-inline')) return;
                window.location.href = `song.html?id=${song.id}`;
            };
            
            let songLinks = '';
            if (song.spotify) {
                songLinks += `
                    <a href="${song.spotify}" target="_blank" title="Spotify" class="song-icon spotify">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.306c-.221.362-.693.475-1.054.254-2.894-1.768-6.536-2.167-10.824-1.185-.413.095-.826-.164-.922-.577-.095-.413.164-.826.577-.922 4.697-1.073 8.71-.611 11.968 1.381.363.221.476.693.255 1.049zm1.467-3.267c-.278.452-.871.597-1.323.32-3.31-2.036-8.358-2.623-12.273-1.434-.51.155-1.044-.136-1.199-.646-.155-.51.136-1.044.646-1.199 4.47-1.356 10.033-.705 13.829 1.623.453.277.597.871.32 1.336zm.126-3.414C15.228 8.243 8.85 8.03 5.158 9.151c-.596.181-1.23-.153-1.411-.749-.181-.596.153-1.23.749-1.411 4.238-1.286 11.284-1.046 15.748 1.605.536.319.712 1.011.393 1.547-.319.535-1.011.712-1.547.393z"/></svg>
                    </a>`;
            }
            if (song.youtube_music) {
                songLinks += `
                    <a href="${song.youtube_music}" target="_blank" title="YouTube Music" class="song-icon youtube-music">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 17.022c-2.774 0-5.022-2.248-5.022-5.022S9.226 6.978 12 6.978s5.022 2.248 5.022 5.022-2.248 5.022-5.022 5.022z"/><circle cx="12" cy="12" r="3.2"/><path d="M12 4.407c-4.187 0-7.593 3.406-7.593 7.593s3.406 7.593 7.593 7.593 7.593-3.406 7.593-7.593-3.406-7.593-7.593-7.593zm0 13.586c-3.305 0-6 2.695-6 6s2.695 6 6 6 6-2.695 6-6-2.695-6-6-6z" opacity=".3"/></svg>
                    </a>`;
            }
            if (song.youtube_video) {
                songLinks += `
                    <a href="${song.youtube_video}" target="_blank" title="YouTube Video" class="song-icon youtube-video">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                    </a>`;
            }
            
            songRow.innerHTML = `
                <div class="song-index">${index + 1}</div>
                <div class="song-info">
                    <div class="song-title">${song.title}</div>
                    <div class="song-artist">${song.artist} ${song.release_year ? `<span class="song-year-inline">(${song.release_year})</span>` : ''}</div>
                </div>
                <div class="song-links-inline">
                    ${songLinks}
                </div>
            `;
            discographyList.appendChild(songRow);
        });
    }

    function renderMembers() {
        const searchTerm = (searchInput && searchInput.value) ? searchInput.value.toLowerCase() : '';
        const statusValue = statusFilter ? statusFilter.value : (document.querySelector('#members-archive') ? 'all' : 'active');
        const sortValue = sortOrder ? sortOrder.value : 'asc';

        // Filter members
        let filtered = allMembers.filter(member => {
            const matchesSearch = member.name.toLowerCase().includes(searchTerm);
            let matchesStatus = false;
            
            if (statusValue === 'all') {
                matchesStatus = true;
            } else if (statusValue === 'active') {
                matchesStatus = member.is_active && !member.position.includes('Trainee');
            } else if (statusValue === 'trainee') {
                matchesStatus = member.is_active && member.position.includes('Trainee');
            } else if (statusValue === 'former') {
                matchesStatus = !member.is_active;
            }
            
            return matchesSearch && matchesStatus;
        });

        // Sort members
        filtered.sort((a, b) => {
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();
            if (sortValue === 'asc') {
                return nameA < nameB ? -1 : (nameA > nameB ? 1 : 0);
            } else {
                return nameA > nameB ? -1 : (nameA < nameB ? 1 : 0);
            }
        });

        // Clear grids
        if (activeGrid) activeGrid.innerHTML = '';
        if (traineeGrid) traineeGrid.innerHTML = '';
        if (formerGrid) formerGrid.innerHTML = '';

        const activeMembers = filtered.filter(m => m.is_active && !m.position.includes('Trainee'));
        const traineeMembers = filtered.filter(m => m.is_active && m.position.includes('Trainee'));
        const formerMembers = filtered.filter(m => !m.is_active);

        // Update visibility of sections
        if (activeSection) activeSection.style.display = activeMembers.length > 0 ? 'block' : 'none';
        
        const traineeSection = document.getElementById('trainee-members-section');
        if (traineeSection) {
            traineeSection.style.display = traineeMembers.length > 0 ? 'block' : 'none';
        }
        
        // Handle Former Members Section visibility based on filter and toggle
        const isFormerFiltered = statusValue === 'all' || statusValue === 'former';
        const isToggleOn = toggleFormerMembersBtn && toggleFormerMembersBtn.textContent.includes('Hide');
        
        if (formerSection) {
            if (isFormerFiltered && (statusValue === 'former' || isToggleOn || document.querySelector('#members-archive'))) {
                formerSection.style.display = formerMembers.length > 0 ? 'block' : 'none';
            } else {
                formerSection.style.display = 'none';
            }
        }

        // Show/Hide the toggle button container
        const shouldShowFormerToggle = formerMembers.length > 0 && statusValue === 'active' && !document.querySelector('#members-archive');
        const toggleContainer = document.querySelector('.member-toggle-container');
        if (toggleContainer) {
            toggleContainer.style.display = shouldShowFormerToggle ? 'block' : 'none';
        }
        
        if (noResults) noResults.style.display = filtered.length === 0 ? 'block' : 'none';

        // Render active members
        if (activeGrid) {
            activeMembers.forEach(member => {
                activeGrid.appendChild(createMemberCard(member));
            });
        }

        // Render former members
        if (formerGrid) {
            formerMembers.forEach(member => {
                formerGrid.appendChild(createMemberCard(member));
            });
        }

        // Render trainee members
        if (traineeGrid) {
            traineeMembers.forEach(member => {
                traineeGrid.appendChild(createMemberCard(member));
            });
        }
    }

    function createMemberCard(member) {
        const card = document.createElement('div');
        card.className = 'card clickable';
        card.onclick = () => {
            window.location.href = `member.html?name=${encodeURIComponent(member.name)}`;
        };
        
        const imgUrl = member.image || 'https://via.placeholder.com/300x400?text=' + member.name;
        
        card.innerHTML = `
            <div class="member-img-wrapper">
                <img src="${imgUrl}" alt="${member.name}" class="member-thumb ${member.is_active ? '' : 'former-img'}">
            </div>
            <div class="member-card-info">
                <h4>${member.name}</h4>
            </div>
        `;
        return card;
    }
});

function loadSongDetail(id) {
    fetch('discography.json')
        .then(response => response.json())
        .then(songs => {
            const song = songs.find(s => s.id == id);
            if (song) {
                document.getElementById('song-title').textContent = song.title;
                
                // Make artist/featuring members clickable
                const songArtist = document.getElementById('song-artist');
                if (songArtist) {
                    const artists = song.artist.split(',').map(a => a.trim());
                    songArtist.innerHTML = '';
                    artists.forEach((artist, index) => {
                        const isUPgirls = artist.toLowerCase() === 'upgirls';
                        const cleanName = artist.replace(/\s+UPgirls$/i, '').trim();
                        
                        if (isUPgirls) {
                            const span = document.createElement('span');
                            span.textContent = artist;
                            songArtist.appendChild(span);
                        } else {
                            const link = document.createElement('a');
                            link.href = `member.html?name=${encodeURIComponent(cleanName)}`;
                            link.textContent = artist;
                            link.className = 'member-link';
                            songArtist.appendChild(link);
                        }
                        
                        if (index < artists.length - 1) {
                            songArtist.appendChild(document.createTextNode(', '));
                        }
                    });
                }
                
                const songType = document.getElementById('song-type');
                const songYear = document.getElementById('song-year');
                if (songType) songType.textContent = song.type || 'Single';
                if (songYear) songYear.textContent = song.release_year || '';

                const streamingContainer = document.getElementById('streaming-links');
                streamingContainer.innerHTML = '';
                
                if (song.spotify) {
                    streamingContainer.innerHTML += `
                        <a href="${song.spotify}" target="_blank" class="streaming-btn spotify">
                            <svg viewBox="0 0 24 24" fill="currentColor" class="btn-icon"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.306c-.221.362-.693.475-1.054.254-2.894-1.768-6.536-2.167-10.824-1.185-.413.095-.826-.164-.922-.577-.095-.413.164-.826.577-.922 4.697-1.073 8.71-.611 11.968 1.381.363.221.476.693.255 1.049zm1.467-3.267c-.278.452-.871.597-1.323.32-3.31-2.036-8.358-2.623-12.273-1.434-.51.155-1.044-.136-1.199-.646-.155-.51.136-1.044.646-1.199 4.47-1.356 10.033-.705 13.829 1.623.453.277.597.871.32 1.336zm.126-3.414C15.228 8.243 8.85 8.03 5.158 9.151c-.596.181-1.23-.153-1.411-.749-.181-.596.153-1.23.749-1.411 4.238-1.286 11.284-1.046 15.748 1.605.536.319.712 1.011.393 1.547-.319.535-1.011.712-1.547.393z"/></svg>
                            Spotify
                        </a>`;
                }
                if (song.youtube_music) {
                    streamingContainer.innerHTML += `
                        <a href="${song.youtube_music}" target="_blank" class="streaming-btn youtube-music">
                            <svg viewBox="0 0 24 24" fill="currentColor" class="btn-icon"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 17.022c-2.774 0-5.022-2.248-5.022-5.022S9.226 6.978 12 6.978s5.022 2.248 5.022 5.022-2.248 5.022-5.022 5.022z"/><circle cx="12" cy="12" r="3.2"/><path d="M12 4.407c-4.187 0-7.593 3.406-7.593 7.593s3.406 7.593 7.593 7.593 7.593-3.406 7.593-7.593-3.406-7.593-7.593-7.593zm0 13.586c-3.305 0-6 2.695-6 6s2.695 6 6 6 6-2.695 6-6-2.695-6-6-6z" opacity=".3"/></svg>
                            YouTube Music
                        </a>`;
                }
                if (song.youtube_video) {
                    streamingContainer.innerHTML += `
                        <a href="${song.youtube_video}" target="_blank" class="streaming-btn youtube-video">
                            <svg viewBox="0 0 24 24" fill="currentColor" class="btn-icon"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                            YouTube Video
                        </a>`;
                }
                
                if (streamingContainer.innerHTML === '') {
                    const songLinksSection = document.querySelector('.song-links');
                    if (songLinksSection) songLinksSection.style.display = 'none';
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
            } else {
                document.getElementById('song-detail').innerHTML = '<p>Song not found. <a href="index.html">Back to home</a></p>';
            }
        })
        .catch(error => console.error('Error loading song details:', error));
}

function renderMemberDiscography(songs) {
    const songList = document.getElementById('member-song-list');
    if (!songList) return;

    if (songs.length === 0) {
        songList.innerHTML = '<p class="no-songs">No specific songs found for this member.</p>';
        return;
    }

    songList.innerHTML = '';
    songs.forEach((song, index) => {
        const songRow = document.createElement('div');
        songRow.className = 'song-row clickable';
        songRow.onclick = (e) => {
            if (e.target.closest('.song-links-inline')) return;
            window.location.href = `song.html?id=${song.id}`;
        };
        
        let songLinks = '';
        if (song.spotify) {
            songLinks += `
                <a href="${song.spotify}" target="_blank" title="Spotify" class="song-icon spotify">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.306c-.221.362-.693.475-1.054.254-2.894-1.768-6.536-2.167-10.824-1.185-.413.095-.826-.164-.922-.577-.095-.413.164-.826.577-.922 4.697-1.073 8.71-.611 11.968 1.381.363.221.476.693.255 1.049zm1.467-3.267c-.278.452-.871.597-1.323.32-3.31-2.036-8.358-2.623-12.273-1.434-.51.155-1.044-.136-1.199-.646-.155-.51.136-1.044.646-1.199 4.47-1.356 10.033-.705 13.829 1.623.453.277.597.871.32 1.336zm.126-3.414C15.228 8.243 8.85 8.03 5.158 9.151c-.596.181-1.23-.153-1.411-.749-.181-.596.153-1.23.749-1.411 4.238-1.286 11.284-1.046 15.748 1.605.536.319.712 1.011.393 1.547-.319.535-1.011.712-1.547.393z"/></svg>
                </a>`;
        }
        if (song.youtube_music) {
            songLinks += `
                <a href="${song.youtube_music}" target="_blank" title="YouTube Music" class="song-icon youtube-music">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 17.022c-2.774 0-5.022-2.248-5.022-5.022S9.226 6.978 12 6.978s5.022 2.248 5.022 5.022-2.248 5.022-5.022 5.022z"/><circle cx="12" cy="12" r="3.2"/><path d="M12 4.407c-4.187 0-7.593 3.406-7.593 7.593s3.406 7.593 7.593 7.593 7.593-3.406 7.593-7.593-3.406-7.593-7.593-7.593zm0 13.586c-3.305 0-6 2.695-6 6s2.695 6 6 6 6-2.695 6-6-2.695-6-6-6z" opacity=".3"/></svg>
                </a>`;
        }
        if (song.youtube_video) {
            songLinks += `
                <a href="${song.youtube_video}" target="_blank" title="YouTube Video" class="song-icon youtube-video">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>`;
        }
        
        songRow.innerHTML = `
            <div class="song-index">${index + 1}</div>
            <div class="song-info">
                <div class="song-title">${song.title}</div>
                <div class="song-artist">${song.artist}</div>
            </div>
            <div class="song-links-inline">
                ${songLinks}
            </div>
        `;
        songList.appendChild(songRow);
    });
}

function loadMemberDetail(name) {
    const detailContainer = document.getElementById('member-detail');
    if (!detailContainer) return;

    fetch('members.json')
        .then(response => response.json())
        .then(data => {
            const member = data.find(m => m.full_name.toLowerCase() === name.toLowerCase() || m.name.toLowerCase() === name.toLowerCase());
            if (member) {
                const imgUrl = member.image || 'https://via.placeholder.com/600x800?text=' + member.name;
                
                let socials = '';
                if (member.instagram) {
                    socials += `<a href="https://instagram.com/${member.instagram}" target="_blank" class="social-btn ig">Instagram</a> `;
                }
                if (member.x) {
                    socials += `<a href="https://x.com/${member.x}" target="_blank" class="social-btn x-com">X (Twitter)</a> `;
                }
                if (member.tiktok) {
                    socials += `<a href="https://tiktok.com/@${member.tiktok}" target="_blank" class="social-btn tiktok">TikTok</a> `;
                }
                if (member.idn_live) {
                    socials += `<a href="https://www.idn.app/${member.idn_live}" target="_blank" class="social-btn idn">IDN Live</a>`;
                }

                const statusTag = member.is_active ? '' : '<span class="status-badge former">Former Member</span>';

                // Build profile metadata list from available fields
                const isValid = v => v && v !== 'N/A' && v !== 'Unknown';
                const metaRows = [];
                if (isValid(member.full_name) && member.full_name.toLowerCase() !== member.name.toLowerCase()) metaRows.push(`<li><span class="label">Full Name</span><span class="value">${member.full_name}</span></li>`);
                if (isValid(member.position)) metaRows.push(`<li><span class="label">Position</span><span class="value">${member.position}</span></li>`);
                if (isValid(member.birth_date)) metaRows.push(`<li><span class="label">Birth Date</span><span class="value">${member.birth_date}</span></li>`);
                if (isValid(member.birth_place)) metaRows.push(`<li><span class="label">Birth Place</span><span class="value">${member.birth_place}</span></li>`);
                if (isValid(member.blood_type)) metaRows.push(`<li><span class="label">Blood Type</span><span class="value">${member.blood_type}</span></li>`);
                if (isValid(member.mbti)) metaRows.push(`<li><span class="label">MBTI</span><span class="value">${member.mbti}</span></li>`);
                if (isValid(member.zodiac)) metaRows.push(`<li><span class="label">Zodiac</span><span class="value">${member.zodiac}</span></li>`);
                if (isValid(member.chinese_zodiac)) metaRows.push(`<li><span class="label">Chinese Zodiac</span><span class="value">${member.chinese_zodiac}</span></li>`);
                if (isValid(member.nationality)) metaRows.push(`<li><span class="label">Nationality</span><span class="value">${member.nationality}</span></li>`);
                if (isValid(member.representative_emoji)) metaRows.push(`<li><span class="label">Emoji</span><span class="value">${member.representative_emoji}</span></li>`);
                const metaHTML = metaRows.length
                    ? `<ul class="profile-meta">${metaRows.join('')}</ul>`
                    : '';

                detailContainer.innerHTML = `
                    <div class="member-detail-grid">
                        <div class="member-image-container">
                            <img src="${imgUrl}" alt="${member.name}" class="detail-image ${member.is_active ? '' : 'former-img'}">
                        </div>
                        <div class="member-info">
                            ${statusTag}
                            <h2>${member.name}</h2>
                            ${metaHTML}
                            <div class="bio-section">
                                <h3>Biography & Facts</h3>
                                <p>${member.facts || '—'}</p>
                            </div>
                            <div class="social-section">
                                <h3>Follow ${member.name}</h3>
                                <div class="social-btns">
                                    ${socials}
                                </div>
                            </div>
                            <div id="member-discography" class="member-discography-section">
                                <h3>Discography</h3>
                                <div id="member-song-list" class="discography-list">
                                    <p class="loading-songs">Loading songs...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // Fetch and render discography for this member (only for Nat and Nay)
                const membersWithDiscography = ['Nat', 'Nay'];
                const discographySection = document.getElementById('member-discography');
                
                if (membersWithDiscography.includes(member.name)) {
                    if (discographySection) discographySection.style.display = 'block';
                    fetch('discography.json')
                        .then(response => response.json())
                        .then(songs => {
                            const memberSongs = songs.filter(song => 
                                song.artist.toLowerCase().includes(member.name.toLowerCase())
                            );
                            renderMemberDiscography(memberSongs);
                        })
                        .catch(error => {
                            console.error('Error loading member discography:', error);
                            const songList = document.getElementById('member-song-list');
                            if (songList) songList.innerHTML = '<p>Error loading songs.</p>';
                        });
                } else {
                    if (discographySection) discographySection.style.display = 'none';
                }
            } else {
                detailContainer.innerHTML = `<p>Member not found. <a href="index.html">Back to home</a></p>`;
            }
        })
        .catch(error => {
            console.error('Error loading member details:', error);
            detailContainer.innerHTML = `<p>Error loading member details.</p>`;
        });
}