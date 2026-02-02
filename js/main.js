// ===============================================
// MAIN APPLICATION
// ===============================================

function initApp() {
    renderAlbums();
    renderTracks();
    initNavigation();
    initFilters();
    initLanguageSelector();

    // Set playlist - only tracks available on web
    player.setPlaylist(getAllAvailableTracks());

    // Check URL hash for deep link (e.g., #track-1)
    const hash = window.location.hash;
    const trackMatch = hash.match(/^#track-(.+)$/);

    if (trackMatch) {
        // Deep link to specific track
        const trackId = trackMatch[1];
        const track = getTrackById(trackId);
        if (track) {
            // Load track into player and open modal
            hydratePlayerUI(track);
            player.loadTrack(trackId, false); // load but don't autoplay
            // Open modal after a short delay to ensure DOM is ready
            setTimeout(() => openTrackModal(trackId), 100);
        } else {
            // Track not found, load first track as fallback
            loadFirstTrack();
        }
    } else {
        // Normal load: Load first track info into player UI by default (no autoplay)
        loadFirstTrack();
    }

    // Render artist social links in About section
    renderAboutLinks();

    // Setup detail overlay backdrop click
    setupDetailOverlay();

    // Setup hash change listener for navigation
    window.addEventListener('hashchange', handleHashChange);
}

function loadFirstTrack() {
    const availableTracks = getAllAvailableTracks();
    if (availableTracks && availableTracks.length > 0) {
        const first = availableTracks[0];
        hydratePlayerUI(first);
        if (typeof player.setCurrentTrack === 'function') {
            player.setCurrentTrack(first.id);
        } else if (typeof player.loadTrack === 'function') {
            try { player.loadTrack(first.id); player.pause && player.pause(); } catch (e) {}
        }
    }
}

function handleHashChange() {
    const hash = window.location.hash;
    const trackMatch = hash.match(/^#track-(.+)$/);

    if (trackMatch) {
        const trackId = trackMatch[1];
        const track = getTrackById(trackId);
        if (track) {
            openTrackModal(trackId);
        }
    } else if (!hash || hash === '#') {
        // Close modal if hash is cleared
        closeModal();
    }
}

// Fill the bottom player UI with a track's metadata (without starting playback)
function hydratePlayerUI(track) {
    const playerCover = document.getElementById('playerCover');
    const playerTitle = document.getElementById('playerTitle');
    const playerArtist = document.getElementById('playerArtist');
    const playerBackground = document.getElementById('playerBackground');

    if (!track) {
        // No track - restore "Select track" text with i18n
        if (playerTitle) {
            playerTitle.setAttribute('data-i18n', 'player.select');
            playerTitle.textContent = window.i18n ? window.i18n.t('player.select') : 'Select track';
            playerTitle.classList.remove('clickable');
            playerTitle.style.cursor = 'default';
            playerTitle.onclick = null;
        }
        // Reset background
        if (playerBackground) {
            playerBackground.classList.remove('loaded');
            playerBackground.style.setProperty('--cover-image', 'none');
        }
        return;
    }

    if (playerCover) {
        // Function to update background
        const updateBackground = () => {
            if (playerBackground && track.cover && !track.cover.includes('placeholder.svg')) {
                // Set background image via CSS variable with absolute path (from root)
                const absolutePath = track.cover.startsWith('/') ? track.cover : `/${track.cover}`;
                playerBackground.style.setProperty('--cover-image', `url(${absolutePath})`);

                // Show background with fade-in animation
                requestAnimationFrame(() => {
                    playerBackground.classList.add('loaded');
                });
            } else if (playerBackground) {
                // Hide background for placeholder
                playerBackground.classList.remove('loaded');
                playerBackground.style.setProperty('--cover-image', 'none');
            }
        };

        playerCover.onerror = () => {
            playerCover.src = 'assets/placeholder.svg';
            // Remove background on error
            if (playerBackground) {
                playerBackground.classList.remove('loaded');
                playerBackground.style.setProperty('--cover-image', 'none');
            }
        };

        // Set player background on successful load
        playerCover.onload = () => {
            updateBackground();
        };

        // Set source and check if already loaded (from cache)
        const newSrc = track.cover;
        const needsReload = playerCover.src !== newSrc && !playerCover.src.endsWith(newSrc);

        if (needsReload) {
            playerCover.src = newSrc;
        } else if (playerCover.complete) {
            // Image already loaded from cache
            updateBackground();
        }
    }

    if (playerTitle) {
        // Remove data-i18n to prevent updateUI() from overwriting the track title
        playerTitle.removeAttribute('data-i18n');
        playerTitle.textContent = track.title || '—';

        // Make title clickable to open modal
        // Store track ID in dataset to avoid closure issues
        playerTitle.classList.add('clickable');
        playerTitle.style.cursor = 'pointer';
        playerTitle.dataset.trackId = track.id;
        playerTitle.onclick = function() {
            const trackId = this.dataset.trackId;
            if (trackId) {
                openTrackModal(trackId);
            }
        };
    }

    if (playerArtist) {
        // Format: "D10G3N • Album"
        const album = getAlbumById(track.albumId);
        const albumTitle = album ? album.title : '';
        playerArtist.textContent = albumTitle ? `D10G3N • ${albumTitle}` : 'D10G3N';
    }

    // render small icons for current track
    player.renderPlayerTrackActions(track);
}

// Render small action icons for the current track in the player bar


// Setup click on overlay to close when clicking outside the container
function setupDetailOverlay() {
    const detail = document.getElementById('trackDetail');
    if (!detail) return;
    if (detail._overlayInit) return; // already initialized

    detail.addEventListener('click', (e) => {
        // If click occurred on the overlay (not inside .detail-container), close
        if (e.target === detail) {
            closeModal();
        }
    });

    detail._overlayInit = true;
}

// ===============================================
// RENDER ALBUMS
// ===============================================

function renderAlbums() {
    const albumsGrid = document.getElementById('albumsGrid');

    musicData.albums.forEach(album => {
        const albumCard = createAlbumCard(album);
        albumsGrid.appendChild(albumCard);
    });
}

// Update track counts on album cards without re-rendering
function updateAlbumTracksText() {
    const albumCards = document.querySelectorAll('.album-card');

    albumCards.forEach((card, index) => {
        if (musicData.albums[index]) {
            const album = musicData.albums[index];
            const tracks = getTracksByAlbum(album.id);
            const tracksWord = window.i18n ? window.i18n.pluralize(tracks.length, 'tracks') : pluralizeTracks(tracks.length);

            // Find the meta span with track count
            const metaSpans = card.querySelectorAll('.album-meta span');
            if (metaSpans.length >= 2) {
                // Second span contains track count
                metaSpans[1].textContent = `${tracks.length} ${tracksWord}`;
            }
        }
    });
}

function createAlbumCard(album) {
    const card = document.createElement('div');
    card.className = 'album-card';
    card.onclick = () => filterByAlbum(album.id);

    const tracks = getTracksByAlbum(album.id);
    const tracksWord = window.i18n ? window.i18n.pluralize(tracks.length, 'tracks') : pluralizeTracks(tracks.length);

    card.innerHTML = `
        <img src="${album.cover}" alt="${album.title}" class="album-cover">
        <div class="album-info">
            <div class="album-title">${album.title}</div>
            <div class="album-meta">
                <span>${album.year}</span>
                <span>${tracks.length} ${tracksWord}</span>
            </div>
        </div>
    `;

    // Обработчик для замены изображения при ошибке загрузки
    const coverImg = card.querySelector('.album-cover');
    if (coverImg) {
        coverImg.onerror = () => { coverImg.src = 'assets/placeholder.svg'; };
    }

    return card;
}

function pluralizeTracks(count) {
    if (count === 1) return 'track';
    if (count >= 2 && count <= 4) return 'tracks';
    return 'tracks';
}

// ===============================================
// RENDER TRACKS
// ===============================================

function renderTracks(filterAlbumId = null) {
    const tracksList = document.getElementById('tracksList');
    tracksList.innerHTML = '';

    let tracks = getAllAvailableTracks();
    if (filterAlbumId && filterAlbumId !== 'all') {
        tracks = getTracksByAlbum(filterAlbumId);
    }

    tracks.forEach(track => {
        const trackItem = createTrackItem(track);
        tracksList.appendChild(trackItem);
    });

    // Restore playing state for current track
    updatePlayingTrackUI();
}

function createTrackItem(track) {
    const item = document.createElement('div');
    item.className = 'track-item';
    item.dataset.trackId = track.id;

    const album = getAlbumById(track.albumId);

    item.innerHTML = `
        <div class="track-cover-wrapper">
            <img src="${track.cover}" alt="${track.title}" class="track-cover">
            <button class="track-play-overlay" aria-label="Play">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </button>
            <div class="playing-animation">
                <div class="bar"></div>
                <div class="bar"></div>
                <div class="bar"></div>
                <div class="bar"></div>
            </div>
        </div>
        <div class="track-info">
            <div class="track-title hoverable">${track.title}</div>
            <div class="track-meta">${album ? album.title : ''} • ${track.year}</div>
        </div>
        <div class="track-actions">
            <button class="track-btn" aria-label="Info">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
            </button>
        </div>
    `;

    // Обработчик для замены изображения при ошибке загрузки
    const coverImg = item.querySelector('.track-cover');
    if (coverImg) {
        coverImg.onerror = () => { coverImg.src = 'assets/placeholder.svg'; };
    }

    // Play overlay button
    const playBtn = item.querySelector('.track-play-overlay');
    if (playBtn) {
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            playTrack(track.id);
        });
    }

    // Info button opens detail
    const infoBtn = item.querySelector('.track-actions .track-btn');
    if (infoBtn) {
        infoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openTrackModal(track.id);
        });
    }

    // Title click opens detail
    const titleEl = item.querySelector('.track-title');
    if (titleEl) {
        titleEl.addEventListener('click', (e) => {
            e.stopPropagation();
            openTrackModal(track.id);
        });
    }

    // Disable click on whole card (prevent accidental opens)
    item.onclick = null;
    item.style.cursor = 'default';

    return item;
}

