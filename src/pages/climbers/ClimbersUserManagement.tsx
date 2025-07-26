import React, { useState, useEffect, useMemo } from 'react';
import { Panel } from '../../components/ui/Panel';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui';
import TransferOwnershipModal from '../../components/climbers/TransferOwnershipModal';
import { 
  UserPlus, 
  UserCog,
  UserX,
  Search,
  Shield,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PermissionGate from '../../components/auth/PermissionGate';
import type { User, UserRole } from '../../types/users';
import { useNotificationsManager } from '../../hooks/state/useNotificationsManager';

// Helper function to get API URL
const getApiUrl = () => {
  return '/api';
};

// User role badge with appropriate color based on role using CSS variables
const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  // Using role-specific CSS variables defined in index.css
  const roleStyles: Record<string, { bg: string, text: string }> = {
    'owner': { 
      bg: 'bg-[rgb(var(--color-role-owner-bg))]', 
      text: 'text-[rgb(var(--color-role-owner-text))]' 
    },
    'admin': { 
      bg: 'bg-[rgb(var(--color-role-admin-bg))]', 
      text: 'text-[rgb(var(--color-role-admin-text))]' 
    },
    'manager': { 
      bg: 'bg-[rgb(var(--color-role-manager-bg))]', 
      text: 'text-[rgb(var(--color-role-manager-text))]' 
    },
    'user': { 
      bg: 'bg-[rgb(var(--color-role-user-bg))]', 
      text: 'text-[rgb(var(--color-role-user-text))]' 
    }
  };

  const { bg, text } = roleStyles[role] || roleStyles['user'];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
};

// Using the imported Modal component from '../../components/ui/Modal'

