import React, { useState, useEffect } from 'react';
import { 
  MdAdd, 
  MdEdit, 
  MdDelete,
  MdPeople,
  MdEmail,
  MdLock,
  MdClose,
  MdSave,
  MdVisibility,
  MdVisibilityOff,
  MdCheckCircle,
  MdPerson,
  MdRefresh
} from 'react-icons/md';
import { getAllUsers, createUser, updateUser, deleteUser } from '../../services/api';
import type { SafeUser } from '../../types/api.types';

const Users: React.FC = () => {
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SafeUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    const result = await getAllUsers();
    if (result.success && result.data) {
      setUsers(result.data);
    } else {
      setError(result.message || 'Failed to fetch users');
    }
    setLoading(false);
  };

  const handleOpenModal = (user?: SafeUser) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name || '',
        email: user.email,
        password: '',
        confirmPassword: ''
      });
    } else {
      setEditingUser(null);
      setFormData({ 
        name: '', 
        email: '', 
        password: '', 
        confirmPassword: '' 
      });
    }
    setFormErrors({ name: '', email: '', password: '', confirmPassword: '' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    setFormErrors({ name: '', email: '', password: '', confirmPassword: '' });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const validateForm = () => {
    const errors = { name: '', email: '', password: '', confirmPassword: '' };
    let isValid = true;

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
      isValid = false;
    }

    // Password validation (only for new users or when changing password)
    if (!editingUser || formData.password) {
      if (!formData.password) {
        errors.password = 'Password is required';
        isValid = false;
      } else if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
        isValid = false;
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
        isValid = false;
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSaveUser = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (editingUser) {
        // Edit existing user
        const updateData: { email?: string; password?: string; name?: string } = {
          name: formData.name,
          email: formData.email
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        const result = await updateUser(editingUser.id, updateData);
        if (result.success) {
          await fetchUsers();
          handleCloseModal();
        } else {
          setError(result.message || 'Failed to update user');
        }
      } else {
        // Create new user
        const result = await createUser({
          email: formData.email,
          password: formData.password,
          name: formData.name || undefined
        });
        if (result.success) {
          await fetchUsers();
          handleCloseModal();
        } else {
          setError(result.message || 'Failed to create user');
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this admin account? This action cannot be undone.')) {
      const result = await deleteUser(id);
      if (result.success) {
        await fetchUsers();
      } else {
        setError(result.message || 'Failed to delete user');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="users-page">
      {/* Page Header */}
      <div className="users-header">
        <div className="header-content">
          <div>
            <h1>Users & Admins</h1>
            <p>Manage admin login accounts and access control</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn secondary" onClick={fetchUsers} disabled={loading}>
              <MdRefresh className={loading ? 'spinning' : ''} />
              Refresh
            </button>
            <button className="btn primary" onClick={() => handleOpenModal()}>
              <MdAdd />
              Add New Admin
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="users-stats">
        <div className="stat-card">
          <div className="stat-icon primary">
            <MdPeople />
          </div>
          <div className="stat-info">
            <h3>{users.length}</h3>
            <p>Total Admins</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon success">
            <MdCheckCircle />
          </div>
          <div className="stat-info">
            <h3>{users.length}</h3>
            <p>Registered Users</p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="users-table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : (
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-row">
                  <div className="empty-state">
                    <MdPeople className="empty-icon" />
                    <p>No admin accounts found</p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </div>
                      <span className="user-name">{user.name || 'N/A'}</span>
                    </div>
                  </td>
                  <td>
                    <span className="user-email">{user.email}</span>
                  </td>
                  <td>
                    <span className="date-text">{formatDate(user.createdAt)}</span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="icon-btn" 
                        onClick={() => handleOpenModal(user)}
                        title="Edit user"
                      >
                        <MdEdit />
                      </button>
                      <button 
                        className="icon-btn danger" 
                        onClick={() => handleDeleteUser(user.id)}
                        title="Delete user"
                      >
                        <MdDelete />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? 'Edit Admin Account' : 'Create New Admin Account'}</h2>
              <button className="close-btn" onClick={handleCloseModal}>
                <MdClose />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="userName">Full Name *</label>
                <div className="input-with-icon">
                  <MdPerson className="input-icon" />
                  <input
                    type="text"
                    id="userName"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                    className={`form-input ${formErrors.name ? 'error' : ''}`}
                  />
                </div>
                {formErrors.name && <span className="error-text">{formErrors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="userEmail">Email Address *</label>
                <div className="input-with-icon">
                  <MdEmail className="input-icon" />
                  <input
                    type="email"
                    id="userEmail"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="admin@example.com"
                    className={`form-input ${formErrors.email ? 'error' : ''}`}
                  />
                </div>
                {formErrors.email && <span className="error-text">{formErrors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="userPassword">
                  Password {editingUser ? '(leave blank to keep current)' : '*'}
                </label>
                <div className="input-with-icon">
                  <MdLock className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="userPassword"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter password"
                    className={`form-input ${formErrors.password ? 'error' : ''}`}
                  />
                  <button
                    type="button"
                    className="toggle-visibility"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                  </button>
                </div>
                {formErrors.password && <span className="error-text">{formErrors.password}</span>}
                <small className="form-help">Password must be at least 6 characters</small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-with-icon">
                  <MdLock className="input-icon" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm password"
                    className={`form-input ${formErrors.confirmPassword ? 'error' : ''}`}
                  />
                  <button
                    type="button"
                    className="toggle-visibility"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <MdVisibilityOff /> : <MdVisibility />}
                  </button>
                </div>
                {formErrors.confirmPassword && <span className="error-text">{formErrors.confirmPassword}</span>}
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn secondary" onClick={handleCloseModal} disabled={saving}>
                Cancel
              </button>
              <button 
                className="btn primary" 
                onClick={handleSaveUser}
                disabled={saving}
              >
                <MdSave />
                {saving ? 'Saving...' : (editingUser ? 'Update Admin' : 'Create Admin')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
