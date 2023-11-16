import { Component } from '@angular/core';
import { Title } from "@angular/platform-browser";

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: []
})
export class CustomersComponent {
  constructor(private titleService:Title) {
    this.titleService.setTitle("Customers");
  }
}



