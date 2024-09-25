export enum RegistrationAttributeType {
  // Translate the types used in the API to internal, proper types:
  Number = 'numeric',
  Text = 'text',
  Date = 'date',
  Enum = 'dropdown',
  PhoneNumber = 'tel',
  Email = 'email',
  Boolean = 'boolean',
  MultiSelect = 'multi-select',
}
