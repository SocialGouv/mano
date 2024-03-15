import BackButton from "../backButton";

const Header = ({ title, style = {}, titleStyle = {}, className = "" }) => {
  return (
    <HeaderStyled style={style} className={className}>
      <Title style={titleStyle}>{title}</Title>
    </HeaderStyled>
  );
};

export const SmallHeaderWithBackButton = ({ className, ...props }) => {
  return <Header className={[className, "tw-px-0 tw-py-4"].join(" ")} title={<BackButton />} {...props} />;
};

export const SmallHeader = ({ className, ...props }) => {
  return <Header className={className} titleStyle={{ fontWeight: "400" }} {...props} />;
};

export const HeaderStyled = ({ children, className = "", style = {} }) => (
  <div style={style} className={[className, "tw-flex tw-items-center tw-justify-between tw-px-0 tw-py-3 sm:tw-py-12"].join(" ")}>
    {children}
  </div>
);

export const Title = ({ children, className = "", style = {} }) => (
  <h2 style={style} className={[className, "tw-text-2xl tw-font-bold tw-text-black"].join(" ")}>
    {children}
  </h2>
);

export default Header;