function playTrack(trackId) {
    try {
        // Check if this is the current track
        const isCurrentTrack = player.currentTrackIndex >= 0 &&
                               player.playlist[player.currentTrackIndex]?.id === trackId;

        if (isCurrentTrack && !player.isPlaying) {
            // Current track is paused - just resume it
            player.play();
        } else if (!isCurrentTrack) {
            // Different track - load and play it
            if (typeof player.loadTrack === 'function') {
                player.loadTrack(trackId);
            }
        } else {
            // Current track is already playing - do nothing (or could pause)
            // Optional: player.pause(); to toggle play/pause
        }
    } catch (e) {
        console.warn('player.loadTrack failed', e);
    }

    // Update bottom player UI to reflect the selected/playing track
    const track = getTrackById(trackId);
    if (track) hydratePlayerUI(track);

    // Update playing state UI
    updatePlayingTrackUI();
}

// Update UI to show which track is currently playing
function updatePlayingTrackUI() {
    // Remove playing and is-playing classes from all tracks
    document.querySelectorAll('.track-item').forEach(item => {
        item.classList.remove('playing', 'is-playing');
    });

    // Add playing class to current track if it exists in the list
    if (player && player.currentTrackIndex >= 0 && player.playlist) {
        const currentTrack = player.playlist[player.currentTrackIndex];
        if (currentTrack) {
            const trackElement = document.querySelector(`.track-item[data-track-id="${currentTrack.id}"]`);
            if (trackElement) {
                trackElement.classList.add('playing');

                // Add is-playing class only if audio is actually playing
                if (player.isPlaying) {
                    trackElement.classList.add('is-playing');
                }
            }
        }
    }
}

