import { computed, inject, Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class RegistrationLookupService {
  private route = inject(ActivatedRoute);

  readonly phonenumber = computed(
    () =>
      (this.route.snapshot.queryParams.phonenumber ??
        this.route.snapshot.queryParams.phoneNumber) as string | undefined,
  );

  readonly isActive = computed(() => !!this.phonenumber());
}
