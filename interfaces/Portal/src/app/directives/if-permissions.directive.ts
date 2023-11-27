import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import Permission from '../auth/permission.enum';

@Directive({
  selector: '[appIfPermissions]',
})
export class IfPermissionsDirective {
  private hasView = false;
  private programId: number;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService,
    private route: ActivatedRoute,
  ) {
    this.programId = this.route.snapshot.params.id;
  }

  @Input()
  set appIfPermissions(requiredPermissions: Permission[]) {
    const condition =
      !!this.programId &&
      this.authService.hasAllPermissions(this.programId, requiredPermissions);

    if (condition && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!condition && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
