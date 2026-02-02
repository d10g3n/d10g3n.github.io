// ===============================================
// AUDIO PLAYER CLASS
// ===============================================

class AudioPlayer {
    constructor() {
        this.audio = document.getElementById('audioElement');
        this.currentTrackIndex = -1;
        this.playlist = [];
        this.isPlaying = false;
        this.isShuffle = false;
        this.repeatMode = 'off'; // 'off', 'all', 'one'
        this.youtubePlayer = null;
        this.isYoutubePlaying = false;
        this.isSeeking = false; // Flag to prevent conflicts during seek

        // DEBUG: Intercept all currentTime changes to track who resets it
        const originalCurrentTime = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'currentTime');
        Object.defineProperty(this.audio, 'currentTime', {
            get() {
                return originalCurrentTime.get.call(this);
            },
            set(value) {
                originalCurrentTime.set.call(this, value);
            }
        });

        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        this.playerCover = document.getElementById('playerCover');
        this.playerTitle = document.getElementById('playerTitle');
        this.playerArtist = document.getElementById('playerArtist');
        this.playBtn = document.getElementById('playBtn');
        this.playIcon = document.getElementById('playIcon');
        this.pauseIcon = document.getElementById('pauseIcon');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.progressBar = document.getElementById('progressBar');
        this.progressFill = document.getElementById('progressFill');
        this.progressHandle = document.getElementById('progressHandle');
        this.currentTime = document.getElementById('currentTime');
        this.totalTime = document.getElementById('totalTime');
        this.shuffleBtn = document.getElementById('shuffleBtn');
        this.repeatBtn = document.getElementById('repeatBtn');
        this.volumeBtn = document.getElementById('volumeBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
    }

    initEventListeners() {
        // Play/Pause
        this.playBtn.addEventListener('click', () => this.togglePlay());

        // Previous/Next
        this.prevBtn.addEventListener('click', () => this.playPrevious());
        this.nextBtn.addEventListener('click', () => this.playNext());

        // Progress bar — support mouse, pointer and touch
        // Use pointerdown with pointer capture to get reliable coordinates across devices
        this.progressBar.addEventListener('click', (e) => this.seek(e));

        // Audio events
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('ended', () => this.handleTrackEnd());
        this.audio.addEventListener('play', () => this.onPlay());
        this.audio.addEventListener('pause', () => this.onPause());

        // Shuffle
        this.shuffleBtn.addEventListener('click', () => this.toggleShuffle());

        // Repeat
        this.repeatBtn.addEventListener('click', () => this.toggleRepeat());

        // Volume
        this.volumeSlider.addEventListener('input', (e) => {
            this.audio.volume = e.target.value / 100;
        });

        this.volumeBtn.addEventListener('click', () => this.toggleMute());
    }

    loadTrack(trackId, autoplay = true) {
        // Stop YouTube if playing
        this.stopYoutube();

        const track = getTrackById(trackId);
        if (!track) return;

        this.currentTrackIndex = this.playlist.findIndex(t => t.id === trackId);

        // CRITICAL: Don't reload the same track (it resets currentTime to 0!)
        const isSameTrack = this.audio.src && this.audio.src.includes(track.audioFile);

        if (!isSameTrack) {
            this.audio.src = track.audioFile;
        }

        // Update player UI with track info (includes clickable title and proper subtitle)
        if (typeof hydratePlayerUI === 'function') {
            hydratePlayerUI(track);
        } else {
            // Fallback if hydratePlayerUI not available
            this.playerCover.src = track.cover;
            this.playerCover.onerror = () => this.playerCover.src = 'assets/placeholder.svg';
            this.playerTitle.textContent = track.title;
            this.playerArtist.textContent = 'D10G3N';
            this.renderPlayerTrackActions(track);
        }

        // Update UI
        this.updateTrackUI();

        // Update playing track UI (highlight in track list)
        if (typeof updatePlayingTrackUI === 'function') {
            updatePlayingTrackUI();
        }

        // Dispatch event for modal sync
        window.dispatchEvent(new CustomEvent('playerStateChanged', {
            detail: { state: 'trackChanged', trackId: trackId, isPlaying: this.isPlaying }
        }));

        if (autoplay && !isSameTrack) {
            this.play();
        }
    }

