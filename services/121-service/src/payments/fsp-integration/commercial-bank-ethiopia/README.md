# Commercial Bank Ethiopia Integration Guide

This readme provides detailed instructions for integrating your Dockerized application with the VPN tunnel on Azure Cloud for the Commercial Bank Ethiopia project.

## VPN Tunnel and Docker Integration

Follow these steps to successfully integrate your Dockerized application with the VPN tunnel on Azure Cloud for the Commercial Bank Ethiopia project:

1. **VPN Tunnel Setup on Azure Cloud**:

   - Ensure that the VPN tunnel is properly configured on Azure Cloud with the required settings.
   - Collect the necessary connection details, including the VPN server address and credentials.

2. **Docker Application Deployment**:

   - Make sure your application is properly containerized using Docker.
   - Deploy the Docker containers on Azure Cloud where the VPN tunnel is set up.

3. **Container Networking**:

   - Ensure that the Docker containers are part of the same network as the VPN tunnel.
   - This enables seamless communication between your containers and the resources accessible via the VPN.

4. **Configure Application for VPN**:

   - Update your application's configuration to include the VPN server address and port.
   - Modify any relevant settings to ensure your application communicates through the VPN tunnel.

5. **VPN-Aware API Calls**:

   - Identify the specific API endpoints provided by Commercial Bank Ethiopia that need to be accessed through the VPN.
   - Update your application's API calls to use the VPN server's address and port.

6. **TLS Certificate Handling**
   - To enable loading Certificate files via ENV-variables in the Azure App-Service Configuration needs to have set `WEBSITE_LOAD_CERTIFICATES=*`.
   - In the Azure Potal, in the instance's App-Service/Settings/Certificates the public key certificate (.cer) can be uploaded (and named). This will result in a "thumbprint", which will be used as the filename for the Certificate.
   - The location of the certificate needs to be set in the ENV-variable: `COMMERCIAL_BANK_ETHIOPIA_CERTIFICATE_PATH=/var/ssl/certs/<thumbprint>.der`.

## Conclusion

By following these instructions, you'll be able to successfully integrate your Dockerized application with the VPN tunnel on Azure Cloud for the Commercial Bank Ethiopia project. If you encounter any challenges or need further assistance, consult the Azure documentation or seek help from your organization's technical support.

Remember to prioritize security and data integrity throughout the integration process, ensuring that your application communicates securely through the established VPN tunnel.
