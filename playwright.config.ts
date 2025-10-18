import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  
  // Tiempo máximo por test
  timeout: 30 * 1000,
  
  // Tiempo máximo para cada acción (click, fill, etc)
  expect: {
    timeout: 5000
  },

  // Ejecutar tests en paralelo
  fullyParallel: true,
  
  // No permitir tests con .only en CI
  forbidOnly: !!process.env.CI,
  
  // Reintentos en caso de fallo (útil en CI)
  retries: process.env.CI ? 2 : 0,
  
  // Workers (tests en paralelo)
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter (formato de resultados)
  reporter: [
    ['html'],
    ['list']
  ],

  use: {
    // URL base de tu aplicación
    baseURL: 'http://localhost:5173',
    
    // Captura de pantalla solo en fallos
    screenshot: 'only-on-failure',
    
    // Video solo en fallos
    video: 'retain-on-failure',
    
    // Trace para debugging (muy útil)
    trace: 'on-first-retry',
  },

  // Configuración de proyectos (navegadores)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Descomentar si quieres probar en más navegadores
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Iniciar servidor automáticamente
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});