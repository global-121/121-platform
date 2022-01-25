import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import Permission from '../auth/permission.enum';

@Directive({
  selector: '[appIfPermissions]',
})
export class IfPermissionsDirective {
  private hasView = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService,
  ) {}

  @Input()
  set appIfPermissions(requiredPermissions: Permission[]) {
    if (!requiredPermissions && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (
      this.authService.hasAllPermissions(requiredPermissions) &&
      this.hasView
    ) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
