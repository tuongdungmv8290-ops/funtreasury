import AnhSangHeroSection from "@/components/anhsang/AnhSangHeroSection";
import DailyAffirmation from "@/components/anhsang/DailyAffirmation";
import MantraCards from "@/components/anhsang/MantraCards";
import LawsOfLightChecklist from "@/components/anhsang/LawsOfLightChecklist";
import BreathingExercise from "@/components/anhsang/BreathingExercise";
import MeditationTimer from "@/components/anhsang/MeditationTimer";

const AnhSang = () => {
  return (
    <div className="space-y-12 pb-8">
      {/* Hero Section */}
      <AnhSangHeroSection />

      {/* Daily Affirmation */}
      <DailyAffirmation />

      {/* 8 Mantras */}
      <MantraCards />

      {/* 5 Laws of Light */}
      <LawsOfLightChecklist />

      {/* Breathing Exercise 4-7-8 */}
      <BreathingExercise />

      {/* Meditation Timer */}
      <MeditationTimer />
    </div>
  );
};

export default AnhSang;
