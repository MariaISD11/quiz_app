import { useState } from 'react';
import { useQuiz } from '@/hooks/useQuiz';
import { useTranslation, LOCALE_KEYS } from '@/services/localization';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Layout } from '@/components/layouts/Layout';
import { ArrowLeft, Check, X, PartyPopper } from 'lucide-react';
import { cn } from '@/services/utils';

export function Learn({ category, onBack }) {
  const { t } = useTranslation();
  const { getCardsByCategory } = useQuiz();
  
  const [currentCategoryId, setCurrentCategoryId] = useState(category.id);
  const [queue, setQueue] = useState(() => getCardsByCategory(category.id));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [passedCount, setPassedCount] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);

  // Swipe logic
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const initialCardsCount = getCardsByCategory(category.id).length;

  if (category.id !== currentCategoryId) {
    setCurrentCategoryId(category.id);
    const newCards = getCardsByCategory(category.id);
    setQueue(newCards);
    setCurrentIndex(0);
    setPassedCount(0);
    setIsFlipped(false);
    setIsFinished(false);
  }

  const currentCard = queue[currentIndex];

  const handleNext = (isCorrect) => {
    if (swipeDirection) return;
    setSwipeDirection(isCorrect ? 'right' : 'left');
    
    setTimeout(() => {
      setIsFlipped(false);
      setSwipeDirection(null);

      if (isCorrect) {
        setPassedCount(prev => Math.min(prev + 1, initialCardsCount));
      } else {
        // Move to the end of queue if incorrect
        setQueue(prev => {
          const newQueue = [...prev];
          const current = newQueue[currentIndex];
          return [...newQueue, current];
        });
      }

      setCurrentIndex(prev => prev + 1);
      
      if (isCorrect && currentIndex >= queue.length - 1) {
        setIsFinished(true);
      }
    }, 400);
  };

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || !isFlipped) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext(false);
    } else if (isRightSwipe) {
      handleNext(true);
    }
  };

  if (isFinished) {
    return (
      <Layout className="flex flex-col items-center justify-center text-center">
        <div className="max-w-md mx-auto py-20 space-y-6 animate-in zoom-in duration-500">
          <div className="inline-flex p-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 mb-4">
            <PartyPopper size={64} />
          </div>
          <h2 className="text-4xl font-bold tracking-tight">{t(LOCALE_KEYS.CONGRATULATIONS)}</h2>
          <p className="text-gray-500 text-lg">{t(LOCALE_KEYS.FINISHED_LEARNING)}</p>
          <Button className="w-full h-14 text-lg mt-8" onClick={onBack}>
            {t(LOCALE_KEYS.BACK)}
          </Button>
        </div>
      </Layout>
    );
  }

  if (!currentCard) {
    return (
      <Layout>
        <div className="py-20 text-center">
           <p className="text-gray-500">{t(LOCALE_KEYS.NO_CARDS)}</p>
           <Button variant="ghost" onClick={onBack} className="mt-4">
             <ArrowLeft size={20} />
             {t(LOCALE_KEYS.BACK)}
           </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" onClick={onBack} className="p-2">
          <ArrowLeft size={24} />
        </Button>
        <div className="px-4 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-bold">
          {passedCount} / {initialCardsCount}
        </div>
      </div>

      <div className="perspective-1000 w-full h-[450px] mb-12 relative overflow-hidden touch-none">
        <div 
          className={cn(
            "relative w-full h-full transition-all duration-500 transform-style-3d cursor-pointer select-none",
            isFlipped ? "rotate-y-180" : "",
            swipeDirection === 'left' ? "-translate-x-[150%] -rotate-12 opacity-0" : "",
            swipeDirection === 'right' ? "translate-x-[150%] rotate-12 opacity-0" : ""
          )}
          onClick={() => !swipeDirection && setIsFlipped(!isFlipped)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Front */}
          <Card className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-8 text-center shadow-xl border-2 hover:border-green-500 transition-colors">
            <div className="flex-1 flex items-center justify-center w-full">
              {currentCard.learn_object_type === 'image' ? (
                <img src={currentCard.learn_object} alt="Learn object" className="max-w-full max-h-[350px] rounded-xl object-contain pointer-events-none" />
              ) : (
                <h3 className="text-4xl font-bold tracking-tight leading-tight">{currentCard.learn_object}</h3>
              )}
            </div>
            <p className="text-gray-400 pt-8 text-sm uppercase tracking-widest font-bold">Tap to flip</p>
          </Card>

          {/* Back */}
          <Card className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-8 text-center shadow-xl border-2 border-green-500">
            <div className="space-y-6 flex flex-col items-center justify-center h-full w-full">
              <h3 className="text-4xl font-bold text-green-600 leading-tight">{currentCard.answer}</h3>
              {currentCard.example && (
                <div className="pt-6 border-t border-gray-100 dark:border-gray-800 w-full">
                  <p className="text-gray-500 italic text-lg leading-relaxed">"{currentCard.example}"</p>
                </div>
              )}
              <p className="text-gray-400 pt-8 text-xs uppercase tracking-widest font-bold">Swipe left (Wrong) / Right (Correct)</p>
            </div>
          </Card>
        </div>
      </div>

      <div className="flex gap-4 min-h-[80px]">
        {isFlipped && !swipeDirection && (
          <div className="flex gap-4 w-full animate-in slide-in-from-bottom-8 duration-500">
            <Button 
              variant="secondary" 
              className="flex-1 h-20 text-xl bg-red-50 dark:bg-red-950/20 text-red-600 hover:bg-red-100 border-2 border-red-100 dark:border-red-900/30"
              onClick={(e) => { e.stopPropagation(); handleNext(false); }}
            >
              <X size={32} />
              {t(LOCALE_KEYS.SWIPE_LEFT) || "Wrong"}
            </Button>
            <Button 
              className="flex-1 h-20 text-xl shadow-lg shadow-green-500/20"
              onClick={(e) => { e.stopPropagation(); handleNext(true); }}
            >
              <Check size={32} />
              {t(LOCALE_KEYS.SWIPE_RIGHT) || "Correct"}
            </Button>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}} />
    </Layout>
  );
}
