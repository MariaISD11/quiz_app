export const LOCALE_KEYS = {
  APP_TITLE: 'QuizApp',
  ADD_CATEGORY: 'Add Category',
  ADD_CARD: 'Add Card',
  CATEGORIES: 'Categories',
  LEARN: 'Learn',
  CARDS: 'Cards',
  LEARN_OBJECT: 'Learn Object',
  ANSWER: 'Answer',
  CATEGORY: 'Category',
  DESCRIPTION: 'Description',
  EXAMPLE: 'Example',
  SAVE: 'Save',
  CANCEL: 'Cancel',
  CONGRATULATIONS: 'Congratulations!',
  FINISHED_LEARNING: 'You have finished learning this category.',
  NO_CARDS: 'No cards in this category yet.',
  SWIPE_LEFT: 'Swipe Left (Wrong)',
  SWIPE_RIGHT: 'Swipe Right (Correct)',
  BACK: 'Back',
  LOGIN: 'Login',
  REGISTER: 'Register',
  EMAIL: 'Email',
  PASSWORD: 'Password',
  USER_NAME: 'User Name',
  LOGOUT: 'Logout',
  EDIT_CATEGORY: 'Edit Category',
  EDIT_CARD: 'Edit Card',
  MOVE_TO_CATEGORY: 'Move to Category',
  LEARN_OBJECT_TYPE: 'Type',
  TEXT: 'Text',
  IMAGE: 'Image',
  RENAME: 'Rename',
  LOGIN_ERROR: 'Login Error: Invalid email or password',
  REGISTER_ERROR: 'Registration Error: Email already in use',
};

const locales = {
  en: {
    // ... previous keys
    [LOCALE_KEYS.BACK]: 'Back',
    [LOCALE_KEYS.LOGIN]: 'Login',
    [LOCALE_KEYS.REGISTER]: 'Register',
    [LOCALE_KEYS.EMAIL]: 'Email',
    [LOCALE_KEYS.PASSWORD]: 'Password',
    [LOCALE_KEYS.USER_NAME]: 'User Name',
    [LOCALE_KEYS.LOGOUT]: 'Logout',
    [LOCALE_KEYS.EDIT_CATEGORY]: 'Edit Category',
    [LOCALE_KEYS.EDIT_CARD]: 'Edit Card',
    [LOCALE_KEYS.MOVE_TO_CATEGORY]: 'Move to Category',
    [LOCALE_KEYS.LEARN_OBJECT_TYPE]: 'Type',
    [LOCALE_KEYS.TEXT]: 'Text',
    [LOCALE_KEYS.IMAGE]: 'Image',
    [LOCALE_KEYS.RENAME]: 'Rename',
    [LOCALE_KEYS.LOGIN_ERROR]: 'Login Error: Invalid email or password',
    [LOCALE_KEYS.REGISTER_ERROR]: 'Registration Error: Email already in use',
  },
};

export function useTranslation() {
  const language = 'en'; // Hardcoded for now
  
  const t = (key) => {
    return locales[language][key] || key;
  };

  return { t };
}
