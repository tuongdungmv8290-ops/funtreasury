import AnhSangHeroSection from "@/components/anhsang/AnhSangHeroSection";
import MantraCards from "@/components/anhsang/MantraCards";
import LawsOfLightChecklist from "@/components/anhsang/LawsOfLightChecklist";
import MeditationTimer from "@/components/anhsang/MeditationTimer";

const AnhSang = () => {
  return (
    <div className="space-y-12 pb-8">
      {/* Hero Section */}
      <AnhSangHeroSection />

      {/* 8 Mantras */}
      <MantraCards />

      {/* 5 Laws of Light */}
      <LawsOfLightChecklist />

      {/* Meditation Timer */}
      <MeditationTimer />
    </div>
  );
};

export default AnhSang;
