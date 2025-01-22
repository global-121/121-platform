## TLS Certificate Handling Azure app Service

To enable loading certificate files via environment variables in the Azure App Service, follow these steps:

1. **Enable Certificate Loading**:

   - Set the `WEBSITE_LOAD_CERTIFICATES=*` environment variable in the Azure App Service configuration.

2. **Upload the Public Key Certificate**:

   - In the Azure Portal, navigate to the instance's **App Service** > **Settings** > **Certificates**.
   - Press 'Bring your own certificates (.pfx)'
   - Upload the public key certificate (`.pfx` file) and name it. This will generate a "thumbprint" which will be used as the filename for the certificate.

3. **Set the Certificate Path**:

   - Find the right certificate path:
     - Azure converts .pfx files to .p12 files
     - To find the correct on navigate to **App Service** > **Development Tools** > **SSH**
     - Go to directory: `cd /var/ssl/private`
     - Log files and file size `ls -lh`
     - Look at the date and a distinct files size to select the right one
   - The location of the certificate needs to be set in the environment variable:

     ```plaintext
     NEDBANK_CERTIFICATE_PATH=/var/ssl/private/<thumbprint>.p12
     ```
