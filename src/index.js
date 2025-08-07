```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Создание глобального объекта hatch для совместимости
window.hatch = {
  useStoredState: (key, initialValue) => {
    const [value, setValue] = React.useState(() => {
      try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      } catch (error) {
        console.error(`Error reading localStorage key "${key}":`, error);
        return initialValue;
      }
    });

    const setStoredValue = React.useCallback((newValue) => {
      try {
        setValue(newValue);
        window.localStorage.setItem(key, JSON.stringify(newValue));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    }, [key]);

    return [value, setStoredValue];
  },

  useUser: () => ({
    id: 'user_local',
    name: 'Пользователь',
    color: '#8B5CF6'
  }),

  useCollaborators: () => []
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```
