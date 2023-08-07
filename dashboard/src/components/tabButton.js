import styled from 'styled-components';
import { NavLink } from 'reactstrap';

const TabButton = styled(NavLink)`
  border: none !important;
  border-bottom: ${({ active }) => (active ? '1px solid #0046FE !important' : '1px solid #e9e9e9 !important')};
  color: ${({ active }) => (active ? '#0046FE !important' : '#1D2021 !important')};
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
`;

export default TabButton;
