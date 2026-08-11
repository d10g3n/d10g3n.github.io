export const languages = ['en', 'ru', 'uk'] as const;
export type Language = (typeof languages)[number];

export const translations = {
  en: {
    'nav.home': 'Home', 'nav.albums': 'Albums', 'nav.tracks': 'Tracks', 'nav.about': 'About',
    'hero.title': 'Welcome to D10G3N Live', 'hero.subtitle': 'Music that speaks louder than words', 'hero.button.listen': 'Listen to music',
    'section.albums': 'Albums', 'section.tracks': 'All tracks', 'section.about': 'About project',
    'tracks.one': 'track', 'tracks.few': 'tracks', 'tracks.many': 'tracks', 'filter.all': 'All',
    'about.text1': 'This is independent music. No algorithms, no trends, no compromises, no labels, no playlists, no rules...',
    'about.text2': 'Just sound, mood, and late-night energy.', 'about.text3': "If it resonates — you're in the right place.",
    'about.text4': 'Just beats, emotions, and occasional chaos.', 'about.text5': 'Press play and see what happens.', 'about.findUs': 'Find us on',
    'player.select': 'Select track', 'modal.playNow': 'Play now', 'modal.nowPlaying': 'Now playing', 'modal.pause': 'Pause',
    'track.backToHome': 'Back to Home', 'track.album': 'Album', 'track.listenOn': 'Listen on:', 'track.lyrics': 'Lyrics', 'track.watchOnYouTube': 'Watch on YouTube',
    'footer.rights': 'All rights reserved', 'footer.privacy': 'Privacy Policy', 'footer.copyright': 'Copyright',
    'aria.toggleNav': 'Toggle navigation', 'aria.play': 'Play/Pause', 'aria.prev': 'Previous track', 'aria.next': 'Next track',
    'aria.shuffle': 'Shuffle', 'aria.repeat': 'Repeat', 'aria.volume': 'Volume', 'aria.trackActions': 'Current track actions', 'lang.select': 'Language',
  },
  ru: {
    'nav.home': 'Главная', 'nav.albums': 'Альбомы', 'nav.tracks': 'Треки', 'nav.about': 'О проекте',
    'hero.title': 'Добро пожаловать в D10G3N Live', 'hero.subtitle': 'Музыка, которая говорит громче слов', 'hero.button.listen': 'Слушать музыку',
    'section.albums': 'Альбомы', 'section.tracks': 'Все треки', 'section.about': 'О проекте',
    'tracks.one': 'трек', 'tracks.few': 'трека', 'tracks.many': 'треков', 'filter.all': 'Все',
    'about.text1': 'Это независимая музыка. Без алгоритмов, без трендов, без компромиссов, без лейблов, без плейлистов, без правил...',
    'about.text2': 'Просто звук, настроение и ночная энергия.', 'about.text3': 'Если это находит отклик — ты в правильном месте.',
    'about.text4': 'Просто биты, эмоции и немного хаоса.', 'about.text5': 'Нажми play и посмотри, что произойдёт.', 'about.findUs': 'Мы в соцсетях',
    'player.select': 'Выберите трек', 'modal.playNow': 'Воспроизвести', 'modal.nowPlaying': 'Сейчас играет', 'modal.pause': 'Пауза',
    'track.backToHome': 'Вернуться на главную', 'track.album': 'Альбом', 'track.listenOn': 'Слушать на:', 'track.lyrics': 'Текст песни', 'track.watchOnYouTube': 'Смотреть на YouTube',
    'footer.rights': 'Все права защищены', 'footer.privacy': 'Политика конфиденциальности', 'footer.copyright': 'Авторские права',
    'aria.toggleNav': 'Переключить навигацию', 'aria.play': 'Воспроизведение/Пауза', 'aria.prev': 'Предыдущий трек', 'aria.next': 'Следующий трек',
    'aria.shuffle': 'Перемешать', 'aria.repeat': 'Повтор', 'aria.volume': 'Громкость', 'aria.trackActions': 'Действия с текущим треком', 'lang.select': 'Язык',
  },
  uk: {
    'nav.home': 'Головна', 'nav.albums': 'Альбоми', 'nav.tracks': 'Треки', 'nav.about': 'Про проєкт',
    'hero.title': 'Ласкаво просимо до D10G3N Live', 'hero.subtitle': 'Музика, що говорить голосніше за слова', 'hero.button.listen': 'Слухати музику',
    'section.albums': 'Альбоми', 'section.tracks': 'Усі треки', 'section.about': 'Про проєкт',
    'tracks.one': 'трек', 'tracks.few': 'треки', 'tracks.many': 'треків', 'filter.all': 'Усі',
    'about.text1': 'Це незалежна музика. Без алгоритмів, без трендів, без компромісів, без лейблів, без плейлистів, без правил...',
    'about.text2': 'Просто звук, настрій і нічна енергія.', 'about.text3': 'Якщо це резонує — ти в правильному місці.',
    'about.text4': 'Просто біти, емоції та трохи хаосу.', 'about.text5': 'Натисни play і подивися, що станеться.', 'about.findUs': 'Ми в соцмережах',
    'player.select': 'Оберіть трек', 'modal.playNow': 'Відтворити', 'modal.nowPlaying': 'Зараз грає', 'modal.pause': 'Пауза',
    'track.backToHome': 'Повернутися на головну', 'track.album': 'Альбом', 'track.listenOn': 'Слухати на:', 'track.lyrics': 'Текст пісні', 'track.watchOnYouTube': 'Дивитися на YouTube',
    'footer.rights': 'Усі права захищені', 'footer.privacy': 'Політика конфіденційності', 'footer.copyright': 'Авторські права',
    'aria.toggleNav': 'Перемкнути навігацію', 'aria.play': 'Відтворення/Пауза', 'aria.prev': 'Попередній трек', 'aria.next': 'Наступний трек',
    'aria.shuffle': 'Перемішати', 'aria.repeat': 'Повтор', 'aria.volume': 'Гучність', 'aria.trackActions': 'Дії з поточним треком', 'lang.select': 'Мова',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function isLanguage(value: string | null | undefined): value is Language {
  return languages.includes(value as Language);
}

export function pluralizeTracks(language: Language, count: number): string {
  let form: 'one' | 'few' | 'many' = 'many';
  if (language === 'en') form = count === 1 ? 'one' : 'many';
  else {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) form = 'one';
    else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) form = 'few';
  }
  return translations[language][`tracks.${form}`];
}
