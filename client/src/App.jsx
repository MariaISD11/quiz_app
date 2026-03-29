import { useState } from 'react';
import { Categories } from '@/pages/Categories';
import { Cards } from '@/pages/Cards';
import { Learn } from '@/pages/Learn';
import { Auth } from '@/pages/Auth';
import { useQuiz } from '@/hooks/useQuiz';

function App() {
  const { currentUser, addCategory, updateCategory, deleteCategory, addCard, updateCard, deleteCard, moveCard } = useQuiz();
  const [currentPage, setCurrentPage] = useState('categories');
  const [selectedCategory, setSelectedCategory] = useState(null);

  if (!currentUser) {
    return <Auth />;
  }

  const handleSelectCategory = (category, isLearnMode = false) => {
    setSelectedCategory(category);
    setCurrentPage(isLearnMode ? 'learn' : 'cards');
  };

  const handleBack = () => {
    setCurrentPage('categories');
    setSelectedCategory(null);
  };

  const handleDeleteCategory = (id) => {
    deleteCategory(id);
    handleBack();
  };

  return (
    <>
      {currentPage === 'categories' && (
        <Categories 
          onSelectCategory={handleSelectCategory} 
          onAddCategory={addCategory}
          onUpdateCategory={updateCategory}
        />
      )}
      {currentPage === 'cards' && (
        <Cards 
          category={selectedCategory} 
          onBack={handleBack}
          onDeleteCategory={handleDeleteCategory}
          onAddCard={addCard}
          onUpdateCard={updateCard}
          onDeleteCard={deleteCard}
          onMoveCard={moveCard}
        />
      )}
      {currentPage === 'learn' && (
        <Learn 
          category={selectedCategory} 
          onBack={handleBack} 
        />
      )}
    </>
  );
}

export default App;
