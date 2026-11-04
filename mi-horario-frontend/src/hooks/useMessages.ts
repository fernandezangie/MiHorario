import { useEffect, useState } from 'react';
import { api } from '../services/api';

let cache: Record<string, string> | null = null;
let inFlight: Promise<Record<string, string>> | null = null;

export const formatMessage = (
  template: string,
  args: Record<string, string | number> = {},
) => template.replace(/{(\w+)}/g, (_, k) => String(args[k] ?? `{${k}}`));

const loadCatalog = (): Promise<Record<string, string>> => {
  if (cache) return Promise.resolve(cache);
  if (!inFlight) {
    inFlight = api
      .getMessages()
      .then((data) => {
        cache = data;
        return data;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
};

export function useMessages() {
  const [messages, setMessages] = useState<Record<string, string>>(cache || {});

  useEffect(() => {
    if (cache) return;
    loadCatalog()
      .then(setMessages)
      .catch((err) => console.error('No se pudo cargar el catálogo:', err));
  }, []);

  const t = (code: string, args?: Record<string, string | number>) =>
    messages[code] ? formatMessage(messages[code], args) : '';

  return { t, messages };
}