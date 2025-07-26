import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Lock} from 'lucide-react';
import { AuthNotification } from '../../components/auth/AuthNotification';
import { Button } from '../../components/ui/Button';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, error, usersExist, checkUsersExist } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the page that the user was trying to access
  // Always go to summit dashboard on successful login as default
  interface LocationState {
    from?: {
      pathname?: string;
    };
  }

  const from = (location.state as LocationState)?.from?.pathname || '/summit';
  
  // Check if users exist on component mount
  useEffect(() => {
    const checkForUsers = async () => {
      if (usersExist === null) {
        await checkUsersExist();
      }
    };
    
    checkForUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const success = await login(username, password);
      if (success) {
        // Redirect to the page the user was trying to access
        navigate(from, { replace: true });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: 'url("/images/everyst-bg.jpg")' }}>
      <div className="max-w-md w-full px-6 py-8 bg-[rgba(var(--color-card),0.97)] backdrop-blur-sm shadow-xl rounded-lg border border-[rgb(var(--color-border))]">
        <div className="flex flex-col items-center mb-6">
          <img src="/images/everyst-logo.svg" alt="Everyst Logo" className="h-16 mb-4" />
          <h1 className="text-3xl font-bold text-[rgb(var(--color-text))]">Войти в систему A.D.A.M</h1>
          <p className="text-[rgb(var(--color-text))] font-medium">Введите ваши учетные данные</p>
        </div>

        {error && (
          <AuthNotification 
            type="error"
            message={error}
          />
        )}
        
        {usersExist === false && (
          <AuthNotification 
            type="info"
            message="Пользователя нет. Перенаправление на страницу регистрации..."
            onDismiss={() => navigate('/register', { replace: true })}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-[rgb(var(--color-text))] mb-2 block">
              Имя пользователя
            </label>
            <div className="relative mt-1.5">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={16} className="text-[rgb(var(--color-text))]" />
              </div>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-md py-2 pl-10 pr-3 font-medium"
                placeholder="Введите имя пользователя"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between mb-2">
              <label htmlFor="password" className="text-sm font-medium text-[rgb(var(--color-text))]">
                Пароль
              </label>
            </div>
            <div className="relative mt-1.5">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={16} className="text-[rgb(var(--color-text))]" />
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md py-2 pl-10 pr-3 font-medium" 
                placeholder="Введите пароль"
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={submitting}
              disabled={submitting}
            >
              Войти
            </Button>
          </div>
        </form>

        {/* Ссылка на регистрацию отображается только в том случае, если в системе нет пользователей. Это регулируется защитой маршрута. */}
      </div>
    </div>
  );
};
