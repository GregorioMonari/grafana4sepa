######################################################################################
# NAME: GRAFANA 4 SEPA
# DESCRIPTION: A custom grafana image with a SEPA subscription plugin ready on the go 
######################################################################################
FROM grafana/grafana

#FIRST COPY THE PLUGIN SRC
COPY . /var/lib/grafana/plugins

#SET DEV MODE, NEEDED TO RUN UNSIGNED PLUGINS
ENV GF_DEFAULT_APP_MODE=development
