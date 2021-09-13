import React from 'react';

const withContext = (Context) => (WrappedComponent) => {
  // ...and returns another component...
  return class extends React.Component {
    render() {
      // ... and renders the wrapped component with the fresh data!
      // Notice that we pass through any additional props
      return <Context.Consumer>{(context) => <WrappedComponent {...this.props} context={{ ...this.props.context, ...context }} />}</Context.Consumer>;
    }
  };
};

export default withContext;
