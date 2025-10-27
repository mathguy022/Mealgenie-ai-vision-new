import React from 'react';

interface MacroBreakdownProps {
  macros: {
    protein: { grams: number; calories: number; percentage: number };
    carbs: { grams: number; calories: number; percentage: number };
    fat: { grams: number; calories: number; percentage: number };
  };
  goalCalories: number;
}

const MacroBreakdown: React.FC<MacroBreakdownProps> = ({ macros, goalCalories }) => {
  const macroItems = [
    {
      key: 'protein',
      name: 'Protein',
      icon: '🥩',
      data: macros.protein,
      color: '#ff6b6b',
      benefits: ['Builds muscle', 'Keeps you full', 'Boosts metabolism']
    },
    {
      key: 'carbs',
      name: 'Carbohydrates',
      icon: '🍞',
      data: macros.carbs,
      color: '#4ecdc4',
      benefits: ['Provides energy', 'Fuels workouts', 'Brain function']
    },
    {
      key: 'fat',
      name: 'Healthy Fats',
      icon: '🥑',
      data: macros.fat,
      color: '#45b7d1',
      benefits: ['Hormone production', 'Vitamin absorption', 'Satiety']
    }
  ];

  return (
    <div className="macro-breakdown space-y-6">
      <div className="macro-header">
        <h4 className="text-lg font-semibold">🥗 Your Daily Macro Targets</h4>
        <p className="macro-subtitle text-sm text-muted-foreground">
          Optimized breakdown of your {goalCalories} daily calories
        </p>
      </div>

      {/* Macro Visual Circle */}
      <div className="macro-circle-container flex items-center justify-center">
        <div className="macro-circle relative">
          <svg viewBox="0 0 42 42" className="macro-donut w-40 h-40">
            <circle
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke="#f0f0f0"
              strokeWidth="3"
            />
            {/* Protein Arc */}
            <circle
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke={macroItems[0].color}
              strokeWidth="3"
              strokeDasharray={`${macros.protein.percentage} ${100 - macros.protein.percentage}`}
              strokeDashoffset="25"
              className="macro-arc protein-arc"
            />
            {/* Carbs Arc */}
            <circle
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke={macroItems[1].color}
              strokeWidth="3"
              strokeDasharray={`${macros.carbs.percentage} ${100 - macros.carbs.percentage}`}
              strokeDashoffset={`${25 - macros.protein.percentage}`}
              className="macro-arc carbs-arc"
            />
            {/* Fat Arc */}
            <circle
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke={macroItems[2].color}
              strokeWidth="3"
              strokeDasharray={`${macros.fat.percentage} ${100 - macros.fat.percentage}`}
              strokeDashoffset={`${25 - macros.protein.percentage - macros.carbs.percentage}`}
              className="macro-arc fat-arc"
            />
          </svg>

          <div className="macro-center absolute inset-0 flex flex-col items-center justify-center">
            <span className="macro-center-calories text-2xl font-bold">{goalCalories}</span>
            <span className="macro-center-label text-xs text-muted-foreground">calories</span>
          </div>
        </div>
      </div>

      {/* Macro Details Grid */}
      <div className="macro-grid grid grid-cols-1 md:grid-cols-3 gap-4">
        {macroItems.map((item) => (
          <div key={item.key} className={`macro-card ${item.key} border rounded-lg p-4`}> 
            <div className="macro-card-header flex items-center gap-3">
              <div className="macro-icon-wrapper text-2xl">
                <span className="macro-icon">{item.icon}</span>
              </div>
              <div className="macro-info">
                <h5 className="macro-name font-medium">{item.name}</h5>
                <div className="macro-percentage text-sm" style={{ color: item.color }}>
                  {item.data.percentage}%
                </div>
              </div>
            </div>

            <div className="macro-values grid grid-cols-2 gap-3 mt-3">
              <div className="macro-value">
                <span className="macro-number font-bold">{item.data.grams}g</span>
                <span className="macro-unit ml-1 text-xs text-muted-foreground">grams</span>
              </div>
              <div className="macro-value">
                <span className="macro-number font-bold">{item.data.calories}</span>
                <span className="macro-unit ml-1 text-xs text-muted-foreground">calories</span>
              </div>
            </div>

            <div className="macro-progress-bar h-2 bg-muted rounded mt-3 overflow-hidden">
              <div
                className="macro-progress-fill h-2"
                style={{ width: `${item.data.percentage}%`, backgroundColor: item.color }}
              />
            </div>

            <div className="macro-benefits mt-3">
              <h6 className="text-sm font-semibold">Key Benefits:</h6>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                {item.benefits.map((benefit, idx) => (
                  <li key={idx}>{benefit}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Macro Tips */}
      <div className="macro-tips mt-6 space-y-3">
        <h5 className="text-base font-semibold">💡 Pro Tips for Meeting Your Macros</h5>
        <div className="tips-grid grid sm:grid-cols-2 gap-3">
          <div className="tip-item flex items-start gap-2">
            <span className="tip-icon text-xl">🥩</span>
            <div className="tip-content text-sm">
              <strong>Protein Sources:</strong> Lean meats, fish, eggs, Greek yogurt, legumes, protein powder
            </div>
          </div>
          <div className="tip-item flex items-start gap-2">
            <span className="tip-icon text-xl">🍞</span>
            <div className="tip-content text-sm">
              <strong>Smart Carbs:</strong> Oats, quinoa, sweet potatoes, fruits
            </div>
          </div>
          <div className="tip-item flex items-start gap-2">
            <span className="tip-icon text-xl">🥑</span>
            <div className="tip-content text-sm">
              <strong>Healthy Fats:</strong> Olive oil, nuts, seeds, avocado, fatty fish
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MacroBreakdown;