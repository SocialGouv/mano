import React, { useState } from "react";
import { Formik, Field } from "formik";
import queryString from "query-string";
import { Button, FormGroup } from "reactstrap";
import { toastr } from "react-redux-toastr";
import { Redirect } from "react-router-dom";
import styled from "styled-components";

import api from "../../services/api";
import LoadingButton from "../../components/loadingButton";

export default ({ location }) => {
  const [redirect, setRedirect] = useState(false);

  return (
    <AuthWrapper>
      <Title>Create new Password</Title>
      <Formik
        initialValues={{ password: "", password1: "" }}
        onSubmit={async (values, actions) => {
          try {
            const { token } = queryString.parse(location.search);
            await api.post("/admin/forgot_password_reset", { ...values, token });
            toastr.success("Success!");
            setRedirect(true);
          } catch (e) {
            toastr.error(e && e.code);
          }
          actions.setSubmitting(false);
        }}
      >
        {({ values, errors, isSubmitting, handleChange, handleSubmit }) => {
          return (
            <form onSubmit={handleSubmit}>
              {redirect && <Redirect to="/" />}
              <StyledFormGroup>
                <div>
                  <InputField className="auth-input" name="password" type="password" id="password" value={values.password} onChange={handleChange} />
                  <label htmlFor="password">New Password</label>
                </div>
              </StyledFormGroup>
              <StyledFormGroup>
                <div>
                  <InputField className="auth-input" name="password1" type="password" id="password1" value={values.password1} onChange={handleChange} />
                  <label htmlFor="password1">Retype Password</label>
                </div>
              </StyledFormGroup>
              <div className="button">
                <Submit loading={isSubmitting} type="submit" color="primary" disabled={isSubmitting}>
                  Create
                </Submit>
              </div>
            </form>
          );
        }}
      </Formik>
    </AuthWrapper>
  );
};

const AuthWrapper = styled.div`
  max-width: 500px;
  width: calc(100% - 40px);
  padding: 40px 30px 30px;
  border-radius: 0.5em;
  background-color: #fff;
  font-family: Nista, Helvetica;
  color: #252b2f;
  margin: 5em auto;
  overflow: hidden;
  -webkit-box-shadow: 0 0 1.25rem 0 rgba(0, 0, 0, 0.2);
  box-shadow: 0 0 1.25rem 0 rgba(0, 0, 0, 0.2);
`;

const Title = styled.div`
  font-family: Helvetica;
  text-align: center;
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 50px;
`;

const Submit = styled(LoadingButton)`
  font-family: Helvetica;
  width: 220px;
  border-radius: 30px;
  margin: auto;
  display: block;
  font-size: 16px;
  padding: 8px;
  min-height: 42px;
`;

const InputField = styled(Field)`
  background-color: transparent;
  outline: 0;
  display: block;
  width: 100%;
  padding: 0.625rem;
  margin-bottom: 0.375rem;
  border-radius: 4px;
  border: 1px solid #a7b0b7;
  color: #252b2f;
  -webkit-transition: border 0.2s ease;
  transition: border 0.2s ease;
  line-height: 1.2;
  &:focus {
    outline: none;
    border: 1px solid #116eee;
    & + label {
      color: #116eee;
    }
  }
`;

const StyledFormGroup = styled(FormGroup)`
  margin-bottom: 25px;
  div {
    display: flex;
    flex-direction: column-reverse;
  }
`;