// ===============================================
// FILTERS
// ===============================================

function initLanguageSelector() {
    const langSelect = document.getElementById('langSelect');
    if (!langSelect) {
        console.warn('[i18n] Language selector element not found');
        return;
    }

    // Check if i18n is loaded
    if (!window.i18n) {
        console.warn('[i18n] window.i18n not loaded yet, retrying...');
        // Retry after a short delay
        setTimeout(initLanguageSelector, 100);
        return;
    }

    // Prevent multiple event listeners
    if (langSelect._i18nInitialized) {
        console.log('[i18n] Selector already initialized');
        return;
    }
    langSelect._i18nInitialized = true;
    console.log('[i18n] Initializing language selector');

    // Set initial value
    langSelect.value = window.i18n.getCurrentLanguage();

    // Handle language change
    langSelect.addEventListener('change', (e) => {
        console.log('[i18n] Language changed to:', e.target.value);
        if (window.i18n) {
            window.i18n.setLanguage(e.target.value);
        }
    });

    // Listen for language changes from other sources
    window.addEventListener('languageChanged', () => {
        console.log('[i18n] Language changed event received');

        if (window.i18n) {
            // Update static translations
            window.i18n.updateUI();

            // Update album track counts text (without re-rendering)
            updateAlbumTracksText();

            // Update player UI if a track is loaded
            if (player && player.currentTrackIndex >= 0 && player.playlist) {
                const currentTrack = player.playlist[player.currentTrackIndex];
                if (currentTrack) {
                    console.log('[i18n] Updating player UI for current track');
                    hydratePlayerUI(currentTrack);
                }
            }

            // Update modal if it's open
            updateModalIfOpen();
        }
    }, { once: false });

    // Listen for player state changes to update modal
    window.addEventListener('playerStateChanged', () => {
        updateModalIfOpen();
    }, { once: false });
}

