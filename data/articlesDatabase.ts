/**
 * Articles Database - Evidence-based pregnancy and parenting information
 * All content is medically accurate and based on current clinical guidelines
 */

export interface ArticleContent {
  title: string;
  summary: string;
  sections: ArticleSection[];
  keyPoints: string[];
  sources: string[];
}

export interface ArticleSection {
  heading: string;
  content: string;
}

export const articlesDatabase: { [key: string]: ArticleContent } = {
  pregnancy: {
    title: "Complete Guide to Pregnancy",
    summary: "Pregnancy is an incredible journey that typically lasts 40 weeks, divided into three trimesters. Each stage brings unique changes to both you and your growing baby.",
    sections: [
      {
        heading: "Timeline & Stages",
        content: "First trimester (weeks 1-12): Your baby's major organs and structures develop. You may experience morning sickness, fatigue, and frequent urination. Second trimester (weeks 13-27): Baby grows rapidly, you'll feel movement, and energy often returns. Third trimester (weeks 28-40): Baby gains weight, you may feel more uncomfortable, and prepare for labor."
      },
      {
        heading: "What to Expect",
        content: "Physical changes include weight gain, breast changes, swelling, stretch marks, and increased blood volume. Emotional changes are normal as hormones fluctuate. You may feel excitement, anxiety, or mood swings."
      },
      {
        heading: "Healthcare",
        content: "Prenatal care is essential for monitoring your health and baby's development. Attend all scheduled appointments, take prenatal vitamins, and discuss any concerns with your healthcare provider."
      }
    ],
    keyPoints: [
      "Pregnancy lasts approximately 40 weeks",
      "Attend all prenatal appointments",
      "Take prenatal vitamins daily",
      "Report any concerning symptoms immediately",
      "Stay hydrated and get adequate sleep",
      "Avoid alcohol, smoking, and harmful substances",
      "Discuss medications with your doctor"
    ],
    sources: [
      "American College of Obstetricians and Gynecologists (ACOG)",
      "Centers for Disease Control and Prevention (CDC)",
      "American Pregnancy Association"
    ]
  },

  symptoms: {
    title: "Pregnancy Symptoms & When to Seek Help",
    summary: "Understanding normal pregnancy symptoms versus concerning signs is crucial for your health and your baby's well-being.",
    sections: [
      {
        heading: "Normal Symptoms",
        content: "Common symptoms include nausea (often called morning sickness), fatigue, frequent urination, food cravings or aversions, mood changes, headaches, constipation, and mild cramping. These are typically normal parts of pregnancy."
      },
      {
        heading: "When to Call Your Doctor",
        content: "Seek immediate medical care if you experience: severe abdominal pain, heavy bleeding, severe headaches with vision changes, chest pain, difficulty breathing, fever above 101°F, severe vomiting, contractions before 37 weeks, or decreased fetal movement after 28 weeks."
      },
      {
        heading: "Managing Common Discomforts",
        content: "Nausea: Eat small, frequent meals and avoid trigger foods. Fatigue: Rest when possible and maintain light exercise. Constipation: Increase fiber and water intake. Headaches: Check with doctor about safe pain relief options."
      }
    ],
    keyPoints: [
      "Most pregnancy symptoms are normal",
      "Trust your instincts - call your doctor if concerned",
      "Severe pain requires immediate attention",
      "Decreased fetal movement needs evaluation",
      "Keep your prenatal appointments",
      "Stay hydrated and eat balanced meals"
    ],
    sources: [
      "ACOG Practice Bulletin",
      "Mayo Clinic Pregnancy Guide",
      "American Family Physician"
    ]
  },

  'fetal-movement': {
    title: "Understanding Fetal Movement",
    summary: "Feeling your baby move is one of pregnancy's most exciting milestones. Understanding normal patterns helps you monitor your baby's health.",
    sections: [
      {
        heading: "When Movement Begins",
        content: "Most women feel baby's first movements (quickening) between 18-25 weeks. First-time mothers may notice movement later than those in subsequent pregnancies. Early movements feel like fluttering or bubbles."
      },
      {
        heading: "Normal Movement Patterns",
        content: "Babies have active and quiet periods, typically moving about 15 times per day by the third trimester. Movement patterns vary - some babies are more active at night. As pregnancy progresses, movements may feel different but should remain regular."
      },
      {
        heading: "Kick Counting",
        content: "Starting around 28 weeks, you can count baby's movements. Choose a consistent time, lie on your side, and time how long it takes to feel 10 movements. Most women feel 10 movements within 2 hours."
      }
    ],
    keyPoints: [
      "Most women feel movement between 18-25 weeks",
      "Count kicks daily starting at 28 weeks",
      "10 movements in 2 hours is normal",
      "Report decreased movement immediately",
      "Babies have active and quiet periods",
      "Movement patterns change as baby grows"
    ],
    sources: [
      "ACOG Committee Opinion",
      "Royal College of Obstetricians and Gynaecologists",
      "World Health Organization"
    ]
  },

  'mental-health': {
    title: "Mental Health During Pregnancy",
    summary: "Pregnancy brings significant physical and emotional changes. Understanding and addressing mental health is crucial for both you and your baby.",
    sections: [
      {
        heading: "Common Concerns",
        content: "Anxiety, mood swings, and worries about the future are common. Helena can also bring joy and anticipation."
      },
      {
        heading: "Signs to Watch For",
        content: "Seek help if you experience persistent sadness, anxiety that interferes with daily life, panic attacks, intrusive thoughts, inability to sleep or eat, or thoughts of harming yourself. These could indicate depression or anxiety that requires treatment."
      },
      {
        heading: "Getting Support",
        content: "Talk openly with your healthcare provider, lean on support systems, consider therapy, and know that treatment options (including some medications) are safe during pregnancy."
      }
    ],
    keyPoints: [
      "Mental health is as important as physical health",
      "Pregnancy hormones affect mood",
      "Postpartum depression risk begins during pregnancy",
      "Many treatments are safe during pregnancy",
      "Prioritize sleep and stress management",
      "Don't hesitate to ask for help"
    ],
    sources: [
      "ACOG Guidelines",
      "American Psychiatric Association",
      "Postpartum Support International"
    ]
  },

  'diet-advice': {
    title: "Nutrition During Pregnancy",
    summary: "Proper nutrition during pregnancy supports your health and your baby's development. Focus on nutrient-dense foods and safe food handling.",
    sections: [
      {
        heading: "Essential Nutrients",
        content: "Focus on folic acid (400-600 mcg), iron (27 mg), calcium (1000 mg), protein (71g), and omega-3 fatty acids. Prenatal vitamins help fill nutritional gaps but don't replace healthy eating."
      },
      {
        heading: "Foods to Include",
        content: "Eat plenty of leafy greens, lean proteins, whole grains, dairy products, and a variety of fruits and vegetables. Stay hydrated with water throughout the day."
      },
      {
        heading: "Foods to Avoid",
        content: "Avoid raw or undercooked meat and seafood, unpasteurized dairy products, high-mercury fish (shark, swordfish, king mackerel), deli meats (unless heated), raw eggs, and excessive caffeine. Limit high-mercury fish to 2-3 servings per week of safe varieties."
      }
    ],
    keyPoints: [
      "Eat 300-500 extra calories daily in second and third trimester",
      "Stay hydrated - aim for 8-10 glasses of water",
      "Take prenatal vitamins daily",
      "Cook meat and eggs thoroughly",
      "Avoid alcohol completely",
      "Limit caffeine to 200mg daily (about 1-2 cups coffee)"
    ],
    sources: [
      "ACOG Nutrition Guidelines",
      "USDA MyPlate for Pregnancy",
      "Dietary Guidelines for Americans"
    ]
  },

  'informed-choices': {
    title: "Making Informed Pregnancy Decisions",
    summary: "Making informed decisions about your pregnancy, birth, and baby care empowers you and supports the best outcomes.",
    sections: [
      {
        heading: "Gathering Information",
        content: "Research from reliable sources, ask your healthcare provider questions, connect with other parents, and consider your values and circumstances. Balance online information with professional guidance."
      },
      {
        heading: "Birth Planning",
        content: "Consider pain management options, delivery setting preferences, and birth plans. Remain flexible as circumstances may change. Discuss preferences with your healthcare team."
      },
      {
        heading: "Advocating for Yourself",
        content: "Ask questions, express your concerns, bring a partner or support person to appointments, and trust your instincts while listening to medical advice."
      }
    ],
    keyPoints: [
      "Ask questions - there are no stupid questions",
      "Discuss all options with your healthcare provider",
      "Birth plans should be flexible",
      "Partner with your healthcare team",
      "Trust your instincts",
      "Remember: decisions are yours to make"
    ],
    sources: [
      "ACOG Patient Education",
      "Evidence-Based Birth",
      "Lamaze International"
    ]
  },

  labor: {
    title: "Labor and Delivery",
    summary: "Understanding labor stages and delivery helps you prepare for your baby's birth.",
    sections: [
      {
        heading: "Signs of Labor",
        content: "True labor contractions become regular, closer together, and intensify. Water may break (either as a gush or trickle). You may have bloody show. Timing contractions helps determine when to go to the hospital."
      },
      {
        heading: "Stages of Labor",
        content: "Stage 1 (labor): Cervix dilates to 10cm, includes early and active phases. Stage 2 (delivery): Pushing and baby's birth. Stage 3 (placenta): Delivery of the placenta. Stage 4 (recovery): First hours after delivery."
      },
      {
        heading: "When to Go to the Hospital",
        content: "Go if contractions are 5 minutes apart (or closer), lasting 60 seconds, water breaks, you have vaginal bleeding, or any concerning symptoms. Trust your instincts."
      }
    ],
    keyPoints: [
      "True labor contractions get closer and stronger",
      "Go to hospital when contractions are 5 minutes apart",
      "Call immediately if water breaks",
      "Most first-time labors take 12-18 hours",
      "Pain relief options are available",
      "Birth plans should be flexible"
    ],
    sources: [
      "ACOG Clinical Guidelines",
      "American Academy of Family Physicians",
      "March of Dimes"
    ]
  },

  breastfeeding: {
    title: "Breastfeeding Guide",
    summary: "Breastfeeding provides optimal nutrition for your baby and offers important health benefits for you both.",
    sections: [
      {
        heading: "Benefits",
        content: "Breast milk is perfectly designed for baby's nutritional needs, provides antibodies, supports bonding, and may reduce risks of infections, allergies, and chronic diseases for baby. For mothers, it may reduce risk of breast and ovarian cancers."
      },
      {
        heading: "Getting Started",
        content: "Position baby belly-to-belly with you, support baby's neck, ensure wide-open mouth with lips flanged outward, and aim for deep latch. Pain indicates improper latch. Seek help from lactation consultants."
      },
      {
        heading: "Common Challenges",
        content: "Soreness usually improves with proper latch. Engorgement: nurse frequently, use cold compresses. Low supply: nurse often, pump between feeds. Consult lactation specialist for persistent issues."
      }
    ],
    keyPoints: [
      "Exclusive breastfeeding recommended for first 6 months",
      "Feed on demand - typically 8-12 times daily",
      "Proper latch is crucial for comfort and milk transfer",
      "Seek help from lactation consultants",
      "Breastfeeding should not be painful",
      "Stay hydrated and eat nutritious foods"
    ],
    sources: [
      "American Academy of Pediatrics",
      "World Health Organization",
      "La Leche League International",
      "Centers for Disease Control and Prevention"
    ]
  },

  'car-seat': {
    title: "Car Seat Safety Guide",
    summary: "Proper car seat use is critical for protecting your child in vehicle crashes.",
    sections: [
      {
        heading: "Types of Car Seats",
        content: "Rear-facing infant seats: Birth to 2 years or until reaching height/weight limits. Convertible seats: Can face rear then forward. Forward-facing harness seats: After outgrowing rear-facing. Booster seats: When child is 4+ years and 40+ pounds."
      },
      {
        heading: "Installation",
        content: "Install following manufacturer instructions exactly. In rear-facing seats, the harness should be at or below baby's shoulders. Chest clip at armpit level. Seat should not move more than 1 inch when tugged."
      },
      {
        heading: "Safety Standards",
        content: "Keep children rear-facing as long as possible (until they reach manufacturer height/weight limits). Always use car seats on every trip. Never use seats with unknown history or after accidents."
      }
    ],
    keyPoints: [
      "Keep babies rear-facing until at least 2 years",
      "Always use car seat for every trip",
      "Follow manufacturer instructions exactly",
      "Never place car seat in front seat with airbag",
      "Register car seat for recall notices",
      "Replace after any vehicle accident"
    ],
    sources: [
      "American Academy of Pediatrics",
      "National Highway Traffic Safety Administration",
      "Safe Kids Worldwide"
    ]
  },

  partner: {
    title: "Supporting Your Partner During Pregnancy",
    summary: "Partners play a crucial role in supporting the pregnant person through this journey.",
    sections: [
      {
        heading: "Ways to Support",
        content: "Attend prenatal appointments when possible, help with household tasks, offer emotional support, learn about pregnancy and baby care together, prepare for birth, and support breastfeeding decisions."
      },
      {
        heading: "Understanding Changes",
        content: "Pregnancy brings significant physical and emotional changes. Be patient with mood swings, understand exhaustion, accommodate food aversions and cravings, and provide reassurance during anxieties."
      },
      {
        heading: "Preparing Together",
        content: "Take childbirth classes together, discuss parenting philosophies, prepare the nursery, pack hospital bags, create birth plans, and decide on baby names. This joint preparation strengthens your partnership."
      }
    ],
    keyPoints: [
      "Your support matters immensely",
      "Attend appointments when possible",
      "Educate yourself about pregnancy and birth",
      "Be patient and understanding",
      "Share household responsibilities",
      "Prepare for parenthood together"
    ],
    sources: [
      "American College of Nurse-Midwives",
      "Fatherhood Institute",
      "Partners in Pregnancy and Parenting"
    ]
  },

  'medical-board': {
    title: "Understanding Your Medical Team",
    summary: "Your pregnancy care team includes various specialists who work together to ensure the best outcomes.",
    sections: [
      {
        heading: "Healthcare Providers",
        content: "Obstetricians: Medical doctors specializing in pregnancy and childbirth. Certified Nurse-Midwives: Advanced practice nurses for low-risk pregnancies. Family Practice Physicians: May provide pregnancy care. Perinatologists: Specialize in high-risk pregnancies."
      },
      {
        heading: "What to Expect at Appointments",
        content: "Regular check-ups include blood pressure, weight, urine tests, measuring baby growth, listening to heartbeat, and discussing questions. First appointment includes comprehensive history and exams."
      },
      {
        heading: "Asking Questions",
        content: "Write questions down before appointments, ask about any concerns, request explanations when you don't understand, and bring a support person. You should feel heard and respected."
      }
    ],
    keyPoints: [
      "Choose a provider you feel comfortable with",
      "Attend all scheduled appointments",
      "Come prepared with questions",
      "Trust your healthcare team",
      "Second opinions are okay if concerned",
      "Build a partnership with your provider"
    ],
    sources: [
      "ACOG Professional Guidelines",
      "National Association of Certified Professional Midwives",
      "American Academy of Family Physicians"
    ]
  },

  'newborn-care': {
    title: "Newborn Care Essentials",
    summary: "Caring for a newborn involves learning new skills and trusting your growing confidence.",
    sections: [
      {
        heading: "Feeding",
        content: "Newborns typically feed 8-12 times per 24 hours. Watch for hunger cues like rooting, sucking motions, or hands in mouth. Burp baby after every 1-2 ounces during bottle feeding. Trust baby's hunger signals."
      },
      {
        heading: "Diaper Changing",
        content: "Change diapers every 2-3 hours or when wet/dirty. Clean front to back for girls, completely for boys. Apply diaper cream for prevention. Watch for signs of diaper rash."
      },
      {
        heading: "Bathing",
        content: "Sponge bathe until umbilical cord falls off (1-2 weeks). Use lukewarm water. Never leave baby unattended. Bathe 2-3 times weekly is sufficient."
      }
    ],
    keyPoints: [
      "Newborns eat every 2-3 hours",
      "Feed on demand, not on schedule",
      "Support baby's head and neck always",
      "Diaper changes happen frequently",
      "Never leave baby unattended on elevated surfaces",
      "Trust your instincts"
    ],
    sources: [
      "American Academy of Pediatrics",
      "HealthyChildren.org",
      "CDC Newborn Care Guidelines"
    ]
  },

  feeding: {
    title: "Feeding Your Baby",
    summary: "Whether breastfeeding or formula feeding, proper nutrition supports your baby's healthy growth and development.",
    sections: [
      {
        heading: "Breastfeeding Basics",
        content: "Feed on demand, typically 8-12 times daily. Watch for swallowing, milk letdown, and satisfied baby. Ensure proper latch to prevent soreness. Cluster feeding is normal."
      },
      {
        heading: "Formula Feeding",
        content: "Follow manufacturer instructions for preparation. Most newborns eat 1-3 ounces every 2-3 hours. Never add extra water. Check bottle temperature. Hold baby during feeds for bonding."
      },
      {
        heading: "Introducing Solids",
        content: "Start around 6 months when baby shows readiness (sits up, opens mouth for spoon, interested in food). Start with single-ingredient purees. Wait 3-5 days between new foods. Continue breast milk or formula."
      }
    ],
    keyPoints: [
      "Breastfeeding recommended for first 6 months",
      "Formula is a healthy alternative",
      "Feed on demand, not strict schedule",
      "Introduce solids around 6 months",
      "Never prop bottles or leave unhealthy infant feeding",
      "Trust your baby's hunger and fullness cues"
    ],
    sources: [
      "American Academy of Pediatrics",
      "World Health Organization",
      "CDC Infant Feeding Guidelines"
    ]
  },

  sleep: {
    title: "Baby Sleep Basics",
    summary: "Understanding newborn sleep patterns helps you establish healthy sleep habits and keep baby safe.",
    sections: [
      {
        heading: "Newborn Sleep Patterns",
        content: "Newborns sleep 14-17 hours daily in 2-4 hour stretches. Sleep schedules are irregular initially. By 3-4 months, many babies start sleeping longer stretches. Night waking is normal."
      },
      {
        heading: "Safe Sleep Guidelines",
        content: "Always place baby on back to sleep, use firm mattress with fitted sheet only, no pillows, blankets, bumpers, or soft toys in crib. Room-share for first 6 months but don't bed-share. Ensure comfortable room temperature."
      },
      {
        heading: "Establishing Routines",
        content: "Create calming bedtime routine (bath, feeding, story, lullaby). Put baby down drowsy but awake. Be consistent. Separate day and night (light and darkness). Patience is key - every baby is different."
      }
    ],
    keyPoints: [
      "Always place baby on back to sleep",
      "Room-share but don't bed-share",
      "No soft bedding, toys, or bumper pads",
      "Newborns wake frequently - this is normal",
      "Sleep training typically starts after 4 months",
      "Seek help for persistent sleep issues"
    ],
    sources: [
      "American Academy of Pediatrics Safe Sleep Guidelines",
      "CDC Infant Sleep Safety",
      "AAP Sleep Recommendations"
    ]
  },

  development: {
    title: "Baby Development & Milestones",
    summary: "Tracking your baby's development helps ensure healthy growth and identifies any concerns early.",
    sections: [
      {
        heading: "Early Months (0-3)",
        content: "By 3 months: Lifts head during tummy time, follows objects with eyes, smiles responsively, makes cooing sounds, brings hands to mouth. Activities: Talking to baby, tummy time, showing contrasting images."
      },
      {
        heading: "Middle Months (4-6)",
        content: "By 6 months: Rolls over both ways, sits with support, reaches for toys, laughs, babbles, shows interest in foods. Activities: Place toys just out of reach, read books, sing songs."
      },
      {
        heading: "Later Months (7-12)",
        content: "By 12 months: Crawls, pulls to stand, uses pincer grasp, says mama/dada, responds to name, waves bye-bye. Activities: Play peek-a-boo, stack blocks together, encourage cruising."
      }
    ],
    keyPoints: [
      "Every baby develops at their own pace",
      "Milestones are guidelines, not deadlines",
      "Talk and read to baby daily",
      "Provide supervised tummy time",
      "Report concerns to pediatrician",
      "Celebrate each milestone"
    ],
    sources: [
      "CDC Developmental Milestones",
      "American Academy of Pediatrics",
      "Zero to Three"
    ]
  },

  'prenatal-vitamins': {
    title: "Prenatal Vitamins Guide",
    summary: "Prenatal vitamins are essential supplements that help ensure you and your baby get the nutrients needed for healthy development.",
    sections: [
      {
        heading: "Essential Nutrients",
        content: "Folic acid (400-800 mcg): Prevents neural tube defects. Iron (27 mg): Prevents anemia and supports baby's growth. Calcium (1000 mg): Builds baby's bones and teeth. Vitamin D: Supports bone health and immune function. Omega-3 DHA: Supports brain and eye development."
      },
      {
        heading: "When to Start",
        content: "Ideally start taking prenatal vitamins before conception, or as soon as you know you're pregnant. Continue throughout pregnancy and while breastfeeding. Some women experience nausea - try taking with food or at bedtime."
      },
      {
        heading: "Choosing the Right Vitamin",
        content: "Look for vitamins with adequate folic acid, iron, and calcium. Avoid megadoses of vitamins A and E. Consider your dietary needs - some women need additional iron or DHA supplements. Consult your healthcare provider for recommendations."
      }
    ],
    keyPoints: [
      "Start prenatal vitamins before conception if possible",
      "Folic acid is most important in early pregnancy",
      "Iron needs increase significantly during pregnancy",
      "Take with food to reduce nausea",
      "Continue while breastfeeding",
      "Don't exceed recommended doses"
    ],
    sources: [
      "ACOG Prenatal Care Guidelines",
      "March of Dimes",
      "American Pregnancy Association"
    ]
  },

  'exercise-pregnancy': {
    title: "Exercise During Pregnancy",
    summary: "Regular exercise during pregnancy can help you feel better, sleep better, and prepare your body for labor and delivery.",
    sections: [
      {
        heading: "Benefits of Exercise",
        content: "Regular exercise can reduce back pain, improve mood, increase energy, promote better sleep, reduce pregnancy discomforts, and help prepare your body for labor. It may also reduce risk of gestational diabetes and preeclampsia."
      },
      {
        heading: "Safe Exercises",
        content: "Walking, swimming, stationary cycling, low-impact aerobics, yoga, and Pilates are generally safe. Avoid activities with high fall risk, contact sports, activities with altitude changes, or exercises lying flat on your back after the first trimester."
      },
      {
        heading: "Exercise Guidelines",
        content: "Aim for 150 minutes of moderate-intensity exercise weekly. Listen to your body and modify as needed. Stay hydrated, avoid overheating, and stop if you feel dizzy, short of breath, or have contractions. Consult your healthcare provider before starting any exercise program."
      }
    ],
    keyPoints: [
      "Exercise is generally safe and beneficial during pregnancy",
      "Listen to your body and modify activities as needed",
      "Avoid activities with high fall risk",
      "Stay hydrated and avoid overheating",
      "Stop if you feel dizzy or have contractions",
      "Consult your healthcare provider first"
    ],
    sources: [
      "ACOG Exercise Guidelines",
      "American College of Sports Medicine",
      "Mayo Clinic Pregnancy Exercise"
    ]
  }
};