    play() {
        this.audio.play().catch(err => {
            console.error('Playback failed:', err);
        });
    }

    pause() {
        this.audio.pause();
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    onPlay() {
        this.isPlaying = true;
        this.playIcon.style.display = 'none';
        this.pauseIcon.style.display = 'block';

        // Update playing track UI (show animation)
        if (typeof updatePlayingTrackUI === 'function') {
            updatePlayingTrackUI();
        }

        // Dispatch event for modal sync
        window.dispatchEvent(new CustomEvent('playerStateChanged', {
            detail: { state: 'play', isPlaying: true }
        }));
    }

    onPause() {
        this.isPlaying = false;
        this.playIcon.style.display = 'block';
        this.pauseIcon.style.display = 'none';

        // Update playing track UI (hide animation)
        if (typeof updatePlayingTrackUI === 'function') {
            updatePlayingTrackUI();
        }

        // Dispatch event for modal sync
        window.dispatchEvent(new CustomEvent('playerStateChanged', {
            detail: { state: 'pause', isPlaying: false }
        }));
    }

    playNext() {
        if (this.playlist.length === 0) return;

        let nextIndex;
        if (this.isShuffle) {
            nextIndex = Math.floor(Math.random() * this.playlist.length);
        } else {
            nextIndex = (this.currentTrackIndex + 1) % this.playlist.length;
        }

        this.loadTrack(this.playlist[nextIndex].id);
    }

    playPrevious() {
        if (this.playlist.length === 0) return;

        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
            return;
        }

        let prevIndex;
        if (this.currentTrackIndex === 0) {
            prevIndex = this.playlist.length - 1;
        } else {
            prevIndex = this.currentTrackIndex - 1;
        }

        this.loadTrack(this.playlist[prevIndex].id);
    }

    handleTrackEnd() {
        if (this.repeatMode === 'one') {
            this.audio.currentTime = 0;
            this.play();
        } else if (this.repeatMode === 'all' || this.currentTrackIndex < this.playlist.length - 1) {
            this.playNext();
        } else {
            this.pause();
        }
    }

    seek(e) {
        // Stop event propagation to prevent conflicts
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }

        // Check if audio is ready
        if (!this.audio || !this.audio.duration || !isFinite(this.audio.duration)) {
            return;
        }

        // Get progressBar position
        const rect = this.progressBar.getBoundingClientRect();
        if (!rect.width || rect.width <= 0) return;

        // Get click X coordinate
        const clientX = e.clientX;
        if (clientX === undefined || clientX === null) return;

        // Calculate percentage (0 to 1)
        const clickX = clientX - rect.left;
        let percent = clickX / rect.width;

        // Clamp between 0 and 1
        percent = Math.max(0, Math.min(1, percent));

        // Calculate new time
        const newTime = percent * this.audio.duration;
        if (!isFinite(newTime)) return;

        // CRITICAL: Check if audio is seekable (WAV files in Chrome often fail!)
        if (this.audio.seekable.length === 0) {
            alert('⚠️ This audio format does not support seeking in your browser.\n\nPlease convert WAV files to MP3 or OGG format for full functionality.');
            return;
        }

