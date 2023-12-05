import { Component, Input } from '@angular/core';

@Component({
  templateUrl: './profile.component.html',
})
export class ProfileComponent {
  @Input() username!: string;
}
