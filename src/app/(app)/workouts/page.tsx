import { Dumbbell } from "lucide-react";
import { ComingSoonPage } from "@/components/shared/coming-soon";

export default function WorkoutsPage() {
  return (
    <ComingSoonPage
      title="Workouts"
      icon={Dumbbell}
      description="Exercise library and the full Program -> Phase -> Week -> Day -> Workout -> Exercise -> Set hierarchy, with historical workout logs."
    />
  );
}