        // CRITICAL FIX FOR CHROME/ARC: Check readyState before setting currentTime
        // Chrome resets currentTime to 0 if readyState < 2 (HAVE_CURRENT_DATA)
        if (this.audio.readyState >= 2) {
            // Audio is ready, set time immediately
            this.isSeeking = true;

            const beforeSet = this.audio.currentTime;

            // Try fastSeek first (more reliable for problematic formats)
            if (typeof this.audio.fastSeek === 'function') {
                this.audio.fastSeek(newTime);
            } else {
                this.audio.currentTime = newTime;
            }

            const afterSet = this.audio.currentTime;

            setTimeout(() => {
                this.isSeeking = false;
            }, 100);
        } else {
            // Audio not ready yet, wait for 'canplay' event
            const setTimeWhenReady = () => {
                this.isSeeking = true;
                this.audio.currentTime = newTime;

                setTimeout(() => {
                    this.isSeeking = false;
                }, 100);

                this.audio.removeEventListener('canplay', setTimeWhenReady);
            };

            this.audio.addEventListener('canplay', setTimeWhenReady, { once: true });
        }
    }

    updateProgress() {
        // Skip updates during seek to prevent conflicts
        if (this.isSeeking) return;

        if (!this.audio.duration) return;

        const percent = (this.audio.currentTime / this.audio.duration) * 100;
        this.progressFill.style.width = percent + '%';
        this.progressHandle.style.left = percent + '%';

        this.currentTime.textContent = this.formatTime(this.audio.currentTime);
    }

    updateDuration() {
        this.totalTime.textContent = this.formatTime(this.audio.duration);
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';

        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    setPlaylist(tracks) {
        this.playlist = tracks;
    }

    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        this.shuffleBtn.classList.toggle('active', this.isShuffle);
    }

    toggleRepeat() {
        const modes = ['off', 'all', 'one'];
        const currentIndex = modes.indexOf(this.repeatMode);
        this.repeatMode = modes[(currentIndex + 1) % modes.length];

        this.repeatBtn.classList.toggle('active', this.repeatMode !== 'off');

        // Update button icon or text if needed
        if (this.repeatMode === 'one') {
            this.repeatBtn.style.color = 'var(--secondary-color)';
        } else {
            this.repeatBtn.style.color = '';
        }
    }

    toggleMute() {
        if (this.audio.volume > 0) {
            this.audio.volume = 0;
            this.volumeSlider.value = 0;
        } else {
            this.audio.volume = 1;
            this.volumeSlider.value = 100;
        }
    }

    updateTrackUI() {
        // Remove 'playing' class from all tracks
        document.querySelectorAll('.track-item').forEach(item => {
            item.classList.remove('playing');
        });

        // Add 'playing' class to current track
        const currentTrack = this.playlist[this.currentTrackIndex];
        if (currentTrack) {
            const trackElement = document.querySelector(`[data-track-id="${currentTrack.id}"]`);
            if (trackElement) {
                trackElement.classList.add('playing');
            }
        }
    }

    stopYoutube() {
        if (this.youtubePlayer && this.isYoutubePlaying) {
            this.youtubePlayer.stopVideo();
            this.isYoutubePlaying = false;
        }
    }

    renderPlayerTrackActions(track) {
        console.info('[renderPlayerTrackActions] called', track && track.id);
        let container = document.getElementById('playerTrackActions');
        if (!container) {
            // try to create and insert it into player container after .player-controls
            const playerContainer = document.querySelector('.player-container');
            const playerControls = document.querySelector('.player-controls');
            if (playerContainer && playerControls) {
                container = document.createElement('div');
                container.id = 'playerTrackActions';
                container.className = 'player-track-actions';
                // insert after playerControls
                if (playerControls.nextSibling) playerContainer.insertBefore(container, playerControls.nextSibling);
                else playerContainer.appendChild(container);
                // ensure visible
                container.style.display = 'flex';
                container.setAttribute('aria-hidden', 'false');
                console.info('[renderPlayerTrackActions] created container after .player-controls');
            } else if (playerContainer) {
                // fallback: append to playerContainer
                container = document.createElement('div');
                container.id = 'playerTrackActions';
                container.className = 'player-track-actions';
                playerContainer.appendChild(container);
                container.style.display = 'flex';
                console.info('[renderPlayerTrackActions] created container appended to .player-container');
            } else {
                console.warn('[renderPlayerTrackActions] player container not found - cannot create actions container');
                return;
            }
        }

        container.innerHTML = '';

        if (!track) return;

        // create link icons (no text)
        const links = track.links || [];
        links.forEach(link => {
            const btn = document.createElement('button');
            btn.className = 'track-action-btn';
            btn.title = link.platform;
            btn.innerHTML = (platformIcons[link.platform] || platformIcons.default);
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                window.open(link.url, '_blank', 'noopener');
            });
            container.appendChild(btn);
        });

        // info button (last)
        const infoBtn = document.createElement('button');
        infoBtn.className = 'track-action-btn info-btn';
        infoBtn.title = 'Details';
        infoBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>';
        infoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openTrackModal(track.id);
        });
        container.appendChild(infoBtn);
    }
}

// Initialize player globally (accessed by main.js)
const player = new AudioPlayer();
