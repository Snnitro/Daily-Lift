// ============================================================
//  WORKOUT PLAN — edit this file to change her program.
//  Days: 0 = Sunday, 1 = Monday ... 6 = Saturday
//  Exercise types:
//    "lift"   -> sets x reps, with optional weight logging
//    "timed"  -> sets x a hold time (e.g. plank)
//    "cardio" -> one block, checked off once
//  After editing, bump CACHE_VERSION in sw.js so her phone
//  picks up the change.
// ============================================================

const PLAN = {
  // Number of weeks in the "learning phase" (fewer working sets)
  learningWeeks: 2,
  learningSets: 2,

  // Default rest timer, in seconds
  defaultRest: 90,

  days: {
    1: {
      title: "Lower Body",
      subtitle: "Legs & Glutes",
      exercises: [
        { name: "Barbell Squats", type: "lift", sets: 3, reps: "8–10" },
        { name: "Barbell Deadlifts", type: "lift", sets: 3, reps: "6–8" },
        { name: "Hip Thrusts", type: "lift", sets: 3, reps: "10–12" },
        { name: "StairMaster", type: "cardio", duration: "10–15 min" }
      ]
    },
    2: {
      title: "Upper Body & Core",
      subtitle: "Back, chest, shoulders",
      exercises: [
        { name: "Lat Pulldowns", type: "lift", sets: 3, reps: "10–12" },
        { name: "Dumbbell Bench Press", type: "lift", sets: 3, reps: "10" },
        { name: "Dumbbell Lateral Raises", type: "lift", sets: 3, reps: "12–15" },
        { name: "Plank", type: "timed", sets: 3, reps: "20–30 sec" },
        { name: "Incline Treadmill Walk", type: "cardio", duration: "15–20 min" }
      ]
    },
    3: {
      title: "Light Full Body",
      subtitle: "Easier day — move well",
      exercises: [
        { name: "Step-Ups", type: "lift", sets: 2, reps: "10 per leg", fixedSets: true },
        { name: "Seated Cable Rows", type: "lift", sets: 3, reps: "12" },
        { name: "Dumbbell Shoulder Press", type: "lift", sets: 3, reps: "10" },
        { name: "Incline Treadmill Walk", type: "cardio", duration: "15–20 min" }
      ]
    },
    4: {
      title: "Lower Body",
      subtitle: "Legs & Glutes",
      exercises: [
        { name: "Barbell Squats", type: "lift", sets: 3, reps: "8–10" },
        { name: "Barbell Deadlifts", type: "lift", sets: 3, reps: "6–8" },
        { name: "Hip Thrusts", type: "lift", sets: 3, reps: "10–12" },
        { name: "StairMaster", type: "cardio", duration: "10–15 min" }
      ]
    },
    5: {
      title: "Upper Body & Core",
      subtitle: "Back, chest, shoulders",
      exercises: [
        { name: "Lat Pulldowns", type: "lift", sets: 3, reps: "10–12" },
        { name: "Dumbbell Bench Press", type: "lift", sets: 3, reps: "10" },
        { name: "Dumbbell Lateral Raises", type: "lift", sets: 3, reps: "12–15" },
        { name: "Plank", type: "timed", sets: 3, reps: "20–30 sec" },
        { name: "Incline Treadmill Walk", type: "cardio", duration: "15–20 min" }
      ]
    },
    6: { rest: true, title: "Rest & Recovery" },
    0: { rest: true, title: "Rest & Recovery" }
  },

  guidelines: [
    "Warm up for 5–10 minutes before lifting.",
    "Rest 60–120 seconds between sets.",
    "Choose weights that allow proper form with 2–3 reps left in reserve.",
    "For the first 2 weeks, start with 2 working sets per exercise while learning technique.",
    "Gradually increase weights as exercises become easier.",
    "Keep cardio at a comfortable, sustainable pace.",
    "Focus on consistency, technique, and gradual improvement rather than lifting heavy immediately."
  ]
};
