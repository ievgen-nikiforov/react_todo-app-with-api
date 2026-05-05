/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState, useRef } from 'react';
import { UserWarning } from './UserWarning';
import { USER_ID } from './api/todos';
import {
  getTodos,
  addTodo as addTodoApi,
  deleteTodo as deleteTodoApi,
  changeCompletedStatus,
  updateTodo as updateTodoApi,
} from './api/todos';
import { Todo } from './types/Todo';
import classNames from 'classnames';

enum Filter {
  All = 'All',
  Active = 'Active',
  Completed = 'Completed',
}
enum ErrorMessage {
  Empty = '',
  LoadError = 'Unable to load todos',
  TitleError = 'Title should not be empty',
  AddError = 'Unable to add a todo',
  DeleteError = 'Unable to delete a todo',
  UpdateError = 'Unable to update a todo',
}

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const completedTodosNumber = todos.filter(todo => !todo.completed).length;
  const [selectedFilter, setSelectedFilter] = useState<Filter>(Filter.All);
  const [filteredTodos, setFilteredTodos] = useState<Todo[]>(todos);
  const [errorMessage, setErrorMessage] = useState<ErrorMessage>(
    ErrorMessage.Empty,
  );
  const [isAnyCompleted, setIsAnyCompleted] = useState(false);
  const [deleteTodoId, setDeleteTodoId] = useState<number | null>(null);
  const [changeStatusTodoId, setChangeStatusTodoId] = useState<number | null>(
    null,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const [istoggleAll, setIsToggleAll] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const closeError = () => {
    setErrorMessage(ErrorMessage.Empty);
  };
  const fetchTodos = async () => {
    setErrorMessage(ErrorMessage.Empty);
    try {
      const data: Todo[] = await getTodos();
      setTodos(data);
    } catch (error) {
      setErrorMessage(ErrorMessage.LoadError);
      setTimeout(() => {
        setErrorMessage(ErrorMessage.Empty);
      }, 3000);
    }
  };
  const selectNewFilter = (newFilter: Filter) => {
    setSelectedFilter(newFilter);
    switch (newFilter) {
      case Filter.All:
        setFilteredTodos(todos);
        break;
      case Filter.Active:
        setFilteredTodos(todos.filter(todo => !todo.completed));
        break;
      case Filter.Completed:
        setFilteredTodos(todos.filter(todo => todo.completed));
        break;
      default:
        setFilteredTodos(todos);
    }
  };
  useEffect(() => {
    fetchTodos();
  }, []);
  useEffect(() => {
    if (!loading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading, todos]);
  const findCompletedTodos = () => {
    setIsAnyCompleted(todos.some(todo => todo.completed));
  };
  useEffect(() => {
    selectNewFilter(selectedFilter);
    findCompletedTodos();
  }, [todos]);
  useEffect(() => {
    setIsToggleAll(todos.length > 0 && todos.every(todo => todo.completed));
  }, [todos]);
  if (!USER_ID) {
    return <UserWarning />;
  }
  const handleAddTodo = async (event: React.FormEvent) => {
    event.preventDefault();

    const value = inputRef.current?.value.trim();

    if (!value) {
      setErrorMessage(ErrorMessage.TitleError);
      setTimeout(() => setErrorMessage(ErrorMessage.Empty), 3000);
      return;
    }

    const temp: Todo = {
      id: 0,
      userId: USER_ID,
      title: value,
      completed: false,
    };

    setTempTodo(temp);
    setLoading(true);

    try {
      const created = await addTodoApi(temp);

      setTodos(prev => [...prev, created]);

      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } catch {
      setErrorMessage(ErrorMessage.AddError);
      setTimeout(() => setErrorMessage(ErrorMessage.Empty), 3000);
    } finally {
      setTempTodo(null);
      setLoading(false);
    }
  };
  const deleteTodo = async (id: number) => {
    setDeleteTodoId(id);
    try {
      await deleteTodoApi(id);

      setTodos(prev => prev.filter(todo => todo.id !== id));
      setEditingId(null);
    } catch (error) {
      setErrorMessage(ErrorMessage.DeleteError);
      setTimeout(() => {
        setErrorMessage(ErrorMessage.Empty);
      }, 3000);

      return null;
    } finally {
      setDeleteTodoId(null);
    }
  };
  const statusTodo = async (id: number, completed: boolean) => {
    setChangeStatusTodoId(id);
    try {
      await changeCompletedStatus(id, completed);
      setTodos(prev =>
        prev.map(todo => (todo.id === id ? { ...todo, completed } : todo)),
      );
    } catch (error) {
      setErrorMessage(ErrorMessage.UpdateError);
      setTimeout(() => {
        setErrorMessage(ErrorMessage.Empty);
      }, 3000);
    } finally {
      setChangeStatusTodoId(null);
    }
  };
  const handleUncheckAll = async () => {
    if (!istoggleAll) return;
    setTodos(prev =>
      prev.map(todo => ({
        ...todo,
        completed: false,
      })),
    );

    try {
      await Promise.all(
        todos.map(todo => changeCompletedStatus(todo.id, false)),
      );
    } catch (error) {
      setErrorMessage(ErrorMessage.UpdateError);
      setTimeout(() => setErrorMessage(ErrorMessage.Empty), 3000);
    }
  };
  const handleCheckToNotToggle = async () => {
    if (istoggleAll) return;
    setTodos(prev =>
      prev.map(todo => ({
        ...todo,
        completed: true,
      })),
    );

    try {
      await Promise.all(
        todos.map(todo =>
          todo.completed
            ? Promise.resolve()
            : changeCompletedStatus(todo.id, true),
        ),
      );
    } catch (error) {
      setErrorMessage(ErrorMessage.UpdateError);
      setTimeout(() => setErrorMessage(ErrorMessage.Empty), 3000);
    }
  };

  const deleteCompleted = async () => {
    await Promise.all(
      todos.filter(todo => todo.completed).map(todo => deleteTodo(todo.id)),
    );
  };
  const handleDoubleClick = (todo: Todo) => {
    setEditingId(todo.id);
    setTempTitle(todo.title);
  };
  const handleSubmit = async (id: number) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const trimmed = tempTitle.trim();

    // same title → cancel
    if (trimmed === todo.title) {
      setEditingId(null);
      return;
    }

    // empty → delete
    if (!trimmed) {
      try {
        setDeleteTodoId(id);
        await deleteTodoApi(id);

        setTodos(prev => prev.filter(t => t.id !== id));

        setEditingId(null);
      } catch {
        setErrorMessage(ErrorMessage.DeleteError);
        setTimeout(() => setErrorMessage(ErrorMessage.Empty), 3000);
      } finally {
        setDeleteTodoId(null);
      }

      return;
    }

    // update title
    try {
      setChangeStatusTodoId(id); // reuse loader
      const updated = await updateTodoApi(id, trimmed);

      setTodos(prev =>
        prev.map(t => (t.id === id ? { ...t, title: updated.title } : t)),
      );
    } catch {
      setErrorMessage(ErrorMessage.UpdateError);
      setTimeout(() => setErrorMessage(ErrorMessage.Empty), 3000);
    } finally {
      setChangeStatusTodoId(null);
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent, id: number) => {
    if (e.key === 'Enter') {
      handleSubmit(id);
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditingId(null);
    }
  };
  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          {/* this button should have `active` class only if all todos are completed */}
          {todos.length > 0 && (
            <button
              type="button"
              className={classNames('todoapp__toggle-all', {
                active: istoggleAll,
              })}
              data-cy="ToggleAllButton"
              onClick={istoggleAll ? handleUncheckAll : handleCheckToNotToggle}
            />
          )}

          {/* Add a todo on form submit */}
          <form onSubmit={handleAddTodo}>
            <input
              data-cy="NewTodoField"
              type="text"
              ref={inputRef}
              disabled={loading}
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
            />
          </form>
        </header>

        <section className="todoapp__main" data-cy="TodoList">
          {/* This is a completed todo */}
          {filteredTodos.map(todo => (
            <div
              key={todo.id}
              data-cy="Todo"
              className={classNames('todo', { completed: todo.completed })}
            >
              <label className="todo__status-label">
                <input
                  data-cy="TodoStatus"
                  type="checkbox"
                  className="todo__status"
                  checked={todo.completed}
                  onClick={() => statusTodo(todo.id, !todo.completed)}
                />
              </label>
              {editingId === todo.id ? (
                <input
                  data-cy="TodoTitleField"
                  className="todo__title"
                  value={tempTitle}
                  onChange={e => setTempTitle(e.target.value)}
                  onBlur={() => handleSubmit(todo.id)}
                  onKeyDown={e => handleKeyDown(e, todo.id)}
                  onKeyUp={handleKeyUp}
                  autoFocus
                />
              ) : (
                <>
                  <span
                    data-cy="TodoTitle"
                    className="todo__title"
                    onDoubleClick={() => handleDoubleClick(todo)}
                  >
                    {todo.title}
                  </span>

                  {/* Remove button appears only on hover */}
                  <button
                    type="button"
                    className="todo__remove"
                    data-cy="TodoDelete"
                    onClick={() => deleteTodo(todo.id)}
                  >
                    ×
                  </button>
                </>
              )}
              {/* overlay will cover the todo while it is being deleted or updated */}
              <div
                data-cy="TodoLoader"
                className={classNames('modal overlay', {
                  'is-active':
                    todo.id === deleteTodoId || todo.id === changeStatusTodoId,
                })}
              >
                <div className="modal-background has-background-white-ter" />
                <div className="loader" />
              </div>
            </div>
          ))}
          {tempTodo && (
            <div data-cy="Todo" className="todo">
              <label className="todo__status-label">
                <input
                  type="checkbox"
                  className="todo__status"
                  checked={false}
                  disabled
                />
              </label>

              <span data-cy="TodoTitle" className="todo__title">
                {tempTodo.title}
              </span>

              <div data-cy="TodoLoader" className="modal overlay is-active">
                <div className="modal-background has-background-white-ter" />
                <div className="loader" />
              </div>
            </div>
          )}
        </section>

        {/* Hide the footer if there are no todos */}
        {todos.length ? (
          <footer className="todoapp__footer" data-cy="Footer">
            <span className="todo-count" data-cy="TodosCounter">
              {completedTodosNumber} items left
            </span>

            {/* Active link should have the 'selected' class */}
            <nav className="filter" data-cy="Filter">
              <a
                href="#/"
                className={classNames('filter__link', {
                  selected: selectedFilter === 'All',
                })}
                data-cy="FilterLinkAll"
                onClick={() => selectNewFilter(Filter.All)}
              >
                All
              </a>

              <a
                href="#/active"
                className={classNames('filter__link', {
                  selected: selectedFilter === 'Active',
                })}
                data-cy="FilterLinkActive"
                onClick={() => selectNewFilter(Filter.Active)}
              >
                Active
              </a>

              <a
                href="#/completed"
                className={classNames('filter__link', {
                  selected: selectedFilter === 'Completed',
                })}
                data-cy="FilterLinkCompleted"
                onClick={() => selectNewFilter(Filter.Completed)}
              >
                Completed
              </a>
            </nav>

            {/* this button should be disabled if there are no completed todos */}

            <button
              type="button"
              className="todoapp__clear-completed"
              data-cy="ClearCompletedButton"
              onClick={() => deleteCompleted()}
              disabled={!isAnyCompleted}
            >
              Clear completed
            </button>
          </footer>
        ) : (
          ''
        )}
      </div>

      {/* DON'T use conditional rendering to hide the notification */}
      {/* Add the 'hidden' class to hide the message smoothly */}

      <div
        data-cy="ErrorNotification"
        className={classNames(
          'notification is-danger is-light has-text-weight-normal',
          { hidden: !errorMessage },
        )}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={() => closeError()}
        />
        {/* show only one message at a time */}
        {errorMessage}
      </div>
    </div>
  );
};
