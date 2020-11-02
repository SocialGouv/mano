import React, { useState } from "react";
import { Button, FormGroup } from "reactstrap";
import { Formik, Field } from "formik";
import classnames from "classnames";
import validator from "validator";
import { toastr } from "react-redux-toastr";
import styled from "styled-components";

import LoadingButton from "../../components/loadingButton";
import api from "../../services/api";

export default () => {
  const [done, setDone] = useState(false);

  const validateEmail = (value) => {
    if (!validator.isEmail(value)) {
      return "Invalid email address";
    }
  };

  if (done) {
    return (
      <AuthWrapper>
        <Title>Reset Password</Title>
        <HowReset>Password recovery link has been sent to your email please check you inbox and follow the link to reset your password.</HowReset>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper>
      <Title>Reset Password</Title>
      <HowReset>Enter your email address below to receive the password reset link.</HowReset>
      <Formik
        initialValues={{ email: "" }}
        onSubmit={async (values, actions) => {
          try {
            await api.post("/admin/forgot_password", values);
            toastr.success("Sent");
            setDone(true);
          } catch (e) {
            toastr.error("Error", e.code);
          }
          actions.setSubmitting(false);
        }}
      >
        {({ values, errors, isSubmitting, handleChange, handleSubmit }) => {
          return (
            <form onSubmit={handleSubmit}>
              <StyledFormGroup>
                <div>
                  <InputField
                    validate={validateEmail}
                    className={classnames({ "has-error": errors.email })}
                    name="email"
                    type="email"
                    id="email"
                    value={values.email}
                    onChange={handleChange}
                  />
                  <label htmlFor="email">E-mail address</label>
                </div>
                <p style={{ fontSize: 12, color: "rgb(253, 49, 49)" }}>{errors.email}</p>
              </StyledFormGroup>
              <Submit type="submit" color="success" loading={isSubmitting}>
                Send link
              </Submit>
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

const Error = styled.div`
  border-left: 6px solid rgb(253, 49, 49);
  color: rgba(253, 49, 49, 0.8);
  background-color: #f3f3f3;
  font-size: 14px;
  font-family: Helvetica;
  padding: 10px 15px;
  margin-bottom: 40px;
`;

const Title = styled.div`
  font-family: Helvetica;
  text-align: center;
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 15px;
`;

const HowReset = styled.div`
  font-size: 16px;
  text-align: center;
  margin-bottom: 30px;
  padding: 0 30px;
  color: #555;
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
