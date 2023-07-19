import defaults from 'lodash/defaults';

import React, { ChangeEvent, PureComponent } from 'react';
import { LegacyForms } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from './datasource';
import { defaultQuery, MyDataSourceOptions, MyQuery, ForcedBindingsTemplate } from './types';

const { FormField } = LegacyForms;

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export class QueryEditor extends PureComponent<Props> {
  //!JSAP UTILS
  isQueryPresent(){
    if(!this.props.datasource.hasOwnProperty("jsap")){return false}
    const jsap = this.props.datasource.jsap
    if(jsap){
      if(jsap.hasOwnProperty("queries")){
        const jsapQueries= jsap.queries;
        if(Object.keys(jsapQueries).length>0){
          return true
        }
      }
    }
    return false
  }

  //!MANAGE STATE
  onQueryTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    console.log("QueryText changed: "+event.target.value)
    const { onChange, query } = this.props;
    onChange({ ...query, queryText: event.target.value });
  };

  onQueryNameChange = (event: ChangeEvent<HTMLSelectElement>) => {
    console.log("QueryName changed: "+event.target.value)
    const rawQueryText=this.props.datasource.jsap.queries[event.target.value].sparql
    const { onChange, query } = this.props;
    onChange({ ...query, queryName:event.target.value, queryText: rawQueryText , forcedBindings:{} });
  };

  onForcedBindingsValueChange = (event: ChangeEvent<HTMLInputElement>) => {
    console.log("Binding '"+event.target.name+"' changed to value:",event.target.value)
    console.log("Current forced bindings:",this.props.query.forcedBindings)

    let overrideForcedBindings=Object.assign({},this.props.query.forcedBindings)
    console.log("Deep copy:",overrideForcedBindings)

    overrideForcedBindings[event.target.name]=event.target.value
    console.log("Modified copy:",overrideForcedBindings)

    const { onChange, query } = this.props;
    onChange({ ...query, forcedBindings: overrideForcedBindings});
  };


  render() {
    const query = defaults(this.props.query, defaultQuery);
    var { queryText } = query;

    var queries:any={}
    var queryNames:string[]=[]
    var currQueryName:string=this.props.query.queryName||"";
    var currQuery:{
      sparql:string;
      forcedBindings: ForcedBindingsTemplate;
    };

    if(this.isQueryPresent()){
      queries=this.props.datasource.jsap.queries;
      queryNames=Object.keys(queries)
      if(queries.hasOwnProperty(currQueryName)){
        console.log("Che cazzo fai bro ripigliati")
        if(queries[currQueryName].hasOwnProperty("forcedBindings")){
          currQuery = {
            sparql: queryText || "",
            forcedBindings: queries[currQueryName].forcedBindings
          };
        }else{
          currQuery = {
            sparql: queryText || "",
            forcedBindings: {}
          };
        }
      }else{
        currQuery = {
          sparql: queryText || "",
          forcedBindings: {}
        };
      }
    }else{
      currQuery = {
        sparql: queryText || "",
        forcedBindings: {}
      };
    }

    console.log("CurrQuery:",currQuery)
    


    return (
      <div className="gf-form-group">
        
        <div style={{display:this.isQueryPresent()?"initial":"none"}}>
        <div className="gf-form">
          <label className="gf-form-label width-8">Query Name</label>
          <select name="querySelection" onChange={this.onQueryNameChange}>
            {!this.props.query.queryName?
              (<option value="">- - select query - -</option>):
              (<option value={this.props.query.queryName}>{this.props.query.queryName}</option>)
            }
            {queryNames.map((queryName)=>{
              if(queryName!=this.props.query.queryName){
                return (<option value={queryName}>{queryName}</option>)
              }else{
                return ""
              }
            })}
          </select>
        </div>
        <br></br>
        </div>

        <div style={{display:(Object.keys(currQuery.forcedBindings).length>0)?"initial":"none"}}>
        <b style={{margin:"0"}}>
          Forced Bindings
        </b>
        {Object.keys(currQuery.forcedBindings).map((bindingName:string)=>{
          return (
            <div className="gf-form">
              <FormField
                labelWidth={8}
                inputWidth={24}
                value={this.props.query.forcedBindings?this.props.query.forcedBindings[bindingName]?this.props.query.forcedBindings[bindingName]:"":""}
                name={bindingName}
                onChange={this.onForcedBindingsValueChange}
                label={bindingName}
                tooltip={""}
              />
            </div>
          )
        })}
        </div>

        
        <b style={{margin:"0"}}>
          Query editor
        </b>
        <div className="gf-form">
          <textarea onChange={this.onQueryTextChange} value={currQuery.sparql}
            style={{
              width:"100%",
              minHeight:"200px",
              background:"black",
              color:"white",
              padding:"0.5%",
              fontSize:"14px"
            }}
          > 
          </textarea>
        </div>
      </div>
    );
  }
}
