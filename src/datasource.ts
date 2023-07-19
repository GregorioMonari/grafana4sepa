//=================================
// STREAMING DATASOURCE PLUGIN
//=================================

//IMPORT MODULES:
import defaults from 'lodash/defaults';
import {getTemplateSrv} from '@grafana/runtime'
import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  FieldType,
  MutableDataFrame
} from '@grafana/data';

import { merge, Observable } from 'rxjs';
import { MyQuery, MyDataSourceOptions, defaultQuery, MyVariableQuery, Jsap } from './types';

const SEPA =  require('@arces-wot/sepa-js').SEPA;
const Bench =  require('@arces-wot/sepa-js').bench;

//DEFAULT JSON:
var default_json = {
	"host": "localhost",
	"oauth": {
		"enable": false,
		"register": "https://localhost:8443/oauth/register",
		"tokenRequest": "https://localhost:8443/oauth/token"
	},
	"namespaces":{},
	"sparql11protocol": {
		"protocol": "http",
		"port": 8600,
		"query": {
			"path": "/query",
			"method": "POST",
			"format": "JSON"
		},
		"update": {
			"path": "/update",
			"method": "POST",
			"format": "JSON"
		}
	},
	"sparql11seprotocol": {
		"protocol": "ws",
		"availableProtocols": {
			"ws": {
				"port": 9600,
				"path": "/subscribe"
			},
			"wss": {
				"port": 9443,
				"path": "/subscribe"
			}
		}
	},
	"updates":{},
	"queries":{}

}

//==========================
// DEFINE BINDINGS STRUCTURE
//==========================

//JSON RESPONSE STRUCTURE: 
export interface SepaNotificationResults{
	spiud: string; 
	alias: string;
	sequence: number;
	addedResults: BindingsResults;
	removedResults: BindingsResults; 
}
export interface BindingsResults{
	head: {
		vars: string[];
	};
	results: {
		bindings: Binding[];
	};
}

export interface Binding{
	[key:string]:{
		type:string;
		value:string;
	}
}

export interface ParsedBinding{
	[key:string]:string;
}
  




//EXTRACT BINDINGS FROM JSON RESPONSE:
function getVars(not:SepaNotificationResults):string[]{
	return not.addedResults.head.vars;
}
function getAddedResultsBindings(not: SepaNotificationResults):Binding[]{
	var bindings=not.addedResults.results.bindings;
	return bindings;
}
function getRemovedResultsBindings(not: SepaNotificationResults):Binding[]{
	var bindings=not.removedResults.results.bindings;
	return bindings;
}

function extractAddedResultsParsedBindings(not: SepaNotificationResults):ParsedBinding[]{
	const rawBindings=getAddedResultsBindings(not);
	return rawBindings.map((binding)=>{
		var newBinding:ParsedBinding={}
		Object.keys(binding).forEach(k=>{
			newBinding[k]=binding[k].value;
		})
		return newBinding
	})
}
function extractRemovedResultsParsedBindings(not: SepaNotificationResults):ParsedBinding[]{
	const rawBindings=getRemovedResultsBindings(not);
	return rawBindings.map((binding)=>{
		var newBinding:ParsedBinding={}
		Object.keys(binding).forEach(k=>{
			newBinding[k]=binding[k].value;
		})
		return newBinding
	})
}

function extract_query_bindings(msg: any){
	var bindings=msg.results.bindings;
	return bindings;
}

/**
 * Instanced when a new panel is created
 */
