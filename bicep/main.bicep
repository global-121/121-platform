// Define all parameters (change values in .bicepparam file)
// Constants
param clientName string
param location string = resourceGroup().location
param logAnalyticsWorkspaceName string
param tags object
param appServicePlanName  string
param runtimeStack string
param corsAllowedOrigins array
param dnsZoneName string
param cName string

// Names
param appServiceName string
param staticWebAppName string

// AppService Env Variables
@secure()
param POSTGRES_PASSWORD string
param POSTGRES_USER string
@secure()
param RESET_SECRET string
@secure()
param SECRETS_121_SERVICE_SECRET string
@secure()
param USERCONFIG_121_SERVICE_PASSWORD_ADMIN string
param ENV_ICON string
param APPLICATION_INSIGHT_ENDPOINT string
param ApplicationInsightsAgent_EXTENSION_VERSION string

param ENV_NAME string
param EXTERNAL_121_SERVICE_URL string
@secure()
param INTERSOLVE_PASSWORD string
param INTERSOLVE_USERNAME string
param KOBO_CONNECT_API_URL string
param MOCK_COMMERCIAL_BANK_ETHIOPIA string
param MOCK_INTERSOLVE string
param MOCK_SAFARICOM string
param MOCK_SERVICE_URL string
param MOCK_TWILIO string
param MOCK_VODACASH string
param NODE_ENV string
param PORT_121_SERVICE string
param POSTGRES_DBNAME string
param POSTGRES_HOST string
param REDIRECT_PORTAL_URL_HOST string
param REDIS_HOST string
@secure()
param REDIS_PASSWORD string
param REDIS_PORT string
param REDIS_PREFIX string
param SAFARICOM_API_URL string
param SAFARICOM_B2C_PAYMENTREQUEST_ENDPOINT string
@secure()
param SAFARICOM_CONSUMER_KEY string
@secure()
param SAFARICOM_CONSUMER_SECRET string
param SAFARICOM_IDTYPE string
param SAFARICOM_INITIATORNAME string
param SAFARICOM_PARTY_A string
@secure()
param SAFARICOM_SECURITY_CREDENTIAL string
@secure()
param TWILIO_AUTHTOKEN string
param TWILIO_MESSAGING_SID string
param TWILIO_SID string
param TWILIO_WHATSAPP_NUMBER string
param USERCONFIG_121_SERVICE_EMAIL_ADMIN string
param WEBSITE_HTTPLOGGING_RETENTION_DAYS string
param WEBSITE_RUN_FROM_PACKAGE string
param WEBSITES_CONTAINER_START_TIME_LIMIT string
param XDT_MicrosoftApplicationInsights_Mode string


// Find existing logAnalyticsWorkspace
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' existing = {
  name: logAnalyticsWorkspaceName
}

// Create Application Insights resource
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '121-${clientName}'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
  }
  tags: tags
}

//Find existing App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2022-03-01' existing = {
  name: appServicePlanName
}

