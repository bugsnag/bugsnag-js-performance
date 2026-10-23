import { Component, Input } from '@angular/core';

@Component({
  templateUrl: './profile.component.html',
  standalone: false,
})
export class ProfileComponent {
  @Input() username!: string;
}
