import * as fs from 'fs';
import * as path from 'path';

export function getSecret(envVarName: string, fileEnvVarName: string): string {
  // 1. Intentar leer desde la variable de entorno que apunta al archivo (ej. Docker)
  let filePath = process.env[fileEnvVarName];

  // 2. Si no está definida, usar por defecto la ruta local basada en el nombre de la variable
  if (!filePath) {
    if (envVarName.includes('REDIS')) {
      filePath = path.resolve(process.cwd(), 'secrets/redis_password.txt');
    } else if (envVarName.includes('DB')) {
      filePath = path.resolve(process.cwd(), 'secrets/db_password.txt'); // O ajusta el nombre si tu archivo de BD se llama distinto
    }
  }

  // 3. Verificar si el archivo existe y leerlo
  if (filePath && fs.existsSync(filePath)) {
    try {
      const rawSecret = fs.readFileSync(filePath, 'utf8');
      return rawSecret.trim();
    } catch (error) {
      console.error(`Error leyendo el archivo de secreto ${filePath}:`, error);
    }
  }

  // 4. Si todo lo anterior falla, recurrir a la variable de entorno directa
  return process.env[envVarName] || '';
}
