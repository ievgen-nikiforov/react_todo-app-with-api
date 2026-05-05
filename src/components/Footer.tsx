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
    <span className="todo-count" data-cy="TodosCounter">
      {count} items left
    </span>

    <nav className="filter" data-cy="Filter">
      <a
        href="#/"
        data-cy="FilterLinkAll"
        className={classNames('filter__link', {
          selected: selectedFilter === Filter.All,
        })}
        onClick={() => onFilterChange(Filter.All)}
      >
        All
      </a>

      <a
        href="#/active"
        data-cy="FilterLinkActive"
        className={classNames('filter__link', {
          selected: selectedFilter === Filter.Active,
        })}
        onClick={() => onFilterChange(Filter.Active)}
      >
        Active
      </a>

      <a
        href="#/completed"
        data-cy="FilterLinkCompleted"
        className={classNames('filter__link', {
          selected: selectedFilter === Filter.Completed,
        })}
        onClick={() => onFilterChange(Filter.Completed)}
      >
        Completed
      </a>
    </nav>

    <button
      type="button"
      className="todoapp__clear-completed"
      data-cy="ClearCompletedButton"
      onClick={onClearCompleted}
      disabled={!isAnyCompleted}
    >
      Clear completed
    </button>
  </footer>
);
