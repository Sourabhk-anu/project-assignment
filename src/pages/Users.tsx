import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, UserX, UserCheck } from 'lucide-react';
import { usersAPI, rolesAPI, enterprisesAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import DataTable from '../components/Common/DataTable';
import Modal from '../components/Common/Modal';
import toast from 'react-hot-toast';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  status: string;
  last_login: string;
  role: {
    id: number;
    name: string;
  };
  enterprise: {
    id: number;
    name: string;
  };
  created_at: string;
}

const Users: React.FC = () => {
  const { hasPermission, isSuperAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [roles, setRoles] = useState<any[]>([]);
  const [enterprises, setEnterprises] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role_id: '',
    enterprise_id: '',
    status: 'active'
  });

  useEffect(() => {
    fetchUsers();
    if (hasPermission('roles', 'read')) {
      fetchRoles();
    }
    if (hasPermission('enterprises', 'read')) {
      fetchEnterprises();
    }
  }, [pagination.page, searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery
      });
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error: any) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await rolesAPI.getRoles({ limit: 100 });
      setRoles(response.data.roles);
    } catch (error: any) {
      console.error('Failed to fetch roles');
    }
  };

  const fetchEnterprises = async () => {
    try {
      const response = await enterprisesAPI.getEnterprises({ limit: 100 });
      setEnterprises(response.data.enterprises);
    } catch (error: any) {
      console.error('Failed to fetch enterprises');
    }
  };

  const handleCreate = () => {
    setModalMode('create');
    setSelectedUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role_id: '',
      enterprise_id: '',
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      first_name: user.first_name,
      last_name: user.last_name,
      role_id: user.role.id.toString(),
      enterprise_id: user.enterprise.id.toString(),
      status: user.status
    });
    setIsModalOpen(true);
  };

  const handleView = (user: User) => {
    setModalMode('view');
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      return;
    }

    try {
      await usersAPI.deleteUser(user.id);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (modalMode === 'create') {
        await usersAPI.createUser(formData);
        toast.success('User created successfully');
      } else if (modalMode === 'edit') {
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        await usersAPI.updateUser(selectedUser!.id, updateData);
        toast.success('User updated successfully');
      }

      setIsModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const toggleUserStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    
    try {
      await usersAPI.updateUser(user.id, { status: newStatus });
      toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (error: any) {
      toast.error('Failed to update user status');
    }
  };

  const formatDate = (dateString: string) => {
    return dateString ? new Date(dateString).toLocaleDateString() : 'Never';
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      locked: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status as keyof typeof statusClasses]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const columns = [
    {
      key: 'username',
      label: 'Username',
    },
    {
      key: 'email',
      label: 'Email',
    },
    {
      key: 'name',
      label: 'Name',
      render: (_: any, row: User) => `${row.first_name} ${row.last_name}`
    },
    {
      key: 'role',
      label: 'Role',
      render: (role: any) => role.name
    },
    ...(isSuperAdmin() ? [{
      key: 'enterprise',
      label: 'Enterprise',
      render: (enterprise: any) => enterprise.name
    }] : []),
    {
      key: 'status',
      label: 'Status',
      render: (status: string) => getStatusBadge(status)
    },
    {
      key: 'last_login',
      label: 'Last Login',
      render: (date: string) => formatDate(date)
    }
  ];

  const renderActions = (user: User) => (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => handleView(user)}
        className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
        title="View"
      >
        <Eye className="h-4 w-4" />
      </button>
      
      {hasPermission('users', 'update') && (
        <button
          onClick={() => handleEdit(user)}
          className="p-1 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded"
          title="Edit"
        >
          <Edit className="h-4 w-4" />
        </button>
      )}

      {hasPermission('users', 'update') && (
        <button
          onClick={() => toggleUserStatus(user)}
          className={`p-1 rounded ${
            user.status === 'active'
              ? 'text-gray-600 hover:text-red-600 hover:bg-red-50'
              : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
          }`}
          title={user.status === 'active' ? 'Deactivate' : 'Activate'}
        >
          {user.status === 'active' ? (
            <UserX className="h-4 w-4" />
          ) : (
            <UserCheck className="h-4 w-4" />
          )}
        </button>
      )}

      {hasPermission('users', 'delete') && user.id !== 1 && (
        <button
          onClick={() => handleDelete(user)}
          className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">Manage system users and their permissions</p>
        </div>
        
        {hasPermission('users', 'create') && (
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add User</span>
          </button>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        data={users}
        columns={columns}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        actions={renderActions}
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          modalMode === 'create' ? 'Create User' :
          modalMode === 'edit' ? 'Edit User' : 'View User'
        }
        size="lg"
      >
        {modalMode === 'view' && selectedUser ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.username}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.first_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.last_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.role.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Enterprise</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.enterprise.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">{getStatusBadge(selectedUser.status)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Login</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(selectedUser.last_login)}</p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username *
                </label>
                <input
                  type="text"
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <input
                  type="text"
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="role_id" className="block text-sm font-medium text-gray-700">
                  Role *
                </label>
                <select
                  id="role_id"
                  value={formData.role_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, role_id: e.target.value }))}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Role</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="enterprise_id" className="block text-sm font-medium text-gray-700">
                  Enterprise *
                </label>
                <select
                  id="enterprise_id"
                  value={formData.enterprise_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, enterprise_id: e.target.value }))}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Enterprise</option>
                  {enterprises.map(enterprise => (
                    <option key={enterprise.id} value={enterprise.id}>{enterprise.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password {modalMode === 'create' ? '*' : '(leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required={modalMode === 'create'}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors duration-200"
              >
                {modalMode === 'create' ? 'Create User' : 'Update User'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Users;