import * as fs from 'fs';
import * as path from 'path';

export function getSecret(envVarName: string, fileEnvVarName: string): string {

  let filePath = process.env[fileEnvVarName];

  if (!filePath) {
    if (envVarName.includes('REDIS')) {
      filePath = path.resolve(process.cwd(), 'secrets/redis_password.txt');
    } else if (envVarName.includes('DB')) {
      filePath = path.resolve(process.cwd(), 'secrets/db_password.txt');
    }
  }

  if (filePath && fs.existsSync(filePath)) {
    try {
      const rawSecret = fs.readFileSync(filePath, 'utf8');
      return rawSecret.trim();
    } catch (error) {
      console.error(`Error leyendo el archivo de secreto ${filePath}:`, error);
    }
  }

  return process.env[envVarName] || '';
}
