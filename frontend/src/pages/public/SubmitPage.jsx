import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Users,
  FileText,
  Upload,
  CheckCircle2,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';

const STEPS = [
  { label: 'Autores', icon: Users },
  { label: 'Información del Paper', icon: FileText },
  { label: 'Archivo', icon: Upload },
  { label: 'Confirmación', icon: CheckCircle2 },
];

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

let authorIdCounter = 0;

function createEmptyAuthor() {
  return { id: `author-${Date.now()}-${++authorIdCounter}`, name: '', email: '', affiliation: '', is_corresponding: false };
}

// --- Step Components ---

function StepAuthors({ authors, setAuthors, errors }) {
  function handleChange(index, field, value) {
    setAuthors((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function addAuthor() {
    setAuthors((prev) => [...prev, createEmptyAuthor()]);
  }

  function removeAuthor(index) {
    if (authors.length <= 1) return;
    setAuthors((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#8b949e]">
        Agrega los autores del paper. Al menos uno debe ser autor de correspondencia.
      </p>

      {errors.authors && (
        <p className="text-sm text-red-400">{errors.authors}</p>
      )}

      {authors.map((author, index) => (
        <Card key={author.id} className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#e6edf3]">
              Autor {index + 1}
            </span>
            {authors.length > 1 && (
              <button
                type="button"
                onClick={() => removeAuthor(index)}
                aria-label={`Eliminar autor ${index + 1}`}
                className="text-[#8b949e] hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nombre completo"
              name={`author-name-${index}`}
              value={author.name}
              onChange={(e) => handleChange(index, 'name', e.target.value)}
              placeholder="Nombre del autor"
              error={errors[`author_${index}_name`]}
            />
            <Input
              label="Correo electrónico"
              name={`author-email-${index}`}
              type="email"
              value={author.email}
              onChange={(e) => handleChange(index, 'email', e.target.value)}
              placeholder="correo@ejemplo.com"
              error={errors[`author_${index}_email`]}
            />
          </div>

          <Input
            label="Afiliación"
            name={`author-affiliation-${index}`}
            value={author.affiliation}
            onChange={(e) => handleChange(index, 'affiliation', e.target.value)}
            placeholder="Universidad / Institución"
          />

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={author.is_corresponding}
              onChange={(e) => handleChange(index, 'is_corresponding', e.target.checked)}
              className="w-4 h-4 rounded border-[#30363d] bg-[#0d1117] text-[#2dd4a8] focus:ring-[#2dd4a8]/40"
            />
            <span className="text-sm text-[#8b949e]">Autor de correspondencia</span>
          </label>
        </Card>
      ))}

      <Button type="button" variant="secondary" onClick={addAuthor} className="gap-1.5">
        <Plus className="h-4 w-4" />
        Agregar autor
      </Button>
    </div>
  );
}

function StepPaperInfo({ paperData, setPaperData, tracks, errors }) {
  function handleChange(field, value) {
    setPaperData((prev) => ({ ...prev, [field]: value }));
  }

  const trackOptions = [
    { value: '', label: 'Seleccionar track...' },
    ...tracks.map((t) => ({ value: String(t.id), label: t.name })),
  ];

  return (
    <div className="space-y-4">
      <Input
        label="Título del paper"
        name="title"
        value={paperData.title}
        onChange={(e) => handleChange('title', e.target.value)}
        placeholder="Título completo del paper"
        error={errors.title}
      />

      <Input
        label="Resumen (Abstract)"
        name="abstract"
        as="textarea"
        value={paperData.abstract}
        onChange={(e) => handleChange('abstract', e.target.value)}
        placeholder="Resumen del paper (minimo 50 caracteres)"
        error={errors.abstract}
      />

      <Select
        label="Track"
        name="track_id"
        value={paperData.track_id}
        onChange={(e) => handleChange('track_id', e.target.value)}
        options={trackOptions}
        error={errors.track_id}
      />

      <Input
        label="Palabras clave"
        name="keywords"
        value={paperData.keywords}
        onChange={(e) => handleChange('keywords', e.target.value)}
        placeholder="Separadas por coma: IA, machine learning, redes neuronales"
        error={errors.keywords}
      />
    </div>
  );
}

function StepFile({ file, setFile, errors }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  function handleFile(selectedFile) {
    if (!selectedFile) return;
    if (selectedFile.type !== 'application/pdf') {
      setFile(null);
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setFile(null);
      return;
    }
    setFile(selectedFile);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#8b949e]">
        Sube tu paper en formato PDF (maximo {MAX_FILE_SIZE_MB} MB).
      </p>

      {errors.file && (
        <p className="text-sm text-red-400">{errors.file}</p>
      )}

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-[#2dd4a8] bg-[#2dd4a8]/5'
            : file
              ? 'border-[#2dd4a8]/50 bg-[#2dd4a8]/5'
              : 'border-[#30363d] hover:border-[#8b949e]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={(e) => handleFile(e.target.files[0])}
          className="hidden"
        />

        {file ? (
          <div className="space-y-2">
            <CheckCircle2 className="h-10 w-10 text-[#2dd4a8] mx-auto" />
            <p className="text-sm font-medium text-[#e6edf3]">{file.name}</p>
            <p className="text-xs text-[#8b949e]">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <p className="text-xs text-[#8b949e]">
              Haz clic para cambiar el archivo
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-10 w-10 text-[#8b949e] mx-auto" />
            <p className="text-sm text-[#e6edf3]">
              Arrastra tu archivo aqui o haz clic para seleccionar
            </p>
            <p className="text-xs text-[#8b949e]">Solo PDF, maximo {MAX_FILE_SIZE_MB} MB</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StepConfirmation({ authors, paperData, file, tracks }) {
  const selectedTrack = tracks.find((t) => String(t.id) === String(paperData.track_id));

  return (
    <div className="space-y-6">
      <p className="text-sm text-[#8b949e]">
        Revisa la información antes de enviar tu paper.
      </p>

      {/* Authors Summary */}
      <Card>
        <h3 className="text-sm font-semibold text-[#e6edf3] mb-3">Autores</h3>
        <div className="space-y-2">
          {authors.map((author, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span className="text-[#e6edf3]">{author.name}</span>
              <span className="text-[#8b949e]">({author.email})</span>
              {author.is_corresponding && (
                <Badge variant="accent">Correspondencia</Badge>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Paper Info Summary */}
      <Card>
        <h3 className="text-sm font-semibold text-[#e6edf3] mb-3">Paper</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-[#8b949e]">Título: </span>
            <span className="text-[#e6edf3]">{paperData.title}</span>
          </div>
          <div>
            <span className="text-[#8b949e]">Track: </span>
            <span className="text-[#e6edf3]">{selectedTrack?.name || 'No seleccionado'}</span>
          </div>
          {paperData.keywords && (
            <div>
              <span className="text-[#8b949e]">Palabras clave: </span>
              <span className="text-[#e6edf3]">{paperData.keywords}</span>
            </div>
          )}
          <div>
            <span className="text-[#8b949e]">Resumen: </span>
            <span className="text-[#e6edf3] line-clamp-3">{paperData.abstract}</span>
          </div>
        </div>
      </Card>

      {/* File Summary */}
      <Card>
        <h3 className="text-sm font-semibold text-[#e6edf3] mb-3">Archivo</h3>
        {file ? (
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-[#2dd4a8]" />
            <span className="text-[#e6edf3]">{file.name}</span>
            <span className="text-[#8b949e]">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
          </div>
        ) : (
          <p className="text-sm text-red-400">No se ha seleccionado un archivo</p>
        )}
      </Card>
    </div>
  );
}

// --- Main Component ---

export default function SubmitPage() {
  const { slug } = useParams();
  const [conference, setConference] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [authors, setAuthors] = useState([createEmptyAuthor()]);
  const [paperData, setPaperData] = useState({
    title: '',
    abstract: '',
    track_id: '',
    keywords: '',
  });
  const [file, setFile] = useState(null);
  const [stepErrors, setStepErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    api.get(`/conferences/${slug}`)
      .then((data) => {
        setConference(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  function validateStep(step) {
    const errors = {};

    if (step === 0) {
      if (authors.length === 0) {
        errors.authors = 'Debe haber al menos un autor';
      }
      authors.forEach((author, index) => {
        if (!author.name.trim()) {
          errors[`author_${index}_name`] = 'Nombre requerido';
        }
        if (!author.email.trim()) {
          errors[`author_${index}_email`] = 'Correo requerido';
        }
      });
      const hasCorresponding = authors.some((a) => a.is_corresponding);
      if (!hasCorresponding) {
        errors.authors = 'Debe haber al menos un autor de correspondencia';
      }
    }

    if (step === 1) {
      if (!paperData.title.trim()) {
        errors.title = 'El título es requerido';
      }
      if (!paperData.abstract.trim()) {
        errors.abstract = 'El resumen es requerido';
      } else if (paperData.abstract.trim().length < 50) {
        errors.abstract = 'El resumen debe tener al menos 50 caracteres';
      }
      if (!paperData.track_id) {
        errors.track_id = 'Selecciona un track';
      }
    }

    if (step === 2) {
      if (!file) {
        errors.file = 'Debes subir un archivo PDF';
      }
    }

    return errors;
  }

  function handleNext() {
    const errors = validateStep(currentStep);
    setStepErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }

  function handlePrevious() {
    setStepErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }

  async function handleSubmit() {
    const errors = validateStep(2);
    if (Object.keys(errors).length > 0) {
      setStepErrors(errors);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const formData = new FormData();
    formData.append('conference_slug', slug);
    formData.append('title', paperData.title);
    formData.append('abstract', paperData.abstract);
    formData.append('track_id', paperData.track_id);
    formData.append('keywords', paperData.keywords);
    formData.append('authors', JSON.stringify(authors));
    formData.append('file', file);

    try {
      const result = await api.postFormData('/submissions', formData);
      setSuccessData(result);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-red-400 text-lg">{error}</p>
        <Button to="/" variant="secondary" className="mt-6">
          Volver al inicio
        </Button>
      </div>
    );
  }

  if (!conference) return null;

  const tracks = conference.tracks || [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <Button to={`/cfp/${slug}`} variant="ghost" size="sm" className="gap-1 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Volver a la convocatoria
        </Button>
        <h1 className="text-2xl font-bold font-['Outfit'] text-[#e6edf3]">
          Enviar Paper
        </h1>
        <p className="text-sm text-[#8b949e] mt-1">{conference.name}</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <div key={step.label} className="flex items-center">
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  isActive
                    ? 'bg-[#2dd4a8]/15 text-[#2dd4a8]'
                    : isCompleted
                      ? 'text-[#2dd4a8]'
                      : 'text-[#8b949e]'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{step.label}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`w-8 h-px mx-1 ${
                    isCompleted ? 'bg-[#2dd4a8]' : 'bg-[#30363d]'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold font-['Outfit'] text-[#e6edf3] mb-4">
          {STEPS[currentStep].label}
        </h2>

        {currentStep === 0 && (
          <StepAuthors
            authors={authors}
            setAuthors={setAuthors}
            errors={stepErrors}
          />
        )}
        {currentStep === 1 && (
          <StepPaperInfo
            paperData={paperData}
            setPaperData={setPaperData}
            tracks={tracks}
            errors={stepErrors}
          />
        )}
        {currentStep === 2 && (
          <StepFile file={file} setFile={setFile} errors={stepErrors} />
        )}
        {currentStep === 3 && (
          <StepConfirmation
            authors={authors}
            paperData={paperData}
            file={file}
            tracks={tracks}
          />
        )}
      </Card>

      {/* Submit Error */}
      {submitError && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/25">
          <p className="text-sm text-red-400">{submitError}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div>
          {currentStep > 0 && (
            <Button type="button" variant="secondary" onClick={handlePrevious} className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
          )}
        </div>

        <div>
          {currentStep < STEPS.length - 1 ? (
            <Button type="button" onClick={handleNext} className="gap-1">
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              loading={submitting}
              disabled={submitting}
              className="gap-1"
            >
              Enviar Paper
            </Button>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {successData && (
        <Modal
          title="Paper Enviado Exitosamente"
          onClose={() => setSuccessData(null)}
        >
          <div className="space-y-4 text-center">
            <CheckCircle2 className="h-16 w-16 text-[#2dd4a8] mx-auto" />
            <p className="text-sm text-[#8b949e]">
              Tu paper ha sido enviado correctamente. Guarda el siguiente codigo
              de seguimiento para consultar el estado de tu envio.
            </p>
            <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4">
              <p className="text-xs text-[#8b949e] mb-1">Código de seguimiento</p>
              <p className="text-xl font-mono font-bold text-[#2dd4a8]">
                {successData.tracking_code}
              </p>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <Button to="/estado" variant="secondary" size="sm">
                Consultar estado
              </Button>
              <Button to="/" size="sm">
                Volver al inicio
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
