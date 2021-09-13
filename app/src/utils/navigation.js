export const navigateToTeamsOrHome = async (navigation, context) => {
  if (context?.teams?.length === 1) {
    // context.setCurrentTeam(context?.teams[0]);
    navigation.navigate('Home');
  } else {
    navigation.navigate('TeamSelection');
  }
};
