import React from 'react';

const withContext = (Context) => (WrappedComponent) => (props) =>
  <Context.Consumer>{(context) => <WrappedComponent {...props} context={{ ...props.context, ...context }} />}</Context.Consumer>;

export default withContext;
