import React from "react";
import { Switch } from "react-router-dom";
import { useRecoilValue } from "recoil";
import SentryRoute from "../../components/Sentryroute";

import View from "./view";
import { currentTeamState } from "../../recoil/auth";

const Router = () => {
  const currentTeam = useRecoilValue(currentTeamState);

  if (!currentTeam) return null;

  return (
    <Switch>
      <SentryRoute path="/reception" component={View} />
    </Switch>
  );
};

export default Router;
