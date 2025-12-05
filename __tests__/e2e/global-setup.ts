import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Verificar que las variables de entorno estén configuradas
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    console.warn('⚠️  TEST_USER_EMAIL o TEST_USER_PASSWORD no están configuradas en .env.local');
    console.warn('   Los tests de autenticación pueden fallar.');
  }
}

export default globalSetup;

