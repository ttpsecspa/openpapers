import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ fullScreen = false }) {
  const spinner = (
    <>
      <Loader2 className="h-8 w-8 animate-spin text-[#2dd4a8]" />
      <span className="sr-only">Cargando...</span>
    </>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#06080d]" role="status" aria-label="Cargando">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12" role="status" aria-label="Cargando">
      {spinner}
    </div>
  );
}
