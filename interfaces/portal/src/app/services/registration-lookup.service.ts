import { computed, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class RegistrationLookupService {
  private readonly route = inject(ActivatedRoute);
  private readonly queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  readonly phonenumber = computed(
    () =>
      this.queryParamMap().get('phonenumber') ??
      this.queryParamMap().get('phoneNumber') ??
      undefined,
  );

  readonly isActive = computed(() => !!this.phonenumber());
}
