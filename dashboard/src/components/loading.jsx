import React from "react";
import { Spinner } from "reactstrap";

const Loading = () => {
  return (
    <div className="tw-flex tw-items-center tw-justify-center tw-w-full tw-h-full">
      <Spinner style={{ width: 100, height: 100 }} color={"primary"} />
    </div>
  );
};

export default Loading;
