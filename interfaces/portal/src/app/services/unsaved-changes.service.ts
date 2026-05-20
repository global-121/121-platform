import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UnsavedChangesService {
  private readonly _visible = signal(false);
  private _resolver: ((confirmed: boolean) => void) | null = null;
  private _pendingConfirmation: null | Promise<boolean> = null;

  get visible() {
    return this._visible.asReadonly();
  }

  confirm(): Promise<boolean> {
    if (this._pendingConfirmation) {
      return this._pendingConfirmation;
    }

    this._visible.set(true);
    this._pendingConfirmation = new Promise((resolve) => {
      this._resolver = resolve;
    });

    return this._pendingConfirmation;
  }

  resolve(result: boolean): void {
    this._visible.set(false);

    const resolver = this._resolver;
    this._resolver = null;
    this._pendingConfirmation = null;

    if (resolver) {
      resolver(result);
    }
  }
}
