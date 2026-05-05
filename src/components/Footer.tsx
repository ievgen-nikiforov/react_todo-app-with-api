import React from 'react';
import classNames from 'classnames';
import { Filter } from '../App';

type Props = {
  count: number;
  selectedFilter: Filter;
  isAnyCompleted: boolean;
  onFilterChange: (filter: Filter) => void;
  onClearCompleted: () => void;
};

export const Footer: React.FC<Props> = ({
  count,
  selectedFilter,
  isAnyCompleted,
  onFilterChange,
  onClearCompleted,
}) => (
  <footer className="todoapp__footer" data-cy="Footer">
    <span data-cy="TodosCounter">{count} items left</span>

    <nav data-cy="Filter">
      {Object.values(Filter).map(f => (
        <a
          key={f}
          href="#/"
          className={classNames('filter__link', {
            selected: selectedFilter === f,
          })}
          onClick={() => onFilterChange(f)}
        >
          {f}
        </a>
      ))}
    </nav>

    <button
      data-cy="ClearCompletedButton"
      onClick={onClearCompleted}
      disabled={!isAnyCompleted}
    >
      Clear completed
    </button>
  </footer>
);
