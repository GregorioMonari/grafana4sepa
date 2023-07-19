import React, { useState } from 'react';
import { MyVariableQuery } from './types';

interface VariableQueryProps {
  query: MyVariableQuery;
  onChange: (query: MyVariableQuery, definition: string) => void;
}

export const VariableQueryEditor = ({ onChange, query }: VariableQueryProps) => {
  const [state, setState] = useState(query);

  const saveQuery = () => {
    onChange(state, `${state.rawQuery}`);
  };

  const handleChange = (event: React.FormEvent<HTMLTextAreaElement>) =>
    setState({
      ...state,
      rawQuery: event.currentTarget.value,
    });

  return (
    <>
      <div className="gf-form">
        <span className="gf-form-label width-10">Raw Sparql Query</span>
        <textarea onChange={handleChange} onBlur={saveQuery} value={state.rawQuery}
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
    </>
  );
};
