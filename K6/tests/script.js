import { sleep } from 'k6';
import { expect } from "https://jslib.k6.io/k6chaijs/4.3.4.3/index.js";
import resetModel from '../models/reset.js';

const resetPage = new resetModel();

export default function () {
  const reset = resetPage.resetDB('2');
  expect(reset.status, "Reset imported was successful").to.equal(202);
  sleep(1);
}
