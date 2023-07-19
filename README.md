# Grafana Data-Source Plugin for SEPA engine 
## What is a Grafana Data Source Plugin?
Grafana supports a wide range of data sources, including Prometheus, MySQL, and even Datadog. There’s a good chance you can already visualize metrics from the systems you have set up. In some cases, though, you already have an in-house metrics solution that you’d like to add to your Grafana dashboards. Grafana Data Source Plugins enables integrating such solutions with Grafana.

## Using the plugin in your grafana instance
### Environment
1. Deploy grafana or use a preconfigured image
### Create and configure Data Source
2. Go to options-> datasource
3. Select new datasource and choose Grafana4Sepa from the entries
4. Specify ip,ports and jsap for the Sepa Instance
5. Select ok
### Create new query panel
6. Create a new dashboard
7. Create a new query panel
8. Select the query name from the drop down menu
9. Edit forced bindings and raw text
10. Refresh the panel to see te query results
### Variable interpolation
11. Use $varname in the raw query text and forced bindings to use grafana built in variable interpolation system



## Developing
1. Install dependencies

   ```
   npm i
   ```
2. Build plugin in development mode or run in watch mode
   ```
   npm run dev
   ```
   or
   ```
   npm run watch
   ```
3. Build plugin in production mode
   ```
   npm build
   ```


## Deployment
If you don't have an already running instance of grafana, the following steps will guide you to deploy a developement instace of grafana locally. This is an example deployment configuration and should not be used in production.

1. Clone this repository

2. Cd into the repository folder

3. Build the docker image locally:
   ```
   docker build -t username/imagename .
   ```


## Learn more
- [Build a data source plugin tutorial](https://grafana.com/tutorials/build-a-data-source-plugin)
- [Grafana documentation](https://grafana.com/docs/)
- [Grafana Tutorials](https://grafana.com/tutorials/) - Grafana Tutorials are step-by-step guides that help you make the most of Grafana
- [Grafana UI Library](https://developers.grafana.com/ui) - UI components to help you build interfaces using Grafana Design System