//Create new App Service
resource newAppService 'Microsoft.Web/sites@2022-03-01' = {
  name: appServiceName
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      appSettings: [
        {
          name: 'POSTGRES_PASSWORD'
          value: POSTGRES_PASSWORD
        },{
          name: 'POSTGRES_USER'
          value: POSTGRES_USER
        },{
          name: 'RESET_SECRET'
          value: RESET_SECRET
        },{
          name: 'SECRETS_121_SERVICE_SECRET'
          value: SECRETS_121_SERVICE_SECRET
        },{
          name: 'USERCONFIG_121_SERVICE_PASSWORD_ADMIN'
          value: USERCONFIG_121_SERVICE_PASSWORD_ADMIN
        },{
          name: 'ENV_ICON'
          value: ENV_ICON
        },{
          name: 'APPLICATION_INSIGHT_ENDPOINT'
          value: APPLICATION_INSIGHT_ENDPOINT
        },{
          name: 'APPLICATION_INSIGHT_IKEY'
          value: appInsights.properties.InstrumentationKey
        },{
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: 'InstrumentationKey=${appInsights.properties.InstrumentationKey};IngestionEndpoint=https://westeurope-5.in.applicationinsights.azure.com/;LiveEndpoint=https://westeurope.livediagnostics.monitor.azure.com/;ApplicationId=${appInsights.properties.AppId}'
        },{
          name: 'ApplicationInsightsAgent_EXTENSION_VERSION'
          value: ApplicationInsightsAgent_EXTENSION_VERSION
        },{
          name: 'ENV_NAME'
          value: ENV_NAME
        },{
          name: 'EXTERNAL_121_SERVICE_URL'
          value: EXTERNAL_121_SERVICE_URL
        },{
          name: 'INTERSOLVE_PASSWORD'
          value: INTERSOLVE_PASSWORD
        },{
          name: 'INTERSOLVE_USERNAME'
          value: INTERSOLVE_USERNAME
        },{
          name: 'KOBO_CONNECT_API_URL'
          value: KOBO_CONNECT_API_URL
        },{
          name: 'MOCK_COMMERCIAL_BANK_ETHIOPIA'
          value: MOCK_COMMERCIAL_BANK_ETHIOPIA
        },{
          name: 'MOCK_INTERSOLVE'
          value: MOCK_INTERSOLVE
        },{
          name: 'MOCK_SAFARICOM'
          value: MOCK_SAFARICOM
        },{
          name: 'MOCK_SERVICE_URL'
          value: MOCK_SERVICE_URL
        },{
          name: 'MOCK_TWILIO'
          value: MOCK_TWILIO
        },{
          name: 'MOCK_VODACASH'
          value: MOCK_VODACASH
        },{
          name: 'NODE_ENV'
          value: NODE_ENV
        },{
          name: 'PORT_121_SERVICE'
          value: PORT_121_SERVICE
        },{
          name: 'POSTGRES_DBNAME'
          value: POSTGRES_DBNAME
        },{
          name: 'POSTGRES_HOST'
          value: POSTGRES_HOST
        },{
          name: 'REDIRECT_PORTAL_URL_HOST'
          value: REDIRECT_PORTAL_URL_HOST
        },{
          name: 'REDIS_HOST'
          value: REDIS_HOST
        },{
          name: 'REDIS_PASSWORD'
          value: REDIS_PASSWORD
        },{
          name: 'REDIS_PORT'
          value: REDIS_PORT
        },{
          name: 'REDIS_PREFIX'
          value: REDIS_PREFIX
        },{
          name: 'SAFARICOM_API_URL'
          value: SAFARICOM_API_URL
        },{
          name: 'SAFARICOM_B2C_PAYMENTREQUEST_ENDPOINT'
          value: SAFARICOM_B2C_PAYMENTREQUEST_ENDPOINT
        },{
          name: 'SAFARICOM_CONSUMER_KEY'
          value: SAFARICOM_CONSUMER_KEY
        },{
          name: 'SAFARICOM_CONSUMER_SECRET'
          value: SAFARICOM_CONSUMER_SECRET
        },{
          name: 'SAFARICOM_IDTYPE'
          value: SAFARICOM_IDTYPE
        },{
          name: 'SAFARICOM_INITIATORNAME'
          value: SAFARICOM_INITIATORNAME
        },{
          name: 'SAFARICOM_PARTY_A'
          value: SAFARICOM_PARTY_A
        },{
          name: 'SAFARICOM_SECURITY_CREDENTIAL'
          value: SAFARICOM_SECURITY_CREDENTIAL
        },{
          name: 'TWILIO_AUTHTOKEN'
          value: TWILIO_AUTHTOKEN
        },{
          name: 'TWILIO_MESSAGING_SID'
          value: TWILIO_MESSAGING_SID
        },{
          name: 'TWILIO_SID'
          value: TWILIO_SID
        },{
          name: 'TWILIO_WHATSAPP_NUMBER'
          value: TWILIO_WHATSAPP_NUMBER
        },{
          name: 'USERCONFIG_121_SERVICE_EMAIL_ADMIN'
          value: USERCONFIG_121_SERVICE_EMAIL_ADMIN
        },{
          name: 'WEBSITE_HTTPLOGGING_RETENTION_DAYS'
          value: WEBSITE_HTTPLOGGING_RETENTION_DAYS
        },{
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: WEBSITE_RUN_FROM_PACKAGE
        },{
          name: 'WEBSITES_CONTAINER_START_TIME_LIMIT'
          value: WEBSITES_CONTAINER_START_TIME_LIMIT
        },{
          name: 'XDT_MicrosoftApplicationInsights_Mode'
          value: XDT_MicrosoftApplicationInsights_Mode
        }
      ]
      scmType: 'None'
      linuxFxVersion: runtimeStack
      appCommandLine: ''  // If you have a custom start command
      http20Enabled: true
      cors: {
        allowedOrigins: corsAllowedOrigins
        supportCredentials: true
      }
    }
    httpsOnly: true
  }
  identity: {
    type: 'SystemAssigned'
  }
  tags: tags
}

// Set logging App service to true
resource setLoggingTrue 'Microsoft.Web/sites/config@2022-09-01' = {
  name: 'logs'
  kind: 'string'
  parent: newAppService
  properties: {
    httpLogs: {
      fileSystem: {
        enabled: true
        retentionInDays: 30
        retentionInMb: 35
      }
    }
  }
}

// Find existing DNSZone
resource dnsZone 'Microsoft.Network/dnsZones@2018-05-01' existing = {
  name: dnsZoneName
}

// Add Cname record for app Service to DNSZone
resource dnsCname 'Microsoft.Network/dnsZones/CNAME@2018-05-01' = {
  name: clientName
  parent: dnsZone
  properties: {
    TTL: 3600
    CNAMERecord: {
      cname: cName
    }
  }
}

// Add custom domain to App Service
resource appServiceCustomHost 'Microsoft.Web/sites/hostNameBindings@2020-06-01' = {
  name: '${clientName}.${dnsZoneName}'
  parent: newAppService
  dependsOn: [dnsCname]
  properties: {
    hostNameType: 'Verified'
    customHostNameDnsRecordType: 'CName'
    siteName: newAppService.name
  }
}

// Create the static web app (portal)
resource newStaticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: staticWebAppName
  location: location
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {}
  tags: tags
}

// Add custom domain to static web app
resource staticWebAppCustomHost 'Microsoft.Web/staticSites/customDomains@2023-12-01' = {
  parent: newStaticWebApp
  dependsOn: [dnsCname]
  name: 'portal.${clientName}.${dnsZoneName}'
}
