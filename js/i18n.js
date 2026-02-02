// ===============================================
// INTERNATIONALIZATION MODULE
// ===============================================

const translations = {
    en: {
        // Header & Navigation
        'nav.home': 'Home',
        'nav.albums': 'Albums',
        'nav.tracks': 'Tracks',
        'nav.about': 'About',

        // Hero Section
        'hero.title': 'Welcome to D10G3N Live',
        'hero.subtitle': 'Music that speaks louder than words',
        'hero.button.listen': 'Listen to music',

        // Sections
        'section.albums': 'Albums',
        'section.tracks': 'All tracks',
        'section.about': 'About project',

        // Tracks count
        'tracks.one': 'track',
        'tracks.few': 'tracks',
        'tracks.many': 'tracks',

        // Filter
        'filter.all': 'All',

        // About Section
        'about.text1': 'This is independent music. No algorithms, no trends, no compromises, no labels, no playlists, no rules...',
        'about.text2': 'Just sound, mood, and late-night energy.',
        'about.text3': 'If it resonates — you\'re in the right place.',
        'about.text4': 'Just beats, emotions, and occasional chaos.',
        'about.text5': 'Press play and see what happens.',
        'about.findUs': 'Find us on',

        // Player
        'player.select': 'Select track',
        'player.artist': 'D10G3N',

        // Track Modal
        'modal.year': 'Year',
        'modal.releaseYear': 'Release year',
        'modal.playNow': 'Play now',
        'modal.nowPlaying': 'Now playing',
        'modal.pause': 'Pause',
        'modal.share': 'Share',
        'modal.copied': 'Copied!',
        'modal.lyrics': 'Lyrics',
        'modal.video': 'Video',
        'modal.close': 'Close',

        // Footer
        'footer.rights': 'All rights reserved',
        'footer.privacy': 'Privacy Policy',
        'footer.copyright': 'Copyright',

        // Aria Labels
        'aria.toggleNav': 'Toggle navigation',
        'aria.play': 'Play/Pause',
        'aria.prev': 'Previous track',
        'aria.next': 'Next track',
        'aria.shuffle': 'Shuffle',
        'aria.repeat': 'Repeat',
        'aria.volume': 'Volume',
        'aria.close': 'Close',
        'aria.trackActions': 'Current track actions',
        'aria.artistLinks': 'Artist links',

        // Language Selector
        'lang.select': 'Language'
    },
    ru: {
        // Header & Navigation
        'nav.home': 'Главная',
        'nav.albums': 'Альбомы',
        'nav.tracks': 'Треки',
        'nav.about': 'О проекте',

        // Hero Section
        'hero.title': 'Добро пожаловать в D10G3N Live',
        'hero.subtitle': 'Музыка, которая говорит громче слов',
        'hero.button.listen': 'Слушать музыку',

        // Sections
        'section.albums': 'Альбомы',
        'section.tracks': 'Все треки',
        'section.about': 'О проекте',

        // Tracks count (русская плюрализация: 1 трек, 2-4 трека, 5+ треков)
        'tracks.one': 'трек',
        'tracks.few': 'трека',
        'tracks.many': 'треков',

        // Filter
        'filter.all': 'Все',

        // About Section
        'about.text1': 'Это независимая музыка. Без алгоритмов, без трендов, без компромиссов, без лейблов, без плейлистов, без правил...',
        'about.text2': 'Просто звук, настроение и ночная энергия.',
        'about.text3': 'Если это находит отклик — ты в правильном месте.',
        'about.text4': 'Просто биты, эмоции и немного хаоса.',
        'about.text5': 'Нажми play и посмотри, что произойдёт.',
        'about.findUs': 'Мы в соцсетях',

        // Player
        'player.select': 'Выберите трек',
        'player.artist': 'D10G3N',

        // Track Modal
        'modal.year': 'Год',
        'modal.releaseYear': 'Год выпуска',
        'modal.playNow': 'Воспроизвести',
        'modal.nowPlaying': 'Сейчас играет',
        'modal.pause': 'Пауза',
        'modal.share': 'Поделиться',
        'modal.copied': 'Скопировано!',
        'modal.lyrics': 'Текст песни',
        'modal.video': 'Видео',
        'modal.close': 'Закрыть',

        // Footer
        'footer.rights': 'Все права защищены',
        'footer.privacy': 'Политика конфиденциальности',
        'footer.copyright': 'Авторские права',

        // Aria Labels
        'aria.toggleNav': 'Переключить навигацию',
        'aria.play': 'Воспроизведение/Пауза',
        'aria.prev': 'Предыдущий трек',
        'aria.next': 'Следующий трек',
        'aria.shuffle': 'Перемешать',
        'aria.repeat': 'Повтор',
        'aria.volume': 'Громкость',
        'aria.close': 'Закрыть',
        'aria.trackActions': 'Действия с текущим треком',
        'aria.artistLinks': 'Ссылки на артиста',

        // Language Selector
        'lang.select': 'Язык'
    },
    uk: {
        // Header & Navigation
        'nav.home': 'Головна',
        'nav.albums': 'Альбоми',
        'nav.tracks': 'Треки',
        'nav.about': 'Про проєкт',

        // Hero Section
        'hero.title': 'Ласкаво просимо до D10G3N Live',
        'hero.subtitle': 'Музика, що говорить голосніше за слова',
        'hero.button.listen': 'Слухати музику',

        // Sections
        'section.albums': 'Альбоми',
        'section.tracks': 'Усі треки',
        'section.about': 'Про проєкт',

        // Tracks count (украинская плюрализация: 1 трек, 2-4 треки, 5+ треків)
        'tracks.one': 'трек',
        'tracks.few': 'треки',
        'tracks.many': 'треків',

        // Filter
        'filter.all': 'Усі',

        // About Section
        'about.text1': 'Це незалежна музика. Без алгоритмів, без трендів, без компромісів, без лейблів, без плейлистів, без правил...',
        'about.text2': 'Просто звук, настрій і нічна енергія.',
        'about.text3': 'Якщо це резонує — ти в правильному місці.',
        'about.text4': 'Просто біти, емоції та трохи хаосу.',
        'about.text5': 'Натисни play і подивися, що станеться.',
        'about.findUs': 'Ми в соцмережах',

        // Player
        'player.select': 'Оберіть трек',
        'player.artist': 'D10G3N',

        // Track Modal
        'modal.year': 'Рік',
        'modal.releaseYear': 'Рік випуску',
        'modal.playNow': 'Відтворити',
        'modal.nowPlaying': 'Зараз грає',
        'modal.pause': 'Пауза',
        'modal.share': 'Поділитися',
        'modal.copied': 'Скопійовано!',
        'modal.lyrics': 'Текст пісні',
        'modal.video': 'Відео',
        'modal.close': 'Закрити',

        // Footer
        'footer.rights': 'Усі права захищені',
        'footer.privacy': 'Політика конфіденційності',
        'footer.copyright': 'Авторські права',

        // Aria Labels
        'aria.toggleNav': 'Перемкнути навігацію',
        'aria.play': 'Відтворення/Пауза',
        'aria.prev': 'Попередній трек',
        'aria.next': 'Наступний трек',
        'aria.shuffle': 'Перемішати',
        'aria.repeat': 'Повтор',
        'aria.volume': 'Гучність',
        'aria.close': 'Закрити',
        'aria.trackActions': 'Дії з поточним треком',
        'aria.artistLinks': 'Посилання на артиста',

        // Language Selector
        'lang.select': 'Мова'
    }
};

