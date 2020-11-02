import React from 'react';
import styled from 'styled-components';

const ScrollContainer = React.forwardRef(({ children, debug, noPadding, ...props }, ref) => (
  <Container debug={debug} ref={ref} noPadding={noPadding} {...props}>
    {children}
  </Container>
));

const Container = styled.ScrollView.attrs(({ debug, noPadding }) => ({
  contentContainerStyle: {
    borderWidth: debug ? 2 : 0,
    borderColor: 'red',
    padding: noPadding ? 0 : 30,
  },
}))`
  flex: 1;
  ${(props) => props.debug && 'border: 3px solid #000;'}
`;

export default ScrollContainer;
