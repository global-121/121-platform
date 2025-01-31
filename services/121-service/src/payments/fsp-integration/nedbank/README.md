# Certificate Handling in Azure App Service

To enable loading certificate files via environment variables in the Azure App Service, follow these steps:

1. **Enable Certificate Loading**:

   - Set the `WEBSITE_LOAD_CERTIFICATES=*` environment variable in the Azure App Service configuration.

2. **Upload the Public Key Certificate**:

   - In the Azure Portal, navigate to the instance's **App Service** > **Settings** > **Certificates**.
   - Press 'Bring your own certificates (.pfx)'
   - Upload the public key certificate (`.pfx`-file) and name it.
   - This will generate a "thumbprint" which will be used as the filename for the certificate.

3. **Set the Certificate-path**:

   - The location of the certificate needs to be set in the environment variable:

     ```dotenv
     NEDBANK_CERTIFICATE_PATH=/var/ssl/private/<thumbprint>.p12
     ```

4. **Error Handling**:

   - When making a payment to Nedbank, if the certificate is not set up correctly, you will encounter transactions with the following error:

     ```json
     { "errno": -71, "code": "EPROTO", "syscall": "write" }
     ```

   - Ensure that the certificate is correctly uploaded and the path is correctly set in the environment variables to avoid this error.
