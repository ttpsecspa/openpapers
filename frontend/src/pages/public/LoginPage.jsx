import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    affiliation: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        await register(formData.email, formData.password, formData.full_name, formData.affiliation);
      } else {
        await login(formData.email, formData.password);
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setIsRegister((prev) => !prev);
    setError(null);
  }

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#2dd4a8]/15 mb-3">
            {isRegister ? (
              <UserPlus className="h-6 w-6 text-[#2dd4a8]" />
            ) : (
              <LogIn className="h-6 w-6 text-[#2dd4a8]" />
            )}
          </div>
          <h1 className="text-2xl font-bold font-['Outfit'] text-[#e6edf3]">
            {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </h1>
          <p className="text-sm text-[#8b949e] mt-1">
            {isRegister
              ? 'Regístrate para acceder a la plataforma'
              : 'Ingresa a tu cuenta para continuar'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/25">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <Input
                label="Nombre completo"
                name="full_name"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                placeholder="Tu nombre completo"
                required
              />
              <Input
                label="Afiliación (opcional)"
                name="affiliation"
                value={formData.affiliation}
                onChange={(e) => handleChange('affiliation', e.target.value)}
                placeholder="Universidad / Institución"
              />
            </>
          )}

          <Input
            label="Correo electrónico"
            name="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="correo@ejemplo.com"
            required
          />

          <Input
            label="Contraseña"
            name="password"
            type="password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            placeholder="Tu contraseña"
            required
          />

          <Button
            type="submit"
            loading={loading}
            disabled={loading}
            className="w-full"
          >
            {isRegister ? 'Registrarse' : 'Iniciar Sesión'}
          </Button>
        </form>

        {/* Toggle */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={toggleMode}
            className="text-sm text-[#8b949e] hover:text-[#2dd4a8] transition-colors"
          >
            {isRegister
              ? '¿Ya tienes cuenta? Inicia sesión'
              : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </Card>
    </div>
  );
}
