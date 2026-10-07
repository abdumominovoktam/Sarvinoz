import React from 'react';
import {
  Zap,
  Grid,
  Search,
  Shuffle,
  ListChecks,
  Puzzle,
  Target,
  Brain,
  Gamepad2,
} from 'lucide-react';

interface GameIconProps {
  name: string;
  className?: string;
}

export const GameIcon: React.FC<GameIconProps> = ({ name, className = 'w-5 h-5' }) => {
  switch (name) {
    case 'Zap':
      return <Zap className={className} />;
    case 'Grid':
      return <Grid className={className} />;
    case 'Search':
      return <Search className={className} />;
    case 'Shuffle':
      return <Shuffle className={className} />;
    case 'ListChecks':
      return <ListChecks className={className} />;
    case 'Puzzle':
      return <Puzzle className={className} />;
    case 'Target':
      return <Target className={className} />;
    case 'Brain':
      return <Brain className={className} />;
    default:
      return <Gamepad2 className={className} />;
  }
};
