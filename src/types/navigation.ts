export type AppTabsParamList = {
  Home: undefined;
  Profile: undefined;
  Education: undefined;
  Ecommerce: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  SignupDetails: undefined;
  Goals: undefined;
  ForgotPasswordScreen: undefined;
};

export type RootStackParamList = {
  AuthStack: AuthStackParamList;
  AppTabs: AppTabsParamList;
};