// Update modal if it's open (helper function)
function updateModalIfOpen() {
    const trackDetail = document.getElementById('trackDetail');
    if (trackDetail && trackDetail.classList.contains('active')) {
        const hash = window.location.hash;
        const trackMatch = hash.match(/^#track-(.+)$/);
        if (trackMatch) {
            const trackId = trackMatch[1];
            console.log('[Modal] Updating modal for track:', trackId);
            // Re-open modal to update state
            openTrackModal(trackId);
        }
    }
}

function initFilters() {
    const filterButtons = document.querySelector('.filter-buttons');
    if (!filterButtons) return;

    // Сделать кнопку "Все" кликабельной
    const allBtn = filterButtons.querySelector('.filter-btn[data-album="all"]');
    if (allBtn) {
        // Remove old listener if exists
        if (!allBtn._filterInitialized) {
            allBtn.addEventListener('click', () => filterByAlbum('all'));
            allBtn._filterInitialized = true;
        }
    }

    // Remove dynamically added album filters (not the "All" button)
    const dynamicBtns = filterButtons.querySelectorAll('.filter-btn:not([data-album="all"])');
    dynamicBtns.forEach(btn => btn.remove());

    // Add album filter buttons
    musicData.albums.forEach(album => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.dataset.album = album.id;
        btn.textContent = album.title;
        btn.addEventListener('click', () => filterByAlbum(album.id));
        filterButtons.appendChild(btn);
    });
}

function filterByAlbum(albumId) {
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.album === albumId) {
            btn.classList.add('active');
        }
    });

    // Render filtered tracks
    renderTracks(albumId);

    // Scroll to tracks section
    scrollToSection('tracks');
}

// ===============================================
// TRACK MODAL
// ===============================================

