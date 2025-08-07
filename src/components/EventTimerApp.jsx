import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Plus, Settings, Sun, Moon, Calendar, Clock, Edit, Trash2, X, Image as ImageIcon, Upload, Home, List } from 'lucide-react';

const EventTimerApp = () => {
  const { useStoredState } = hatch;

  // Состояния
  const [events, setEvents] = useStoredState('events', []);
  const [settings, setSettings] = useStoredState('settings', {
    theme: 'light',
    soundEnabled: true,
    desktopNotifications: true,
    notificationDays: [1, 3, 7], // за 1 день, 3 дня, неделю
    backgroundImage: null
  });
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('home'); // home, events, calendar

  // Форма события
  const [eventForm, setEventForm] = useState({
    name: '',
    date: '',
    time: '',
    repeat: 'none',
    repeatInterval: 1
  });

  // Предустановленные фоновые изображения
  const backgroundImages = [
    { id: 'gradient1', name: 'Фиолетовый градиент', url: 'keys/purple-gradient?prompt=abstract%20purple%20gradient%20background%20with%20dark%20tones' },
    { id: 'gradient2', name: 'Розовый градиент', url: 'keys/pink-gradient?prompt=abstract%20pink%20and%20purple%20gradient%20background' },
    { id: 'gradient3', name: 'Космический', url: 'keys/space-gradient?prompt=dark%20space%20background%20with%20purple%20pink%20nebula%20and%20stars' },
    { id: 'gradient4', name: 'Абстракция', url: 'keys/abstract-purple?prompt=abstract%20purple%20pink%20black%20geometric%20background' }
  ];

  // Обновление времени каждую секунду
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Проверка уведомлений
  useEffect(() => {
    const checkNotifications = () => {
      const now = new Date();
      const newNotifications = [];

      events.forEach(event => {
        const eventDate = new Date(event.date);
        const timeDiff = eventDate.getTime() - now.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        settings.notificationDays.forEach(days => {
          if (daysDiff === days && timeDiff > 0) {
            newNotifications.push({
              id: `${event.id}-${days}`,
              eventName: event.name,
              daysLeft: days,
              eventDate: eventDate
            });
          }
        });
      });

      if (newNotifications.length > 0) {
        setNotifications(prev => [...prev, ...newNotifications]);
        
        if (settings.desktopNotifications) {
          newNotifications.forEach(notification => {
            if ('Notification' in window) {
              new Notification(`Напоминание о событии`, {
                body: `"${notification.eventName}" через ${notification.daysLeft} ${getDaysText(notification.daysLeft)}`,
                icon: '🔔'
              });
            }
          });
        }
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 60000);
    return () => clearInterval(interval);
  }, [events, settings.notificationDays, settings.desktopNotifications]);

  const getDaysText = (days) => {
    if (days === 1) return 'день';
    if (days < 5) return 'дня';
    return 'дней';
  };

  const formatTimeRemaining = (targetDate) => {
    const now = currentTime;
    const target = new Date(targetDate);
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) {
      return { text: 'Событие прошло', expired: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      text: `${days} дн. ${hours.toString().padStart(2, '0')} ч. ${minutes.toString().padStart(2, '0')} мин. ${seconds.toString().padStart(2, '0')} сек.`,
      expired: false,
      urgent: days === 0 && hours < 24
    };
  };

  const addEvent = () => {
    const newEvent = {
      id: Date.now(),
      name: eventForm.name,
      date: `${eventForm.date}T${eventForm.time || '00:00'}`,
      repeat: eventForm.repeat,
      repeatInterval: parseInt(eventForm.repeatInterval) || 1
    };

    setEvents([...events, newEvent]);
    resetForm();
    setShowAddEventModal(false);
  };

  const updateEvent = () => {
    setEvents(events.map(event => 
      event.id === editingEvent.id 
        ? { ...event, name: eventForm.name, date: `${eventForm.date}T${eventForm.time || '00:00'}`, repeat: eventForm.repeat, repeatInterval: parseInt(eventForm.repeatInterval) || 1 }
        : event
    ));
    resetForm();
    setShowAddEventModal(false);
    setEditingEvent(null);
  };

  const deleteEvent = (id) => {
    setEvents(events.filter(event => event.id !== id));
  };

  const resetForm = () => {
    setEventForm({
      name: '',
      date: '',
      time: '',
      repeat: 'none',
      repeatInterval: 1
    });
  };

  const openEditModal = (event) => {
    const eventDate = new Date(event.date);
    setEventForm({
      name: event.name,
      date: eventDate.toISOString().split('T')[0],
      time: eventDate.toTimeString().slice(0, 5),
      repeat: event.repeat || 'none',
      repeatInterval: event.repeatInterval || 1
    });
    setEditingEvent(event);
    setShowAddEventModal(true);
  };

  const toggleTheme = () => {
    setSettings(prev => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light'
    }));
  };

  const setBackgroundImage = (imageUrl) => {
    setSettings(prev => ({
      ...prev,
      backgroundImage: imageUrl
    }));
    setShowBackgroundModal(false);
  };

  const handleCustomImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBackgroundImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const generateCalendar = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay() + 1);

    const days = [];
    const today = new Date();

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const hasEvent = events.some(event => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === date.toDateString();
      });

      const isToday = date.toDateString() === today.toDateString();
      const isCurrentMonth = date.getMonth() === currentMonth;

      days.push({
        date,
        day: date.getDate(),
        hasEvent,
        isToday,
        isCurrentMonth
      });
    }

    return days;
  };

  const isDark = settings.theme === 'dark';
  
  // Улучшенные градиентные стили в фиолетово-розово-черных тонах
  const themeClasses = isDark 
    ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white' 
    : 'bg-gradient-to-br from-purple-50 via-pink-50 to-white text-gray-900';

  const cardClasses = isDark 
    ? 'bg-gradient-to-br from-purple-800/20 via-pink-800/20 to-gray-800/20 border-purple-500/30 backdrop-blur-lg' 
    : 'bg-gradient-to-br from-white/80 via-purple-50/80 to-pink-50/80 border-purple-200 backdrop-blur-lg';

  const buttonClasses = isDark
    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600';

  const headerButtonClasses = isDark
    ? 'bg-gradient-to-r from-purple-700/50 to-pink-700/50 hover:from-purple-600/50 hover:to-pink-600/50 backdrop-blur-sm border border-purple-500/30'
    : 'bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 border border-purple-300';

  const backgroundStyle = settings.backgroundImage ? {
    backgroundImage: `url(${settings.backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  } : {};

  // Компонент для отображения главной страницы
  const HomeTab = () => (
    <>
      {/* Header мобильный */}
      <div className={`flex items-center justify-between mb-4 p-4 rounded-2xl border ${cardClasses} shadow-lg`}>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          <Clock className="w-6 h-6 md:w-8 md:h-8 text-purple-500" />
          Event Timer
        </h1>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotificationModal(true)}
            className={`p-2 md:p-3 rounded-xl transition-all duration-300 ${headerButtonClasses} relative shadow-lg hover:shadow-xl`}
          >
            <Bell className="w-5 h-5 md:w-6 md:h-6" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse shadow-lg">
                {notifications.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setShowSettingsModal(true)}
            className={`p-2 md:p-3 rounded-xl transition-all duration-300 ${headerButtonClasses} shadow-lg hover:shadow-xl`}
          >
            <Settings className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>
      </div>

      {/* Event Timers - стек на мобильных */}
      <div className="space-y-4 mb-6">
        {events.slice(0, 3).map(event => {
          const timeRemaining = formatTimeRemaining(event.date);
          return (
            <div
              key={event.id}
              className={`p-4 md:p-6 rounded-2xl border transition-all duration-300 ${cardClasses} shadow-xl hover:shadow-2xl ${
                timeRemaining.urgent ? 'ring-2 ring-red-400 animate-pulse' : ''
              } ${timeRemaining.expired ? 'opacity-60' : ''}`}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg md:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex-1 pr-2">{event.name}</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(event)}
                    className={`p-1.5 md:p-2 rounded-lg transition-all duration-300 ${headerButtonClasses} hover:scale-110`}
                  >
                    <Edit className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
                  <button
                    onClick={() => deleteEvent(event.id)}
                    className="p-1.5 md:p-2 rounded-lg bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 border border-red-400/30 transition-all duration-300 hover:scale-110"
                  >
                    <Trash2 className="w-3 h-3 md:w-4 md:h-4 text-red-400" />
                  </button>
                </div>
              </div>
              
              <div className={`text-xl md:text-2xl font-mono font-bold mb-2 ${
                timeRemaining.expired ? 'text-red-400' : 
                timeRemaining.urgent ? 'text-orange-400' : 'text-green-400'
              } drop-shadow-lg`}>
                {timeRemaining.text}
              </div>
              
              <div className="text-xs md:text-sm opacity-70 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-medium">
                {new Date(event.date).toLocaleString('ru-RU')}
              </div>
            </div>
          );
        })}
      </div>

      {events.length === 0 && (
        <div className={`text-center py-12 md:py-16 rounded-2xl border-2 border-dashed ${isDark ? 'border-purple-500/30' : 'border-purple-300'} ${cardClasses} shadow-xl`}>
          <Calendar className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 md:mb-6 opacity-50 text-purple-500" />
          <p className="text-lg md:text-2xl opacity-70 mb-4 md:mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">Пока нет событий</p>
          <button
            onClick={() => setShowAddEventModal(true)}
            className={`${buttonClasses} text-white px-6 py-3 md:px-8 md:py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-semibold`}
          >
            Добавить первое событие
          </button>
        </div>
      )}

      {events.length > 3 && (
        <div className="text-center">
          <button
            onClick={() => setActiveTab('events')}
            className={`${buttonClasses} text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-semibold`}
          >
            Показать все события ({events.length})
          </button>
        </div>
      )}
    </>
  );

  // Компонент для отображения всех событий
  const EventsTab = () => (
    <>
      <div className={`flex items-center justify-between mb-4 p-4 rounded-2xl border ${cardClasses} shadow-lg`}>
        <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Все события ({events.length})
        </h2>
        <button
          onClick={() => setShowAddEventModal(true)}
          className={`${buttonClasses} text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-semibold`}
        >
          <Plus className="w-4 h-4" />
          Добавить
        </button>
      </div>

      <div className="space-y-4">
        {events.map(event => {
          const timeRemaining = formatTimeRemaining(event.date);
          return (
            <div
              key={event.id}
              className={`p-4 rounded-2xl border transition-all duration-300 ${cardClasses} shadow-lg hover:shadow-xl ${
                timeRemaining.urgent ? 'ring-2 ring-red-400 animate-pulse' : ''
              } ${timeRemaining.expired ? 'opacity-60' : ''}`}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex-1 pr-2">{event.name}</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(event)}
                    className={`p-1.5 rounded-lg transition-all duration-300 ${headerButtonClasses} hover:scale-110`}
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteEvent(event.id)}
                    className="p-1.5 rounded-lg bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 border border-red-400/30 transition-all duration-300 hover:scale-110"
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                </div>
              </div>
              
              <div className={`text-lg font-mono font-bold mb-2 ${
                timeRemaining.expired ? 'text-red-400' : 
                timeRemaining.urgent ? 'text-orange-400' : 'text-green-400'
              } drop-shadow-lg`}>
                {timeRemaining.text}
              </div>
              
              <div className="text-xs opacity-70 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-medium">
                {new Date(event.date).toLocaleString('ru-RU')}
              </div>
            </div>
          );
        })}
      </div>

      {events.length === 0 && (
        <div className={`text-center py-12 rounded-2xl border-2 border-dashed ${isDark ? 'border-purple-500/30' : 'border-purple-300'} ${cardClasses} shadow-xl`}>
          <List className="w-12 h-12 mx-auto mb-4 opacity-50 text-purple-500" />
          <p className="text-lg opacity-70 mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">Список событий пуст</p>
          <button
            onClick={() => setShowAddEventModal(true)}
            className={`${buttonClasses} text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-semibold`}
          >
            Добавить событие
          </button>
        </div>
      )}
    </>
  );

  // Компонент календаря
  const CalendarTab = () => (
    <div className={`p-4 md:p-6 rounded-2xl border ${cardClasses} shadow-xl`}>
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Календарь</h2>
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => {
              if (currentMonth === 0) {
                setCurrentMonth(11);
                setCurrentYear(currentYear - 1);
              } else {
                setCurrentMonth(currentMonth - 1);
              }
            }}
            className={`p-2 md:p-3 rounded-xl transition-all duration-300 ${headerButtonClasses} shadow-lg hover:shadow-xl hover:scale-105`}
          >
            ←
          </button>
          
          <span className="text-sm md:text-lg font-bold min-w-32 md:min-w-48 text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {new Date(currentYear, currentMonth).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
          </span>
          
          <button
            onClick={() => {
              if (currentMonth === 11) {
                setCurrentMonth(0);
                setCurrentYear(currentYear + 1);
              } else {
                setCurrentMonth(currentMonth + 1);
              }
            }}
            className={`p-2 md:p-3 rounded-xl transition-all duration-300 ${headerButtonClasses} shadow-lg hover:shadow-xl hover:scale-105`}
          >
            →
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 md:mb-4">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
          <div key={day} className="p-2 md:p-3 text-center text-xs md:text-sm font-bold opacity-70 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {generateCalendar().map((day, index) => (
          <div
            key={index}
            className={`p-2 md:p-3 text-center text-xs md:text-sm cursor-pointer rounded-lg md:rounded-xl transition-all duration-300 min-h-8 md:min-h-12 flex items-center justify-center relative hover:scale-105 ${
              !day.isCurrentMonth ? 'opacity-30' :
              day.isToday ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' :
              day.hasEvent ? 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-300 font-bold border border-green-400/50' :
              isDark ? 'hover:bg-gradient-to-r hover:from-purple-600/30 hover:to-pink-600/30' : 'hover:bg-gradient-to-r hover:from-purple-200/50 hover:to-pink-200/50'
            } shadow-md hover:shadow-lg`}
            onClick={() => {
              setEventForm(prev => ({
                ...prev,
                date: day.date.toISOString().split('T')[0]
              }));
              setShowAddEventModal(true);
            }}
          >
            {day.day}
            {day.hasEvent && (
              <div className="absolute bottom-0.5 md:bottom-1 left-1/2 transform -translate-x-1/2 w-1 md:w-2 h-1 md:h-2 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse shadow-lg"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div 
      className={`min-h-screen transition-all duration-300 ${themeClasses} relative pb-20`}
      style={backgroundStyle}
    >
      {/* Overlay для лучшей читаемости на фоне изображения */}
      {settings.backgroundImage && (
        <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-purple-900/20 to-black/30 pointer-events-none"></div>
      )}
      
      {/* Основной контент с отступом снизу для навигации */}
      <div className="p-4 max-w-md mx-auto relative z-10">
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'events' && <EventsTab />}
        {activeTab === 'calendar' && <CalendarTab />}
      </div>

      {/* Плавающая кнопка добавления события */}
      <button
        onClick={() => setShowAddEventModal(true)}
        className={`fixed bottom-24 right-4 ${buttonClasses} text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 z-30`}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Мобильная навигация внизу */}
      <div className={`fixed bottom-0 left-0 right-0 ${cardClasses} border-t backdrop-blur-lg z-40`}>
        <div className="flex items-center justify-around py-2 safe-area-inset-bottom">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 ${
              activeTab === 'home' 
                ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 scale-105' 
                : 'hover:bg-purple-500/10'
            }`}
          >
            <Home className={`w-6 h-6 mb-1 ${
              activeTab === 'home' 
                ? 'text-purple-500' 
                : isDark ? 'text-gray-400' : 'text-gray-600'
            }`} />
            <span className={`text-xs font-medium ${
              activeTab === 'home' 
                ? 'text-purple-500' 
                : isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Главная
            </span>
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 relative ${
              activeTab === 'events' 
                ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 scale-105' 
                : 'hover:bg-purple-500/10'
            }`}
          >
            <List className={`w-6 h-6 mb-1 ${
              activeTab === 'events' 
                ? 'text-purple-500' 
                : isDark ? 'text-gray-400' : 'text-gray-600'
            }`} />
            <span className={`text-xs font-medium ${
              activeTab === 'events' 
                ? 'text-purple-500' 
                : isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              События
            </span>
            {events.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {events.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 ${
              activeTab === 'calendar' 
                ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 scale-105' 
                : 'hover:bg-purple-500/10'
            }`}
          >
            <Calendar className={`w-6 h-6 mb-1 ${
              activeTab === 'calendar' 
                ? 'text-purple-500' 
                : isDark ? 'text-gray-400' : 'text-gray-600'
            }`} />
            <span className={`text-xs font-medium ${
              activeTab === 'calendar' 
                ? 'text-purple-500' 
                : isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Календарь
            </span>
          </button>

          <button
            onClick={() => setShowNotificationModal(true)}
            className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 relative hover:bg-purple-500/10`}
          >
            <Bell className={`w-6 h-6 mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
            <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Звонок
            </span>
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {notifications.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Background Selection Modal */}
      {showBackgroundModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl ${cardClasses} p-6 md:p-8 max-h-screen overflow-y-auto`}>
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
                <ImageIcon className="w-5 h-5 md:w-6 md:h-6 text-purple-500" />
                Выбор фона
              </h3>
              <button
                onClick={() => setShowBackgroundModal(false)}
                className={`p-2 rounded-xl transition-all duration-300 ${headerButtonClasses} hover:scale-105`}
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
              {/* Убрать фон */}
              <div
                onClick={() => setBackgroundImage(null)}
                className={`aspect-square rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 flex items-center justify-center ${
                  !settings.backgroundImage ? 'border-purple-500 bg-gradient-to-br from-purple-500/20 to-pink-500/20' : 'border-purple-300/30 bg-gradient-to-br from-gray-200 to-gray-300'
                } shadow-lg hover:shadow-xl`}
              >
                <X className="w-6 h-6 md:w-8 md:h-8 text-gray-500" />
              </div>
              
              {/* Предустановленные фоны */}
              {backgroundImages.map(bg => (
                <div
                  key={bg.id}
                  onClick={() => setBackgroundImage(bg.url)}
                  className={`aspect-square rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                    settings.backgroundImage === bg.url ? 'border-purple-500' : 'border-purple-300/30'
                  } shadow-lg hover:shadow-xl overflow-hidden`}
                  style={{
                    backgroundImage: `url(${bg.url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="w-full h-full bg-gradient-to-t from-black/50 to-transparent flex items-end p-2">
                    <span className="text-white text-xs font-medium">{bg.name}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-purple-300/30 pt-4 md:pt-6">
              <label className="block text-sm font-medium mb-3">Загрузить собственное изображение:</label>
              <div className="flex flex-col gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCustomImageUpload}
                  className="hidden"
                  id="background-upload"
                />
                <label
                  htmlFor="background-upload"
                  className={`${buttonClasses} text-white px-4 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-semibold`}
                >
                  <Upload className="w-5 h-5" />
                  Выбрать файл
                </label>
                <span className="text-xs opacity-70 text-center">JPG, PNG, GIF до 10MB</span>
              </div>
            </div>

            <div className="flex justify-end mt-6 md:mt-8">
              <button
                onClick={() => setShowBackgroundModal(false)}
                className={`${buttonClasses} text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-semibold`}
              >
                Готово
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl ${cardClasses} p-6 md:p-8 max-h-screen overflow-y-auto`}>
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {editingEvent ? 'Редактировать событие' : 'Новое событие'}
              </h3>
              <button
                onClick={() => {
                  setShowAddEventModal(false);
                  setEditingEvent(null);
                  resetForm();
                }}
                className={`p-2 rounded-xl transition-all duration-300 ${headerButtonClasses} hover:scale-105`}
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            <div className="space-y-4 md:space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2 md:mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Название</label>
                <input
                  type="text"
                  value={eventForm.name}
                  onChange={(e) => setEventForm(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full p-3 md:p-4 rounded-xl border-2 transition-all duration-300 ${
                    isDark 
                      ? 'bg-gray-800/50 border-purple-500/30 focus:border-purple-400 backdrop-blur-sm' 
                      : 'bg-white/80 border-purple-300 focus:border-purple-500 backdrop-blur-sm'
                  } focus:outline-none focus:ring-4 focus:ring-purple-500/20 shadow-lg`}
                  placeholder="Введите название события"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2 md:mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Дата</label>
                  <input
                    type="date"
                    value={eventForm.date}
                    onChange={(e) => setEventForm(prev => ({ ...prev, date: e.target.value }))}
                    className={`w-full p-3 md:p-4 rounded-xl border-2 transition-all duration-300 ${
                      isDark 
                        ? 'bg-gray-800/50 border-purple-500/30 focus:border-purple-400 backdrop-blur-sm' 
                        : 'bg-white/80 border-purple-300 focus:border-purple-500 backdrop-blur-sm'
                    } focus:outline-none focus:ring-4 focus:ring-purple-500/20 shadow-lg`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 md:mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Время</label>
                  <input
                    type="time"
                    value={eventForm.time}
                    onChange={(e) => setEventForm(prev => ({ ...prev, time: e.target.value }))}
                    className={`w-full p-3 md:p-4 rounded-xl border-2 transition-all duration-300 ${
                      isDark 
                        ? 'bg-gray-800/50 border-purple-500/30 focus:border-purple-400 backdrop-blur-sm' 
                        : 'bg-white/80 border-purple-300 focus:border-purple-500 backdrop-blur-sm'
                    } focus:outline-none focus:ring-4 focus:ring-purple-500/20 shadow-lg`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2 md:mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Повторение</label>
                  <select
                    value={eventForm.repeat}
                    onChange={(e) => setEventForm(prev => ({ ...prev, repeat: e.target.value }))}
                    className={`w-full p-3 md:p-4 rounded-xl border-2 transition-all duration-300 ${
                      isDark 
                        ? 'bg-gray-800/50 border-purple-500/30 focus:border-purple-400 backdrop-blur-sm' 
                        : 'bg-white/80 border-purple-300 focus:border-purple-500 backdrop-blur-sm'
                    } focus:outline-none focus:ring-4 focus:ring-purple-500/20 shadow-lg`}
                  >
                    <option value="none">Не повторять</option>
                    <option value="daily">Ежедневно</option>
                    <option value="weekly">Еженедельно</option>
                    <option value="monthly">Ежемесячно</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 md:mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Интервал</label>
                  <input
                    type="number"
                    min="1"
                    value={eventForm.repeatInterval}
                    onChange={(e) => setEventForm(prev => ({ ...prev, repeatInterval: e.target.value }))}
                    className={`w-full p-3 md:p-4 rounded-xl border-2 transition-all duration-300 ${
                      isDark 
                        ? 'bg-gray-800/50 border-purple-500/30 focus:border-purple-400 backdrop-blur-sm' 
                        : 'bg-white/80 border-purple-300 focus:border-purple-500 backdrop-blur-sm'
                    } focus:outline-none focus:ring-4 focus:ring-purple-500/20 shadow-lg`}
                    placeholder="1"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 md:gap-4 mt-6 md:mt-8">
              <button
                onClick={() => {
                  setShowAddEventModal(false);
                  setEditingEvent(null);
                  resetForm();
                }}
                className={`flex-1 py-3 md:py-4 px-4 md:px-6 rounded-xl border-2 transition-all duration-300 ${
                  isDark 
                    ? 'border-purple-500/30 hover:bg-purple-600/10 backdrop-blur-sm' 
                    : 'border-purple-300 hover:bg-purple-50 backdrop-blur-sm'
                } shadow-lg hover:shadow-xl hover:scale-105 font-semibold`}
              >
                Отмена
              </button>
              <button
                onClick={editingEvent ? updateEvent : addEvent}
                disabled={!eventForm.name || !eventForm.date}
                className={`flex-1 py-3 md:py-4 px-4 md:px-6 rounded-xl ${buttonClasses} text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 font-semibold`}
              >
                {editingEvent ? 'Обновить' : 'Добавить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl ${cardClasses} p-6 md:p-8 max-h-screen overflow-y-auto`}>
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
                <Bell className="w-5 h-5 md:w-6 md:h-6 text-purple-500" />
                Уведомления
              </h3>
              <button
                onClick={() => setShowNotificationModal(false)}
                className={`p-2 rounded-xl transition-all duration-300 ${headerButtonClasses} hover:scale-105`}
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            <div className="space-y-4 md:space-y-6">
              <div>
                <label className="block text-sm font-bold mb-3 md:mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Уведомлять за (дни)</label>
                <div className="space-y-2 md:space-y-3">
                  {[1, 3, 7, 14, 30].map(days => (
                    <label key={days} className="flex items-center p-2 md:p-3 rounded-xl bg-gradient-to-r from-purple-100/10 to-pink-100/10 backdrop-blur-sm border border-purple-300/20 hover:border-purple-400/40 transition-all duration-300">
                      <input
                        type="checkbox"
                        checked={settings.notificationDays.includes(days)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSettings(prev => ({
                              ...prev,
                              notificationDays: [...prev.notificationDays, days].sort((a, b) => a - b)
                            }));
                          } else {
                            setSettings(prev => ({
                              ...prev,
                              notificationDays: prev.notificationDays.filter(d => d !== days)
                            }));
                          }
                        }}
                        className="mr-3 md:mr-4 w-4 h-4 md:w-5 md:h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                      />
                      <span className="font-medium text-sm md:text-base">{days} {getDaysText(days)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2 md:space-y-3">
                <label className="flex items-center p-2 md:p-3 rounded-xl bg-gradient-to-r from-purple-100/10 to-pink-100/10 backdrop-blur-sm border border-purple-300/20 hover:border-purple-400/40 transition-all duration-300">
                  <input
                    type="checkbox"
                    checked={settings.desktopNotifications}
                    onChange={(e) => setSettings(prev => ({ ...prev, desktopNotifications: e.target.checked }))}
                    className="mr-3 md:mr-4 w-4 h-4 md:w-5 md:h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="font-medium text-sm md:text-base">Показывать системные уведомления</span>
                </label>

                <label className="flex items-center p-2 md:p-3 rounded-xl bg-gradient-to-r from-purple-100/10 to-pink-100/10 backdrop-blur-sm border border-purple-300/20 hover:border-purple-400/40 transition-all duration-300">
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => setSettings(prev => ({ ...prev, soundEnabled: e.target.checked }))}
                    className="mr-3 md:mr-4 w-4 h-4 md:w-5 md:h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="font-medium text-sm md:text-base">Звуковые уведомления</span>
                </label>

                <div className="p-2 md:p-3 rounded-xl bg-gradient-to-r from-purple-100/10 to-pink-100/10 backdrop-blur-sm border border-purple-300/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm md:text-base">Тема оформления</span>
                    <button
                      onClick={toggleTheme}
                      className={`p-2 rounded-lg transition-all duration-300 ${headerButtonClasses} hover:scale-105`}
                    >
                      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSettings(prev => ({ ...prev, theme: 'light' }))}
                      className={`flex-1 p-2 rounded-lg border transition-all duration-300 text-sm font-medium ${
                        settings.theme === 'light' 
                          ? 'border-purple-500 bg-gradient-to-r from-purple-500/20 to-pink-500/20' 
                          : 'border-purple-300/30 hover:border-purple-400/50'
                      }`}
                    >
                      Светлая
                    </button>
                    <button
                      onClick={() => setSettings(prev => ({ ...prev, theme: 'dark' }))}
                      className={`flex-1 p-2 rounded-lg border transition-all duration-300 text-sm font-medium ${
                        settings.theme === 'dark' 
                          ? 'border-purple-500 bg-gradient-to-r from-purple-500/20 to-pink-500/20' 
                          : 'border-purple-300/30 hover:border-purple-400/50'
                      }`}
                    >
                      Темная
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowBackgroundModal(true)}
                  className={`w-full p-2 md:p-3 rounded-xl bg-gradient-to-r from-purple-100/10 to-pink-100/10 backdrop-blur-sm border border-purple-300/20 hover:border-purple-400/40 transition-all duration-300 flex items-center justify-center gap-2 font-medium text-sm md:text-base`}
                >
                  <ImageIcon className="w-4 h-4 md:w-5 md:h-5" />
                  Настроить фон
                </button>
              </div>

              {notifications.length > 0 && (
                <div>
                  <h4 className="font-bold mb-3 md:mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Активные уведомления:</h4>
                  <div className="space-y-2 md:space-y-3 max-h-32 md:max-h-40 overflow-y-auto">
                    {notifications.map(notification => (
                      <div key={notification.id} className={`p-2 md:p-3 rounded-xl ${isDark ? 'bg-purple-800/30' : 'bg-purple-100/30'} backdrop-blur-sm border border-purple-300/30`}>
                        <div className="text-sm font-bold">
                          {notification.eventName}
                        </div>
                        <div className="text-xs opacity-70">
                          Через {notification.daysLeft} {getDaysText(notification.daysLeft)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setNotifications([])}
                    className="mt-3 md:mt-4 text-sm text-red-400 hover:text-red-300 transition-colors duration-300 font-medium"
                  >
                    Очистить уведомления
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6 md:mt-8">
              <button
                onClick={() => setShowNotificationModal(false)}
                className={`${buttonClasses} text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-semibold`}
              >
                Готово
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl ${cardClasses} p-6 md:p-8 max-h-screen overflow-y-auto`}>
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Настройки</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className={`p-2 rounded-xl transition-all duration-300 ${headerButtonClasses} hover:scale-105`}
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            <div className="space-y-4 md:space-y-6">
              <div>
                <label className="block text-sm font-bold mb-3 md:mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Тема</label>
                <div className="flex gap-2 md:gap-3">
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, theme: 'light' }))}
                    className={`flex-1 p-3 md:p-4 rounded-xl border-2 flex items-center justify-center gap-2 md:gap-3 transition-all duration-300 font-semibold ${
                      settings.theme === 'light' 
                        ? 'border-purple-500 bg-gradient-to-r from-purple-500/20 to-pink-500/20 shadow-lg' 
                        : isDark ? 'border-purple-500/30 hover:border-purple-400/50 backdrop-blur-sm' : 'border-purple-300 hover:border-purple-400 backdrop-blur-sm'
                    } hover:scale-105 shadow-md hover:shadow-lg`}
                  >
                    <Sun className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-sm md:text-base">Светлая</span>
                  </button>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, theme: 'dark' }))}
                    className={`flex-1 p-3 md:p-4 rounded-xl border-2 flex items-center justify-center gap-2 md:gap-3 transition-all duration-300 font-semibold ${
                      settings.theme === 'dark' 
                        ? 'border-purple-500 bg-gradient-to-r from-purple-500/20 to-pink-500/20 shadow-lg' 
                        : isDark ? 'border-purple-500/30 hover:border-purple-400/50 backdrop-blur-sm' : 'border-purple-300 hover:border-purple-400 backdrop-blur-sm'
                    } hover:scale-105 shadow-md hover:shadow-lg`}
                  >
                    <Moon className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-sm md:text-base">Темная</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2 md:space-y-3">
                <label className="flex items-center p-2 md:p-3 rounded-xl bg-gradient-to-r from-purple-100/10 to-pink-100/10 backdrop-blur-sm border border-purple-300/20 hover:border-purple-400/40 transition-all duration-300">
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => setSettings(prev => ({ ...prev, soundEnabled: e.target.checked }))}
                    className="mr-3 md:mr-4 w-4 h-4 md:w-5 md:h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="font-medium text-sm md:text-base">Звуковые уведомления</span>
                </label>

                <label className="flex items-center p-2 md:p-3 rounded-xl bg-gradient-to-r from-purple-100/10 to-pink-100/10 backdrop-blur-sm border border-purple-300/20 hover:border-purple-400/40 transition-all duration-300">
                  <input
                    type="checkbox"
                    checked={settings.desktopNotifications}
                    onChange={(e) => setSettings(prev => ({ ...prev, desktopNotifications: e.target.checked }))}
                    className="mr-3 md:mr-4 w-4 h-4 md:w-5 md:h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="font-medium text-sm md:text-base">Системные уведомления</span>
                </label>

                <button
                  onClick={() => setShowBackgroundModal(true)}
                  className={`w-full p-2 md:p-3 rounded-xl bg-gradient-to-r from-purple-100/10 to-pink-100/10 backdrop-blur-sm border border-purple-300/20 hover:border-purple-400/40 transition-all duration-300 flex items-center justify-center gap-2 font-medium text-sm md:text-base`}
                >
                  <ImageIcon className="w-4 h-4 md:w-5 md:h-5" />
                  Настроить фон приложения
                </button>
              </div>
            </div>

            <div className="flex justify-end mt-6 md:mt-8">
              <button
                onClick={() => setShowSettingsModal(false)}
                className={`${buttonClasses} text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-semibold`}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventTimerApp;
