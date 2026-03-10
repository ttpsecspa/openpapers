import { FileQuestion } from 'lucide-react';
import Button from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#06080d] px-4">
      <div className="text-center">
        <FileQuestion className="h-16 w-16 text-[#30363d] mx-auto mb-6" />
        <h1 className="text-6xl font-bold font-['Outfit'] text-[#e6edf3] mb-2">
          404
        </h1>
        <p className="text-lg text-[#8b949e] mb-8">
          Página no encontrada
        </p>
        <Button to="/">
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}
