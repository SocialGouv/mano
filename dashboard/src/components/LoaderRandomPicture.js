import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import picture1 from '../assets/MANO_livraison_elements-07_green.png';
import picture2 from '../assets/MANO_livraison_elements-08_green.png';
import picture3 from '../assets/MANO_livraison_elements_Plan_de_travail_green.png';

function getRandomPicture() {
  return [picture1, picture3, picture2][Math.floor(Math.random() * 3)];
}

export function RandomPicturePreloader() {
  return (
    <Hidden>
      <Picture src={picture1} />
      <Picture src={picture2} />
      <Picture src={picture3} />
    </Hidden>
  );
}

export function RandomPicture() {
  const [picture, setPicture] = useState(getRandomPicture());
  useEffect(() => {
    setPicture(getRandomPicture());
  }, []);
  return <Picture src={picture} />;
}

const Hidden = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
`;

const Picture = styled.div`
  background-image: url(${(props) => props.src});
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  width: 100%;
  height: 80%;
`;
