export class RegistrationType {
  id: number;
  fsp: string | undefined; // Assuming fsp is a string, adjust if necessary
  [key: string]: unknown; // Add any other properties that `registration` might have
}
