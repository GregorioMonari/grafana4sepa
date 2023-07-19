import React, { ChangeEvent, PureComponent } from 'react';
import { LegacyForms } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { MyDataSourceOptions } from './types';

const { FormField } = LegacyForms;

interface Props extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions> {}

interface State {}

export class ConfigEditor extends PureComponent<Props, State> {
  //!OVERRIDE PARAMETERS
  onHostChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      host: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  onHttpPortChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      http_port: parseFloat(event.target.value),
    };
    onOptionsChange({ ...options, jsonData });
  };

  onWSPortChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      ws_port: parseFloat(event.target.value),
    };
    onOptionsChange({ ...options, jsonData });
  };

  //?update
  onTLSChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      tls_enabled: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  //!OVERRIDE JSAP FILE
  onJsapFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file= event.target.files?.[0];
    if(!file){return} 

    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const fileContent = readerEvent.target?.result as string;
      console.log(fileContent);
      const jsonFile=JSON.parse(fileContent);

      const { onOptionsChange, options } = this.props;
      const jsonData = {
        ...options.jsonData,
        jsap: jsonFile,
      };
      onOptionsChange({ ...options, jsonData });
    };

    reader.readAsText(file);
  };

  render() {
    const { options } = this.props;
    const { jsonData } = options;
    
    return (
      <div className="gf-form-group">

        <div className="gf-form">
          <FormField
            label="Host"
            labelWidth={6}
            inputWidth={20}
            onChange={this.onHostChange}
            value={jsonData.host || ''}
            placeholder="enter host (ex: localhost)"
          />
        </div>

        <div className="gf-form">
          <FormField
            label="Http port"
            labelWidth={6}
            inputWidth={20}
            onChange={this.onHttpPortChange}
            value={jsonData.http_port || ''}
            placeholder="enter http port"
          />
        </div>

        <div className="gf-form">
          <FormField
            label="Websocket port"
            labelWidth={8}
            inputWidth={20}
            onChange={this.onWSPortChange}
            value={jsonData.ws_port || ''}
            placeholder="enter websocket port"
          />
        </div>

        <div className="gf-form">
          <FormField
            label="Enable TLS"
            labelWidth={8}
            inputWidth={20}
            onChange={this.onTLSChange}
            value={jsonData.tls_enabled || 'false'}
            placeholder="enable tls security"
          />
        </div>

        <div className="gf-form">
          <label className="gf-form-label width-8">Jsap File</label>
          <input 
            type='file' 
            onChange={this.onJsapFileChange}
          >
          </input>
        </div>

      </div>
    );
  }
}
