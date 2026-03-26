document.addEventListener('DOMContentLoaded', () => {
    const activeGrid = document.getElementById('active-members-grid');
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

    let allMembers = [];
    let allSongs = [];

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

    if (activeGrid && formerGrid) {
        fetch('members.json')
            .then(response => response.json())
            .then(data => {
                allMembers = data;
                renderMembers();
                
                // Add event listeners for controls
                searchInput.addEventListener('input', renderMembers);
                statusFilter.addEventListener('change', renderMembers);
                sortOrder.addEventListener('change', renderMembers);
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
        const searchTerm = searchInput.value.toLowerCase();
        const statusValue = statusFilter.value;
        const sortValue = sortOrder.value;

        // Filter members
        let filtered = allMembers.filter(member => {
            const matchesSearch = member.name.toLowerCase().includes(searchTerm);
            const matchesStatus = statusValue === 'all' || 
                                 (statusValue === 'active' && member.is_active) || 
                                 (statusValue === 'former' && !member.is_active);
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
        activeGrid.innerHTML = '';
        formerGrid.innerHTML = '';

        const activeMembers = filtered.filter(m => m.is_active);
        const formerMembers = filtered.filter(m => !m.is_active);

        // Update visibility of sections
        activeSection.style.display = activeMembers.length > 0 ? 'block' : 'none';
        formerSection.style.display = formerMembers.length > 0 ? 'block' : 'none';
        noResults.style.display = filtered.length === 0 ? 'block' : 'none';

        // Render active members
        activeMembers.forEach(member => {
            activeGrid.appendChild(createMemberCard(member));
        });

        // Render former members
        formerMembers.forEach(member => {
            formerGrid.appendChild(createMemberCard(member));
        });
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
                document.getElementById('song-artist').textContent = song.artist;
                
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
                    socials += `<a href="https://tiktok.com/@${member.tiktok}" target="_blank" class="social-btn tiktok">TikTok</a>`;
                }

                const statusTag = member.is_active ? '' : '<span class="status-badge former">Former Member</span>';

                detailContainer.innerHTML = `
                    <div class="member-detail-grid">
                        <div class="member-image-container">
                            <img src="${imgUrl}" alt="${member.name}" class="detail-image ${member.is_active ? '' : 'former-img'}">
                        </div>
                        <div class="member-info">
                            ${statusTag}
                            <h2>${member.name}</h2>
                            <div class="bio-section">
                                <h3>Biography & Facts</h3>
                                <p>${member.facts}</p>
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

                // Fetch and render discography for this member
                fetch('discography.json')
                    .then(response => response.json())
                    .then(songs => {
                        const memberSongs = songs.filter(song => 
                            song.artist.toLowerCase().includes(member.name.toLowerCase()) || 
                            song.artist.toLowerCase().includes('upgirls')
                        );
                        renderMemberDiscography(memberSongs);
                    })
                    .catch(error => {
                        console.error('Error loading member discography:', error);
                        const songList = document.getElementById('member-song-list');
                        if (songList) songList.innerHTML = '<p>Error loading songs.</p>';
                    });
            } else {
                detailContainer.innerHTML = `<p>Member not found. <a href="index.html">Back to home</a></p>`;
            }
        })
        .catch(error => {
            console.error('Error loading member details:', error);
            detailContainer.innerHTML = `<p>Error loading member details.</p>`;
        });
}