export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {

	host: string;
	http_port: number;
	ws_port: number;
	tls_enabled: string; //?update
	jsap: Jsap;

	constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    	super(instanceSettings);
		//Jsap Override Parameters
		this.host= instanceSettings.jsonData.host || "localhost";
		this.http_port = instanceSettings.jsonData.http_port || 8000.0;
		this.ws_port = instanceSettings.jsonData.ws_port || 9000.0;
		this.tls_enabled = instanceSettings.jsonData.tls_enabled || "false";
		//Jsap file from datasource config or default jsap
		this.jsap = instanceSettings.jsonData.jsap || default_json;
		this.overrideJsap() //override jsap with provided parameters
		console.log(this.jsap)
  	}

	//----------------------------------MANAGE QUERY-------------------------------------
	query(options: DataQueryRequest<MyQuery>): Observable<DataQueryResponse> {
		const observables = options.targets.map((target) => {
			const {queryText,refId}=this.preprocessQueryText(options,target)
			console.log("-------------------< Subscribe >-------------------")
			return new Observable<DataQueryResponse>((subscriber)=>{

				//Contains the results
				/*const frame = new CircularDataFrame({
					append: 'tail',
					capacity: 100000,
				});*/
				let frame = new MutableDataFrame({
					refId:refId,
					fields:[]
				})

				//Subscribe
				let client = new SEPA(this.jsap);
				const sub = client.subscribe(queryText);
				sub.on("subscribed", console.log)
				sub.on("error",console.error);

				//Handle Notification
				sub.on("notification", (not: SepaNotificationResults) => {
					console.log("** RECEIVED NEW NOTIFICATION")

					//Set frame fields with notification vars
					const vars = getVars(not);
					vars.forEach(key=>{
						var found=false;
						frame.fields.forEach(field=>{
							if(key==field.name){found=true}
						})
						if(!found){
							console.log("Adding new field:",key)
							frame.addField({ name: key, type: FieldType.string });
						}else{
							console.log("Skipping field",key,", already exists")
						}
					})


					//Get parsed bindings results
					const bindings = extractAddedResultsParsedBindings(not);
					const removedBindings = extractRemovedResultsParsedBindings(not);
					console.log("Bindings:",bindings)
					console.log("Removed bindings:",removedBindings)

					

					//Remove bindings from dataframe
					
					if(frame.length>0){
						if(removedBindings.length>0){
							var bindingsToKeep=[]
							console.log("Removing bindings")
							for(var i=0; i<frame.length; i++){
								//for each row check if remove or not
								var currBinding=frame.get(i);
								console.log("Row "+i+":",currBinding)
								var match=false;
								for(let bindingToRemove of removedBindings){
									Object.keys(bindingToRemove).forEach(k=>{
										if(currBinding.hasOwnProperty(k)){
											if(currBinding[k]==bindingToRemove[k]){
												match=true;
											}
										}
									})
								}
								if(match==false){
									bindingsToKeep.push(currBinding)
								}
							}
							console.log("Bindings to keep:",bindingsToKeep)
							console.log("Clearing dataframe")
							frame = new MutableDataFrame({
								refId:refId,
								fields:[]
							})
							const vars = getVars(not);
							vars.forEach(key=>{
								var found=false;
								frame.fields.forEach(field=>{
									if(key==field.name){found=true}
								})
								if(!found){
									console.log("Adding new field:",key)
									frame.addField({ name: key, type: FieldType.string });
								}else{
									console.log("Skipping field",key,", already exists")
								}
							})
							console.log("Appending rows")
							bindingsToKeep.forEach(binding=>{
								frame.add(binding)
							})
						}
					}
					
					//Add new bindings to dataframe
					bindings.forEach(binding=>{
						frame.add(binding)
					})
					//?ALMOST: frame.set(5,null);
					//console.log(frame.get(0))
					//Add frame to subscriber
					console.log(frame)

					subscriber.next({
						data: [frame],
						key: refId,
					});
				});
			});
		});

		return merge(...observables);
	}
	/** Manages Forced Bindings and variables interpolation */
	preprocessQueryText(options:DataQueryRequest<MyQuery>,target:MyQuery):any{
		//create query	
		//*0. FETCH PARAMETERS
		var query = defaults(target, defaultQuery);
		var queryText=query.queryText||"";
		var queryName=query.queryName||"";
		const forcedBindingsNoType=query.forcedBindings||{};
		var forcedBindings:any={};
		if(this.jsap.hasOwnProperty("queries")){
			if(Object.keys(this.jsap.queries).length>0){
				if(this.jsap.queries.hasOwnProperty(queryName)){
					if(this.jsap.queries[queryName].hasOwnProperty("forcedBindings")){
						const forcedBindingsTemplate=this.jsap.queries[queryName].forcedBindings;
						//Add type to bindings, bench does not work if not done correctly
						Object.keys(forcedBindingsNoType).forEach(k=>{
							forcedBindings[k]={
								type:forcedBindingsTemplate[k].type,
								value:forcedBindingsNoType[k]
							}
						})
					}
				}
			}
		}
		var rawPrefixes=this.jsap.namespaces;
		var prefixes="";
		Object.keys(rawPrefixes).forEach(k=>{
			const prefix= "PREFIX "+k+": <"+rawPrefixes[k]+"> "
			prefixes=prefixes+prefix
		})

		//*1. QUERYBENCH
		//console.log("-> Performing query:",queryName)
		console.log("-> QueryName:",queryName)
		console.log("-> Pre-bench Sparql:",queryText)
		console.log("-> forcedBindings:",forcedBindings)
		const bench = new Bench();
		queryText= bench.sparql(queryText,forcedBindings)
		queryText=prefixes+queryText; //!REMEMBER PREFIXES!

		//*2. INTERPOLATION
		console.log("-------------------< Interpolate variables >-------------------")
		console.log("Pre interpolation query text: ",queryText)
		//replace query text with interpolated string with variables
		queryText = getTemplateSrv().replace(queryText, options.scopedVars);
		console.log("Post interpolation query text: ",queryText)
		return {queryText:queryText,refId:query.refId}
	}

	//-------------------------------------UTILITY---------------------------------------
	async metricFindQuery(query: MyVariableQuery, options?: any) {
		console.log("Metric find query")
		// Retrieve DataQueryResponse based on query.
		const response = await this.fetchMetricNames(query.rawQuery);
		// Convert query results to a MetricFindValue[]
		const values = response.map(binding => ({ text: binding }));
		return values;
	}
	async fetchMetricNames(rawQuery:string): Promise<string[]>{
		console.log("RawQuery: "+rawQuery)
		var client = new SEPA(this.jsap);
		var res= await client.query(rawQuery);
		console.log(res)
		const bindings= extract_query_bindings(res);
		console.log(bindings)
		return bindings.map((binding:Binding)=>{
			var bindingOnlyValue=""
			Object.keys(binding).forEach(k=>{
				bindingOnlyValue=binding[k].value;
			})
			return bindingOnlyValue
		})
	}
	async testDatasource(): Promise<any> {
		const testQuery="SELECT ?time WHERE {<http://sepatest/currentTime> <http://sepatest/hasValue> ?time }";
		let client = new SEPA(this.jsap);

		return new Promise((resolve,reject)=>{
			client.query(testQuery)
				.then((res:BindingsResults)=>{
					console.log(res)
					var message=`Performed sparql query: ${testQuery} `
					message=message+` ->  result: ${JSON.stringify(res)}`
					resolve({
						status: 'success',
						message: message,
					})
				})
				.catch((error:any)=>{
					reject(error)
				});
		});

	}
	overrideJsap(){
		console.log("-------------------< JSAP CONFIGURATION OVERRIDE >-------------------")
		this.jsap.host = this.host;
		this.jsap.sparql11protocol.port = this.http_port;
		this.jsap.sparql11seprotocol.availableProtocols.ws.port = this.ws_port;
		
		console.log("Host: "+this.jsap.host);
		console.log("Http Port: "+this.jsap.sparql11protocol.port);
		console.log("Ws port: "+this.jsap.sparql11seprotocol.availableProtocols.ws.port);

		//?update
		var tlsFormattedOption=this.tls_enabled.trim()
		tlsFormattedOption=tlsFormattedOption.toLowerCase()
		if(tlsFormattedOption==="true"){
			console.log("TLS Enabled, modifying parameters")
			this.jsap.sparql11protocol.protocol="https";
			this.jsap.sparql11seprotocol.protocol="wss";
			this.jsap.sparql11seprotocol.availableProtocols.wss.port=this.ws_port
		}//else do not change anything else
		console.log("Http Protocol: "+this.jsap.sparql11protocol.protocol)
		console.log("Ws Protocol: "+this.jsap.sparql11seprotocol.protocol)
		console.log("Secure ws port: "+this.jsap.sparql11seprotocol.availableProtocols.wss.port)	
	}

}