class I18n {
    constructor() {
        this.translations = translations; // СНАЧАЛА присваиваем translations
        this.currentLang = this.detectLanguage(); // ПОТОМ вызываем detectLanguage
    }

    detectLanguage() {
        // Check localStorage first
        const saved = localStorage.getItem('d10g3n_language');
        if (saved && this.translations[saved]) {
            return saved;
        }

        // Detect from browser
        const browserLang = navigator.language || navigator.userLanguage;
        const langCode = browserLang.split('-')[0].toLowerCase();

        // Map language codes
        if (langCode === 'ru') return 'ru';
        if (langCode === 'uk') return 'uk';
        return 'en'; // Default to English
    }

    setLanguage(lang) {
        if (!this.translations[lang]) {
            console.warn(`Language ${lang} not supported`);
            return;
        }

        this.currentLang = lang;
        localStorage.setItem('d10g3n_language', lang);

        // Update HTML lang attribute
        document.documentElement.lang = this.getLangAttribute(lang);

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));

        // Update UI
        this.updateUI();
    }

    getLangAttribute(lang) {
        const langMap = {
            'en': 'en',
            'ru': 'ru',
            'uk': 'uk'
        };
        return langMap[lang] || 'en';
    }

    t(key) {
        const translation = this.translations[this.currentLang]?.[key];
        if (!translation) {
            console.warn(`Translation key "${key}" not found for language "${this.currentLang}"`);
            return key;
        }
        return translation;
    }

    // Pluralization for tracks count
    pluralize(count, baseKey) {
        let pluralForm;

        if (this.currentLang === 'en') {
            // English: 1 track, 2+ tracks
            pluralForm = count === 1 ? 'one' : 'many';
        } else if (this.currentLang === 'ru' || this.currentLang === 'uk') {
            // Russian/Ukrainian: 1 трек, 2-4 трека/треки, 5+ треків/треков
            const mod10 = count % 10;
            const mod100 = count % 100;

            if (mod10 === 1 && mod100 !== 11) {
                pluralForm = 'one';
            } else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
                pluralForm = 'few';
            } else {
                pluralForm = 'many';
            }
        } else {
            pluralForm = 'many';
        }

        return this.t(`${baseKey}.${pluralForm}`);
    }

    updateUI() {
        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);

            // Check if element has data-i18n-attr to update attribute instead of text
            const attr = element.getAttribute('data-i18n-attr');
            if (attr) {
                element.setAttribute(attr, translation);
            } else {
                element.textContent = translation;
            }
        });

        // Update all elements with data-i18n-html attribute (for HTML content)
        document.querySelectorAll('[data-i18n-html]').forEach(element => {
            const key = element.getAttribute('data-i18n-html');
            const translation = this.t(key);
            element.innerHTML = translation;
        });

        // Update language selector
        this.updateLanguageSelector();

        // Trigger re-render if needed (e.g., for dynamically loaded content)
        window.dispatchEvent(new Event('i18nUpdated'));
    }

    updateLanguageSelector() {
        const selector = document.getElementById('langSelect');
        if (selector) {
            selector.value = this.currentLang;
        }
    }

    getCurrentLanguage() {
        return this.currentLang;
    }

    getSupportedLanguages() {
        return Object.keys(this.translations);
    }

    getLanguageName(langCode) {
        const names = {
            'en': 'English',
            'ru': 'Русский',
            'uk': 'Українська'
        };
        return names[langCode] || langCode;
    }
}

// Create global instance
// Always recreate on page load to ensure fresh state
window.i18n = new I18n();

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.i18n.updateUI();
    });
} else {
    // DOM already loaded
    window.i18n.updateUI();
}

// Debug: log that i18n is loaded
console.log('[i18n] Loaded, current language:', window.i18n.getCurrentLanguage());
