import { UpcomingIPOCard } from "../UpcomingIPOCard";

export default function UpcomingIPOCardExample() {
  return (
    <div className="p-6 bg-background">
      <div className="max-w-md">
        <UpcomingIPOCard
          companyName="AI Robotics Inc."
          ticker="AIRO"
          ipoDate="Feb 15, 2025"
          priceRange="$18-$22"
          expectedValuation="$2.5B"
          sector="Technology"
          interest="high"
          description="Leading AI robotics company specializing in autonomous warehouse solutions. Currently deployed in 500+ facilities across North America with 250% YoY growth."
          onLearnMore={() => console.log("Learn more about AIRO")}
        />
      </div>
    </div>
  );
}
