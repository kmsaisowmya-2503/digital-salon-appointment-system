export const SALON = {
  openHour: 10,  // 10 AM
  closeHour: 19, // 7 PM
  slotMinutes: 30,
};

export const SERVICES = [
  { id: "srv1", name: "Haircut", price: 300, durationMin: 30, category: "Hair" },
  { id: "srv2", name: "Hair Spa", price: 800, durationMin: 60, category: "Hair" },
  { id: "srv3", name: "Facial", price: 1000, durationMin: 60, category: "Skin" },
  { id: "srv4", name: "Threading", price: 100, durationMin: 30, category: "Skin" },
  { id: "srv5", name: "Bridal Makeup", price: 5000, durationMin: 120, category: "Bridal" },
  { id: "srv6", name: "Manicure", price: 600, durationMin: 60, category: "Nails" },
];

export const STAFF = [
  { id: "st1", name: "Asha", skills: ["Hair", "Bridal"], workingDays: [1,2,3,4,5,6] }, // Mon-Sat
  { id: "st2", name: "Riya", skills: ["Skin", "Nails"], workingDays: [1,2,3,4,5,6] },
  { id: "st3", name: "Meena", skills: ["Hair", "Skin"], workingDays: [2,3,4,5,6,0] }, // Tue-Sun
];
