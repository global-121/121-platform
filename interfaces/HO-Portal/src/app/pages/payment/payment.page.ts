import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.page.html',
  styleUrls: ['./payment.page.scss'],
})
export class PaymentPage implements OnInit {
  public programId = this.route.snapshot.params.id;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {}
}
