import React, { createContext, useContext, useState } from 'react';

export type Locale = 'uz' | 'ru' | 'en';

export const translations: Record<Locale, Record<string, string>> = {
  uz: {
    brandTitle: 'Sanoq Sistemalari',
    brandSubtitle: 'Kompyuterda sonlarni tasvirlash va qayta ishlash',
    navDashboard: 'Dashboard',
    navGames: 'O‘yinlar',
    navLeaderboard: 'Reyting',
    navMyResult: 'Mening natijam',
    navProfile: 'Profil',
    navAdmin: 'Admin panel',
    registerTitle: 'Ro‘yxatdan o‘tish',
    loginTitle: 'Tizimga kirish',
    firstName: 'Ism',
    lastName: 'Familiya',
    group: 'Guruh',
    email: 'Email',
    password: 'Parol',
    startBtn: 'Boshlash',
    continueBtn: 'Davom ettirish',
    rulesTitle: 'Qoidalar',
    rulesSubtitle: 'Iltimos, qoidalarni diqqat bilan o‘qing va rozi ekanligingizni tasdiqlang.',
    rulesCheckbox: 'Men yuqoridagi barcha qoidalar bilan tanishdim va roziman.',
    rulesConfirmBtn: 'Roziman va davom etish',
    totalTime: 'Umumiy vaqt',
    completed: 'Yakunlangan',
    totalScore: 'Umumiy ball',
    statusNotStarted: 'Boshlanmagan',
    statusInProgress: 'Jarayonda',
    statusCompleted: 'Tugallangan',
    statusTimeExpired: 'Vaqt tugagan',
    statusViolation: 'Qoidabuzildi',
    timeLabel: 'Vaqt',
    maxScoreLabel: 'Max ball',
    resultLabel: 'Natija',
    studentsLabel: 'Talabalar',
    completedGamesLabel: 'Bajarilgan o‘yinlar',
    timeSpentLabel: 'Sarflangan vaqt',
    accuracyLabel: 'Aniqlik',
    noRetryLabel: 'Qayta urinib bo‘lmaydi',
    loadingText: 'Yuklanmoqda...',
    networkOffline: 'Internet aloqasi uzildi. Ulanish tiklangach davom etishingiz mumkin.',
    serverError: 'Server bilan aloqa qilishda muammo yuz berdi.',
    sessionExpired: 'Seansingiz tugagan. Qayta login qiling.',
    emptyLeaderboard: 'Hozircha reyting mavjud emas.',
    allGamesDone: 'Barcha o‘yinlarni bajardingiz.',
  },
  ru: {
    brandTitle: 'Системы счисления',
    brandSubtitle: 'Представление и обработка чисел в компьютере',
    navDashboard: 'Дашборд',
    navGames: 'Игры',
    navLeaderboard: 'Рейтинг',
    navMyResult: 'Мой результат',
    navProfile: 'Профиль',
    navAdmin: 'Админ панель',
    registerTitle: 'Регистрация',
    loginTitle: 'Вход в систему',
    firstName: 'Имя',
    lastName: 'Фамилия',
    group: 'Группа',
    email: 'Email',
    password: 'Пароль',
    startBtn: 'Начать',
    continueBtn: 'Продолжить',
    rulesTitle: 'Правила',
    rulesSubtitle: 'Пожалуйста, внимательно прочитайте правила и подтвердите свое согласие.',
    rulesCheckbox: 'Я ознакомился со всеми правилами выше и согласен.',
    rulesConfirmBtn: 'Согласен и продолжить',
    totalTime: 'Общее время',
    completed: 'Завершено',
    totalScore: 'Общий балл',
    statusNotStarted: 'Не начато',
    statusInProgress: 'В процессе',
    statusCompleted: 'Завершено',
    statusTimeExpired: 'Время вышло',
    statusViolation: 'Нарушение правил',
    timeLabel: 'Время',
    maxScoreLabel: 'Макс. балл',
    resultLabel: 'Результат',
    studentsLabel: 'Студенты',
    completedGamesLabel: 'Выполненные игры',
    timeSpentLabel: 'Затраченное время',
    accuracyLabel: 'Точность',
    noRetryLabel: 'Повторная попытка невозможна',
    loadingText: 'Загрузка...',
    networkOffline: 'Соединение потеряно. Вы сможете продолжить после восстановления сети.',
    serverError: 'Возникла проблема при соединении с сервером.',
    sessionExpired: 'Ваша сессия истекла. Войдите снова.',
    emptyLeaderboard: 'Рейтинг пока пуст.',
    allGamesDone: 'Вы выполнили все игры.',
  },
  en: {
    brandTitle: 'Number Systems',
    brandSubtitle: 'Computer Number Representation & Processing',
    navDashboard: 'Dashboard',
    navGames: 'Games',
    navLeaderboard: 'Leaderboard',
    navMyResult: 'My Result',
    navProfile: 'Profile',
    navAdmin: 'Admin Panel',
    registerTitle: 'Registration',
    loginTitle: 'Sign In',
    firstName: 'First Name',
    lastName: 'Last Name',
    group: 'Group',
    email: 'Email',
    password: 'Password',
    startBtn: 'Start',
    continueBtn: 'Resume',
    rulesTitle: 'Rules',
    rulesSubtitle: 'Please read the rules carefully and confirm your agreement.',
    rulesCheckbox: 'I have read and agree to all the rules above.',
    rulesConfirmBtn: 'Agree and Continue',
    totalTime: 'Total Time',
    completed: 'Completed',
    totalScore: 'Total Score',
    statusNotStarted: 'Not Started',
    statusInProgress: 'In Progress',
    statusCompleted: 'Completed',
    statusTimeExpired: 'Time Expired',
    statusViolation: 'Rule Violated',
    timeLabel: 'Time',
    maxScoreLabel: 'Max Score',
    resultLabel: 'Result',
    studentsLabel: 'Students',
    completedGamesLabel: 'Completed Games',
    timeSpentLabel: 'Time Spent',
    accuracyLabel: 'Accuracy',
    noRetryLabel: 'Cannot be retried',
    loadingText: 'Loading...',
    networkOffline: 'Internet connection lost. You can continue once reconnected.',
    serverError: 'A problem occurred while communicating with the server.',
    sessionExpired: 'Your session has expired. Please log in again.',
    emptyLeaderboard: 'No leaderboard entries yet.',
    allGamesDone: 'You have completed all games.',
  },
};

interface I18nContextType {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: 'uz',
  setLocale: () => {},
  t: (k) => k,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem('sarvinoz_locale') as Locale | null;
    return saved && ['uz', 'ru', 'en'].includes(saved) ? saved : 'uz';
  });

  const setLocale = (loc: Locale) => {
    setLocaleState(loc);
    localStorage.setItem('sarvinoz_locale', loc);
  };

  const t = (key: string): string => {
    return translations[locale]?.[key] || translations.uz[key] || key;
  };

  return React.createElement(
    I18nContext.Provider,
    { value: { locale, setLocale, t } },
    children
  );
};

export const useI18n = () => useContext(I18nContext);
