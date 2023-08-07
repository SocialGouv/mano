import styled from "styled-components";
import {theme} from "../../config";

export const FilterTitle = styled.div`
  font-weight: 800;
  font-size: 12px;
  line-height: 22px;
    
  letter-spacing: 0.02em;
  text-transform: uppercase;
  
  color: ${theme.black};
`

export const filterStyles = {
  control: styles => ({
    ...styles,
    borderWidth: 0,
  }),
  indicatorSeparator: styles => ({
    ...styles,
    borderWidth: 0,
    backgroundColor: "transparent",
  }),
}