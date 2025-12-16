import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            QUIROPRAXIA RAMALLO
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Inicia sesión para gestionar turnos
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