// Add User Form
const AddUserForm: React.FC<{ 
  onClose: () => void, 
  onSuccess: () => void,
  setExternalLoading: (isLoading: boolean) => void,
  users: User[] // Adding users prop to check for existing owners
}> = ({ onClose, onSuccess, setExternalLoading, users }) => {
  const { getAccessToken, user } = useAuth();
  const { sendUserNotification } = useNotificationsManager();
  const [availableRoles, setAvailableRoles] = useState<UserRole[]>([]);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'user'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if there's already a system owner
  const hasExistingOwner = useMemo(() => {
    return Array.isArray(users) && users.some(user => user.role === 'Владелец');
  }, [users]);

  // Fetch available roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const token = getAccessToken();
        if (!token) return;

        const response = await fetch(`${getApiUrl()}/roles/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Roles API response:', data);
          // Ensure data is an array before setting it
          setAvailableRoles(Array.isArray(data) ? data : Array.isArray(data.results) ? data.results : []);
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
      }
    };

    fetchRoles();
  }, [getAccessToken]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.username) newErrors.username = 'Username is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setExternalLoading(true);
    
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${getApiUrl()}/users/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: formData.role
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle API validation errors
        if (data.username) setErrors(prev => ({ ...prev, username: data.username[0] }));
        if (data.email) setErrors(prev => ({ ...prev, email: data.email[0] }));
        if (data.password) setErrors(prev => ({ ...prev, password: data.password[0] }));
        if (data.detail) {
          // Handle specific error for system owner limitation
          if (data.detail.includes('system owner')) {
            setErrors(prev => ({ ...prev, role: data.detail }));
          }
          throw new Error(data.detail);
        }
        throw new Error('Failed to create user');
      }
      
      sendUserNotification(
        user?.id as string,
        'Success',
        `User ${formData.username} created successfully`,
        'success'
      );
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating user:', error);
      sendUserNotification(
        user?.id as string,
        'Error',
        error instanceof Error ? error.message : 'Failed to create user',
        'error'
      );
    } finally {
      setExternalLoading(false);
    }
  };

  return (
    <form id="addUserForm" onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">
          Имя пользователя*
        </label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          className={`w-full px-3 py-2 border ${
            errors.username ? 'border-[rgb(var(--color-error))]' : 'border-[rgb(var(--color-border))]'
          } rounded-md bg-[rgb(var(--color-input))] text-[rgb(var(--color-text))]`}
          placeholder="имя пользователя"
        />
        {errors.username && <p className="mt-1 text-sm text-[rgb(var(--color-error))]">{errors.username}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">
          Почта*
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`w-full px-3 py-2 border ${
            errors.email ? 'border-[rgb(var(--color-error))]' : 'border-[rgb(var(--color-border))]'
          } rounded-md bg-[rgb(var(--color-input))] text-[rgb(var(--color-text))]`}
          placeholder="email@example.com"
        />
        {errors.email && <p className="mt-1 text-sm text-[rgb(var(--color-error))]">{errors.email}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">
            Имя
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[rgb(var(--color-border))] rounded-md bg-[rgb(var(--color-input))] text-[rgb(var(--color-text))]"
            placeholder="Ваше имя"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">
            Фамилия
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[rgb(var(--color-border))] rounded-md bg-[rgb(var(--color-input))] text-[rgb(var(--color-text))]"
            placeholder="Ваша фамилия"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">
          Пароль*
        </label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className={`w-full px-3 py-2 border ${
            errors.password ? 'border-[rgb(var(--color-error))]' : 'border-[rgb(var(--color-border))]'
          } rounded-md bg-[rgb(var(--color-input))] text-[rgb(var(--color-text))]`}
          placeholder="••••••••"
        />
        {errors.password && <p className="mt-1 text-sm text-[rgb(var(--color-error))]">{errors.password}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">
          Подтвердите пароль*
        </label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          className={`w-full px-3 py-2 border ${
            errors.confirmPassword ? 'border-[rgb(var(--color-error))]' : 'border-[rgb(var(--color-border))]'
          } rounded-md bg-[rgb(var(--color-input))] text-[rgb(var(--color-text))]`}
          placeholder="••••••••"
        />
        {errors.confirmPassword && <p className="mt-1 text-sm text-[rgb(var(--color-error))]">{errors.confirmPassword}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">
          Роль*
        </label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className={`w-full px-3 py-2 border ${
            errors.role ? 'border-[rgb(var(--color-error))]' : 'border-[rgb(var(--color-border))]'
          } rounded-md bg-[rgb(var(--color-input-bg))] text-[rgb(var(--color-text))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))] focus:border-[rgb(var(--color-primary))] appearance-none`}
          style={{ 
            backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' stroke='rgb(var(--color-text-secondary))' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.7rem center',
            backgroundSize: '0.7em'
          }}
        >
          {Array.isArray(availableRoles) ? availableRoles.map((role) => {
            // Don't show owner option if there's already an owner
            if (role.name === 'owner' && hasExistingOwner) {
              return null;
            }
            return (
              <option 
                key={role.name} 
                value={role.name}
                className="text-[rgb(var(--color-text))] bg-[rgb(var(--color-input-bg))]"
              >
                {role.name.charAt(0).toUpperCase() + role.name.slice(1)} - {role.description}
              </option>
            );
          }) : <option value="" className="text-[rgb(var(--color-text))] bg-[rgb(var(--color-input-bg))]">Loading roles...</option>}
          {Array.isArray(availableRoles) && availableRoles.length === 0 && <option value="user" className="text-[rgb(var(--color-text))] bg-[rgb(var(--color-input-bg))]">User</option>}
        </select>
        {errors.role && <p className="mt-1 text-sm text-[rgb(var(--color-error))]">{errors.role}</p>}
        {hasExistingOwner && (
          <p className="mt-1 text-sm text-[rgb(var(--color-warning-text))]">
            Владелец системы уже есть. Создать нового владельца невозможно.
          </p>
        )}
      </div>

    </form>
  );
};

// Edit User Form
const EditUserForm: React.FC<{ 
  user: User, 
  users: User[],
  onClose: () => void, 
  onSuccess: () => void,
  setExternalLoading: (isLoading: boolean) => void 
}> = ({ user, users, onClose, onSuccess, setExternalLoading }) => {
  const { getAccessToken } = useAuth();
  const { sendUserNotification } = useNotificationsManager();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [formData, setFormData] = useState({
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    role: user.role || 'Пользователь',
    isActive: user.is_active
  });
  const isCurrentOwner = user.role === 'Владелец';
  
  // Access parent component state via context or props
  const transferOwnership = () => {
    // This will trigger the modal in the parent component
    const event = new CustomEvent('transferOwnership', { detail: user });
    document.dispatchEvent(event);
    onClose(); // Close the edit dialog
  };

  // Fetch available roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const token = getAccessToken();
        if (!token) return;

        const response = await fetch(`${getApiUrl()}/roles/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Ответ API ролей:', data);
          // Ensure data is an array before setting it
          if (Array.isArray(data)) {
            setRoles(data);
          } else if (data && typeof data === 'объект') {
            // If it's paginated response with results property
            if (Array.isArray(data.results)) {
              setRoles(data.results);
            } else {
              // Fallback to empty array
              setRoles([]);
            }
          } else {
            // Fallback to empty array
            setRoles([]);
          }
        }
      } catch (error) {
        console.error('Ошибка при получении ролей:', error);
      }
    };

    fetchRoles();
  }, [getAccessToken]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special handling for role changes when the user is currently an owner
    if (name === 'Роль' && isCurrentOwner && value !== 'Владелец') {
      // If trying to demote an owner to another role, trigger the ownership transfer
      transferOwnership();
      return; // Don't update the role yet
    }
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'isActive' 
        ? (e.target as HTMLInputElement).checked 
        : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If attempting to change owner's role, show transfer dialog instead of submitting
    if (isCurrentOwner && formData.role !== 'Владелец') {
      transferOwnership();
      return;
    }
    
    setExternalLoading(true);
    
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Токен аутентификации не найден');
      }
      
      // Update basic user information
      const basicUpdateResponse = await fetch(`${getApiUrl()}/users/${user.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          is_active: formData.isActive
        })
      });
      
      if (!basicUpdateResponse.ok) {
        throw new Error('Не удалось обновить информацию о пользователе.');
      }
      
      // Only update role if it changed
      if (formData.role !== user.role) {
        // Special check if trying to promote a user to owner
        if (formData.role === 'Владелец') {
          // Count current owners
          const currentOwners = users.filter(u => u.role === 'Владелец' && u.id !== user.id);
          
          if (currentOwners.length > 0) {
            throw new Error('Владелец системы может быть только один. Сначала передайте права собственности текущему владельцу.');
          }
        }
        
        // Set user role
        const roleUpdateResponse = await fetch(`${getApiUrl()}/users/${user.id}/set_role/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ role: formData.role })
        });
        
        if (!roleUpdateResponse.ok) {
          const errorData = await roleUpdateResponse.json();
          throw new Error(errorData.detail || 'Не удалось обновить роль пользователя.');
        }
      }
      
      sendUserNotification(
        user?.id as string,
        'Успешно',
        `Пользователь ${user.username} обновлено успешно`,
        'Успешно'
      );
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Ошибка обновления пользователя:', error);
      sendUserNotification(
        user?.id as string,
        'Ошибка',
        error instanceof Error ? error.message : 'Не удалось обновить пользователя.',
        'Ошибка'
      );
    } finally {
      setExternalLoading(false);
    }
  };

  // Eligibility check now handled in the parent component's TransferOwnershipModal

  return (
    <form id="editUserForm" onSubmit={handleSubmit} className="space-y-4">
      {isCurrentOwner && (
        <div className="bg-[rgb(var(--color-info-bg))] border border-[rgb(var(--color-info-border))] text-[rgb(var(--color-info-text))] p-3 rounded-md mb-4">
          <p className="text-sm">
            <strong>Владелец системы:</strong> Этот пользователь имеет полный административный доступ к системе.
Чтобы изменить его роль, необходимо сначала передать права владения другому пользователю.
          </p>
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">
          Имя пользователя
        </label>
        <input
          type="text"
          value={user.username}
          disabled
          className="w-full px-3 py-2 border border-[rgb(var(--color-border))] rounded-md bg-[rgba(var(--color-input),0.5)] text-[rgb(var(--color-text-secondary))]"
        />
        <p className="mt-1 text-xs text-[rgb(var(--color-text-secondary))]">Имя пользователя не может быть изменено</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">
          Почта
        </label>
        <input
          type="email"
          value={user.email}
          disabled
          className="w-full px-3 py-2 border border-[rgb(var(--color-border))] rounded-md bg-[rgba(var(--color-input),0.5)] text-[rgb(var(--color-text-secondary))]"
        />
        <p className="mt-1 text-xs text-[rgb(var(--color-text-secondary))]">Адрес электронной почты не может быть изменен</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">
            Имя
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[rgb(var(--color-border))] rounded-md bg-[rgb(var(--color-input))] text-[rgb(var(--color-text))]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">
            Фамилия
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[rgb(var(--color-border))] rounded-md bg-[rgb(var(--color-input))] text-[rgb(var(--color-text))]"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">
          Роль
        </label>          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[rgb(var(--color-border))] rounded-md bg-[rgb(var(--color-input-bg))] text-[rgb(var(--color-text))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))] focus:border-[rgb(var(--color-primary))] appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ 
              backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' stroke='rgb(var(--color-text-secondary))' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.7rem center',
              backgroundSize: '0.7em'
            }}
            disabled={isCurrentOwner} // Disable role selection for the owner
          >
            {Array.isArray(roles) && roles.map((role) => {
              // For non-owner users, don't show owner role if there already is one
              const hasExistingOwner = users.some(u => u.role === 'Владелец' && u.id !== user.id);
              if (role.name === 'owner' && hasExistingOwner && user.role !== 'Владелец') {
                return null; // Skip this option if there's already an owner
              }
              
              return (
                <option 
                  key={role.name} 
                  value={role.name} 
                  className="text-[rgb(var(--color-text))] bg-[rgb(var(--color-input-bg))]"
                >
                  {role.name.charAt(0).toUpperCase() + role.name.slice(1)} - {role.description}
                </option>
              );
            })}
            {(!Array.isArray(roles) || roles.length === 0) && <option value="user" className="text-[rgb(var(--color-text))] bg-[rgb(var(--color-input-bg))]">User</option>}
          </select>
          {isCurrentOwner && (
            <p className="mt-1 text-sm text-[rgb(var(--color-warning-text))]">
              Чтобы изменить роль этого пользователя, необходимо сначала передать право владения системой другому пользователю.
            </p>
          )}
      </div>

      <div className="flex items-center">
        <input
          id="is-active"
          type="checkbox"
          name="isActive"
          checked={formData.isActive}
          onChange={handleChange}
          className="h-4 w-4 text-[rgb(var(--color-primary))] focus:ring-[rgb(var(--color-primary))] border-[rgb(var(--color-border))] rounded"
        />
        <label htmlFor="is-active" className="ml-2 block text-sm text-[rgb(var(--color-text))]">
          Активный аккаунт
        </label>
      </div>
      
      {isCurrentOwner && (
        <div className="mt-4 p-3 bg-[rgb(var(--color-info-bg))] border border-[rgb(var(--color-info-border))] rounded-md">
          <h4 className="text-sm font-medium text-[rgb(var(--color-info-text))]">Действия владельца системы</h4>
          <p className="text-xs text-[rgb(var(--color-info-text))] mt-1 mb-2">
            Системе всегда требуется только один владелец. Чтобы изменить роль этого пользователя,
            необходимо сначала передать права владения другому администратору.
          </p>
          <Button
            type="button"
            onClick={transferOwnership}
            variant="outline"
            className="w-full text-[rgb(var(--color-primary))]"
          >
            Передать право собственности другому пользователю
          </Button>
        </div>
      )}
    </form>
  );
};

