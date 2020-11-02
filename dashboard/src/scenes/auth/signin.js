import React from "react";
import { Button, FormGroup } from "reactstrap";
import { Formik, Field } from "formik";
import classnames from "classnames";
import validator from "validator";
import { Link, Redirect } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toastr } from "react-redux-toastr";
import styled from "styled-components";

import { setUser } from "../../redux/auth/actions";

import api from "../../services/api";
import LoadingButton from "../../components/loadingButton";

export default () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.Auth.user);

  return (
    <AuthWrapper>
      <Title>Se connecter</Title>
      {user && <Redirect to="/" />}
      <Formik
        initialValues={{ email: "", password: "" }}
        onSubmit={async (values, actions) => {
          try {
            const { user, token } = await api.post(`/user/signin`, values);
            if (token) api.setToken(token);
            if (user) dispatch(setUser(user));
          } catch (e) {
            console.log("e", e);
            toastr.error("Wrong login", e.code);
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
                    validate={(v) => !validator.isEmail(v) && "Invalid email address"}
                    name="email"
                    type="email"
                    id="email"
                    value={values.email}
                    onChange={handleChange}
                  />
                  <label htmlFor="email">E-mail</label>
                </div>
                <p style={{ fontSize: 12, color: "rgb(253, 49, 49)" }}>{errors.email}</p>
              </StyledFormGroup>
              <StyledFormGroup>
                <div>
                  <InputField
                    validate={(v) => validator.isEmpty(v) && "This field is Required"}
                    name="password"
                    type="password"
                    id="password"
                    value={values.password}
                    onChange={handleChange}
                  />
                  <label htmlFor="password">Mot de passe</label>
                </div>
                <p style={{ fontSize: 12, color: "rgb(253, 49, 49)" }}>{errors.password}</p>
              </StyledFormGroup>
              <div style={{ textAlign: "right", marginBottom: 20, marginTop: -20, fontSize: 12 }}>
                <Link to="/auth/forgot">Mot de passe oublié ?</Link>
              </div>
              <Submit loading={isSubmitting} type="submit" color="primary">
                Se connecter
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

const Title = styled.div`
  font-family: Helvetica;
  text-align: center;
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 15px;
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
