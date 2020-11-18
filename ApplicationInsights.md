## Application Insights
Creating and associating instances:
Application Insights resources can be created on the azure portal by accessing "Create a resource" > "Developer Tools" > "Application Insights". Moreover, it is always associated with a resource group. Each resource has a workspace within "Log Analytics" which stores the logged data for the time-period that can be set-up. By default, the data retention period is of 30 days.
Each Application Insights resource has its own `instrumentation key` which is used to access/ connect the resource to the targeted applications that you want to monitor.

## setup
### Web Application (interfaces)
In order to start monitoring a web application, the steps needed are to first install SDK using the library called `applicationinsights-web`. This can be installed using the `npm install` command. Once it has been installed, we can simply initiate the SDK by using a code snippet:

```ts
new ApplicationInsights({
   config: {
     instrumentationKey: <<ikey>>,
     enableSessionStorageBuffer: true,
   },
});
```


The `config` object within the starting call can be used to set-up basic configurations such as enabling cookies and so on, see more at: https://github.com/microsoft/ApplicationInsights-JS#readme.

Additionally, in order to send telemetry we can call the inbuilt methods and pass on the event/exception related objects that will be logged on. For example, in order to start tracking the `page views` after the application has been launched, we can simply invoke:

```ts
    appInsights.trackPageView({name: 'some page'});
```

### Node.js server (services)
Similar to how `applicationinsights-web` is set up we can set-up the monitoring for services by installing `@microsoft/applicationinsights` and then initializing the SDK by simply:

```ts
appInsights.setup(<<ikey>>);
appInsights.start();
```

The `instrumentation keys` should always be stored within the env files and be accessed through the environment variables.

### Custom telemetry
The SDKs installed provide us with inbuilt methods that can be invoked anywhere be used to send customized telemetry. This allows us to track `clicks` and also keep track of certain events that may not be considered an important javascript event otherwise.


## Portal
Once the `applicationinsights` resource has been setup and the SDKs have been installed and invoked within the interfaces and services, we can observe the data that has started logging in. A simple network of connected  instances can be seen under Application Insights > Application Maps. Here each node presents either a single or a grouped collection of instances. The network shows how it interprets the different components interacting with each other. By clicking on one of these nodes, we can observe a detail sidebar on the right, and that gives us further details on the major logged events and exceptions.

### Usage
The usage and estimate of the price can be observed under "Application Insights resource > Configure > Usage and estimate costs".
For `Log Analytics` it will be under "Log Analytics resource > General (sidebar) > Usage and estimate costs".

### Logs
Since each Application Insights is connected with a workspace, we can use the "Logs" option within the AI resource sidebar to access the logged data. There are already custom queries set up, however we can add multiple filters and observe the telemetry that has been logged in the desired time period. The output result can also be converted into a chart which can be pinned to "Application Dashboard".

Important queries to know:
```
customEvents
| where timestamp > ago(24h)
| summarize count() by  name
````
This can give a table showing counts of all events and they are summarized by their names, this can be modified to add more filters and use multiple columns to summarize the data.

```
Usage
| where TimeGenerated > startofday(ago(90d))
| where IsBillable == true
| summarize IngestedGB = sum(Quantity) / 1000
```
This shows the utilized space within the `Log Analytics` workspace.

### Workbooks
For creating various representations of logs by creating customized charts and telemetry data, we can make use of Workbooks. Go to "Application Insights > Monitoring > Workbooks" and select "New". This will open a text box for a entering a query and then various options available to show the output using charts and numbers.

### Alerts
Application Insights also allows us to set up alerts to notify users of a certain event threshold being hit, this can be used to alert pertinent people of things such as consumed space, CPU usage, incoming traffic, user counts etc.

In order to create an alert, go to "Application Insights > Alerts > New". Alternatively, for a query, within Logs one can also choose the "Query" button to add the output of a certain query and apply thresholds with it.
Each alert selects an action group which contains a list of roles or list of emails that are going to be notified of the alert being invoked.

#### Action group
Action groups can be created from `Application Insights` and during the creation process within `Notifications` emails and roles can be added.
