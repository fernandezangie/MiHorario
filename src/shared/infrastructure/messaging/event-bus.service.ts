import { Injectable } from '@nestjs/common';

@Injectable()
export class EventBusService {
  private listeners: Map<string, Array<(data: any) => void>> = new Map();

  publish(event: string, data: any): void {
    const handlers = this.listeners.get(event) || [];
    handlers.forEach((handler) => handler(data));
  }

  subscribe(event: string, handler: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);
  }
}