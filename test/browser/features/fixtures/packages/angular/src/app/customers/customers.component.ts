import { Component } from '@angular/core';
import { Title } from "@angular/platform-browser";
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
})
export class CustomersComponent {
  constructor(private titleService: Title, private route: ActivatedRoute) {
    const customerId = this.route.snapshot.paramMap.get('customerId')
    this.titleService.setTitle(`Customer ${customerId}`);
  }
}
