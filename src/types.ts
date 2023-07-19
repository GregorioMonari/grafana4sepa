import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface MyQuery extends DataQuery {
  queryText?: string;
  queryName?: string;
  forcedBindings?: {
	[key: string]: string
  }
}

export const defaultQuery: Partial<MyQuery> = {
  queryText: "SELECT ?time WHERE {<http://sepatest/currentTime> <http://sepatest/hasValue> ?time }",
};


export interface ForcedBindingsTemplate{
	[key: string]: {
		type: string;
		value: string;
	};
};
export interface Jsap{
  host: string;
  oauth?: any;
  sparql11protocol: {
		protocol: string;
		port: number;
		query: {
			path: string;
			method: string;
			format: string;
		},
		update: {
			path: string;
			method: string;
			format: string;
		}
	};
  sparql11seprotocol: {
		protocol: string;
		availableProtocols: {
			ws: {
				port: number;
				path: string;
			},
			wss: {
				port: number;
				path: string;
			}
		}
  };
  namespaces: {
	[key: string]: string
  };
  extended?: any;
  updates: {
	[key: string]: {
		sparql: string;
		forcedBindings: ForcedBindingsTemplate
	};
  };
  queries: {
	[key: string]: {
		sparql: string;
		forcedBindings: ForcedBindingsTemplate
	};
  }
}


export interface MyDataSourceOptions extends DataSourceJsonData {
  host?: string;
  http_port?: number;
  ws_port?: number; 
  tls_enabled?: string; //?update aggiunta opzione per attivare sicurezza https e wss
  jsap?: Jsap|null;
}

export interface MyVariableQuery{ //?update to support query variables
  rawQuery: string;
}


