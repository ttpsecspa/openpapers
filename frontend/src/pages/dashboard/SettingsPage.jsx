import { useState, useEffect } from 'react';
import {
  Save,
  CheckCircle2,
  Server,
} from 'lucide-react';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    smtp_host: '',
    smtp_port: '',
    smtp_secure: true,
    smtp_user: '',
    smtp_password: '',
    smtp_from_name: '',
    smtp_from_email: '',
  });

  useEffect(() => {
    api.get('/dashboard/settings')
      .then((data) => {
        setForm({
          smtp_host: data.smtp_host || '',
          smtp_port: data.smtp_port || '',
          smtp_secure: data.smtp_secure ?? true,
          smtp_user: data.smtp_user || '',
          smtp_password: '',
          smtp_from_name: data.smtp_from_name || '',
          smtp_from_email: data.smtp_from_email || '',
        });
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const payload = {
        ...form,
        smtp_port: Number(form.smtp_port) || 587,
      };
      if (!payload.smtp_password) {
        delete payload.smtp_password;
      }
      await api.post('/dashboard/settings', payload);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold font-['Outfit'] text-[#e6edf3]">
        Configuración
      </h1>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/25">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          <p className="text-sm text-green-400">Configuración guardada exitosamente</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SMTP Server */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Server className="h-4 w-4 text-[#2dd4a8]" />
            <h3 className="text-sm font-semibold font-['Outfit'] text-[#e6edf3]">
              Servidor SMTP
            </h3>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Host"
                name="smtp_host"
                value={form.smtp_host}
                onChange={(e) => handleChange('smtp_host', e.target.value)}
                placeholder="smtp.ejemplo.com"
              />
              <Input
                label="Puerto"
                name="smtp_port"
                type="number"
                value={form.smtp_port}
                onChange={(e) => handleChange('smtp_port', e.target.value)}
                placeholder="587"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#e6edf3]">Conexion segura (TLS/SSL)</p>
                <p className="text-xs text-[#8b949e]">Usar cifrado para la conexion SMTP</p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('smtp_secure', !form.smtp_secure)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  form.smtp_secure ? 'bg-[#2dd4a8]' : 'bg-[#30363d]'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    form.smtp_secure ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </Card>

        {/* SMTP Credentials */}
        <Card>
          <h3 className="text-sm font-semibold font-['Outfit'] text-[#e6edf3] mb-4">
            Credenciales
          </h3>
          <div className="space-y-4">
            <Input
              label="Usuario"
              name="smtp_user"
              value={form.smtp_user}
              onChange={(e) => handleChange('smtp_user', e.target.value)}
              placeholder="usuario@ejemplo.com"
            />
            <Input
              label="Contrasena"
              name="smtp_password"
              type="password"
              value={form.smtp_password}
              onChange={(e) => handleChange('smtp_password', e.target.value)}
              placeholder="Contrasena del servidor SMTP"
            />
          </div>
        </Card>

        {/* From Settings */}
        <Card>
          <h3 className="text-sm font-semibold font-['Outfit'] text-[#e6edf3] mb-4">
            Remitente
          </h3>
          <div className="space-y-4">
            <Input
              label="Nombre del remitente"
              name="smtp_from_name"
              value={form.smtp_from_name}
              onChange={(e) => handleChange('smtp_from_name', e.target.value)}
              placeholder="OpenPapers"
            />
            <Input
              label="Correo del remitente"
              name="smtp_from_email"
              type="email"
              value={form.smtp_from_email}
              onChange={(e) => handleChange('smtp_from_email', e.target.value)}
              placeholder="noreply@ejemplo.com"
            />
          </div>
        </Card>

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            type="submit"
            loading={saving}
            disabled={saving}
            className="gap-1.5"
          >
            <Save className="h-4 w-4" />
            Guardar Configuración
          </Button>
        </div>
      </form>
    </div>
  );
}
