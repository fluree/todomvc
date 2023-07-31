import React, { Fragment, useState } from 'react';
import classNames from 'classnames';
import { v4 as uuid } from 'uuid';
import useFlureeHook from './hooks/useFlureeHook';
import './App.css';

const statusTypes = {
  ALL: 1,
  ACTIVE: 2,
  COMPLETED: 3
}

const App = () => {
  const [input, setInput] = useState('');
  const [editInput, setEditInput] = useState('');
  const [status, setStatus] = useState(statusTypes.ALL)
  const [todoList, setTodoList] = useFlureeHook([]);

  const handleInput = ({ target: { value } }) => {
    setInput(value);
  };

  const handleEditInput = ({ target: { value } }) => {
    setEditInput(value);
  }

  const handleEditItemBlur = (id) => {
    const newTodoList = todoList.map(t => {
      if (t["@id"] === id) {
        return {...t, content: editInput, editMode: false}
      }
      else {
        return {...t}
      }
    })
    setTodoList(newTodoList);
  }

  const handleEnterKey = (e, id) => {
    if(e.keyCode === 13) {
      handleEditItemBlur(id);
    }
  }

  const handleCheck = (id) => {
    const index = todoList.findIndex(t => t["@id"] === id);
    const newTodoList = [...todoList];
    newTodoList[index].checked = !newTodoList[index].checked;
    setTodoList(newTodoList);
  }

  const handleDoubleClick = (id) => {
    const newTodoList = todoList.map(t => {
      if (t["@id"] === id) {
        setEditInput(t.content);
        return {...t, editMode: true}
      }
      else {
        return {...t, editMode: false}
      }
    })
    setTodoList(newTodoList);
  }

  const handleDelete = (id) => {
    let newList = todoList.filter(t => id !== t["@id"]);
    setTodoList(newList);
  }

  const handleCheckAll = () => {
    const allChecked =
      todoList.length && todoList.every(t => t.checked)

    const newTodoList = todoList.map(t => {
      return {...t, checked: !allChecked}
    })
    setTodoList(newTodoList);
  }

  const handleClearCompleted = () => {
    let newList = todoList.filter(t => !t.checked);
    setTodoList(newList);
  }

  const handleInputSubmit = (e) => {
    e.preventDefault();
    const value = input.trim();
    if (value) {
      const newList = [
        {
          "@id": uuid(),
          checked: false,
          content: value,
          editMode: false,
        }, ...todoList
      ];
      setTodoList(newList);
      setInput('');
    }
  };

  const currentList = {
    [statusTypes.ALL]: todoList,
    [statusTypes.ACTIVE]: todoList?.filter((item) => !item.checked),
    [statusTypes.COMPLETED]: todoList?.filter((item) => item.checked),
  }[status]

  return (
    <Fragment>
      <section className="todoapp">
        <header className="header">
          <h1>todos</h1>
          <form onSubmit={handleInputSubmit}>
            <input className="new-todo" placeholder="What needs to be done?" onChange={handleInput} value={input} autoFocus />
          </form>
        </header>
        {todoList && todoList.length > 0 &&
          <Fragment>
            <section className="main">
              <input id="toggle-all" className="toggle-all" type="checkbox" />
              <label htmlFor="toggle-all" onClick={handleCheckAll}>Mark all as complete</label>
              <ul className="todo-list">
                {currentList.map(t => {
                  return (
                    <li key={t["@id"]} className={classNames({editing: t.editing}, {completed: t.checked})}>
                      <div className="view" onDoubleClick={() => handleDoubleClick(t["@id"])}>
                        <input className="toggle" type="checkbox" checked={t.checked ? true : null} onChange={() => handleCheck(t["@id"])} />
                        {
                          t.editMode
                            ? <input 
                                className="new-todo" 
                                style={{ fontWeight: 400, height: "58.8px" }} 
                                value={editInput}
                                onChange={(e) => handleEditInput(e, t["@id"])}
                                onBlur={() => handleEditItemBlur(t["@id"])}
                                onKeyDown={(e) => handleEnterKey(e, t["@id"])}
                                autoFocus 
                              />
                            : <label>{t.content}</label>
                        }
                        <button className="destroy" onClick={() => handleDelete(t["@id"])} />
                      </div>
                    </li>
                  ) 
                })}
              </ul>
            </section>
            <footer className="footer">
              <span className="todo-count"><strong>{todoList?.length || 0}</strong> item{todoList === 1 && "s"}</span>
              <ul className="filters">
                <li onClick={() => setStatus(statusTypes.ALL)}>
                  <a className={status === statusTypes.ALL ? "selected" : null} href>All</a>
                </li>
                <li onClick={() => setStatus(statusTypes.ACTIVE)}>
                  <a className={status === statusTypes.ACTIVE ? "selected" : null} href>Active</a>
                </li>
                <li onClick={() => setStatus(statusTypes.COMPLETED)}>
                  <a className={status === statusTypes.COMPLETED ? "selected" : null} href>Completed</a>
                </li>
              </ul>
              <button className="clear-completed" onClick={handleClearCompleted}>Clear completed</button>
            </footer>
          </Fragment>
        }
      </section>
      <footer className="info">
        <p>Double-click to edit a todo</p>
        <p>Template by <a href="http://sindresorhus.com">Sindre Sorhus</a></p>
        <p>Created by <a href="http://todomvc.com">Kelly Dickson</a></p>
        <p>Part of <a href="http://todomvc.com">TodoMVC</a></p>
      </footer>
    </Fragment>
  );
}

export default App;
