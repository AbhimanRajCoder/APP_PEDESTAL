"""
Constants for the Pedestal Reinforced Learning Stack.
"""

# ============================================================
# Energy Economy
# ============================================================
DEFAULT_MAX_ENERGY = 100
DEFAULT_REGEN_RATE = 5            # energy points per interval
DEFAULT_REGEN_INTERVAL_SECONDS = 1800  # 30 minutes
MIN_ENERGY_TO_START = 1           # minimum energy to allow lesson start

# ============================================================
# XP & Leveling
# ============================================================
BASE_XP_REWARD = 25
XP_MULTIPLIER_ADVANCED = 1.5      # bonus for harder lessons
XP_PER_LEVEL = 500                # XP needed to level up
MAX_LEVEL = 100

# ============================================================
# Adaptive Learning Thresholds
# ============================================================
QUIZ_ADVANCE_THRESHOLD = 80.0     # score >= 80% → advance
QUIZ_REMEDIAL_THRESHOLD = 50.0    # score <= 50% → remedial

# Score adjustment increments
SCORE_INCREMENT = 5.0             # added on good performance
SCORE_DECREMENT = 3.0             # subtracted on poor performance
SCORE_MIN = 0.0
SCORE_MAX = 100.0

# ============================================================
# Difficulty Scaling
# ============================================================
MIN_DIFFICULTY = 1
MAX_DIFFICULTY = 10
DIFFICULTY_STEP_UP = 1
DIFFICULTY_STEP_DOWN = 1

# ============================================================
# Reinforcement Queue
# ============================================================
REMEDIAL_PRIORITY = 10            # high priority for remedial lessons
FLASHCARD_PRIORITY = 5            # medium priority for flashcards
SPACED_REPETITION_PRIORITY = 3    # low priority for spaced review

# ============================================================
# Onboarding Score Weights
# ============================================================
ONBOARDING_WEIGHTS = {
    "risk_score": 0.25,
    "discipline_score": 0.25,
    "knowledge_score": 0.30,
    "stability_score": 0.20,
}

# ============================================================
# Rate Limiting (for future middleware)
# ============================================================
RATE_LIMIT_REQUESTS_PER_MINUTE = 60
RATE_LIMIT_BURST = 10