// Props for ClimbersUserManagement component
type ClimbersPageProps = Record<string, never>;

const ClimbersUserManagement: React.FC<ClimbersPageProps> = () => {
  const { user: currentUser, getAccessToken } = useAuth();
  const { sendUserNotification } = useNotificationsManager();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [showEditUserModal, setShowEditUserModal] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [systemOwner, setSystemOwner] = useState<User | null>(null);
  const [showOwnershipModal, setShowOwnershipModal] = useState<boolean>(false);
  // Dedicated loading states for form buttons in modal footers
  const [addUserLoading, setAddUserLoading] = useState<boolean>(false);
  const [editUserLoading, setEditUserLoading] = useState<boolean>(false);
  
  // Add event listener for ownership transfer
  useEffect(() => {
    const handleTransferOwnership = (event: CustomEvent<User>) => {
      setSystemOwner(event.detail);
      setShowOwnershipModal(true);
    };

    document.addEventListener('transferOwnership', handleTransferOwnership as EventListener);
    
    return () => {
      document.removeEventListener('transferOwnership', handleTransferOwnership as EventListener);
    };
  }, []);

  // Fetch users and roles
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = getAccessToken();
        if (!token) {
          throw new Error('Authentication token not found');
        }
        
        // Always fetch current user first to ensure we have at least one user
        const currentUserResponse = await fetch(`${getApiUrl()}/users/me/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (currentUserResponse.ok) {
          const userData = await currentUserResponse.json();
          console.log('Current user data:', userData);
          
          // Initialize users list with current user
          setUsers([userData]);
        }
        
        // Fetch all users 
        const usersResponse = await fetch(`${getApiUrl()}/users/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!usersResponse.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const usersData = await usersResponse.json();
        console.log('Users API response:', usersData);
        
        // Handle both array responses and object responses with results property
        let usersList: User[] = [];
        
        if (Array.isArray(usersData)) {
          usersList = usersData;
          setUsers(usersData);
        } else if (usersData && typeof usersData === 'object') {
          // If it's paginated response with results property
          if (Array.isArray(usersData.results)) {
            usersList = usersData.results;
            setUsers(usersData.results);
          } else {
            // If it's a single user object, wrap it in array
            usersList = [usersData];
            setUsers([usersData]);
          }
        } else {
          // Fallback to empty array
          setUsers([]);
        }
        
        // Find and set the system owner
        const owner = usersList.find(user => user.role === 'Владелец');
        if (owner) {
          setSystemOwner(owner);
        }
        
        // Fetch roles - we'll keep this code but not store the result since it's not used in this component
        const rolesResponse = await fetch(`${getApiUrl()}/roles/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!rolesResponse.ok) {
          throw new Error('Failed to fetch roles');
        }
        
        // Make sure at least the current user is included
        if (currentUser) {
          setUsers(prevUsers => {
            // Check if current user is in the list
            const hasCurrentUser = Array.isArray(prevUsers) && 
              prevUsers.some(user => user.id === currentUser.id);
              
            if (!hasCurrentUser) {
              console.log('Adding current user to list:', currentUser);
              return [...prevUsers, currentUser];
            }
            return prevUsers;
          });
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load users. Please try again.');
        sendUserNotification(
          currentUser?.id as string,
          'Error',
          'Failed to load users data.',
          'error'
        );
        
        // Even if main request fails, ensure current user is shown
        if (currentUser) {
          setUsers([currentUser]);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [getAccessToken, sendUserNotification, currentUser]);
  
  // Filtered users based on search term and role filter
  const filteredUsers = (Array.isArray(users) ? users : []).filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });
  
  // Function to handle user deletion
  const handleUserDelete = async (userId: string | number) => {
    // Prevent deleting your own account
    if (userId === currentUser?.id) {
      sendUserNotification(
        currentUser?.id as string,
        'Error',
        'You cannot delete your own account.',
        'error'
      );
      return;
    }
    
    // Get the user to be deleted
    const userToDelete = users.find(user => user.id === userId);
    
    // Prevent deleting system owner
    if (userToDelete?.role === 'Владелец') {
      sendUserNotification(
        currentUser?.id as string,
        'Ошибка',
        'Владельцы системы не могут быть удалены по соображениям безопасности.',
        'Ошибка'
      );
      return;
    }
    
    // Confirm before deletion
    if (!window.confirm('Вы уверены, что хотите удалить этого пользователя? Это действие не может быть отменено.')) {
      return;
    }
    
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Токен аутентификации не найден');
      }
      
      const response = await fetch(`${getApiUrl()}/users/${userId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Не удалось удалить пользователя.');
      }
      
      // Update the users list, ensuring users is treated as an array
      setUsers(Array.isArray(users) ? users.filter(user => user.id !== userId) : []);
      
      sendUserNotification(
        currentUser?.id as string,
        'Успешно',
        'Пользователь был успешно удален.',
        'Успешно'
      );
    } catch (err) {
      console.error('Error deleting user:', err);
      sendUserNotification(
        currentUser?.id as string,
        'Ошибка',
        'Не удалось удалить пользователя. Попробуйте ещё раз.',
        'Ошибка'
      );
    }
  };
  
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[rgb(var(--color-text))]">UserControl</h1>
        <p className="text-[rgb(var(--color-text-secondary))] mt-1">
          Управляйте пользователями и их ролями в вашей системе
        </p>
      </header>
      
      <PermissionGate 
        permission="canManageUsers"
        fallback={
          <Panel className="bg-[rgb(var(--color-warning-bg))] border-[rgb(var(--color-warning-border))]">
            <div className="p-4 text-[rgb(var(--color-warning-text))]">
              <div className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                <h3 className="font-medium">Недостаточно прав</h3>
              </div>
              <p className="mt-1 text-sm">
                У вас нет разрешения на управление пользователями. Обратитесь к администратору за доступом.
              </p>
            </div>
          </Panel>
        }
      >
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[rgb(var(--color-text-secondary))]" />
              <input
                type="text"
                placeholder="Поиск пользователя..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full rounded-md"
              />
            </div>
            
            <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
              {/* Role Filter */}
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-input-bg))] text-[rgb(var(--color-text))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))] focus:border-[rgb(var(--color-primary))] hover:border-[rgb(var(--color-border))]"
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' stroke='rgb(var(--color-text-secondary))' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.7rem center',
                    backgroundSize: '0.7em'
                  }}
                >
                  <option value="all" className="text-[rgb(var(--color-text))] bg-[rgb(var(--color-input-bg))]">Все роли</option>
                  <option value="owner" className="text-[rgb(var(--color-text))] bg-[rgb(var(--color-input-bg))]">Владелец</option>
                  <option value="admin" className="text-[rgb(var(--color-text))] bg-[rgb(var(--color-input-bg))]">Админ</option>
                  <option value="manager" className="text-[rgb(var(--color-text))] bg-[rgb(var(--color-input-bg))]">Менеджер</option>
                  <option value="user" className="text-[rgb(var(--color-text))] bg-[rgb(var(--color-input-bg))]">Пользователь</option>
                </select>
                {/* Remove the ChevronDown icon since we're using CSS for the dropdown arrow */}
              </div>
              
              {/* Refresh Button */}
              <Button 
                variant="outline" 
                aria-label="Refresh connection"
                title="Refresh connection"
                className="p-2"
              >
                <RefreshCw size={16} />
              </Button>
              
              {/* Add User Button */}
              <Button
                onClick={() => setShowAddUserModal(true)}
                variant="primary"
                leftIcon={<UserPlus className="h-4 w-4" />}
              >
                Добавить пользователя
              </Button>
            </div>
          </div>
          {/* Users Table */}
          <Panel>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[rgba(var(--color-bg),0.5)]">
                  <tr className="border-b border-[rgb(var(--color-border))]">
                    <th className="px-4 py-3 text-left text-xs font-medium text-[rgb(var(--color-text-secondary))] uppercase tracking-wider w-12">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[rgb(var(--color-text-secondary))] uppercase tracking-wider">Пользователь</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[rgb(var(--color-text-secondary))] uppercase tracking-wider">Почта</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[rgb(var(--color-text-secondary))] uppercase tracking-wider">Роль</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[rgb(var(--color-text-secondary))] uppercase tracking-wider">Статус</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[rgb(var(--color-text-secondary))] uppercase tracking-wider">Присоединился</th>
                    <th className="px-4 py-3 text-xs font-medium text-[rgb(var(--color-text-secondary))] uppercase tracking-wider text-right">Действия</th>
                  </tr>
                </thead>
                
                <tbody className="bg-[rgb(var(--color-card))] divide-y divide-[rgb(var(--color-border))]">
                  {loading ? (
                    // Loading state
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={`loading-${index}`} className="animate-pulse">
                        <td className="px-4 py-3"><div className="h-4 w-8 bg-[rgb(var(--color-border))] rounded"></div></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-[rgb(var(--color-border))]"></div>
                            <div className="ml-3 space-y-1">
                              <div className="h-4 w-24 bg-[rgb(var(--color-border))] rounded"></div>
                              <div className="h-3 w-16 bg-[rgb(var(--color-border))] rounded"></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><div className="h-4 w-32 bg-[rgb(var(--color-border))] rounded"></div></td>
                        <td className="px-4 py-3"><div className="h-5 w-16 bg-[rgb(var(--color-border))] rounded-full"></div></td>
                        <td className="px-4 py-3"><div className="h-5 w-16 bg-[rgb(var(--color-border))] rounded-full"></div></td>
                        <td className="px-4 py-3"><div className="h-4 w-24 bg-[rgb(var(--color-border))] rounded"></div></td>
                        <td className="px-4 py-3 text-right"><div className="h-8 w-16 bg-[rgb(var(--color-border))] rounded ml-auto"></div></td>
                      </tr>
                    ))
                  ) : error ? (
                    // Error state
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-[rgb(var(--color-text-secondary))]">
                        <AlertCircle className="h-6 w-6 mx-auto mb-2 text-[rgb(var(--color-error))]" />
                        <p>{error}</p>
                        <Button
                          onClick={() => window.location.reload()}
                          variant="ghost"
                          className="mt-2"
                        >
                          Try Again
                        </Button>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    // Empty state
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-[rgb(var(--color-text-secondary))]">
                        <UserX className="h-6 w-6 mx-auto mb-2" />
                        <p>No users found matching your criteria</p>
                        {searchTerm && (
                          <Button
                            onClick={() => setSearchTerm('')}
                            variant="ghost"
                            className="mt-1"
                          >
                            Clear Search
                          </Button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    // User list
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-[rgba(var(--color-bg),0.5)]">
                        <td className="px-4 py-3 text-sm text-[rgb(var(--color-text-secondary))]">
                          {typeof user.id === 'number' ? `#${user.id}` : user.id.substring(0, 8)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-[rgb(var(--color-primary))] text-white flex items-center justify-center uppercase font-medium text-sm">
                              {user.first_name ? user.first_name[0] : user.username[0]}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-[rgb(var(--color-text))]">
                                {user.first_name && user.last_name 
                                  ? `${user.first_name} ${user.last_name}` 
                                  : user.username}
                                {user.id === currentUser?.id && (
                                  <span className="ml-2 text-xs text-[rgb(var(--color-text-secondary))]">(You)</span>
                                )}
                              </div>
                              <div className="text-xs text-[rgb(var(--color-text-secondary))]">
                                @{user.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-[rgb(var(--color-text))]">{user.email}</td>
                        <td className="px-4 py-3">
                          <RoleBadge role={user.role || 'Пользователь'} />
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.is_active 
                              ? 'bg-[rgb(var(--color-status-active-bg))] text-[rgb(var(--color-status-active-text))]' 
                              : 'bg-[rgb(var(--color-status-inactive-bg))] text-[rgb(var(--color-status-inactive-text))]'
                          }`}>
                            {user.is_active ? 'Активный' : 'Неактивный'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-[rgb(var(--color-text-secondary))]">
                          {user.date_joined 
                            ? new Date(user.date_joined).toLocaleDateString() 
                            : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowEditUserModal(true);
                              }}
                              className="text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-hover))]"
                              aria-label={`Edit ${user.username}`}
                            >
                              <UserCog className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleUserDelete(user.id)}
                              className={`${
                                user.id === currentUser?.id || user.role === 'Владелец'
                                  ? 'text-[rgba(var(--color-error),0.4)] cursor-not-allowed'
                                  : 'text-[rgb(var(--color-error))] hover:text-[rgb(var(--color-error-hover))]'
                              }`}
                              aria-label={`Delete ${user.username}`}
                              disabled={user.id === currentUser?.id || user.role === 'Владелец'}
                              title={
                                user.id === currentUser?.id 
                                  ? "You cannot delete your own account"
                                  : user.role === 'Владелец'
                                    ? "System owners cannot be deleted - transfer ownership first"
                                    : `Delete ${user.username}`
                              }
                            >
                              <UserX className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Panel className="p-4">
              <h3 className="text-lg font-medium text-[rgb(var(--color-text))]">Всего пользователей</h3>
              <p className="text-3xl font-bold mt-2 text-[rgb(var(--color-text))]">{Array.isArray(users) ? users.length : 0}</p>
              <p className="text-sm text-[rgb(var(--color-text-secondary))] mt-1">
                Активных: {Array.isArray(users) ? users.filter(user => user.is_active).length : 0} | 
                Неактивных: {Array.isArray(users) ? users.filter(user => !user.is_active).length : 0}
              </p>
            </Panel>
            
            <Panel className="p-4">
              <h3 className="text-lg font-medium text-[rgb(var(--color-text))]">Распределение ролей</h3>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[rgb(var(--color-text))]">Владелец</span>
                  <span className="font-medium text-[rgb(var(--color-text))]">
                    {Array.isArray(users) ? users.filter(user => user.role === 'Владелец').length : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[rgb(var(--color-text))]">Админ</span>
                  <span className="font-medium text-[rgb(var(--color-text))]">
                    {Array.isArray(users) ? users.filter(user => user.role === 'Админ').length : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[rgb(var(--color-text))]">Менеджер</span>
                  <span className="font-medium text-[rgb(var(--color-text))]">
                    {Array.isArray(users) ? users.filter(user => user.role === 'Менеджер').length : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[rgb(var(--color-text))]">Пользователь</span>
                  <span className="font-medium text-[rgb(var(--color-text))]">
                    {Array.isArray(users) ? users.filter(user => user.role === 'Пользователь' || !user.role).length : 0}
                  </span>
                </div>
              </div>
            </Panel>
            
            <Panel className="p-4">
              <h3 className="text-lg font-medium text-[rgb(var(--color-text))]">Недавняя активность</h3>
              <p className="text-sm text-[rgb(var(--color-text-secondary))] mt-2">
                Последний присоединившийся пользователь: {
                  Array.isArray(users) && users.length > 0 
                    ? new Date(Math.max(...users
                        .filter(user => user.date_joined)
                        .map(user => new Date(user.date_joined || '').getTime())))
                        .toLocaleDateString()
                    : 'N/A'
                }
              </p>
            </Panel>
          </div>
        </div>
      </PermissionGate>
      
      {/* Modals */}
      <Modal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        title="Добавить учетную запись"
        footerContent={
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              onClick={() => setShowAddUserModal(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              form="addUserForm"
              type="submit"
              disabled={addUserLoading}
              variant="primary"
              isLoading={addUserLoading}
            >
              {addUserLoading ? 'Создание...' : 'Создать пользователя'}
            </Button>
          </div>
        }
      >
        <AddUserForm 
          onClose={() => setShowAddUserModal(false)} 
          onSuccess={() => {
            // Use the main loading state for refreshing the data
            setLoading(true);
            setTimeout(() => setLoading(false), 500); // Simulate refresh
          }}
          setExternalLoading={setAddUserLoading}
          users={users}
        />
      </Modal>
      
      <Modal
        isOpen={showEditUserModal}
        onClose={() => setShowEditUserModal(false)}
        title="Редактировать пользователя"
        footerContent={
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              onClick={() => setShowEditUserModal(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              form="editUserForm"
              type="submit"
              disabled={editUserLoading}
              variant="primary"
              isLoading={editUserLoading}
            >
              {editUserLoading ? 'Обновление...' : 'Пользователь обновлен'}
            </Button>
          </div>
        }
      >
        {selectedUser && (
          <EditUserForm 
            user={selectedUser}
            users={users}
            onClose={() => setShowEditUserModal(false)} 
            onSuccess={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 500); // Simulate refresh
            }} 
            setExternalLoading={setEditUserLoading}
          />
        )}
      </Modal>

      {/* Ownership Transfer Modal */}
      {systemOwner && (
        <TransferOwnershipModal
          isOpen={showOwnershipModal}
          onClose={() => setShowOwnershipModal(false)}
          onSuccess={() => {
            // Reload all users to reflect the ownership change
            setLoading(true);
            const fetchData = async () => {
              try {
                const token = getAccessToken();
                if (token) {
                  const usersResponse = await fetch(`${getApiUrl()}/users/`, {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  });
                  
                  if (usersResponse.ok) {
                    const usersData = await usersResponse.json();
                    if (Array.isArray(usersData)) {
                      setUsers(usersData);
                      const newOwner = usersData.find((u: User) => u.role === 'owner');
                      if (newOwner) setSystemOwner(newOwner);
                    } else if (usersData?.results && Array.isArray(usersData.results)) {
                      setUsers(usersData.results);
                      const newOwner = usersData.results.find((u: User) => u.role === 'owner');
                      if (newOwner) setSystemOwner(newOwner);
                    }
                  }
                }
                setShowOwnershipModal(false);
              } catch (err) {
                console.error('Ошибка обновления пользователей после передачи права собственности:', err);
              } finally {
                setLoading(false);
              }
            };
            fetchData();
          }}
          currentOwner={systemOwner}
          eligibleUsers={users.filter(user => 
            user.id !== systemOwner.id && 
            user.is_active && 
            (user.role === 'Администратор')
          )}
        />
      )}
    </div>
  );
};

export default ClimbersUserManagement;
