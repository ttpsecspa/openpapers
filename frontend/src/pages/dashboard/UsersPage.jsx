import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Search,
  UserPlus,
  Mail,
  Pencil,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const ROLE_OPTIONS = [
  { value: 'author', label: 'Autor' },
  { value: 'reviewer', label: 'Revisor' },
  { value: 'admin', label: 'Administrador' },
  { value: 'superadmin', label: 'Super Administrador' },
];

const ROLE_VARIANTS = {
  superadmin: 'accent',
  admin: 'info',
  reviewer: 'warning',
  author: 'neutral',
};

const ROLE_LABELS = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  reviewer: 'Revisor',
  author: 'Autor',
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [createForm, setCreateForm] = useState({
    full_name: '',
    email: '',
    password: '',
    affiliation: '',
    role: 'author',
  });
  const [inviteForm, setInviteForm] = useState({
    email: '',
    full_name: '',
    role: 'reviewer',
    tracks: [],
  });
  const [editForm, setEditForm] = useState(null);

  const [tracks, setTracks] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const { activeConferenceId: conferenceId } = useOutletContext();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set('page', String(page));
    if (search.trim()) params.set('search', search.trim());

    try {
      const data = await api.get(`/dashboard/users?${params.toString()}`);
      setUsers(data.users || data.data || []);
      setTotalPages(data.total_pages || data.totalPages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (!conferenceId) return;
    api.get(`/dashboard/conferences/${conferenceId}`)
      .then((data) => {
        setTracks(data.tracks || []);
      })
      .catch(() => {});
  }, [conferenceId]);

  function handleSearchKeyDown(e) {
    if (e.key === 'Enter') {
      setPage(1);
      fetchUsers();
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      await api.post('/dashboard/users', createForm);
      setShowCreateModal(false);
      setCreateForm({ full_name: '', email: '', password: '', affiliation: '', role: 'author' });
      fetchUsers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleInviteReviewer(e) {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      await api.post('/dashboard/users/invite', {
        ...inviteForm,
        conference_id: conferenceId,
      });
      setShowInviteModal(false);
      setInviteForm({ email: '', full_name: '', role: 'reviewer', tracks: [] });
      fetchUsers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleEditUser(e) {
    e.preventDefault();
    if (!editForm) return;
    setFormLoading(true);
    setFormError(null);

    try {
      await api.put(`/dashboard/users/${editForm.id}`, {
        full_name: editForm.full_name,
        email: editForm.email,
        affiliation: editForm.affiliation,
        role: editForm.role,
      });
      setShowEditModal(false);
      setEditForm(null);
      fetchUsers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  }

  function openEditModal(user) {
    setEditForm({ ...user });
    setFormError(null);
    setShowEditModal(true);
  }

  function handleTrackToggle(trackId) {
    setInviteForm((prev) => {
      const trackIdStr = String(trackId);
      const newTracks = prev.tracks.includes(trackIdStr)
        ? prev.tracks.filter((t) => t !== trackIdStr)
        : [...prev.tracks, trackIdStr];
      return { ...prev, tracks: newTracks };
    });
  }

  const columns = [
    {
      key: 'full_name',
      label: 'Nombre',
      render: (value) => (
        <span className="font-medium">{value}</span>
      ),
    },
    { key: 'email', label: 'Email' },
    {
      key: 'affiliation',
      label: 'Afiliación',
      render: (value) => (
        <span className="text-[#8b949e]">{value || '-'}</span>
      ),
    },
    {
      key: 'role',
      label: 'Rol',
      render: (value) => (
        <Badge variant={ROLE_VARIANTS[value] || 'neutral'}>
          {ROLE_LABELS[value] || value}
        </Badge>
      ),
    },
    {
      key: 'is_active',
      label: 'Estado',
      render: (value) => (
        <Badge variant={value !== false ? 'success' : 'error'}>
          {value !== false ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openEditModal(row);
          }}
          className="text-[#8b949e] hover:text-[#2dd4a8] transition-colors"
        >
          <Pencil className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold font-['Outfit'] text-[#e6edf3]">
          Usuarios
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setFormError(null);
              setShowInviteModal(true);
            }}
            className="gap-1.5"
          >
            <Mail className="h-4 w-4" />
            Invitar Revisor
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setFormError(null);
              setShowCreateModal(true);
            }}
            className="gap-1.5"
          >
            <UserPlus className="h-4 w-4" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b949e]" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-9 pr-3 py-2 text-sm text-[#e6edf3] placeholder-[#8b949e] focus:outline-none focus:border-[#2dd4a8] transition-colors"
          />
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <Table
          columns={columns}
          data={users}
          emptyMessage="No se encontraron usuarios"
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <span className="text-sm text-[#8b949e]">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <Modal title="Nuevo Usuario" onClose={() => setShowCreateModal(false)}>
          <form onSubmit={handleCreateUser} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25">
                <p className="text-sm text-red-400">{formError}</p>
              </div>
            )}
            <Input
              label="Nombre completo"
              name="full_name"
              value={createForm.full_name}
              onChange={(e) => setCreateForm((f) => ({ ...f, full_name: e.target.value }))}
              required
            />
            <Input
              label="Correo electrónico"
              name="email"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            <Input
              label="Contraseña"
              name="password"
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
              required
            />
            <Input
              label="Afiliación"
              name="affiliation"
              value={createForm.affiliation}
              onChange={(e) => setCreateForm((f) => ({ ...f, affiliation: e.target.value }))}
            />
            <Select
              label="Rol"
              name="role"
              options={ROLE_OPTIONS}
              value={createForm.role}
              onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value }))}
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setShowCreateModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" loading={formLoading} disabled={formLoading}>
                Crear Usuario
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Invite Reviewer Modal */}
      {showInviteModal && (
        <Modal title="Invitar Revisor" onClose={() => setShowInviteModal(false)}>
          <form onSubmit={handleInviteReviewer} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25">
                <p className="text-sm text-red-400">{formError}</p>
              </div>
            )}
            <Input
              label="Nombre completo"
              name="invite_name"
              value={inviteForm.full_name}
              onChange={(e) => setInviteForm((f) => ({ ...f, full_name: e.target.value }))}
              required
            />
            <Input
              label="Correo electrónico"
              name="invite_email"
              type="email"
              value={inviteForm.email}
              onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            <Select
              label="Rol"
              name="invite_role"
              options={ROLE_OPTIONS}
              value={inviteForm.role}
              onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value }))}
            />

            {/* Tracks Selection */}
            {tracks.length > 0 && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#e6edf3]">
                  Tracks
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto p-2 bg-[#0d1117] rounded-lg border border-[#30363d]">
                  {tracks.map((track) => (
                    <label key={track.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inviteForm.tracks.includes(String(track.id))}
                        onChange={() => handleTrackToggle(track.id)}
                        className="w-4 h-4 rounded border-[#30363d] bg-[#0d1117] text-[#2dd4a8] focus:ring-[#2dd4a8]/40"
                      />
                      <span className="text-sm text-[#e6edf3]">{track.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setShowInviteModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" loading={formLoading} disabled={formLoading}>
                Enviar Invitación
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit User Modal */}
      {showEditModal && editForm && (
        <Modal title="Editar Usuario" onClose={() => setShowEditModal(false)}>
          <form onSubmit={handleEditUser} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25">
                <p className="text-sm text-red-400">{formError}</p>
              </div>
            )}
            <Input
              label="Nombre completo"
              name="edit_name"
              value={editForm.full_name}
              onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))}
              required
            />
            <Input
              label="Correo electrónico"
              name="edit_email"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            <Input
              label="Afiliación"
              name="edit_affiliation"
              value={editForm.affiliation || ''}
              onChange={(e) => setEditForm((f) => ({ ...f, affiliation: e.target.value }))}
            />
            <Select
              label="Rol"
              name="edit_role"
              options={ROLE_OPTIONS}
              value={editForm.role}
              onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setShowEditModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" loading={formLoading} disabled={formLoading}>
                Guardar Cambios
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