function openTrackModal(trackId) {
    const track = getTrackById(trackId);
    if (!track) return;

    // Update URL hash for deep linking (without triggering hashchange event)
    if (window.location.hash !== `#track-${trackId}`) {
        history.replaceState(null, null, `#track-${trackId}`);
    }

    const detail = document.getElementById('trackDetail');
    const modalCover = document.getElementById('modalCover');
    const modalTitle = document.getElementById('modalTitle');
    const modalYear = document.getElementById('modalYear');
    const modalLinks = document.getElementById('modalLinks');
    const modalVideo = document.getElementById('modalVideo');
    const modalLyrics = document.getElementById('modalLyrics');
    const detailClose = document.querySelector('.detail-close');

    // Save scroll position if modal is already open AND for the SAME track
    const detailContainer = detail.querySelector('.detail-container');
    const wasOpen = detail.classList.contains('active');
    const previousTrackId = detail.dataset.currentTrackId;
    const isSameTrack = wasOpen && previousTrackId === trackId;
    const savedScrollTop = isSameTrack && detailContainer ? detailContainer.scrollTop : 0;

    // Store current track ID for future comparisons
    detail.dataset.currentTrackId = trackId;

    // Update SEO
    updatePageMeta(track);

    // Set cover and title
    modalCover.src = track.cover;
    modalCover.onerror = () => modalCover.src = 'assets/placeholder.svg';
    modalTitle.textContent = track.title;

    // Use i18n for "Release year"
    const releaseYearLabel = window.i18n ? window.i18n.t('modal.releaseYear') : 'Release year';
    let yearText = `${releaseYearLabel}: ${track.year}`;

    // Add ISRC if available
    if (track.isrc) {
        yearText += `\nISRC: ${track.isrc}`;
    }

    modalYear.textContent = yearText;

    // Render links
    modalLinks.innerHTML = '';

    // Add Play/Pause button first
    const playPauseBtn = document.createElement('button');
    playPauseBtn.className = 'modal-link play-pause-link';
    playPauseBtn.dataset.trackId = trackId;

    // Determine button state and content
    const isCurrentTrack = player && player.currentTrackIndex >= 0 &&
                           player.playlist[player.currentTrackIndex]?.id === trackId;
    const isPlaying = isCurrentTrack && player.isPlaying;

    let buttonText, iconSvg;

    if (isCurrentTrack && isPlaying) {
        // Case 1: Current track is playing - show pause
        buttonText = window.i18n ? window.i18n.t('modal.pause') : 'Pause';
        iconSvg = `<svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
        </svg>`;
    } else if (isCurrentTrack && !isPlaying) {
        // Case 2: Current track is paused - show play
        buttonText = window.i18n ? window.i18n.t('modal.playNow') : 'Play now';
        iconSvg = `<svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
        </svg>`;
    } else {
        // Case 3: Not current track - show play
        buttonText = window.i18n ? window.i18n.t('modal.playNow') : 'Play now';
        iconSvg = `<svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
        </svg>`;
    }

    // Add "Now playing" indicator for current playing track
    if (isCurrentTrack && isPlaying) {
        buttonText = window.i18n ? window.i18n.t('modal.nowPlaying') : 'Now playing';
        // Use animation bars icon
        iconSvg = `<div class="modal-playing-animation">
            <div class="bar"></div>
            <div class="bar"></div>
            <div class="bar"></div>
            <div class="bar"></div>
        </div>`;
    }

    playPauseBtn.innerHTML = `${iconSvg}<span>${buttonText}</span>`;
    playPauseBtn.title = buttonText;

    playPauseBtn.addEventListener('click', () => {
        const trackId = playPauseBtn.dataset.trackId;
        const isCurrentTrack = player && player.currentTrackIndex >= 0 &&
                               player.playlist[player.currentTrackIndex]?.id === trackId;

        if (isCurrentTrack && player.isPlaying) {
            // Case 1: Playing - pause it
            player.pause();
        } else if (isCurrentTrack && !player.isPlaying) {
            // Case 2: Paused - resume
            player.play();
        } else {
            // Case 3: Not current - play this track
            playTrack(trackId);
        }

        // Refresh modal to update button state
        setTimeout(() => openTrackModal(trackId), 100);
    });

    modalLinks.appendChild(playPauseBtn);

    // Add Share button second
    const shareBtn = document.createElement('button');
    shareBtn.className = 'modal-link share-link';
    const shareText = window.i18n ? window.i18n.t('modal.share') : 'Share';
    shareBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
        </svg>
        <span>${shareText}</span>
    `;
    shareBtn.title = 'Copy link to this track';
    shareBtn.addEventListener('click', async () => {
        const url = `${window.location.origin}${window.location.pathname}#track-${trackId}`;
        const copiedText = window.i18n ? window.i18n.t('modal.copied') : 'Copied!';
        try {
            await navigator.clipboard.writeText(url);
            // Show feedback
            const originalText = shareBtn.querySelector('span').textContent;
            shareBtn.querySelector('span').textContent = copiedText;
            shareBtn.style.background = 'var(--primary-color)';
            setTimeout(() => {
                shareBtn.querySelector('span').textContent = originalText;
                shareBtn.style.background = '';
            }, 2000);
        } catch (err) {
            // Fallback for older browsers
            const input = document.createElement('input');
            input.value = url;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);

            shareBtn.querySelector('span').textContent = copiedText;
            setTimeout(() => {
                const shareText = window.i18n ? window.i18n.t('modal.share') : 'Share';
                shareBtn.querySelector('span').textContent = shareText;
            }, 2000);
        }
    });
    modalLinks.appendChild(shareBtn);

    // Add track links
    if (track.links && track.links.length > 0) {
        track.links.forEach(link => {
            const linkEl = createLinkButton(link);
            modalLinks.appendChild(linkEl);
        });
    }

    // Render YouTube video
    modalVideo.innerHTML = '';
    if (track.youtubeId) {
        modalVideo.style.display = '';
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${track.youtubeId}?enablejsapi=1`;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        // Ensure iframe fills its parent container
        iframe.style.display = 'block';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = '0';
        modalVideo.appendChild(iframe);

        // Optional YouTube API setup (no auto-pause)
        iframe.onload = () => {
            setupYoutubePlayer(iframe);
        };
    } else {
        modalVideo.style.display = 'none';
    }

    // Render lyrics
    modalLyrics.textContent = track.lyrics;

    // Show detail panel (overlay) WITHOUT changing page scroll or hiding main
    // calculate header and player heights to position overlay between them
    const headerEl = document.querySelector('.header');
    const playerEl = document.querySelector('.player');
    const headerH = headerEl ? headerEl.offsetHeight : 0;
    const playerH = playerEl ? playerEl.offsetHeight : parseInt(getComputedStyle(document.documentElement).getPropertyValue('--player-height')) || 120;

    detail.style.top = headerH + 'px';
    detail.style.bottom = playerH + 'px';
    detail.classList.add('active');
    detail.setAttribute('aria-hidden', 'false');

    // Reset scroll position logic:
    // - If same track and was open: restore scroll (user is reading, just updating state)
    // - If different track or was closed: reset to top (new content to read)
    if (detailContainer) {
        if (isSameTrack) {
            // Same track, modal was open - restore scroll position
            detailContainer.scrollTop = savedScrollTop;
        } else {
            // Different track or modal was closed - reset to top
            detailContainer.scrollTop = 0;
        }
    }

    // position close button fixed below header
    if (detailClose) {
        // ensure the close button sits just below header and is visible
        detailClose.style.top = (headerH + 12) + 'px';
        detailClose.style.right = '16px';
    }

    // focus for accessibility (do not change scroll)
    try {
        modalTitle.setAttribute('tabindex', '-1');
        modalTitle.focus({ preventScroll: true });
    } catch (e) {
        console.warn('Focus failed', e);
    }
}

function closeModal() {
    const detail = document.getElementById('trackDetail');
    const modalVideo = document.getElementById('modalVideo');
    const detailClose = document.querySelector('.detail-close');

    // Clear URL hash (without triggering hashchange event)
    if (window.location.hash) {
        history.replaceState(null, null, window.location.pathname);
    }

    // Hide panel
    if (detail) {
        detail.classList.remove('active');
        detail.setAttribute('aria-hidden', 'true');
        // clear inline positioning
        detail.style.top = '';
        detail.style.bottom = '';
    }

    // reset close button position
    if (detailClose) {
        detailClose.style.top = '';
        detailClose.style.right = '';
    }

    // Stop YouTube video by clearing iframe
    if (modalVideo) modalVideo.innerHTML = '';

    // Reset SEO
    updatePageMeta();
}

function createLinkButton(link) {
    const btn = document.createElement('a');
    btn.href = link.url;
    btn.target = '_blank';
    btn.rel = 'noopener noreferrer';
    btn.className = 'modal-link';

    const icon = platformIcons[link.platform] || platformIcons.default;
    const platformName = link.platform.charAt(0).toUpperCase() + link.platform.slice(1);

    btn.innerHTML = `${icon}<span>${platformName}</span>`;

    return btn;
}

function setupYoutubePlayer(iframe) {
    // intentionally left minimal: we don't auto-pause audio when showing video
    // Future improvement: integrate YouTube IFrame API for better sync if desired
}

// ===============================================
// NAVIGATION
// ===============================================

function initNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Toggle mobile menu
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    // Close menu on link click
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('href').substring(1);
            scrollToSection(target);
            navMenu.classList.remove('active');

            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Update active link on scroll
    window.addEventListener('scroll', () => {
        let current = '';
        const sections = document.querySelectorAll('.section, .hero');

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (window.pageYOffset >= sectionTop - 100) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const headerHeight = document.querySelector('.header').offsetHeight;
        const sectionTop = section.offsetTop - headerHeight - 20;
        window.scrollTo({
            top: sectionTop,
            behavior: 'smooth'
        });
    }
}

// ===============================================
// SEO HELPERS
// ===============================================

function updatePageMeta(track = null) {
    if (track) {
        document.title = `${track.title} - D10G3N Live - Music streaming`;

        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.content = `Listen ${track.title} by D10G3N. ${track.year} year.`;
        }

        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) {
            ogTitle.content = `${track.title} - D10G3N Live - Music streaming`;
        }

        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage && track.cover) {
            ogImage.content = track.cover;
        }
    } else {
        document.title = 'D10G3N Live - Music streaming';

        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.content = 'D10G3N Live - Official music streaming platform made by D10G3N. Independent music, no algorithms, no trends, just sound and emotions.';
        }

        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) {
            ogTitle.content = 'D10G3N Music';
        }
    }
}

// ===============================================
// KEYBOARD SHORTCUTS
// ===============================================

document.addEventListener('keydown', (e) => {
    // Space - play/pause
    if (e.code === 'Space' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        player.togglePlay();
    }

    // Arrow left - previous track
    if (e.code === 'ArrowLeft' && e.ctrlKey) {
        e.preventDefault();
        player.playPrevious();
    }

    // Arrow right - next track
    if (e.code === 'ArrowRight' && e.ctrlKey) {
        e.preventDefault();
        player.playNext();
    }

    // Escape - close modal
    if (e.code === 'Escape') {
        closeModal();
    }
});

// ===============================================
// SERVICE WORKER (for PWA)
// ===============================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => {
            console.log('ServiceWorker registration failed:', err);
        });
    });
}

// Render links for the About section using musicData.artistLinks
function renderAboutLinks() {
    const container = document.getElementById('aboutLinks');
    if (!container) return;
    container.innerHTML = '';
    const links = (musicData.artistLinks || []);
    links.forEach(link => {
        const btn = createLinkButton(link);
        container.appendChild(btn);
    });
}

// Bootstrap: wait for DOM and musicData to be ready before initApp()
function boot() {
    const domReady = new Promise(resolve => {
        if (document.readyState === 'interactive' || document.readyState === 'complete') return resolve();
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
    });

    const dataReady = window.musicDataPromise || Promise.resolve(window.musicData);

    Promise.all([domReady, dataReady]).then(() => {
        try {
            initApp();
            // Set app version in footer
            setAppVersion();
        } catch (e) {
            console.error('initApp failed', e);
        }
    }).catch(err => {
        console.error('Boot failed', err);
        // still try to init with fallback data
        initApp();
        setAppVersion();
    });
}

// Set app version in footer
function setAppVersion() {
    const versionEl = document.getElementById('appVersion');
    if (versionEl && typeof APP_VERSION !== 'undefined') {
        versionEl.textContent = `v${APP_VERSION}`;
    }
}

boot();
